/**
 * Publishes the packed tarballs (`scripts/pack.ts`) to npm as one release.
 *
 *   bun scripts/publish.ts <dir>                       # in the release workflow
 *   bun scripts/publish.ts <dir> --dry-run             # the plan, nothing sent
 *   bun scripts/publish.ts <dir> --registry <url>      # another registry (a rehearsal)
 *
 * What it guarantees, and what each step costs:
 *
 * 1. **Nothing is published unless everything can be.** npm's trusted publishing exchanges the
 *    workflow's identity for a token per package, and when a package has no matching publisher
 *    `npm publish` only says so as an E404 on its upload. So the exchange is asked for every
 *    package first, and the release stops there, with the packages named, before any upload.
 *
 * 2. **Nobody installs a package before the packages it depends on.** npm's CDN may serve a
 *    package's list of versions from its cache for `max-age` (read from the registry's own
 *    answer; 300 s). An adapter published right after the core could be installed from an edge
 *    that still holds the core's old list. So the packages are published a dependency level at a
 *    time, and a level starts once that time has passed since the level before it. Within a
 *    level every package is published at once. The family has two levels (the core and the
 *    vocabulary, then the adapters), so a release waits once.
 *
 * 3. **Nothing is waited for at the end.** Until an edge's cache runs out it serves the previous
 *    release, whole: each adapter names its core by exact version, so any mix an install can see
 *    is a working one. The job ends when the last package is accepted; `scripts/consume.ts
 *    --version` then installs the release from the registry as its own, later, step.
 *
 * 4. **It can always be run again.** A version the registry already holds is skipped, a publish
 *    the registry stored but answered with an error is found there, and a registry that fails
 *    for its own reasons (5xx, 429, a dropped connection) is asked again.
 *
 * Each package goes straight under its final tag (`latest`, or `next` for a prerelease): no tag
 * is moved afterwards.
 */
import { spawn, spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => {
  const index = args.indexOf(`--${name}`)
  return index < 0 ? undefined : args[index + 1]
}
const directory = args.find(
  (each, index) => !each.startsWith("--") && args[index - 1] !== "--registry"
)
if (!directory) {
  console.error("usage: bun scripts/publish.ts <dir> [--dry-run] [--registry <url>] [--by-hand]")
  process.exit(2)
}
const dryRun = flag("dry-run")
const NPM = "https://registry.npmjs.org"
const registry = (option("registry") ?? NPM).replace(/\/$/, "")
/**
 * Seconds before each further attempt at a request the registry failed for its own reasons. (The
 * rehearsal shortens them: `scripts/rehearse.ts`.)
 */
const RETRY_DELAYS = (process.env.KIRANA_UI_RETRY_DELAYS ?? "15,30,60,120").split(",").map(Number)

interface Tarball {
  file: string
  name: string
  version: string
  depends: string[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const transient = (status: number) => status === 408 || status === 429 || status >= 500

/** A tarball's own manifest, read without unpacking it. */
function manifest(file: string): Tarball {
  const read = spawnSync("tar", ["-xzOf", file, "package/package.json"], { encoding: "utf8" })
  if (read.status !== 0) throw new Error(`cannot read ${file}: ${read.stderr}`)
  const json = JSON.parse(read.stdout) as {
    name: string
    version: string
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
  }
  return {
    file,
    name: json.name,
    version: json.version,
    depends: Object.keys({
      ...json.dependencies,
      ...json.peerDependencies,
      ...json.optionalDependencies,
    }),
  }
}

// An absolute path: npm reads a relative `dir/name.tgz` as a GitHub `user/repo`.
const tarballs = readdirSync(directory)
  .filter((file) => file.endsWith(".tgz"))
  .map((file) => manifest(path.resolve(directory, file)))
  .sort((a, b) => a.name.localeCompare(b.name))
if (tarballs.length === 0) {
  console.error(`no tarball in ${directory}: run \`bun scripts/pack.ts\` first`)
  process.exit(2)
}
const byName = new Map(tarballs.map((each) => [each.name, each]))
const versions = new Set(tarballs.map((each) => each.version))
if (versions.size !== 1) {
  console.error(`one release is one version, found ${[...versions].join(", ")}`)
  process.exit(1)
}
const [version] = versions as unknown as [string]
const tag = version.includes("-") ? "next" : "latest"

/** A package's level: 0 when it depends on nothing published here, else one past its deepest. */
const depth = new Map<string, number>()
function level(tarball: Tarball, seen: string[] = []): number {
  const known = depth.get(tarball.name)
  if (known !== undefined) return known
  if (seen.includes(tarball.name)) throw new Error(`a cycle through ${tarball.name}`)
  const own =
    Math.max(
      -1,
      ...tarball.depends
        .map((name) => byName.get(name))
        .filter((each) => each !== undefined)
        .map((each) => level(each, [...seen, tarball.name]))
    ) + 1
  depth.set(tarball.name, own)
  return own
}
const levels: Tarball[][] = []
for (const tarball of tarballs) (levels[level(tarball)] ??= []).push(tarball)

const escaped = (name: string) => name.replace("/", "%2f")

/** A registry request, asked again while the registry fails for its own reasons. */
async function ask(target: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const delay = RETRY_DELAYS[attempt]
    let failure: string
    try {
      const response = await fetch(target, { ...init, signal: AbortSignal.timeout(15_000) })
      if (!transient(response.status) || delay === undefined) return response
      failure = `HTTP ${response.status}`
    } catch (error) {
      if (delay === undefined) throw error
      failure = (error as Error).message
    }
    console.log(`retry    ${target} (${failure}) in ${delay} s`)
    await sleep(delay * 1000)
  }
}

/** Whether the registry holds a version. This endpoint is not cached at the edge. */
async function held({ name }: Tarball): Promise<boolean> {
  const response = await ask(`${registry}/${escaped(name)}/${version}`)
  if (response.status === 404) return false
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  return true
}

/**
 * What an installer reads from this edge: the versions a package lists, and for how long an edge
 * may go on serving that list from its cache.
 */
async function listed(name: string): Promise<{ versions: string[]; maxAge: number }> {
  const response = await ask(`${registry}/${escaped(name)}`, {
    headers: { Accept: "application/vnd.npm.install-v1+json" },
  })
  if (response.status === 404) return { versions: [], maxAge: 0 }
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  const age = /max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")
  const json = (await response.json()) as { versions?: Record<string, unknown> }
  return { versions: Object.keys(json.versions ?? {}), maxAge: age ? Number(age[1]) : 0 }
}

/** The workflow's identity, as GitHub signs it for npm. `undefined` outside GitHub Actions. */
async function identity(): Promise<string | undefined> {
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: token } = process.env
  if (!url || !token) return undefined
  const target = new URL(url)
  target.searchParams.append("audience", `npm:${new URL(registry).hostname}`)
  const response = await ask(target.href, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`GitHub gave no identity token: HTTP ${response.status}`)
  return ((await response.json()) as { value: string }).value
}

/**
 * Asks npm, for each package, the exchange `npm publish` will ask: this workflow's identity for
 * a token to publish that package. It is the same request npm's own client makes, and a refusal
 * here is the one `npm publish` reports only as an E404 on its upload.
 */
async function authorized(pending: Tarball[]): Promise<void> {
  const token = await identity()
  if (!token) {
    // Another registry is a rehearsal's, signed in to however its own configuration says.
    if (registry !== NPM || flag("by-hand")) return
    console.error(
      "refused  publishing to npm happens in the release workflow, by trusted publishing.\n" +
        "         From a machine signed in to npm, and only to repair a release: --by-hand."
    )
    process.exit(1)
  }
  const npm = spawnSync("npm", ["--version"], { encoding: "utf8" }).stdout.trim()
  const [major = 0, minor = 0, patch = 0] = npm.split(".").map(Number)
  if (major < 11 || (major === 11 && (minor < 5 || (minor === 5 && patch < 1)))) {
    console.error(`refused  trusted publishing needs npm 11.5.1 or later, this is ${npm}`)
    process.exit(1)
  }
  const refused: string[] = []
  await Promise.all(
    pending.map(async ({ name }) => {
      const response = await ask(
        `${registry}/-/npm/v1/oidc/token/exchange/package/${escaped(name)}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) return
      const body = (await response.json().catch(() => ({}))) as { message?: string }
      refused.push(`${name}: HTTP ${response.status} ${body.message ?? ""}`.trim())
    })
  )
  if (refused.length === 0) {
    console.log(`allowed  npm ${npm} may publish all ${pending.length} for this workflow`)
    return
  }
  console.error(
    `refused  nothing was published. npm does not let this workflow publish:\n` +
      refused
        .sort()
        .map((each) => `           ${each}`)
        .join("\n") +
      `\n         Each needs a trusted publisher (npmjs.com, the package, Settings): this\n` +
      `         repository, this workflow's file name, and the job's environment.`
  )
  process.exit(1)
}

/** `npm publish`, its output kept together, asked again while the registry fails on its own. */
async function publish(tarball: Tarball): Promise<void> {
  const spec = `${tarball.name}@${version}`
  for (let attempt = 0; ; attempt++) {
    const child = spawn(
      "npm",
      // One request per attempt: npm's own retries are silent, and after an upload the
      // registry stored they fail with "cannot publish over". The retries are this script's.
      [
        "publish",
        tarball.file,
        "--access",
        "public",
        "--tag",
        tag,
        "--registry",
        registry,
        "--fetch-retries",
        "0",
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    )
    let output = ""
    child.stdout.on("data", (chunk) => (output += String(chunk)))
    child.stderr.on("data", (chunk) => (output += String(chunk)))
    const status = await new Promise<number | null>((resolve) => child.on("close", resolve))
    if (status === 0) {
      console.log(`done     ${spec} (${tag})`)
      return
    }
    // A stored upload can still be answered with an error: the registry is asked before npm is.
    if (await held(tarball)) {
      console.log(`landed   ${spec}: npm reported a failure, the registry holds it`)
      return
    }
    const code = /npm (?:error|ERR!) code (\S+)/.exec(output)?.[1] ?? ""
    const again =
      (/^E\d{3}$/.test(code) && transient(Number(code.slice(1)))) ||
      ["ECONNREFUSED", "ECONNRESET", "EAI_AGAIN", "ENOTFOUND", "EPIPE", "ETIMEDOUT"].includes(code)
    const delay = RETRY_DELAYS[attempt]
    if (!again || delay === undefined) {
      process.stderr.write(output)
      throw new Error(`${spec} was not published (${code || `exit ${status}`})`)
    }
    console.log(`retry    ${spec} (${code}) in ${delay} s`)
    await sleep(delay * 1000)
  }
}

const started = Date.now()
const pending: Tarball[][] = []
for (const members of levels) {
  const waiting: Tarball[] = []
  for (const tarball of members) {
    if (await held(tarball)) console.log(`skip     ${tarball.name}@${version} (already published)`)
    else waiting.push(tarball)
  }
  pending.push(waiting)
}
const all = pending.flat()
console.log(
  `release  ${version} under "${tag}" to ${registry}: ${all.length} of ${tarballs.length} to publish, in ${levels.length} levels`
)
for (const [index, members] of pending.entries()) {
  for (const { name } of members) console.log(`plan     level ${index}  ${name}`)
}
if (dryRun || all.length === 0) process.exit(0)
await authorized(all)

/**
 * When a version was published, for one an earlier run published: the registry's own date, read
 * from the list this edge serves. `undefined` when that list does not hold the version yet, which
 * is the case the wait is for.
 */
async function publishedAt(name: string): Promise<number | undefined> {
  const response = await ask(`${registry}/${escaped(name)}`)
  if (!response.ok) return undefined
  const date = ((await response.json()) as { time?: Record<string, string> }).time?.[version]
  return date ? Date.parse(date) : undefined
}

/** When this run published each package. */
const publishedHere = new Map<string, number>()
for (const [index, members] of pending.entries()) {
  if (members.length === 0) continue
  const before = levels[index - 1] ?? []
  if (before.length > 0) {
    const ages = await Promise.all(before.map((each) => listed(each.name)))
    // The level before last changed when its latest package was published: by this run, or by
    // an earlier one (a run that continues a release), and "now" when that cannot be told.
    const dates = await Promise.all(
      before.map(
        async (each) => publishedHere.get(each.name) ?? (await publishedAt(each.name)) ?? Date.now()
      )
    )
    const until = Math.max(...dates) + Math.max(...ages.map((each) => each.maxAge)) * 1000
    const wait = until - Date.now()
    if (wait > 0) {
      console.log(
        `waiting  ${Math.ceil(wait / 1000)} s: until then an edge may serve level ${index - 1} without ${version}`
      )
      await sleep(wait)
    }
    // The edge this runner reaches lists them by now; a short grace for one that lags.
    for (let attempt = 0; ; attempt++) {
      const lists = await Promise.all(before.map((each) => listed(each.name)))
      const missing = before.filter((_each, at) => !lists[at]!.versions.includes(version))
      if (missing.length === 0) break
      if (attempt === 12) {
        console.error(
          `failed   not listed a minute past the cache's age: ${missing.map((each) => each.name).join(", ")}.\n` +
            `         Nothing after level ${index - 1} was published. Run the job again: it continues.`
        )
        process.exit(1)
      }
      await sleep(5_000)
    }
  }
  await Promise.all(
    members.map(async (each) => {
      await publish(each)
      publishedHere.set(each.name, Date.now())
    })
  ).catch((error: Error) => {
    console.error(
      `failed   ${error.message}\n         Run the job again: what is published is skipped.`
    )
    process.exit(1)
  })
}
console.log(
  `released ${version}: ${all.length} packages in ${Math.round((Date.now() - started) / 1000)} s`
)
