// What a part's component is made with, for a component of one's own.
export { default as Part } from "./Part.svelte"
export { controller, fromSignal, partProps, toSignal } from "./runtime.svelte.ts"
// The reading direction a `DirectionProvider` around a component states, as the signal a
// controller takes (`{ direction }`); `undefined` outside one. The library's parts read the same.
export { useDirectionAround } from "./direction/context.ts"
export type {
  Attributes,
  ChildGiven,
  Controlled,
  ElementAttributes,
  GivenAttributes,
  HeldInput,
  HeldText,
  PartAttributes,
  PartEvent,
  Placement,
  PositionerProps,
  Renderless,
  RootProps,
  StateFor,
  Tag,
} from "./types.ts"
