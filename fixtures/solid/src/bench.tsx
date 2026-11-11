import { Collapsible as Ark } from "@ark-ui/solid/collapsible"
import { Collapsible } from "@kirana-ui/solid"
import { For, Show } from "solid-js"
import { render } from "solid-js/web"

/**
 * The bench page: `?lib=kirana|other&n=1000` mounts that many closed collapsibles and times it.
 * `other` is Ark UI (Zag), the library Solid is measured against.
 */
const params = new URLSearchParams(location.search)
const lib = params.get("lib") ?? "kirana"
const count = Number(params.get("n") ?? 1000)
const rows = Array.from({ length: count }, (_, index) => index)
let dispose: (() => void) | undefined

function List() {
  return (
    <Show
      when={lib === "other"}
      fallback={
        <For each={rows}>
          {(index) => (
            <Collapsible.Root>
              <Collapsible.Trigger>Row {index}</Collapsible.Trigger>
              <Collapsible.Panel>Content {index}</Collapsible.Panel>
            </Collapsible.Root>
          )}
        </For>
      }
    >
      <For each={rows}>
        {(index) => (
          <Ark.Root lazyMount unmountOnExit>
            <Ark.Trigger>Row {index}</Ark.Trigger>
            <Ark.Content>Content {index}</Ark.Content>
          </Ark.Root>
        )}
      </For>
    </Show>
  )
}

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
