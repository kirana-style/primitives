import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createRating } from "@kirana-ui/core/rating"
import type { Rating as Controller, RatingProps } from "@kirana-ui/core/rating"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["rating"]

const Context = createContext<Controller | null>(null)

function useRating(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Rating part must be inside <Rating.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<RatingProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onHoverChange",
    "count",
    "allowHalf",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createRating, {
      field: useContext(FieldContext) ?? undefined,
      direction: useContext(DirectionContext) ?? undefined,
    }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      count: local.count,
      allowHalf: local.allowHalf,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      onValueChange: (value: number, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
      onHoverChange: (value: number | null) => local.onHoverChange?.(value),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest}>
        {local.children}
        {/* The input a form reads is the element's last child. */}
        <Part of={made.input} tag="input" />
      </Part>
    </Context>
  )
}

export type ItemsProps = {
  /** Draws one item, once for each place, from 1. */
  children: (place: number) => JSX.Element
}

/** Draws its child once for each item, from 1 to `count`. */
function Items(props: ItemsProps): JSX.Element {
  const places = fromSignal(useRating().places)
  // Each place's item once, as it comes in: a place that stays keeps its element.
  return <For each={places()}>{(place) => untrack(() => props.children(place))}</For>
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    /** Its place among the items, from 1. */
    place: number
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["place"])
  // An item is its place for as long as it is in the page.
  const part = useRating().item(untrack(() => local.place))
  return <Part of={part} tag="span" {...rest} />
}

export const Rating = { Root, Items, Item }
