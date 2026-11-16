// What a part's component is made with, for a component of one's own.
export { default as Part } from "./Part.svelte"
export { controller, fromSignal, partProps, toSignal } from "./runtime.svelte.ts"
export type { Attributes, GivenAttributes, PartAttributes, RootProps } from "./types.ts"
