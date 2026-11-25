import { computed } from "@kirana-ui/core"
import { createFileUpload, formatBytes } from "@kirana-ui/core/file-upload"
import type { FileUpload, FileUploadEntry, FileUploadProps } from "@kirana-ui/core/file-upload"

import { fieldAround } from "./around.ts"
import { defineElement, entryAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/** The file a part is in: the entry its item was stamped for. */
const keyOf = (element: HTMLElement) => entryAround<FileUploadEntry>(element)?.key

/**
 * `<kui-file-upload>` around `kui-part="root"`, which holds a `dropzone` (with a `trigger`
 * button inside, if the page wants one), a `list` with a `<template kui-each="items">` for a
 * file (`{name}`, `{size}` in bytes, `{type}` and `{index}` are its own), and a `clear` button.
 * An `item` holds its `item-name` and `item-size`, which say the file's name and its size as
 * people read one (in the language of its `kui-locale`) unless the page wrote something, and an
 * `item-remove` button. The dropzone draws the native file input, hidden, as its last child.
 * `accept`, `multiple`, `max-files`, `max-size`, `min-size`, `disabled`, `required`, `name`,
 * `form`; `files`, `default-files` and `validate` as properties. It tells `files-change` and
 * `files-reject` (`detail.rejections`).
 */
export const tag = defineElement<FileUploadProps, FileUpload>({
  tag: "kui-file-upload",
  props: {
    accept: "string",
    multiple: "boolean",
    "max-files": "number",
    "max-size": "number",
    "min-size": "number",
    disabled: "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["files", "defaultFiles", "validate"],
  create: (props, host) => createFileUpload(props, { field: fieldAround(host) }),
  changes: {
    onFilesChange: { event: "files-change", prop: "files" },
    onFilesReject: { event: "files-reject", prop: "rejections", hold: false },
  },
  lists: {
    items: (controller) => ({
      entries: controller.entries,
      key: (entry: FileUploadEntry) => entry.key,
      values: (entry: FileUploadEntry) => ({
        name: entry.file.name,
        size: entry.file.size,
        type: entry.file.type,
        index: entry.index,
      }),
    }),
  },
  parts: {
    root: (controller) => controller.root,
    dropzone: (controller) => ({ part: controller.dropzone, inner: controller.input }),
    trigger: (controller) => controller.trigger,
    list: (controller) => controller.list,
    item(controller, element) {
      const key = keyOf(element)
      return key === undefined ? undefined : controller.item(key)
    },
    "item-name"(controller, element) {
      const entry = entryAround<FileUploadEntry>(element)
      if (!entry) return undefined
      const { name } = entry.file
      return { part: controller.itemName(entry.key), text: computed(() => name) }
    },
    "item-size"(controller, element) {
      const entry = entryAround<FileUploadEntry>(element)
      if (!entry) return undefined
      const { size } = entry.file
      return {
        part: controller.itemSize(entry.key),
        text: computed(() => formatBytes(size, element.getAttribute("kui-locale") ?? undefined)),
      }
    },
    "item-remove"(controller, element) {
      const key = keyOf(element)
      return key === undefined ? undefined : controller.itemRemove(key)
    },
    clear: (controller) => controller.clear,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-file-upload": ElementOf<
      typeof tag,
      {
        "files-change": ["onFilesChange", "files"]
        "files-reject": ["onFilesReject", "rejections"]
      }
    >
  }
}
