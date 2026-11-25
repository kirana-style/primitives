import type { TagsInput, TagsInputEntry } from "@kirana-ui/core/tags-input"
import { getContext, setContext } from "svelte"

const KEY = Symbol("TagsInput")

export const provide = (controller: TagsInput): TagsInput => setContext(KEY, controller)

export function useTagsInput(): TagsInput {
  const controller = getContext<TagsInput | undefined>(KEY)
  if (!controller) throw new Error("A TagsInput part must be inside <TagsInput.Root>")
  return controller
}

// The tag an item is, for the parts inside it: read through a function, since an edit gives
// the same key a new text.
export const ITEM = Symbol("TagsInputItem")

export function useEntry(part: string): () => TagsInputEntry {
  const entry = getContext<(() => TagsInputEntry) | undefined>(ITEM)
  if (!entry) throw new Error(`<TagsInput.${part}> must be inside <TagsInput.Item>`)
  return entry
}
