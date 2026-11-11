import { Collapsible as Base } from "@base-ui/react/collapsible"
import { Collapsible } from "@kirana-ui/react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"

/**
 * The bench page: `?lib=kirana|other&n=1000` mounts that many closed collapsibles (a root, a
 * trigger, a panel that is not in the page) and times it. `other` is Base UI, the library React
 * is measured against.
 */
const params = new URLSearchParams(location.search)
const lib = params.get("lib") ?? "kirana"
const count = Number(params.get("n") ?? 1000)
const rows = Array.from({ length: count }, (_, index) => index)

function List() {
  if (lib === "other") {
    return rows.map((index) => (
      <Base.Root key={index}>
        <Base.Trigger>Row {index}</Base.Trigger>
        <Base.Panel>Content {index}</Base.Panel>
      </Base.Root>
    ))
  }
  return rows.map((index) => (
    <Collapsible.Root key={index}>
      <Collapsible.Trigger>Row {index}</Collapsible.Trigger>
      <Collapsible.Panel>Content {index}</Collapsible.Panel>
    </Collapsible.Root>
  ))
}

const root = createRoot(document.getElementById("root")!)

function timed(work: () => void): number {
  const start = performance.now()
  work()
  // The layout the change asks for is part of its cost.
  void document.body.offsetHeight
  return performance.now() - start
}

Object.assign(window, {
  bench: {
    mount: () => timed(() => flushSync(() => root.render(<List />))),
    toggle(howMany: number) {
      const triggers = [...document.querySelectorAll("button")].slice(0, howMany)
      return timed(() => {
        for (const each of triggers) flushSync(() => each.click())
      })
    },
    unmount: () => timed(() => flushSync(() => root.render(null))),
  },
})
