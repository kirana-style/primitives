/**
 * Rehearses a release against a registry of its own, so the release path is tried on every change
 * and never for the first time on npm. It publishes the tarballs in `dist-packages/` (`vp run
 * pack` made them) with `scripts/publish.ts`, to a registry in this process that behaves as npm
 * does where it matters: versions are held for good, a package's list of versions is served with
 * a `max-age`, an upload can fail, and a workflow's identity is exchanged for a token per package.
 *
 *   bun scripts/pack.ts && bun scripts/rehearse.ts
 *
 * What it holds the script to:
 *   - a dry run sends nothing;
 *   - a package npm would refuse stops the release before any upload;
 *   - the adapters are uploaded only once the cache's age has passed since the core was;
 *   - an upload the registry failed is tried again, and one it stored but answered with an error
 *     is found there;
 *   - a second run publishes nothing, and a run after a release that stopped halfway continues it,
 *     waiting only for what is left of the cache's age;
 *   - the release then installs from the registry and works (`scripts/consume.ts --version`).
 *
 * What it cannot rehearse is npm itself accepting the workflow: that is the first step of a real
 * release, before anything is published.
 */
import { spawn } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const packed = path.join(root, "dist-packages")
const tarballs = readdirSync(packed).filter((file) => file.endsWith(".tgz"))
if (tarballs.length === 0) throw new Error("nothing is packed: run `bun scripts/pack.ts` first")

const MAX_AGE = 4
interface Held {
  manifest: Record<string, unknown>
  tarball: Uint8Array
  file: string
  at: number
}

/** A registry: what it holds, what it was asked, and the faults it is told to have. */
function registry() {
  const held = new Map<string, Map<string, Held>>()
  const uploads: { name: string; at: number }[] = []
  const exchanges: string[] = []
  // Per package: how the next upload fails. "lost" stores nothing; "stored" keeps it and still
  // answers with an error.
  const faults = new Map<string, "lost" | "stored">()
  const refused = new Set<string>()
  const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    })
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const parts = decodeURIComponent(url.pathname).slice(1)
      if (parts === "identity") return json({ value: "the-workflow" })
      const exchange = /^-\/npm\/v1\/oidc\/token\/exchange\/package\/(.+)$/.exec(parts)
      if (exchange) {
        exchanges.push(exchange[1]!)
        return refused.has(exchange[1]!)
          ? json({ message: "no trusted publisher matches" }, 404)
          : json({ token: "granted" })
      }
      const file = /^(@[^/]+\/[^/]+)\/-\/(.+\.tgz)$/.exec(parts)
      if (file) {
        const found = [...(held.get(file[1]!)?.values() ?? [])].find(
          // npm names the file with its scope (`-/@kirana-ui/core-0.1.0.tgz`).
          (each) => each.file === file[2]!.split("/").pop()
        )
        return found ? new Response(found.tarball as unknown as BodyInit) : json({}, 404)
      }
      const [, name, version] = /^(@[^/]+\/[^/]+)(?:\/(.+))?$/.exec(parts) ?? []
      if (!name) return json({}, 404)
      if (request.method === "PUT") {
        const body = (await request.json()) as {
          versions: Record<string, Record<string, unknown>>
          _attachments: Record<string, { data: string }>
        }
        const [[number, manifest]] = Object.entries(body.versions) as [
          [string, Record<string, unknown>],
        ]
        const [[attached, { data }]] = Object.entries(body._attachments) as [
          [string, { data: string }],
        ]
        const fault = faults.get(name)
        faults.delete(name)
        if (fault === "lost") return json({ error: "unavailable" }, 503)
        if (held.get(name)?.has(number)) return json({ error: "cannot publish over" }, 403)
        const versions = held.get(name) ?? new Map<string, Held>()
        held.set(name, versions)
        versions.set(number, {
          manifest,
          tarball: Buffer.from(data, "base64"),
          file: attached.split("/").pop()!,
          at: Date.now(),
        })
        uploads.push({ name, at: Date.now() })
        return fault === "stored" ? json({ error: "unavailable" }, 503) : json({ ok: true }, 201)
      }
      const versions = held.get(name)
      if (version) {
        const one = versions?.get(version)
        return one ? json(one.manifest) : json({}, 404)
      }
      if (!versions) return json({}, 404)
      return json(
        {
          name,
          "dist-tags": {},
          versions: Object.fromEntries(
            [...versions].map(([number, each]) => [number, each.manifest])
          ),
          time: Object.fromEntries(
            [...versions].map(([number, each]) => [number, new Date(each.at).toISOString()])
          ),
        },
        200,
        { "cache-control": `public, max-age=${MAX_AGE}` }
      )
    },
  })
  return {
    url: `http://localhost:${server.port}`,
    held,
    uploads,
    exchanges,
    faults,
    refused,
    stop: () => server.stop(true),
  }
}

const scratch = mkdtempSync(path.join(tmpdir(), "kirana-ui-rehearse-"))
let failed = 0
function expect(condition: unknown, message: string) {
  if (condition) console.log(`ok    ${message}`)
  else {
    failed++
    console.log(`FAIL  ${message}`)
  }
}

/** Runs a command without stopping this process, whose registry it talks to. */
function command(file: string, args: string[], env?: Record<string, string | undefined>) {
  return new Promise<{ status: number | null; output: string }>((resolve) => {
    const child = spawn(file, args, { env: env ?? process.env, stdio: ["ignore", "pipe", "pipe"] })
    let output = ""
    child.stdout.on("data", (chunk) => (output += String(chunk)))
    child.stderr.on("data", (chunk) => (output += String(chunk)))
    child.on("close", (status) => resolve({ status, output }))
  })
}

/** `scripts/publish.ts` against a registry, signed in to it as npm's own configuration says. */
function publish(target: ReturnType<typeof registry>, args: string[] = [], workflow = true) {
  const npmrc = path.join(scratch, "npmrc")
  writeFileSync(npmrc, `//localhost:${new URL(target.url).port}/:_authToken=rehearsal\n`)
  const { GITHUB_ACTIONS: _ci, ...environment } = process.env
  return command(
    "bun",
    [path.join(root, "scripts/publish.ts"), packed, "--registry", target.url, ...args],
    {
      ...environment,
      NPM_CONFIG_USERCONFIG: npmrc,
      KIRANA_UI_RETRY_DELAYS: "1,1",
      ...(workflow
        ? {
            ACTIONS_ID_TOKEN_REQUEST_URL: `${target.url}/identity`,
            ACTIONS_ID_TOKEN_REQUEST_TOKEN: "runner",
          }
        : {}),
    }
  )
}

const count = tarballs.length
const adapters = (name: string) => !["@kirana-ui/core", "@kirana-ui/vocabulary"].includes(name)
const first = (target: ReturnType<typeof registry>, name: string) =>
  target.uploads.find((each) => each.name === name)!.at

try {
  // 1. A dry run, then a workflow npm would refuse for one package: nothing is uploaded.
  let target = registry()
  let run = await publish(target, ["--dry-run"])
  expect(run.status === 0 && target.uploads.length === 0, "a dry run plans and sends nothing")
  expect(/plan {5}level 0 {2}@kirana-ui\/core/.test(run.output), "the core is in the first level")
  expect(/plan {5}level 1 {2}@kirana-ui\/react/.test(run.output), "an adapter in the second")
  target.refused.add("@kirana-ui/svelte")
  run = await publish(target)
  expect(run.status === 1, "a package npm refuses fails the release")
  expect(target.uploads.length === 0, "before anything is uploaded")
  expect(target.exchanges.length === count, "every package was asked for")
  expect(/@kirana-ui\/svelte: HTTP 404/.test(run.output), "and the refused one is named")
  await target.stop()

  // 2. A release, with one upload lost and one stored but answered with an error.
  target = registry()
  target.faults.set("@kirana-ui/react", "lost")
  target.faults.set("@kirana-ui/vue", "stored")
  run = await publish(target)
  expect(run.status === 0, `a release succeeds${run.status === 0 ? "" : `\n${run.output}`}`)
  expect(target.held.size === count, `the registry holds all ${count}`)
  expect(/retry {4}@kirana-ui\/react/.test(run.output), "a lost upload is tried again")
  expect(/landed {3}@kirana-ui\/vue/.test(run.output), "a stored one is found on the registry")
  const core = Math.max(first(target, "@kirana-ui/core"), first(target, "@kirana-ui/vocabulary"))
  const earliest = Math.min(
    ...target.uploads.filter((each) => adapters(each.name)).map((each) => each.at)
  )
  expect(
    earliest - core >= MAX_AGE * 1000,
    `the adapters wait out the cache's age after the core (${earliest - core} ms, ${MAX_AGE} s asked)`
  )
  expect(earliest - core < (MAX_AGE + 3) * 1000, "and no longer than that")

  // 3. Again: nothing to do.
  const before = target.uploads.length
  run = await publish(target)
  expect(run.status === 0 && target.uploads.length === before, "a second run publishes nothing")

  // 4. The release, installed from the registry.
  const consumed = await command("bun", [
    path.join(root, "scripts/consume.ts"),
    "--version",
    "0.0.0",
    "--registry",
    target.url,
  ])
  expect(
    consumed.status === 0,
    `the release installs from the registry and works${consumed.status === 0 ? "" : `\n${consumed.output}`}`
  )
  await target.stop()

  // 5. A release that stopped after its first level continues: at once when the cache's age has
  // passed since, and after what is left of it when not.
  for (const [age, label] of [
    [MAX_AGE * 2000, "long ago"],
    [1000, "a moment ago"],
  ] as const) {
    target = registry()
    run = await publish(target, [], false)
    // Keep the first level as an earlier run would have left it, published `age` ago.
    for (const name of [...target.held.keys()].filter(adapters)) target.held.delete(name)
    for (const versions of target.held.values())
      for (const each of versions.values()) each.at = Date.now() - age
    target.uploads.length = 0
    const started = Date.now()
    run = await publish(target, [], false)
    const waited = Math.min(...target.uploads.map((each) => each.at)) - started
    expect(
      run.status === 0 &&
        target.held.size === count &&
        target.uploads.every((each) => adapters(each.name)),
      `a release stopped ${label} continues with the adapters only`
    )
    expect(
      age > MAX_AGE * 1000 ? waited < 2500 : waited >= MAX_AGE * 1000 - age - 500,
      `and waits ${age > MAX_AGE * 1000 ? "for nothing" : "for what is left of the age"} (${waited} ms)`
    )
    await target.stop()
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
console.log(failed === 0 ? "\nrehearsal: passed" : `\nrehearsal: ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
