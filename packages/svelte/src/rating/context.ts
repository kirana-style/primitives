import type { Rating } from "@kirana-ui/core/rating"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Rating")

export const provide = (controller: Rating): Rating => setContext(KEY, controller)

export function useRating(): Rating {
  const controller = getContext<Rating | undefined>(KEY)
  if (!controller) throw new Error("A Rating part must be inside <Rating.Root>")
  return controller
}
