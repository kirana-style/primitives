import { computed } from "@kirana-ui/core"
import { createToast, createToaster } from "@kirana-ui/core/toast"
import type { Toast, ToastProps, ToastRecord, Toaster } from "@kirana-ui/core/toast"

import { defineElement, entryAround } from "./runtime.ts"

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
 * `<kui-toast>` around a `kui-part="viewport"`, which holds a `<template kui-each="toasts">`
 * with a `toast` for each message (`{id}`, `{title}`, `{description}`, `{type}`), its
 * `content` with a `title` and a `description`, and a `close` and an `action` button if it
 * has them. `label`, `hotkey`, `swipe-direction`; `duration` and `limit` for the toaster it
 * makes, or `toaster` as a property for one of the page's own.
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
    title: (controller, element) => partsOf(controller, element)?.title,
    description: (controller, element) => partsOf(controller, element)?.description,
    close: (controller, element) => partsOf(controller, element)?.close,
    action: (controller, element) => partsOf(controller, element)?.action,
  },
})

export { createToaster }
export type { Toaster }
