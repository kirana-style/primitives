import type { TagsInputEntry, TagsInputProps } from "@kirana-ui/core/tags-input"
import type { Snippet } from "svelte"

import type { Controlled, HeldInput, HeldText, PartAttributes, StateFor } from "../types.ts"

/**
 * `bind:value` is the tags. With `child`, the snippet is also given `input`: the hidden input
 * a form reads the first tag from; the rest follow it, drawn by the component.
 */
export type RootProps = PartAttributes<
  "div",
  StateFor<"tagsInput", "root">,
  Controlled<TagsInputProps>,
  HeldInput
>

export type ListProps = PartAttributes<"div", StateFor<"tagsInput", "list">>

/** Draws nothing itself: its snippet once for each tag, kept by the tag's key. */
export type ItemsProps = { children: Snippet<[TagsInputEntry]> }

export type ItemProps = PartAttributes<
  "span",
  StateFor<"tagsInput", "item">,
  {
    /** The tag it is, as `<TagsInput.Items>` gave it. */
    entry: TagsInputEntry
  }
>

/**
 * Says the tag's text unless it is given children. With `child`, the snippet is also given
 * that text as `text`.
 */
export type ItemTextProps = PartAttributes<
  "span",
  StateFor<"tagsInput", "itemText">,
  unknown,
  HeldText
>

export type ItemInputProps = PartAttributes<"input", StateFor<"tagsInput", "itemInput">>

export type ItemRemoveProps = PartAttributes<"button", StateFor<"tagsInput", "itemRemove">>

export type InputProps = PartAttributes<"input", StateFor<"tagsInput", "input">>

export type ClearProps = PartAttributes<"button", StateFor<"tagsInput", "clear">>
