/**
 * The bench: each fixture's bench page mounts N closed collapsibles (a root, a trigger, a panel
 * that is not in the page), with this library and with the one its framework is measured against
 * (Base UI on React, Ark UI on Svelte, ng-primitives on Angular), and reports the time to mount,
 * the memory the mounted parts hold, the time to open a hundred of them and the time to unmount.
 *
 *   bun bench/run.ts [adapter…] [--n 1000,10000] [--runs 5]
 *
 * One page at a time, the median of the runs. It serves each fixture's `dist/` itself and stops
 * its servers and its browser before it exits.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { chromium } from "playwright"

const ROOT = join(import.meta.dirname, "..")
const OUT = join(import.meta.dirname, "out")
const OTHER: Record<string, string> = {
  react: "Base UI",
  svelte: "Ark UI",
  angular: "ng-primitives",
}

const args = process.argv.slice(2)
const option = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`)
  return index < 0 ? fallback : args.splice(index, 2)[1]!
}
const sizes = option("n", "1000,10000").split(",").map(Number)
const runs = Number(option("runs", "5"))
const adapters = (args.length > 0 ? args : Object.keys(OTHER)).filter((each) =>
  existsSync(join(ROOT, "fixtures", each, "dist/bench.html"))
)

const median = (values: number[]) =>
  values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]!

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ args: ["--disable-gpu", "--disable-software-rasterizer"] })
const rows: Record<string, string | number>[] = []

try {
  for (const adapter of adapters) {
    const dist = join(ROOT, "fixtures", adapter, "dist")
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        const file = Bun.file(join(dist, new URL(request.url).pathname))
        return (await file.exists()) ? new Response(file) : new Response("", { status: 404 })
      },
    })
    try {
      for (const n of sizes) {
        for (const lib of ["kirana", "other"]) {
          const samples = {
            mount: [] as number[],
            heap: [] as number[],
            open: [] as number[],
            unmount: [] as number[],
          }
          for (let run = 0; run < runs; run++) {
            const page = await browser.newPage()
            const session = await page.context().newCDPSession(page)
            const heap = async () => {
              await session.send("HeapProfiler.collectGarbage")
              const { metrics } = await session.send("Performance.getMetrics")
              return metrics.find((each) => each.name === "JSHeapUsedSize")!.value
            }
            await session.send("Performance.enable")
            await page.goto(`http://localhost:${server.port}/bench.html?lib=${lib}&n=${n}`)
            await page.waitForFunction(() => "bench" in window)
            const before = await heap()
            samples.mount.push(await page.evaluate(() => (window as any).bench.mount()))
            samples.heap.push(((await heap()) - before) / 1024)
            samples.open.push(await page.evaluate(() => (window as any).bench.toggle(100)))
            samples.unmount.push(await page.evaluate(() => (window as any).bench.unmount()))
            await page.close()
          }
          const row = {
            adapter,
            library: lib === "kirana" ? "Kirana UI" : OTHER[adapter]!,
            n,
            "mount ms": Math.round(median(samples.mount) * 10) / 10,
            "KB per instance": Math.round((median(samples.heap) / n) * 100) / 100,
            "open 100 ms": Math.round(median(samples.open) * 10) / 10,
            "unmount ms": Math.round(median(samples.unmount) * 10) / 10,
          }
          rows.push(row)
          console.log(Object.values(row).join("\t"))
        }
      }
    } finally {
      await server.stop(true)
    }
  }
} finally {
  await browser.close()
}

const header = Object.keys(rows[0] ?? {})
const table = [
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${Object.values(row).join(" | ")} |`),
].join("\n")
writeFileSync(join(OUT, "bench.md"), `${table}\n`)
console.log(`\n${table}`)
