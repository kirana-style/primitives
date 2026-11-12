import type { Slider } from "@kirana-ui/core/slider"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Slider")

export const provide = (controller: Slider): Slider => setContext(KEY, controller)

export function useSlider(): Slider {
  const controller = getContext<Slider | undefined>(KEY)
  if (!controller) throw new Error("A Slider part must be inside <Slider.Root>")
  return controller
}
