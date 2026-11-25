import type { FileUploadEntry, FileUploadProps } from "@kirana-ui/core/file-upload"
import type { Snippet } from "svelte"

import type { Controlled, HeldInput, HeldText, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:files` is the files held. With `child`, the snippet is also given `input`: the native
 * file input, hidden, which a form submits.
 */
export type RootProps = PartAttributes<
  "div",
  StateFor<"fileUpload", "root">,
  Controlled<FileUploadProps>,
  HeldInput
>

/** Where files are dropped, and pressed to pick them. */
export type DropzoneProps = PartAttributes<"div", StateFor<"fileUpload", "dropzone">>

export type TriggerProps = PartAttributes<"button", StateFor<"fileUpload", "trigger">>

export type ListProps = PartAttributes<"ul", StateFor<"fileUpload", "list">>

/** Draws nothing itself: its snippet once for each file, kept by the file's key. */
export type ItemsProps = { children: Snippet<[FileUploadEntry]> }

export type ItemProps = PartAttributes<
  "li",
  StateFor<"fileUpload", "item">,
  {
    /** The file it is, as `<FileUpload.Items>` gave it. */
    entry: FileUploadEntry
  }
>

/**
 * Says the file's name unless it is given children. With `child`, the snippet is also given
 * that name as `text`.
 */
export type ItemNameProps = PartAttributes<
  "span",
  StateFor<"fileUpload", "itemName">,
  unknown,
  HeldText
>

/**
 * Says the file's size as people read one unless it is given children. With `child`, the
 * snippet is also given that size as `text`.
 */
export type ItemSizeProps = PartAttributes<
  "span",
  StateFor<"fileUpload", "itemSize">,
  {
    /** The language the number is written in. Default: the reader's. */
    locale?: string | undefined
  },
  HeldText
>

export type ItemRemoveProps = PartAttributes<"button", StateFor<"fileUpload", "itemRemove">>

export type ClearProps = PartAttributes<"button", StateFor<"fileUpload", "clear">>
