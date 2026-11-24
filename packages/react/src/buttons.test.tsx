import type * as React from "react"
import type * as Runtime from "./runtime.tsx"
import type { ReactElement, ReactNode } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

// A `<button>` with no `type` submits the form it is in. Every element a part draws is made by
// `createElement` (the page's own JSX is not), so what is caught here is the library's alone.
const drawn = vi.hoisted(() => ({ buttons: [] as Record<string, unknown>[] }))
vi.mock("react", async (original) => {
  const react = await original<typeof React>()
  return {
    ...react,
    createElement: (
      type: unknown,
      props: Record<string, unknown> | null,
      ...children: unknown[]
    ) => {
      if (type === "button") drawn.buttons.push(props ?? {})
      return (react.createElement as (...given: unknown[]) => ReactElement)(
        type,
        props,
        ...children
      )
    },
  }
})
// A portal is the browser's, so a server draws none: here it draws what it holds in place, and
// what an open popup holds is read as well.
vi.mock("./runtime.tsx", async (original) => ({
  ...(await original<typeof Runtime>()),
  Portal: ({ children }: { children?: ReactNode }) => children,
}))

const { App } = await import("../../../fixtures/react/src/App.tsx")
const { Open } = await import("../../../fixtures/react/src/Open.tsx")
const { AlertDialog, Button, Dialog, Drawer, HoverCard, Menu, Popover, Tooltip } =
  await import("./index.ts")

const called = (props: Record<string, unknown>) =>
  String(props["data-testid"] ?? props.id ?? props["aria-label"] ?? JSON.stringify(props))

function untyped(page: ReactElement): string[] {
  drawn.buttons.length = 0
  renderToString(page)
  expect(drawn.buttons.length).toBeGreaterThan(0)
  return drawn.buttons.filter((props) => props.type === undefined).map(called)
}

describe("every button a part draws", () => {
  it("has a type, on both fixture pages: the tooltip's trigger among them", () => {
    expect(untyped(<App />)).toEqual([])
    expect(untyped(<Open />)).toEqual([])
  })

  it("has a type in an open popup", () => {
    const page = (
      <>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger data-testid="tooltip">t</Tooltip.Trigger>
        </Tooltip.Root>
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>d</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close data-testid="dialog-close">x</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close data-testid="alert-close">x</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Close data-testid="drawer-close">x</Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
        <Popover.Root defaultOpen>
          <Popover.Trigger>p</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close data-testid="popover-close">x</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </>
    )
    expect(untyped(page)).toEqual([])
    expect(drawn.buttons.map(called)).toEqual(
      expect.arrayContaining([
        "tooltip",
        "dialog-close",
        "alert-close",
        "drawer-close",
        "popover-close",
      ])
    )
  })

  it("is not a hover card's trigger, which is a link", () => {
    drawn.buttons.length = 0
    const html = renderToString(
      <HoverCard.Root>
        <HoverCard.Trigger href="#card">h</HoverCard.Trigger>
      </HoverCard.Root>
    )
    expect(drawn.buttons).toEqual([])
    expect(html).toMatch(/^<a [^>]*href="#card"/)
    expect(html).not.toContain("type=")
  })

  it("is the caller's type when it gives one: a submit button submits its form", () => {
    drawn.buttons.length = 0
    const html = renderToString(
      <form>
        <Button type="submit" data-testid="send">
          Send
        </Button>
        <Button type="reset" data-testid="clear">
          Clear
        </Button>
        <Tooltip.Root>
          <Tooltip.Trigger type="submit" data-testid="save">
            Save
          </Tooltip.Trigger>
        </Tooltip.Root>
      </form>
    )
    const typeOf = (testid: string) =>
      drawn.buttons.find((props) => props["data-testid"] === testid)?.type
    expect(typeOf("send")).toBe("submit")
    expect(typeOf("clear")).toBe("reset")
    expect(typeOf("save")).toBe("submit")
    expect(html).not.toContain('type="button"')
  })

  it("is not written on a part drawn as a link", () => {
    drawn.buttons.length = 0
    const html = renderToString(
      <>
        <Tooltip.Root>
          <Tooltip.Trigger render={<a href="#tooltip" />}>t</Tooltip.Trigger>
        </Tooltip.Root>
        <Dialog.Root>
          <Dialog.Trigger render={<a href="#dialog" />}>d</Dialog.Trigger>
        </Dialog.Root>
        <Popover.Root>
          <Popover.Trigger render={<a href="#popover" />}>p</Popover.Trigger>
        </Popover.Root>
        <Menu.Root>
          <Menu.Trigger render={<a href="#menu" />}>m</Menu.Trigger>
        </Menu.Root>
        <Button nativeButton={false} render={<a href="#button" />}>
          b
        </Button>
      </>
    )
    expect(drawn.buttons).toEqual([])
    expect(html.match(/<a /g)).toHaveLength(5)
    expect(html).not.toContain("type=")
  })
})
