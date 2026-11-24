import { createRef } from "react"
import type { ReactElement, Ref } from "react"
import { renderToString } from "react-dom/server"
import { signal } from "@kirana-ui/core"
import { describe, expect, it, vi } from "vite-plus/test"

import type * as Element from "./element.ts"

// The path React 18 takes, on the React that is installed: a component is given its ref only
// through `forwardRef`, as it was before a ref became a prop.
vi.mock("./element.ts", async (original) => ({
  ...(await original<typeof Element>()),
  REF_IS_A_PROP: false,
  // The installed React still keeps an element's ref among its props.
  refOf: (element: ReactElement) => (element.props as { ref?: Ref<HTMLElement> }).ref,
}))

const { Accordion, Avatar, Button, Collapsible, Dialog, Tabs } = await import("./index.ts")
const { component, usePart } = await import("./runtime.tsx")

const element = () =>
  new Proxy({} as HTMLElement, {
    get: (_target, key) =>
      key === "isConnected"
        ? false
        : key === "ownerDocument"
          ? undefined
          : key === "localName"
            ? "button"
            : () => undefined,
  })

describe("a part's ref where a component is given one only through forwardRef", () => {
  it("wraps every part, under its name", () => {
    for (const part of [Dialog.Trigger, Dialog.Root, Accordion.Root, Button]) {
      expect((part as unknown as { $$typeof: symbol }).$$typeof).toBe(
        Symbol.for("react.forward_ref")
      )
    }
    expect((Dialog.Trigger as { displayName?: string }).displayName).toBe("Dialog.Trigger")
    expect((Button as { displayName?: string }).displayName).toBe("Button")
    // One wrapper for one component, however often it is asked for.
    const draw = () => null
    expect(component("A", draw)).toBe(component("B", draw))
  })

  it("hands the ref on: to the part, and through a part that draws its element apart", () => {
    const refs = {
      trigger: createRef<HTMLButtonElement>(),
      root: createRef<HTMLDivElement>(),
      fallback: createRef<HTMLSpanElement>(),
      button: createRef<HTMLButtonElement>(),
      tabs: createRef<HTMLDivElement>(),
    }
    const attached: Record<string, Ref<HTMLElement> | undefined> = {}
    const caught = (name: string) => (props: { ref?: Ref<HTMLElement> | undefined }) => {
      attached[name] = props.ref
      return <i />
    }
    renderToString(
      <>
        <Accordion.Root ref={refs.root} render={caught("root")} />
        <Collapsible.Root>
          <Collapsible.Trigger ref={refs.trigger} render={caught("trigger")} />
        </Collapsible.Root>
        <Avatar.Root>
          <Avatar.Fallback ref={refs.fallback} render={caught("fallback")} />
        </Avatar.Root>
        <Button ref={refs.button} render={caught("button")} />
        <Tabs.Root<string> ref={refs.tabs} defaultValue="a" render={caught("tabs")} />
      </>
    )
    for (const name of Object.keys(refs) as (keyof typeof refs)[]) {
      const given = element()
      ;(attached[name] as (given: HTMLElement) => void)(given)
      expect(refs[name].current, name).toBe(given)
    }
  })

  it("draws what it drew without a ref", () => {
    expect(
      renderToString(
        <Collapsible.Root id="c" defaultOpen>
          <Collapsible.Trigger>Open</Collapsible.Trigger>
          <Collapsible.Panel>Shown</Collapsible.Panel>
        </Collapsible.Root>
      )
    ).toContain('aria-expanded="true" aria-controls="c-panel"')
  })
})

describe("`inert` where React does not know it as a boolean", () => {
  const part = (props: Record<string, unknown>) => ({
    props: signal(props),
    attach: () => () => undefined,
  })
  function Drawn({ of }: { of: Record<string, unknown> }): ReactElement {
    return usePart(part(of), "div", {})
  }

  it("is written as an empty attribute, and left out when the part is not inert", () => {
    // React 18 drops `inert={true}` with a warning, and writes `inert=""`.
    let handed: Record<string, unknown> = {}
    const caught = (props: Record<string, unknown>) => {
      handed = props
      return <i />
    }
    function Asked({ of }: { of: Record<string, unknown> }): ReactElement {
      return usePart(part(of), "div", { render: caught })
    }
    renderToString(<Asked of={{ inert: "", hidden: "" }} />)
    expect(handed.inert).toBe("")
    expect(handed.hidden).toBe(true)
    renderToString(<Asked of={{ inert: undefined }} />)
    expect(handed.inert).toBeUndefined()
    expect(renderToString(<Drawn of={{ inert: undefined }} />)).toBe("<div></div>")
  })
})
