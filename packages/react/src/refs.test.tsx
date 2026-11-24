import { createRef, forwardRef } from "react"
import type * as React from "react"
import type { ReactElement, Ref } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { Accordion, Avatar, Button, Collapsible, Dialog } from "./index.ts"
import { component, parts } from "./runtime.tsx"

// There is no DOM here, so no element is ever made: what is held is the path a ref takes. The
// ref a part gives its element is caught as the element is drawn, then handed an element as
// React would hand it one, and the caller's ref must have it.
const drawn = vi.hoisted(() => ({ refs: [] as unknown[] }))
vi.mock("react", async (original) => {
  const react = await original<typeof React>()
  return {
    ...react,
    createElement: (type: unknown, props: { ref?: unknown } | null, ...children: unknown[]) => {
      if (typeof type === "string" && props?.ref) drawn.refs.push(props.ref)
      return (react.createElement as (...given: unknown[]) => ReactElement)(
        type,
        props,
        ...children
      )
    },
  }
})

// An element as far as a part's own work on it goes: it listens, and is never in a page.
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

function handed(page: ReactElement): (given: HTMLElement) => void {
  drawn.refs.length = 0
  renderToString(page)
  // The part asked about is the last one drawn.
  expect(drawn.refs.length).toBeGreaterThan(0)
  return drawn.refs.at(-1) as (given: HTMLElement) => void
}

describe("a part's ref", () => {
  it("is given the part's element: an object ref and a function ref", () => {
    const object = createRef<HTMLButtonElement>()
    const one = element()
    handed(
      <Collapsible.Root>
        <Collapsible.Trigger ref={object} />
      </Collapsible.Root>
    )(one)
    expect(object.current).toBe(one)

    const seen: unknown[] = []
    const two = element()
    handed(
      <Collapsible.Root>
        <Collapsible.Trigger ref={(given) => void seen.push(given)} />
      </Collapsible.Root>
    )(two)
    expect(seen).toHaveLength(1)
    expect(seen[0]).toBe(two)
  })

  it("is given it through a part that draws its element as a component of its own", () => {
    // A root and a fallback hand their props to `PartElement`; a lone component is one function.
    const root = createRef<HTMLDivElement>()
    const fallback = createRef<HTMLSpanElement>()
    const button = createRef<HTMLButtonElement>()
    const given = element()
    handed(<Accordion.Root ref={root} />)(given)
    expect(root.current).toBe(given)
    handed(
      <Avatar.Root>
        <Avatar.Fallback ref={fallback} />
      </Avatar.Root>
    )(given)
    expect(fallback.current).toBe(given)
    handed(<Button ref={button} />)(given)
    expect(button.current).toBe(given)
  })

  it("is given the element a `render` function draws, and a `render` element's own ref too", () => {
    const object = createRef<HTMLButtonElement>()
    const given = element()
    let attach: Ref<HTMLElement> | undefined
    renderToString(
      <Dialog.Root>
        <Dialog.Trigger
          ref={object}
          render={(props) => {
            attach = props.ref
            return <a {...props} />
          }}
        />
      </Dialog.Root>
    )
    ;(attach as (given: HTMLElement) => void)(given)
    expect(object.current).toBe(given)

    // An element of a component's: the component is handed the ref the part made.
    const theirs = createRef<HTMLAnchorElement>()
    const mine = createRef<HTMLButtonElement>()
    const Probe = forwardRef<HTMLAnchorElement, object>((_props, ref) => {
      attach = ref as Ref<HTMLElement>
      return <a />
    })
    renderToString(
      <Dialog.Root>
        <Dialog.Trigger ref={mine} render={<Probe ref={theirs} />} />
      </Dialog.Root>
    )
    const other = element()
    ;(attach as (given: HTMLElement) => void)(other)
    expect(mine.current).toBe(other)
    expect(theirs.current).toBe(other)
  })

  it("names its parts for DevTools, and keeps the name a shared part has", () => {
    expect((Dialog.Trigger as { displayName?: string }).displayName).toBe("Dialog.Trigger")
    expect((Button as { displayName?: string }).displayName).toBe("Button")
    const Shared = component("First.Shared", () => null)
    const second = parts("Second", { Shared, Own: () => null })
    expect(second.Shared).toBe(Shared)
    expect((second.Shared as { displayName?: string }).displayName).toBe("First.Shared")
    expect((second.Own as { displayName?: string }).displayName).toBe("Second.Own")
  })
})
