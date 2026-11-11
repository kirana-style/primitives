import { flushSync, mount, unmount } from "svelte"

import Bench from "./Bench.svelte"

/**
 * The bench page: `?lib=kirana|other&n=1000` mounts that many closed collapsibles and times it.
 * `other` is Ark UI (Zag), the library Svelte is measured against.
 */
const params = new URLSearchParams(location.search)
const lib = params.get("lib") ?? "kirana"
const count = Number(params.get("n") ?? 1000)
let app: Record<string, unknown> | undefined

function timed(work: () => void): number {
  const start = performance.now()
  work()
  void document.body.offsetHeight
  return performance.now() - start
}

Object.assign(window, {
  bench: {
    mount: () =>
      timed(() => {
        app = mount(Bench, { target: document.getElementById("root")!, props: { lib, count } })
        flushSync()
      }),
    toggle(howMany: number) {
      const triggers = [...document.querySelectorAll("button")].slice(0, howMany)
      return timed(() => {
        for (const each of triggers) {
          each.click()
          flushSync()
        }
      })
    },
    unmount: () =>
      timed(() => {
        if (app) void unmount(app)
        flushSync()
      }),
  },
})
