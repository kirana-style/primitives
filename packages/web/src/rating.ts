import { createRating } from "@kirana-ui/core/rating"
import type { Rating, RatingProps } from "@kirana-ui/core/rating"

import { fieldAround } from "./around.ts"
import { defineElement, entryAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-rating>` around a `kui-part="root"` element holding a `<template kui-each="items">`
 * with an `item` for a place (`{place}` is its number, from 1). The root draws the hidden input
 * a form reads, as its last child. `value`, `default-value`, `count`, `allow-half`, `disabled`,
 * `read-only`, `required`, `name`, `form`; it tells `value-change` and `hover-change`.
 */
export const tag = defineElement<RatingProps, Rating>({
  tag: "kui-rating",
  props: {
    value: "number",
    "default-value": "number",
    count: "number",
    "allow-half": "boolean",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  create: (props, host) => createRating(props, { field: fieldAround(host) }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onHoverChange: { event: "hover-change", prop: "value", hold: false },
  },
  lists: {
    items: (controller) => ({
      entries: controller.places,
      key: (place: number) => place,
      values: (place: number) => ({ place }),
    }),
  },
  parts: {
    root: (controller) => ({ part: controller.root, inner: controller.input }),
    item(controller, element) {
      const place = entryAround<number>(element)
      return place === undefined ? undefined : controller.item(place)
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-rating": ElementOf<
      typeof tag,
      { "value-change": ["onValueChange", "value"]; "hover-change": ["onHoverChange", "value"] }
    >
  }
}
