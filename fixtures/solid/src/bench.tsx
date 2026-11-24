import { Collapsible } from "@kirana-ui/solid"
import { For, flush } from "solid-js"
import { render } from "@solidjs/web"

/**
 * The bench page: `?n=1000` mounts that many closed collapsibles and times it. Solid is measured
 * alone: Ark UI, which the other adapters are measured against, has no release for Solid 2.
 */
const params = new URLSearchParams(location.search)
const count = Number(params.get("n") ?? 1000)
const rows = Array.from({ length: count }, (_, index) => index)
let dispose: (() => void) | undefined

function List() {
  return (
    <For each={rows}>
      {(index) => (
        <Collapsible.Root>
          <Collapsible.Trigger>Row {index}</Collapsible.Trigger>
          <Collapsible.Panel>Content {index}</Collapsible.Panel>
        </Collapsible.Root>
      )}
    </For>
  )
}

function timed(work: () => void): number {
  const start = performance.now()
  work()
  // Solid 2 draws what changed on the next microtask: drawn here, so it is in what is timed.
  flush()
  void document.body.offsetHeight
  return performance.now() - start
}

Object.assign(window, {
  bench: {
    mount: () =>
      timed(() => {
        dispose = render(() => <List />, document.getElementById("root")!)
      }),
    toggle(howMany: number) {
      const triggers = [...document.querySelectorAll("button")].slice(0, howMany)
      return timed(() => {
        for (const each of triggers) each.click()
      })
    },
    unmount: () => timed(() => dispose?.()),
  },
})
