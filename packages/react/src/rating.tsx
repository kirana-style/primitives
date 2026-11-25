import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createRating } from "@kirana-ui/core/rating"
import type { Rating as Controller, RatingProps } from "@kirana-ui/core/rating"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["rating"]

const Context = createContext<Controller | null>(null)

function useRating(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Rating.${part}> must be inside <Rating.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<RatingProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  onHoverChange,
  count,
  allowHalf,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createRating, { field, direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    onHoverChange,
    count,
    allowHalf,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>
      {usePart(controller.root, "div", rest, undefined, (content) => (
        // The input a form reads is the element's last child, whatever element was asked for.
        <>
          {content}
          <PartElement of={controller.input} tag="input" />
        </>
      ))}
    </Context.Provider>
  )
}

export interface ItemsProps {
  /** Draws one item, once for each place, from 1. */
  children: (place: number) => ReactNode
}

/** Draws its child once for each item, from 1 to `count`. */
function Items({ children }: ItemsProps): ReactElement {
  const places = useSignal(useRating("Items").places)
  return (
    <>
      {places.map((place) => (
        <Fragment key={place}>{children(place)}</Fragment>
      ))}
    </>
  )
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    /** Its place among the items, from 1. */
    place: number
  }
>

function Item({ place, ...props }: ItemProps): ReactElement {
  return usePart(useRating("Item").item(place), "span", props)
}

export const Rating = /* @__PURE__ */ parts("Rating", { Root, Items, Item })
