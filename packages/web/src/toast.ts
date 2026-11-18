import { computed } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createToast, createToaster } from "@kirana-ui/core/toast"
import type { Toast, ToastProps, ToastRecord, Toaster } from "@kirana-ui/core/toast"

import { defineElement, entryAround } from "./runtime.ts"
import type { Drawn, ElementOf } from "./runtime.ts"

const toasters = new WeakMap<Element, Toaster>()

/**
 * The toaster a `<kui-toast>` draws: its own (made with the element's `duration` and
 * `limit`), unless it was given one as its `toaster` property before it began.
 * `toasterOf(element).add({ title: "Saved" })`.
 */
export function toasterOf(element: Element): Toaster {
  let toaster = toasters.get(element)
  if (!toaster) {
    const number = (name: string) =>
      element.hasAttribute(name) ? { [name]: Number(element.getAttribute(name)) } : {}
    toasters.set(element, (toaster = createToaster({ ...number("duration"), ...number("limit") })))
  }
  return toaster
}

const partsOf = (controller: Toast, element: HTMLElement) => {
  const toast = entryAround<ToastRecord>(element)
  return toast && controller.toast(toast.id)
}

/**
 * A part that says something of the toast's, when the page wrote nothing in its element: the
 * text the toast was added with, and out of the page while the toast has none. What the page
 * wrote there (`{title}`) stays the page's.
 */
const said =
  (name: "title" | "description" | "action") =>
  (controller: Toast, element: HTMLElement): Part | Drawn | undefined => {
    const parts = partsOf(controller, element)
    if (!parts || element.childNodes.length > 0) return parts?.[name]
    const text = computed(() => {
      const toast = parts.record.get()
      return name === "action" ? toast?.action?.label : toast?.[name]
    })
    return { part: parts[name], text, mounted: computed(() => text.get() !== undefined) }
  }

/**
 * `<kui-toast>` around a `kui-part="viewport"`, which holds a `<template kui-each="toasts">`
 * with a `toast` for each message (`{id}`, `{type}`), its `content` with a `title` and a
 * `description`, and a `close` and an `action` button. A `title`, a `description` and an
 * `action` written empty say what the toast was added with, and are in the page only for a
 * toast that has one; one written with something in it (`{title}`) is always there. `label`,
 * `hotkey`, `swipe-direction`; `duration` and `limit` for the toaster it makes, or `toaster`
 * as a property for one of the page's own. A title, a description and an action's label are
 * strings.
 */
export const tag = defineElement<
  Omit<ToastProps, "toaster"> & { toaster?: Toaster; duration?: number; limit?: number },
  Toast
>({
  tag: "kui-toast",
  props: {
    label: "string",
    hotkey: "string",
    "swipe-direction": "string",
    duration: "number",
    limit: "number",
  },
  properties: ["toaster"],
  create(props, host) {
    const given = props.peek().toaster
    if (given) toasters.set(host, given)
    const toaster = toasterOf(host)
    return createToast(
      computed(() => {
        const { duration: _duration, limit: _limit, ...own } = props.get()
        return { ...own, toaster }
      })
    )
  },
  changes: {},
  lists: {
    toasts: (controller) => ({ entries: controller.toasts, key: (toast: ToastRecord) => toast.id }),
  },
  parts: {
    viewport: (controller) => controller.viewport,
    toast: (controller, element) => partsOf(controller, element)?.root,
    content: (controller, element) => partsOf(controller, element)?.content,
    title: said("title"),
    description: said("description"),
    close: (controller, element) => partsOf(controller, element)?.close,
    action: said("action"),
  },
})

export { createToaster }
export type { Toaster }
export type {
  ToastActionOptions,
  ToastOptions,
  ToastRecord,
  ToastState,
  ToasterOptions,
} from "@kirana-ui/core/toast"

declare global {
  interface HTMLElementTagNameMap {
    "kui-toast": ElementOf<typeof tag>
  }
}
