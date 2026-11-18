import { describe, expect, it } from "vite-plus/test"
import { createSSRApp, defineComponent, h } from "vue"
import type { Component, VNode } from "vue"
import { renderToString } from "vue/server-renderer"

import { draw } from "./element.ts"
import {
  Button,
  Calendar,
  Checkbox,
  Collapsible,
  Combobox,
  DateField,
  Meter,
  NavigationMenu,
  NumberField,
  Otp,
  Progress,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Toast,
  createToaster,
} from "./index.ts"
import type { ToastRecord } from "./index.ts"
import { Primitive } from "./primitive.ts"

// Rendered with no DOM at all: making a controller and reading its parts touches no document.
describe("on the server", () => {
  it("draws what a toast was added with, whatever a render function returns, unless the caller draws its own", async () => {
    const toaster = createToaster({ duration: Infinity })
    toaster.add({ id: "plain", title: "Plain" })
    toaster.add({
      id: "rich",
      title: [h("b", "Saved"), " to the cloud"],
      description: h("a", { href: "/log" }, "See what changed"),
      action: { label: h("kbd", "Undo"), onAction() {} },
    })
    const app = createSSRApp({
      render: () =>
        h(Toast.Viewport, { id: "ts", toaster }, () =>
          h(Toast.List, null, {
            default: ({ toast }: { toast: ToastRecord }) =>
              h(Toast.Root, { toast }, () => [
                h(Toast.Title, { class: "title" }),
                h(Toast.Description),
                h(Toast.Action),
                toast.id === "plain" ? h(Toast.Title, null, () => "Mine") : null,
              ]),
          })
        ),
    })
    const html = (await renderToString(app)).replace(/<!--[^>]*-->/g, "")
    expect(html).toContain('<div class="title" id="ts-rich-title"><b>Saved</b> to the cloud</div>')
    expect(html).toContain(
      '<div id="ts-rich-description"><a href="/log">See what changed</a></div>'
    )
    expect(html).toContain('<button type="button"><kbd>Undo</kbd></button>')
    // A toast with no description and no action draws neither.
    expect(html).toContain('<div class="title" id="ts-plain-title">Plain</div>')
    expect(html).not.toContain('id="ts-plain-description"')
    expect(html.match(/<button/g)).toHaveLength(1)
    // The caller's slot wins over what the toast was added with.
    expect(html).toContain('<div id="ts-plain-title">Mine</div>')
  })
})

// Rendered with no DOM at all, as a server renders a page.
const html = (render: () => VNode) => renderToString(createSSRApp({ render }))

interface Given {
  state: Record<string, string | true>
  text?: string
}

describe("a part drawn as its caller's own element (as-child)", () => {
  it("lets the element's own props win over the attributes on the part", async () => {
    const out = await html(() =>
      h(
        Button as Component,
        {
          asChild: true,
          nativeButton: false,
          "data-slot": "button",
          class: "button",
          style: { color: "red", margin: "0" },
          title: "handed",
        },
        () =>
          h(
            "a",
            {
              "data-slot": "pagination-link",
              class: "link",
              style: { margin: "4px" },
              href: "#",
              role: "link",
            },
            "Previous"
          )
      )
    )
    expect(out).toContain('data-slot="pagination-link"')
    expect(out).not.toContain('data-slot="button"')
    expect(out).toContain('title="handed"')
    expect(out).toContain('href="#"')
    expect(out).toContain(">Previous</a>")
    // Classes join once and styles are merged, the element's own winning a property.
    expect(out).toContain('class="button link"')
    expect(out).toContain('style="color:red;margin:4px;"')
    // The part's own are over both: an element that is not a button is given the role of one.
    expect(out).toContain('role="button"')
  })

  it("leaves an input disabled by the element it is drawn as", async () => {
    const out = await html(() =>
      h(Combobox.Root as Component, { id: "c", inline: true }, () =>
        h(Combobox.Input as Component, { asChild: true }, () =>
          h("input", { class: "mine", disabled: true })
        )
      )
    )
    expect(out).toMatch(/<input[^>]*class="mine"/)
    expect(out).toMatch(/<input[^>]* disabled/)
    expect(out).toContain('role="combobox"')
  })

  it("runs every listener, the part's caller's first, and lets either stop the part's", () => {
    const heard: string[] = []
    const listener = (name: string) => (event: { type: string; preventKiranaHandler(): void }) => {
      heard.push(name)
      if (event.type === name) event.preventKiranaHandler()
    }
    const drawn = draw(
      "button",
      true,
      // Two listeners of one event are a list, as Vue keeps them.
      { onClick: [listener("handed"), listener("also handed")] },
      [h("a", { onClick: listener("element") })],
      { onClick: () => heard.push("part") }
    )!
    const click = drawn.props!.onClick as (event: object) => void
    click({ type: "click", preventDefault() {} })
    expect(heard).toEqual(["handed", "also handed", "element", "part"])
    heard.length = 0
    click({ type: "handed", preventDefault() {} })
    expect(heard).toEqual(["handed", "also handed", "element"])
    heard.length = 0
    click({ type: "element", preventDefault() {} })
    expect(heard).toEqual(["handed", "also handed", "element"])
  })
})

describe("a part's default slot", () => {
  const trigger = (open: boolean, asChild: boolean) =>
    html(() =>
      h(Collapsible.Root as Component, { id: "a", defaultOpen: open }, () =>
        h(
          Collapsible.Trigger as Component,
          { asChild },
          {
            default: ({ state }: Given) =>
              asChild
                ? h("a", { href: "#" }, state.panelOpen ? "is open" : "is closed")
                : state.panelOpen
                  ? "is open"
                  : "is closed",
          }
        )
      )
    )

  it("is given the part's state, read from its attributes", async () => {
    expect(await trigger(true, false)).toContain("data-panel-open>is open</button>")
    expect(await trigger(false, false)).toContain(">is closed</button>")
  })

  it("is given it with as-child too", async () => {
    expect(await trigger(true, true)).toMatch(/<a [^>]*data-panel-open>is open<\/a>/)
    expect(await trigger(false, true)).toMatch(/<a [^>]*>is closed<\/a>/)
  })

  it("keeps what a part already gave its slot", async () => {
    const out = await html(() =>
      h(Meter.Root as Component, { id: "m", value: 40 }, () =>
        h(Meter.Value as Component, null, {
          default: ({ text, state }: Given) => `${text} ${typeof state}`,
        })
      )
    )
    expect(out).toMatch(/>40[^<]* object<\/span>/)
  })
})

describe("parts that used to draw their own element", () => {
  it("draws a select's item indicator and a navigation menu's item as asked", async () => {
    const select = await html(() =>
      h(Select.Root as Component, { id: "s", defaultValue: "kiwi" }, () =>
        h(Select.Item as Component, { value: "kiwi" }, () =>
          h(Select.ItemIndicator as Component, { asChild: true, class: "mark" }, () =>
            h("i", { class: "check" }, "chosen")
          )
        )
      )
    )
    expect(select).toContain('<i class="mark check" aria-hidden="true">chosen</i>')

    const menu = await html(() =>
      h(NavigationMenu.Root as Component, { id: "n" }, () =>
        h(NavigationMenu.List as Component, null, () =>
          h(NavigationMenu.Item as Component, { value: "apps", as: "div", class: "item" }, () =>
            h(NavigationMenu.Trigger as Component, null, () => "Apps")
          )
        )
      )
    )
    expect(menu).toMatch(/<div class="item"><button[^>]*>Apps<\/button><\/div>/)
  })
})

describe("Primitive", () => {
  it("is a div, or the element it is told", async () => {
    expect(await html(() => h(Primitive, { class: "badge" }, () => "New"))).toBe(
      '<div class="badge">New</div>'
    )
    expect(await html(() => h(Primitive, { as: "span", class: "badge" }, () => "New"))).toBe(
      '<span class="badge">New</span>'
    )
  })

  it("with as-child, lays the slotted element's own props over its attributes", async () => {
    const out = await html(() =>
      h(Primitive, { asChild: true, class: "badge", "data-slot": "badge", title: "handed" }, () =>
        h("a", { class: "link", "data-slot": "breadcrumb-link", href: "#" }, "Home")
      )
    )
    expect(out).toBe(
      '<a class="badge link" data-slot="breadcrumb-link" title="handed" href="#">Home</a>'
    )
  })
})

// A caller's own component, which draws what it is given in an element of its own.
const Box = defineComponent({
  name: "Box",
  setup:
    (_props, { slots }) =>
    () =>
      h("label", { class: "box" }, slots.default?.()),
})

type Drawn = (given: { asChild?: boolean }, content?: () => VNode) => VNode

// Each part that keeps something of its own in its element, with the mark of what it keeps.
const KEEPERS: [name: string, part: Drawn, kept: string, plain: string][] = [
  [
    "Checkbox.Root",
    (given, content) => h(Checkbox.Root, { id: "c", name: "agree", ...given }, content),
    '<input type="checkbox" id="c" name="agree" hidden tabindex="-1" aria-hidden="true">',
    '<span role="checkbox" tabindex="0" aria-checked="false" data-unchecked><!----><input type="checkbox" id="c" name="agree" hidden tabindex="-1" aria-hidden="true"></span>',
  ],
  [
    "Switch.Root",
    (given, content) => h(Switch.Root, { id: "s", name: "on", ...given }, content),
    '<input type="checkbox" id="s" name="on" hidden tabindex="-1" aria-hidden="true">',
    '<span role="switch" tabindex="0" aria-checked="false" data-unchecked><!----><input type="checkbox" id="s" name="on" hidden tabindex="-1" aria-hidden="true"></span>',
  ],
  [
    "RadioGroup.Item",
    (given, content) =>
      h(RadioGroup.Root, { id: "r", name: "pick" }, () =>
        h(RadioGroup.Item, { value: "a", ...given }, content)
      ),
    '<input type="radio" name="pick" value="a" hidden tabindex="-1" aria-hidden="true">',
    '<div role="radiogroup"><span role="radio" tabindex="0" aria-checked="false" data-unchecked><!----><input type="radio" name="pick" value="a" hidden tabindex="-1" aria-hidden="true"></span></div>',
  ],
  [
    "Slider.Thumb",
    (given, content) =>
      h(Slider.Root, { id: "sl", name: "vol", defaultValue: 40 }, () =>
        h(Slider.Thumb, given, content)
      ),
    '<input type="hidden" name="vol" value="40">',
    '<div role="group" data-orientation="horizontal"><div role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-orientation="horizontal" data-index="0" data-orientation="horizontal" style="position:absolute;inset-inline-start:40%;top:50%;translate:-50% -50%;"><!----><input type="hidden" name="vol" value="40"></div></div>',
  ],
  [
    "NumberField.Root",
    (given, content) =>
      h(NumberField.Root, { id: "n", name: "qty", defaultValue: 2, ...given }, content),
    '<input type="hidden" name="qty" value="2">',
    '<div data-filled><!----><input type="hidden" name="qty" value="2"></div>',
  ],
]

describe("a part that keeps a native input in its element", () => {
  for (const [name, part, kept, plain] of KEEPERS) {
    it(`${name}: draws what it drew, when it is not asked for another element`, async () => {
      expect(await html(() => part({}))).toBe(plain)
    })

    it(`${name}: holds its input once, last, in the element its caller asked for`, async () => {
      const out = await html(() =>
        part({ asChild: true }, () => h("label", { class: "mine" }, "text"))
      )
      expect(out.split(kept)).toHaveLength(2)
      expect(out.replace(/<!--[^>]*-->/g, "")).toContain(`text${kept}</label>`)
      expect(out).toContain('<label class="mine"')
    })

    it(`${name}: holds its input once, last, in what a component of its caller's draws`, async () => {
      const out = await html(() => part({ asChild: true }, () => h(Box, null, () => "text")))
      expect(out.split(kept)).toHaveLength(2)
      expect(out.replace(/<!--[^>]*-->/g, "")).toContain(`text${kept}</label>`)
      expect(out).toContain('<label class="box"')
    })
  }

  it("a number field with no name keeps none, whichever element it is", async () => {
    const unnamed = (given: { asChild?: boolean }, content?: () => VNode) =>
      h(NumberField.Root, { id: "n", defaultValue: 2, ...given }, content)
    expect(await html(() => unnamed({}))).toBe("<div data-filled><!----><!----></div>")
    const out = await html(() => unnamed({ asChild: true }, () => h("label", "text")))
    expect(out.replace(/<!--[^>]*-->/g, "")).toBe("<label data-filled>text</label>")
  })

  it("a code cell shows its character first, whichever element it is", async () => {
    const cell = (given: { asChild?: boolean }, content?: () => VNode) =>
      h(Otp.Root, { id: "o", length: 2, defaultValue: "7" }, () =>
        h(Otp.Slot, { index: 0, ...given }, content)
      )
    expect(await html(() => cell({}, () => h("i")))).toBe(
      '<div><div data-index="0" data-filled>7<!--[--><i></i><!--]--></div></div>'
    )
    const out = await html(() => cell({ asChild: true }, () => h("b", { class: "mine" }, "x")))
    expect(out.replace(/<!--[^>]*-->/g, "")).toBe(
      '<div><b class="mine" data-index="0" data-filled>7x</b></div>'
    )
    const boxed = await html(() => cell({ asChild: true }, () => h(Box, null, () => "x")))
    expect(boxed.replace(/<!--[^>]*-->/g, "")).toBe(
      '<div><label class="box" data-index="0" data-filled>7x</label></div>'
    )
  })
})

describe("a part that writes its own text", () => {
  const plain = (out: string) => out.replace(/<!--[^>]*-->/g, "")

  it("writes it in the caller's own element (as-child), unless that element writes its own", async () => {
    const own = { asChild: true }
    const out = plain(
      await html(() =>
        h("main", [
          h(Meter.Root as Component, { id: "m", value: 40 }, () =>
            h(Meter.Value as Component, own, () => h("b", { class: "meter" }))
          ),
          h(Progress.Root as Component, { id: "g", value: 25 }, () =>
            h(Progress.Value as Component, own, () => h("b", { class: "progress" }))
          ),
          h(Slider.Root as Component, { id: "w", defaultValue: 30 }, () =>
            h(Slider.Value as Component, own, () => h("b", { class: "slider" }))
          ),
          h(
            Select.Root as Component,
            { id: "s", defaultValue: "kiwi", items: { kiwi: "Kiwi" } },
            () => h(Select.Value as Component, own, () => h("b", { class: "select" }))
          ),
          h(
            Calendar.Root as Component,
            { id: "c", defaultValue: "2026-03-09", locale: "en-US" },
            () => h(Calendar.Heading as Component, own, () => h("h2"))
          ),
          h(
            DateField.Root as Component,
            { id: "d", defaultValue: "2026-03-09", locale: "en-US" },
            () =>
              h(DateField.Segments as Component, null, {
                default: ({ segment }: { segment: object }) =>
                  h(DateField.Segment as Component, { segment, ...own }, () => h("i")),
              })
          ),
          h(Meter.Root as Component, { id: "o", value: 40 }, () =>
            h(Meter.Value as Component, own, {
              default: ({ text }: Given) => h("b", { class: "mine" }, `${text} full`),
            })
          ),
          h(Meter.Root as Component, { id: "x", value: 40 }, () =>
            h(Meter.Value as Component, own, () => h(Box))
          ),
        ])
      )
    )
    expect(out).toMatch(/<b class="meter"[^>]*>40%<\/b>/)
    expect(out).toMatch(/<b class="progress"[^>]*>25%<\/b>/)
    expect(out).toMatch(/<b class="slider"[^>]*>30<\/b>/)
    expect(out).toMatch(/<b class="select"[^>]*>Kiwi<\/b>/)
    expect(out).toMatch(/<h2[^>]*>March 2026<\/h2>/)
    expect(out).toMatch(/<i [^>]*>03<\/i>.*<i [^>]*>2026<\/i>/s)
    // The element's own content stays, and a component of the caller's is given the text.
    expect(out).toMatch(/<b class="mine"[^>]*>40% full<\/b>/)
    expect(out).toMatch(/<label class="box"[^>]*>40%<\/label>/)
  })

  it("a toast's title, description and action say what it was added with there too", async () => {
    const toaster = createToaster({ duration: Infinity })
    toaster.add({
      id: "t",
      title: "Saved",
      description: "To the cloud",
      action: { label: "Undo", onAction() {} },
    })
    const out = plain(
      await html(() =>
        h(Toast.Viewport, { id: "ts", toaster }, () =>
          h(Toast.List, null, {
            default: ({ toast }: { toast: ToastRecord }) =>
              h(Toast.Root, { toast }, () => [
                h(Toast.Title as Component, { asChild: true }, () => h("h3")),
                h(Toast.Description as Component, { asChild: true }, () => h("p")),
                h(Toast.Action as Component, { asChild: true }, () => h("a")),
              ]),
          })
        )
      )
    )
    expect(out).toMatch(/<h3[^>]*>Saved<\/h3>/)
    expect(out).toMatch(/<p[^>]*>To the cloud<\/p>/)
    expect(out).toMatch(/<a[^>]*>Undo<\/a>/)
  })

  it("hands a select's value its state beside what is chosen", async () => {
    const out = plain(
      await html(() =>
        h(
          Select.Root as Component,
          { id: "s", defaultValue: "kiwi", items: { kiwi: "Kiwi" } },
          () =>
            h(Select.Value as Component, null, {
              default: ({ state, label }: { state?: object; label: unknown }) =>
                `${String(label)} ${typeof state}`,
            })
        )
      )
    )
    expect(out).toContain(">Kiwi object</span>")
  })
})

describe("the element's own `part` attribute", () => {
  it("is the caller's to write, for `::part()`", async () => {
    const out = await html(() =>
      h(Collapsible.Root as Component, { id: "n", part: "root" }, () => [
        h(Collapsible.Trigger as Component, { part: "trigger" }, () => "Open"),
        h(Collapsible.Panel as Component, { part: "panel", keepMounted: true, asChild: true }, () =>
          h("section", "Held")
        ),
      ])
    )
    expect(out).toMatch(/<div [^>]*part="root"/)
    expect(out).toMatch(/<button [^>]*part="trigger"[^>]*>Open<\/button>/)
    expect(out).toMatch(/<section [^>]*part="panel"[^>]*>Held<\/section>/)
  })
})
