import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "../src/runtime.tsx"
import type { PartComponentProps } from "../src/runtime.tsx"
import { createRating } from "../../../docs/examples/rating.ts"
import type { Rating as Controller, RatingProps } from "../../../docs/examples/rating.ts"

const Context = createContext<Controller | null>(null)

function useRating(): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error("A Rating part must be inside <Rating.Root>")
  return controller
}

function Root({
  value,
  defaultValue,
  onValueChange,
  count,
  disabled,
  name,
  children,
  ...rest
}: RatingProps & PartComponentProps): ReactElement {
  // Made once; it follows the props of each render, and runs its `mount` while in the page.
  const controller = useController<RatingProps, Controller>(createRating, {
    value,
    defaultValue,
    onValueChange,
    count,
    disabled,
    name,
  })
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest}>
        {children}
        {name === undefined ? null : <HiddenInput />}
      </RootElement>
    </Context.Provider>
  )
}

// A part's element: the caller's props under the part's, `render` for another element, and the
// part's DOM work attached once the element is in the page.
const RootElement = (props: PartComponentProps) => usePart(useRating().root, "div", props)
const HiddenInput = () => usePart(useRating().input, "input", {})

function Item({ place, ...props }: PartComponentProps & { place: number }): ReactElement {
  return usePart(useRating().item(place), "button", { type: "button", ...props })
}

export const Rating = { Root, Item }
