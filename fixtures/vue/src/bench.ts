import { createApp, nextTick } from "vue"
import type { App } from "vue"

import Bench from "./Bench.vue"

/**
 * The bench page: `?lib=kirana|other&n=1000` mounts that many closed collapsibles and times it.
 * `other` is Ark UI (Zag), the library Vue is measured against.
 */
const params = new URLSearchParams(location.search)
const lib = params.get("lib") ?? "kirana"
const count = Number(params.get("n") ?? 1000)
let app: App | undefined

async function timed(work: () => void | Promise<void>): Promise<number> {
  const start = performance.now()
  await work()
  void document.body.offsetHeight
  return performance.now() - start
}

Object.assign(window, {
  bench: {
    // Vue renders at once on mount and in a microtask after a change: each is waited for.
    mount: () =>
      timed(() => {
        app = createApp(Bench, { lib, count })
        app.mount("#root")
      }),
    toggle(howMany: number) {
      const triggers = [...document.querySelectorAll("button")].slice(0, howMany)
      return timed(async () => {
        for (const each of triggers) {
          each.click()
          await nextTick()
        }
      })
    },
    unmount: () => timed(() => app?.unmount()),
  },
})
