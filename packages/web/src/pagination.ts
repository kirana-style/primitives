import { createPagination } from "@kirana-ui/core/pagination"
import type { Pagination, PaginationEntry, PaginationProps } from "@kirana-ui/core/pagination"

import { defineElement, entryAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/**
 * `<kui-pagination>` around a `kui-part="root"` nav with `previous` and `next` buttons and,
 * between them, a `<template kui-each="items">` holding an `item` button for a page
 * (`kui-when="page"`; `{page}` is its number) and an `ellipsis` for a gap
 * (`kui-when="ellipsis"`; `{key}` is `start` or `end`). `page`, `default-page`, `count`,
 * `page-size`, `sibling-count`, `boundary-count`, `disabled`; it tells `page-change`.
 */
export const tag = defineElement<PaginationProps, Pagination>({
  tag: "kui-pagination",
  props: {
    page: "number",
    "default-page": "number",
    count: "number",
    "page-size": "number",
    "sibling-count": "number",
    "boundary-count": "number",
    disabled: "boolean",
  },
  create: (props) => createPagination(props),
  changes: { onPageChange: { event: "page-change", prop: "page" } },
  lists: {
    items: (controller) => ({
      entries: controller.entries,
      key: (entry: PaginationEntry) => entry.key,
      type: (entry: PaginationEntry) => entry.type,
    }),
  },
  parts: {
    root: (controller) => controller.root,
    previous: (controller) => controller.previous,
    next: (controller) => controller.next,
    ellipsis: (controller) => controller.ellipsis,
    item(controller, element) {
      const entry = entryAround<PaginationEntry>(element)
      return entry?.type === "page" ? controller.item(entry.page) : undefined
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-pagination": ElementOf<typeof tag, { "page-change": ["onPageChange", "page"] }>
  }
}
