import { signal } from "@kirana-ui/core"
import { StrictMode } from "react"
import type { ComponentProps, ReactElement } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import {
  Accordion,
  Avatar,
  Button,
  Calendar,
  Checkbox,
  Collapsible,
  Combobox,
  Dialog,
  Meter,
  NavigationMenu,
  ScrollArea,
  Select,
  Slider,
  Toast,
  createToaster,
} from "./index.ts"
import { usePart } from "./runtime.tsx"
import { mergeProps, useRender } from "./use-render.tsx"
import type { RenderProp } from "./use-render.tsx"

// Rendered with no DOM at all: making a controller and reading its parts touches no document.
describe("on the server", () => {
  it("renders an open collapsible with its panel and a closed one without", () => {
    const html = renderToString(
      <>
        <Collapsible.Root id="a" defaultOpen>
          <Collapsible.Trigger>Open</Collapsible.Trigger>
          <Collapsible.Panel>Shown</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root id="b">
          <Collapsible.Trigger>Closed</Collapsible.Trigger>
          <Collapsible.Panel>Hidden</Collapsible.Panel>
        </Collapsible.Root>
      </>
    )
    expect(html).toContain('<div data-open="">')
    expect(html).toContain('aria-expanded="true" aria-controls="a-panel"')
    expect(html).toContain('id="a-panel"')
    expect(html).toContain("Shown")
    expect(html).not.toContain("Hidden")
    expect(html).not.toContain("data-starting-style")
  })

  it("renders a dialog's trigger and no popup, and a select's value and its hidden input", () => {
    const html = renderToString(
      <>
        <Dialog.Root id="d">
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Select.Root
          id="s"
          name="fruit"
          defaultValue="kiwi"
          items={[{ value: "kiwi", label: "Kiwi" }]}
        >
          <Select.Trigger>
            <Select.Value placeholder="Pick" />
          </Select.Trigger>
        </Select.Root>
      </>
    )
    expect(html).toContain('aria-haspopup="dialog" aria-expanded="false"')
    expect(html).not.toContain("Content")
    expect(html).toContain("<span>Kiwi</span>")
    expect(html).toContain('<input type="hidden" name="fruit" value="kiwi"/>')
  })

  it("draws what a toast was added with, whatever React draws, unless the caller draws its own", () => {
    const toaster = createToaster({ duration: Infinity })
    toaster.add({ id: "plain", title: "Plain" })
    toaster.add({
      id: "rich",
      title: (
        <>
          <b>Saved</b> to the cloud
        </>
      ),
      description: <a href="/log">See what changed</a>,
      action: { label: <kbd>Undo</kbd>, onAction() {} },
      priority: "assertive",
    })
    const html = renderToString(
      <Toast.Viewport id="ts" toaster={toaster}>
        <Toast.List>
          {(toast) => (
            <Toast.Root toast={toast}>
              <Toast.Title className="title" />
              <Toast.Description />
              <Toast.Action />
              <Toast.Close>
                {toast.id === "plain" ? <Toast.Title>Mine</Toast.Title> : "Close"}
              </Toast.Close>
            </Toast.Root>
          )}
        </Toast.List>
      </Toast.Viewport>
    )
    expect(html).toContain('<div class="title" id="ts-rich-title"><b>Saved</b> to the cloud</div>')
    expect(html).toContain(
      '<div id="ts-rich-description"><a href="/log">See what changed</a></div>'
    )
    expect(html).toContain('<button type="button"><kbd>Undo</kbd></button>')
    expect(html).toContain('role="alertdialog"')
    expect(html).toContain('aria-live="assertive" aria-atomic="true"')
    // A toast with no description and no action draws neither.
    expect(html).toContain('<div class="title" id="ts-plain-title">Plain</div>')
    expect(html).not.toContain('id="ts-plain-description"')
    expect(html.match(/<kbd>/g)).toHaveLength(1)
    expect(html.match(/<button type="button">/g)).toHaveLength(3)
    // The caller's children win over what the toast was added with.
    expect(html).toContain('<div id="ts-plain-title">Mine</div>')
  })

  it("renders a navigation item that was given no value, with its trigger", () => {
    // The item gave its parts nothing to stand in: the trigger threw as it rendered.
    const menu = (
      <NavigationMenu.Root id="n">
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>More</NavigationMenu.Trigger>
            <NavigationMenu.Content>Shown while open</NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="docs">
            <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    )
    for (const html of [renderToString(menu), renderToString(<StrictMode>{menu}</StrictMode>)]) {
      expect(html).toContain('<button type="button" aria-expanded="false">More</button>')
      expect(html).toContain('<li><a href="/pricing">Pricing</a></li>')
      expect(html).toContain('aria-expanded="false">Docs</button>')
      expect(html).not.toContain("Shown while open")
    }
  })

  it("renders accordion items that were given no value, each with a value of its own", () => {
    const html = renderToString(
      <Accordion.Root id="a" defaultValue={["given"]}>
        {["One", "Two"].map((each) => (
          <Accordion.Item key={each}>
            <Accordion.Header>
              <Accordion.Trigger>{each}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Closed</Accordion.Panel>
          </Accordion.Item>
        ))}
        <Accordion.Item value="given">
          <Accordion.Header>
            <Accordion.Trigger>Given</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Open</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    )
    // Three triggers with three ids: an item's own value is made from the id React gave it.
    const ids = [...html.matchAll(/<button type="button" id="([^"]+)"/g)].map((each) => each[1])
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    expect(ids[2]).toBe("a-trigger-given")
    expect(html).toContain("Open")
    expect(html).not.toContain("Closed")
  })

  it("places each thumb of a range that was given no index at its own value", () => {
    // Both were the first value's, and a thumb's place is a style the server writes.
    const range = (
      <Slider.Root id="s" defaultValue={[25, 50]}>
        <Slider.Control>
          <Slider.Thumb />
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
    )
    for (const html of [renderToString(range), renderToString(<StrictMode>{range}</StrictMode>)]) {
      const thumbs = [
        ...html.matchAll(/aria-valuenow="(\d+)"[^>]*data-index="(\d)"[^>]*style="([^"]*)"/g),
      ]
      expect(thumbs.map((each) => `${each[2]}=${each[1]}`)).toEqual(["0=25", "1=50"])
      expect(thumbs[0]![3]).toContain("inset-inline-start:25%")
      expect(thumbs[1]![3]).toContain("inset-inline-start:50%")
      expect(html).toContain('<input type="hidden" value="25"/>')
      expect(html).toContain('<input type="hidden" value="50"/>')
    }
    // A thumb that says which it is, is that one, wherever it is written.
    const swapped = renderToString(
      <Slider.Root id="s" defaultValue={[25, 50]}>
        <Slider.Control>
          <Slider.Thumb index={1} />
          <Slider.Thumb index={0} />
        </Slider.Control>
      </Slider.Root>
    )
    expect([...swapped.matchAll(/aria-valuenow="(\d+)"/g)].map((each) => each[1])).toEqual([
      "50",
      "25",
    ])
  })

  it("places a scroll area's scrollbars and corner in what it writes", () => {
    const html = renderToString(
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content>Text</ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    )
    expect(html).toContain(
      '<div style="position:relative;--scroll-area-corner-height:0px;--scroll-area-corner-width:0px">'
    )
    expect(html).toContain(
      '<div data-orientation="vertical" style="position:absolute;touch-action:none;-webkit-user-select:none;user-select:none;top:0px;bottom:var(--scroll-area-corner-height);inset-inline-end:0px;--scroll-area-thumb-height:0px">'
    )
    expect(html).toContain(
      '<div data-orientation="horizontal" style="position:absolute;touch-action:none;-webkit-user-select:none;user-select:none;inset-inline-start:0px;inset-inline-end:var(--scroll-area-corner-width);bottom:0px;--scroll-area-thumb-width:0px">'
    )
    // A thumb is out of sight until there is something to measure it by.
    expect(html).toContain(
      '<div data-orientation="vertical" style="visibility:hidden;height:var(--scroll-area-thumb-height)">'
    )
    // No corner until both scrollbars have something to scroll.
    expect(html).not.toContain("position:absolute;bottom:0px")
  })

  it("draws an avatar as Base UI's server does: a fallback that waits is not drawn", () => {
    const html = renderToString(
      <>
        <Avatar.Root>
          <Avatar.Image src="/a.png" alt="A" />
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Image src="/b.png" alt="B" keepMounted />
          <Avatar.Fallback delay={600}>B</Avatar.Fallback>
        </Avatar.Root>
      </>
    )
    // React may put a preload of the kept picture before them.
    expect(html).toContain(
      '<span data-image-loading-status="idle"><span>A</span></span>' +
        // Kept in the page, with its own address, unheard until it loads.
        '<span data-image-loading-status="idle"><img src="/b.png" alt="B" aria-hidden="true"/></span>'
    )
    expect(html).not.toContain(">B<")
  })
})

// A design system's own button: it names its slot on the part, as a wrapper does.
const Slotted = (props: ComponentProps<typeof Button>) => (
  <Button data-slot="button" className="button" style={{ color: "red", margin: 0 }} {...props} />
)

describe("a part drawn as the element its caller asked for", () => {
  it("leaves what a component of the caller's writes on its root as the component orders it", () => {
    // A day's cell as a design system draws it, writing attributes of its own beside the ones
    // it is given: those it writes after them are its own, and those before them stay where
    // the part has nothing to say (the cell is not disabled).
    const own = { "data-disabled": "true", "data-selected": "true" }
    const After = (props: ComponentProps<"td">) => <td {...props} {...own} />
    const Before = (props: ComponentProps<"td">) => <td {...own} {...props} />
    const cell = (day: ReactElement<Record<string, unknown>>) =>
      renderToString(
        <Calendar.Root id="c" defaultValue="2026-04-15" month="2026-04-01">
          <Calendar.Cell date="2026-04-15" render={day} />
        </Calendar.Root>
      ).match(/<td[^>]*>/)![0]
    const after = cell(<After />)
    expect(after).toContain('data-selected="true"')
    expect(after).toContain('data-disabled="true"')
    expect(after).toContain('role="gridcell"')
    const before = cell(<Before />)
    expect(before).toContain('data-selected=""')
    expect(before).toContain('data-disabled="true"')
  })

  it("lets the element's own props win over what the part was handed", () => {
    const html = renderToString(
      <Slotted
        nativeButton={false}
        render={
          <a
            data-slot="pagination-link"
            className="link"
            style={{ margin: 4 }}
            href="#"
            role="link"
          >
            Previous
          </a>
        }
      />
    )
    expect(html).toContain('data-slot="pagination-link"')
    expect(html).not.toContain('data-slot="button"')
    expect(html).toContain('href="#"')
    expect(html).toContain(">Previous</a>")
    // Classes join and styles are merged, the element's own winning a property.
    expect(html).toContain('class="button link"')
    expect(html).toContain('style="color:red;margin:4px"')
    // The part's own are over both: an element that is not a button is given the role of one.
    expect(html).toContain('role="button"')
  })

  it("keeps the element's own children, and the part's caller's where it has none", () => {
    const own = renderToString(<Slotted render={<a href="#">Its own</a>}>Handed</Slotted>)
    expect(own).toContain(">Its own</a>")
    expect(own).not.toContain("Handed")
    expect(renderToString(<Slotted render={<a href="#" />}>Handed</Slotted>)).toContain(
      ">Handed</a>"
    )
  })

  it("writes a part's own text in the element asked for, unless it has its own", () => {
    const value = (render: ReactElement<Record<string, unknown>>) =>
      renderToString(
        <Meter.Root id="m" value={40}>
          <Meter.Value render={render} />
        </Meter.Root>
      )
    expect(value(<b className="mine" />)).toMatch(/<b [^>]*class="mine"[^>]*>40%<\/b>/)
    expect(value(<b>Its own</b>)).toContain(">Its own</b>")
  })

  it("leaves a caller's `part` attribute on the element, for `::part()`", () => {
    const out = renderToString(
      <Collapsible.Root id="n" part="root">
        <Collapsible.Trigger part="trigger">Open</Collapsible.Trigger>
        <Collapsible.Panel part="panel" keepMounted render={<section />}>
          Held
        </Collapsible.Panel>
      </Collapsible.Root>
    )
    expect(out).toMatch(/<div [^>]*part="root"/)
    expect(out).toMatch(/<button [^>]*part="trigger"[^>]*>Open<\/button>/)
    expect(out).toMatch(/<section [^>]*part="panel"[^>]*>Held<\/section>/)
  })

  it("writes `inert` as the boolean React knows it as", () => {
    const part = { props: signal<Record<string, unknown>>({ inert: "" }), attach: () => () => {} }
    const Drawn = () => usePart(part, "div", {})
    expect(renderToString(<Drawn />)).toBe('<div inert=""></div>')
  })

  it("leaves an input disabled by the element it is drawn as", () => {
    const html = renderToString(
      <Combobox.Root id="c" inline>
        <Combobox.Input render={<input className="mine" disabled readOnly />} />
      </Combobox.Root>
    )
    expect(html).toMatch(/<input[^>]*class="mine"/)
    expect(html).toMatch(/<input[^>]* disabled=""/)
    expect(html).toMatch(/<input[^>]* readOnly=""/)
    expect(html).toContain('role="combobox"')
  })

  it("gives a function the part's state, read from its attributes", () => {
    const shown = (open: boolean) =>
      renderToString(
        <Collapsible.Root id="a" defaultOpen={open}>
          <Collapsible.Trigger
            render={(props, state) => (
              <button {...props}>{state.panelOpen ? "is open" : "is closed"}</button>
            )}
          />
        </Collapsible.Root>
      )
    expect(shown(true)).toContain('data-panel-open="">is open</button>')
    expect(shown(false)).toContain(">is closed</button>")
  })

  it("draws a select's and a combobox's item indicator as the element asked for", () => {
    const select = renderToString(
      <Select.Root id="s" defaultValue="kiwi">
        <Select.Item value="kiwi">
          <Select.ItemIndicator className="mark" render={<i className="check" />}>
            chosen
          </Select.ItemIndicator>
        </Select.Item>
        <Select.Item value="plum">
          <Select.ItemIndicator render={<i className="check" />}>not chosen</Select.ItemIndicator>
          <Select.ItemIndicator keepMounted render={(props) => <b {...props}>kept</b>} />
        </Select.Item>
      </Select.Root>
    )
    expect(select).toContain('<i class="mark check" aria-hidden="true">chosen</i>')
    expect(select).not.toContain("not chosen")
    expect(select).toContain('<b aria-hidden="true">kept</b>')

    const combobox = renderToString(
      <Combobox.Root id="c" inline defaultValue="kiwi">
        <Combobox.Popup>
          <Combobox.Item value="kiwi">
            <Combobox.ItemIndicator className="mark" render={<i className="check" />}>
              chosen
            </Combobox.ItemIndicator>
          </Combobox.Item>
          <Combobox.Item value="plum">
            <Combobox.ItemIndicator render={<i className="check" />}>
              not chosen
            </Combobox.ItemIndicator>
            <Combobox.ItemIndicator keepMounted render={(props) => <b {...props}>kept</b>} />
          </Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>
    )
    expect(combobox).toContain('<i class="mark check" aria-hidden="true">chosen</i>')
    expect(combobox).not.toContain("not chosen")
    expect(combobox).toContain('<b aria-hidden="true">kept</b>')
  })

  it("keeps a control's native input in the element asked for", () => {
    const html = renderToString(
      <Checkbox.Root id="x" name="terms" render={<span className="box">Accept</span>} />
    )
    expect(html).toMatch(/<span[^>]*class="box"[^>]*>Accept<input[^>]*type="checkbox"/)
  })

  it("draws a navigation menu's item as the element asked for, with its attributes", () => {
    const html = renderToString(
      <NavigationMenu.Root id="n">
        <NavigationMenu.List>
          <NavigationMenu.Item value="apps" className="item" render={<div role="listitem" />}>
            <NavigationMenu.Trigger>Apps</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    )
    expect(html).toMatch(/<div role="listitem" class="item"><button[^>]*>Apps<\/button><\/div>/)
  })
})

// A design system's own element with the `render` prop a part takes.
function Badge({
  render,
  tone,
  ...props
}: {
  render?: RenderProp<{ tone: string | undefined; pinned: boolean; isNew: boolean }>
  tone?: string
  [attribute: string]: unknown
}) {
  return useRender({
    render,
    defaultTagName: "span",
    state: { tone, pinned: false, isNew: true },
    props: mergeProps({ className: "badge", "data-slot": "badge" }, props),
  })
}

describe("useRender", () => {
  it("draws the default element with the state as attributes", () => {
    expect(renderToString(<Badge tone="quiet">New</Badge>)).toBe(
      '<span data-tone="quiet" data-is-new="" class="badge" data-slot="badge">New</span>'
    )
  })

  it("lays the render element's own props over the component's", () => {
    const html = renderToString(
      <Badge className="mine" render={<a data-slot="breadcrumb-link" className="link" href="#" />}>
        Home
      </Badge>
    )
    expect(html).toBe(
      '<a data-slot="breadcrumb-link" class="badge mine link" href="#" data-is-new="">Home</a>'
    )
  })

  it("gives a function the props and the state", () => {
    const html = renderToString(
      <Badge
        tone="loud"
        render={(props, state) => <em {...props}>{`${state.tone} ${String(state.isNew)}`}</em>}
      />
    )
    expect(html).toContain('<em data-tone="loud" data-is-new="" class="badge"')
    expect(html).toContain(">loud true</em>")
  })
})

describe("mergeProps", () => {
  it("lets a later set win, joins classes, merges styles and chains handlers", () => {
    const heard: string[] = []
    const merged = mergeProps(
      {
        id: "a",
        title: "kept",
        className: "one",
        style: { color: "red", margin: 0 },
        onClick: () => heard.push("first"),
      },
      undefined,
      {
        id: "b",
        title: undefined,
        className: "two",
        style: { margin: 4 },
        onClick: (event: { preventKiranaHandler(): void }) => {
          heard.push("second")
          event.preventKiranaHandler()
        },
      },
      { className: "three", onClick: () => heard.push("third") }
    )
    expect(merged).toMatchObject({
      id: "b",
      title: "kept",
      className: "one two three",
      style: { color: "red", margin: 4 },
    })
    ;(merged.onClick as (event: object) => void)({ type: "click", preventDefault() {} })
    // `preventKiranaHandler()` stops the handlers after the one that called it.
    expect(heard).toEqual(["first", "second"])
  })
})
