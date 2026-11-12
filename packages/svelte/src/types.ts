import type { PartProps } from "@kirana-ui/core"
import type { Snippet } from "svelte"

/** Any attribute of the part's element. */
export type Attributes = { [attribute: string]: unknown }

/**
 * What a part's component takes beside its own props: any attribute of its element, its content,
 * or `child`, a snippet that draws the caller's own element with the part's props.
 */
export type PartAttributes = Attributes & {
  child?: Snippet<[{ props: PartProps }]>
  children?: Snippet
}

/** A root's props: its controller's, with the id optional (one is made), and its element's. */
export type RootProps<Props> = Omit<Props, "id"> & { id?: string } & PartAttributes

/** A part whose `children` snippet is given something: the written value, say. */
export type GivenAttributes<Given extends unknown[]> = Attributes & {
  child?: Snippet<[{ props: PartProps }]>
  children?: Snippet<Given>
}
