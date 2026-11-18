import { describe, expectTypeOf, it } from "vite-plus/test"

import type { ChangeDetails } from "@kirana-ui/core"
import type { Combobox } from "@kirana-ui/core/combobox"

import type {} from "./index.ts"
import type { Told } from "./runtime.ts"

type Elements = HTMLElementTagNameMap

// Read by the type checker only: each is called by nothing, so no page is needed.
type Usage = (
  page: Document,
  combobox: Elements["kui-combobox"],
  slider: Elements["kui-slider"],
  dialog: Elements["kui-dialog"],
  menu: Elements["kui-menu"]
) => void

describe("the custom elements, as TypeScript knows them", () => {
  it("names every element, so the page's own lookups give it", () => {
    const found = (page: Document) => page.querySelector("kui-combobox")
    expectTypeOf(found).returns.toEqualTypeOf<Elements["kui-combobox"] | null>()
    const made = (page: Document) => page.createElement("kui-dialog")
    expectTypeOf(made).returns.toEqualTypeOf<Elements["kui-dialog"]>()
    expectTypeOf<Elements["kui-dialog"]>().toExtend<HTMLElement>()
    // @ts-expect-error no component has this name
    expectTypeOf<HTMLElementTagNameMap["kui-nothing"]>().toBeAny()
  })

  it("types what an element tells: the value under its prop's name, and why", () => {
    const typed: Usage = (_page, combobox, slider, dialog, menu) => {
      combobox.addEventListener("values-change", (event) => {
        expectTypeOf(event).toEqualTypeOf<Told<"values", string[]>>()
        expectTypeOf(event.detail.values).toEqualTypeOf<string[]>()
        expectTypeOf(event.detail.details).toEqualTypeOf<ChangeDetails>()
        // @ts-expect-error the values are under `values`, not `value`
        void event.detail.value
      })
      combobox.addEventListener("value-change", (event) => {
        expectTypeOf(event.detail.value).toEqualTypeOf<string | null>()
      })
      combobox.addEventListener("open-change", (event) => {
        expectTypeOf(event.detail.open).toEqualTypeOf<boolean>()
      })
      slider.addEventListener("value-committed", (event) => {
        expectTypeOf(event.detail.value).toEqualTypeOf<number | number[]>()
      })
      // What a menu's parts tell reaches the menu.
      menu.addEventListener("checked-change", (event) => {
        expectTypeOf(event.detail.checked).toEqualTypeOf<boolean>()
      })
      // The page's own events are as they were.
      dialog.addEventListener("click", (event) => {
        expectTypeOf(event).toExtend<MouseEvent>()
      })
      dialog.addEventListener("open-change", (event) => {
        // @ts-expect-error a dialog tells `open`, not `value`
        void event.detail.value
      })
    }
    expectTypeOf(typed).toBeFunction()
  })

  it("types an element's props as properties, and its controller", () => {
    expectTypeOf<Elements["kui-dialog"]["open"]>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<Elements["kui-slider"]["min"]>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Elements["kui-combobox"]["controller"]>().toEqualTypeOf<
      Combobox<string> | undefined
    >()
    const set: Usage = (_page, _combobox, _slider, dialog) => {
      dialog.open = true
      // @ts-expect-error `open` is a boolean
      dialog.open = "yes"
      // @ts-expect-error a callback is told as an event, not set as a property
      dialog.onOpenChange = () => {}
    }
    expectTypeOf(set).toBeFunction()
  })
})
