import type { Carousel } from "@kirana-ui/core/carousel"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Carousel")

export const provide = (controller: Carousel): Carousel => setContext(KEY, controller)

export function useCarousel(): Carousel {
  const controller = getContext<Carousel | undefined>(KEY)
  if (!controller) throw new Error("A Carousel part must be inside <Carousel.Root>")
  return controller
}
