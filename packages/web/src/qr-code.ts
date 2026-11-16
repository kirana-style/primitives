import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode, QrCodeProps } from "@kirana-ui/core/qr-code"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-qr-code>` around `kui-part="root"`, a `frame` (an `<svg>`) and its `pattern` (a
 * `<path>`). `value`, `correction`.
 */
export const tag = defineElement<QrCodeProps, QrCode>({
  tag: "kui-qr-code",
  props: { value: "string", correction: "string" },
  create: (props) => createQrCode(props),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    frame: (controller) => controller.frame,
    pattern: (controller) => controller.pattern,
  },
})
