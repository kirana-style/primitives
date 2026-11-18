import { defineMenu } from "./menu.ts"
import type { ElementOf, Told } from "./runtime.ts"

/**
 * `<kui-context-menu>`: a menu for an area of the page, opened at the pointer by a secondary
 * press, or a long one on a touch screen. Its `kui-part="trigger"` is the area; the rest are a
 * menu's parts.
 */
export const tag = defineMenu(
  "kui-context-menu",
  () => ({ context: true }),
  (controller) => controller.area
)

declare global {
  interface HTMLElementTagNameMap {
    "kui-context-menu": ElementOf<
      typeof tag,
      { "open-change": ["onOpenChange", "open"] },
      { "checked-change": Told<"checked", boolean>; "value-change": Told<"value", string> }
    >
  }
}
