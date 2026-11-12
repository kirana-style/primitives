import type { PartProps } from "@kirana-ui/core"
import type { Snippet } from "svelte"

/**
 * What a part's component takes beside its own props: any attribute of its element, its content,
 * or `child`, a snippet that draws the caller's own element with the part's props.
 */
export type PartAttributes = {
  child?: Snippet<[{ props: PartProps }]>
  children?: Snippet
  [attribute: string]: unknown
}
