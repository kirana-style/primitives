import { effect } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp, OtpProps } from "@kirana-ui/core/otp"

import { defineElement, partAround } from "./runtime.ts"

const indexOf = (element: HTMLElement | null) => Number(element?.getAttribute("kui-index") ?? 0)

/**
 * `<kui-otp>` around `kui-part="root"`, the one `input` that is typed in, and a `slot` for
 * each character (`kui-index`, from 0), which says its character and may hold a `caret`, in
 * the page while the next character goes there. Slots may be in `group`s with a `separator`
 * between. `length`, `value`, `default-value`, `mode`, `disabled`, `name`, `form`; it tells
 * `value-change` and `complete`.
 */
export const tag = defineElement<OtpProps, Otp>({
  tag: "kui-otp",
  props: {
    length: "number",
    value: "string",
    "default-value": "string",
    mode: "string",
    disabled: "boolean",
    name: "string",
    form: "string",
  },
  create: (props) => createOtp(props),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onComplete: { event: "complete", prop: "value", hold: false },
  },
  parts: {
    root: (controller) => controller.root,
    input: (controller) => controller.input,
    group: (controller) => controller.group,
    separator: (controller) => controller.separator,
    slot(controller, element) {
      const slot = controller.slot(indexOf(element))
      return {
        part: slot.part,
        // Its character comes before what the page wrote in it: a caret.
        mount() {
          const text = element.ownerDocument.createTextNode("")
          element.prepend(text)
          const stop = effect(() => void (text.data = slot.char.get()))
          return () => {
            stop()
            text.remove()
          }
        },
      }
    },
    caret: (controller, element) => ({
      part: controller.caretPart,
      mounted: controller.slot(indexOf(partAround(element, "slot"))).caret,
    }),
  },
})
