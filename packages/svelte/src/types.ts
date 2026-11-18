import type {
  Anchor,
  PartDefinition,
  PartEvent,
  PartProps,
  PartState,
  PositionOptions,
  StateOf,
} from "@kirana-ui/core"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import type { Snippet } from "svelte"
import type { ClassValue, SvelteHTMLElements } from "svelte/elements"

export type { PartEvent }

/** Any attribute of an element, of whatever kind. A part's own are `PartAttributes`. */
export type Attributes = { [attribute: string]: unknown }

/** The elements Svelte knows by name: what a part can be drawn as. */
export type Tag = keyof {
  [
    Name in keyof SvelteHTMLElements as string extends Name
      ? never
      : Name extends `svelte:${string}`
        ? never
        : Name
  ]: unknown
}

/**
 * The state of a part, from the vocabulary: `StateFor<"collapsible", "panel">` knows `open`,
 * `closed`, `startingStyle` and `endingStyle`. Types only: no page carries the vocabulary.
 */
export type StateFor<
  Component extends keyof Vocabulary,
  Name extends keyof Vocabulary[Component],
> = Vocabulary[Component][Name] extends infer Definition extends PartDefinition
  ? StateOf<Definition>
  : never

/**
 * What a `child` snippet is given: the part's props to spread on its element, and its state,
 * read from the part's own `data-*` attributes.
 */
export type ChildGiven<State = PartState> = { props: PartProps; state: State }

// `Omit` asks for the keys of every element at once when the tag is not yet known, which is
// more than the checker will hold: this reads one key at a time.
type Without<Props, Names> = {
  [Name in keyof Props as Name extends Names ? never : Name]: Props[Name]
}

// A handler takes the event with its `preventKiranaHandler()`; anything else is as it was.
type Hearing<Prop> = Prop extends (event: infer Heard) => infer Answer
  ? Heard extends Event
    ? (event: PartEvent<Heard>) => Answer
    : Prop
  : Prop

/**
 * An element's attributes and events as a part takes them: Svelte's own, without the
 * bindings and directives only an element has. A handler's event has
 * `preventKiranaHandler()`, which keeps the part's own handler out of it. A `class` is
 * Svelte's (text, a list, an object of conditions) but for a bare number, which is never a
 * class a caller meant.
 */
export type ElementAttributes<Name extends Tag = "div"> = {
  [
    Each in keyof SvelteHTMLElements[Name] as Each extends
      | "class"
      | `bind:${string}`
      | `on:${string}`
      ? never
      : Each
  ]: Hearing<SvelteHTMLElements[Name][Each]>
} & { class?: Exclude<ClassValue, number | bigint> | null | undefined }

/**
 * What a part's component takes: the attributes and events of the element it draws (`Name`),
 * the part's own props (`Own`) over the element's of the same name, its content, and `child`,
 * a snippet that draws the caller's own element with the part's props and is given the part's
 * state (`State`) and whatever else the part keeps in its element (`Held`: a control's native
 * input as `input`, the text a part writes as `text`, to render inside the caller's element).
 *
 * The element itself is reached with an attachment, `{@attach (element) => …}`, which the
 * part passes to its element, or to the caller's through `child`'s props; `bind:this` on a
 * component gives the component.
 */
export type PartAttributes<
  Name extends Tag = "div",
  State = PartState,
  Own = unknown,
  Held = unknown,
> = Own &
  Without<ElementAttributes<Name>, keyof Own | "child"> & {
    child?: Snippet<[ChildGiven<State> & Held]>
  }

/** A controller's props as its component takes them: the id optional (one is made). */
export type Controlled<Props> = Omit<Props, "id"> & { id?: string | undefined }

/** A root that draws no element of its own: its controller's props, and its content. */
export type Renderless<Props> = Controlled<Props> & { children?: Snippet | undefined }

/** What a form control's `child` snippet is given beside its props and state. */
export type HeldInput = {
  /**
   * The control's own native input, hidden. Render it inside the element the snippet draws,
   * last (`{@render input()}`): it is what a form submits, what a `<label>` presses and what
   * the browser fills in, and the control's change goes through it.
   */
  input: Snippet
}

/** What a part that writes its own text gives its `child` snippet beside its props and state. */
export type HeldText = {
  /**
   * What the part would write in its own element: the value as it is written, the chosen
   * label, a toast's title. Render it inside the element the snippet draws
   * (`{@render text()}`), or leave it out to write something else.
   */
  text: Snippet
}

/** A root's props: its controller's, with the id optional (one is made), and its element's. */
export type RootProps<Props, State = PartState> = PartAttributes<"div", State, Controlled<Props>>

/** A part whose `children` snippet is given something: the written value, say. */
export type GivenAttributes<Given extends unknown[], State = PartState> = PartAttributes<
  "div",
  State,
  { children?: Snippet<Given> }
>

/** Where a positioner's popup goes, and what it is placed against. */
export type Placement = Partial<Omit<PositionOptions, "anchor">> & {
  /**
   * What the popup is placed against, when that is not its trigger: an element (what
   * `bind:this` filled), a place in the viewport (an object with `getBoundingClientRect`), or
   * a function that gives one. It may change while the popup is open: the popup follows.
   */
  anchor?: Anchor | (() => Anchor | null | undefined) | null | undefined
}

/** A positioner's props: where its popup goes and what it is placed against, and its element's. */
export type PositionerProps<State = PartState> = PartAttributes<"div", State, Placement>

/**
 * Says where every popup inside it is drawn, the popups those open included: an element of
 * the page (a shadow root's host, a full-screen element) in place of `<body>`.
 */
export type PortalProviderProps = {
  container?: HTMLElement | null | undefined
  children?: Snippet | undefined
}
