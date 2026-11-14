import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCorrection } from "@kirana-ui/core/qr-code"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, partComponent } from "./runtime.ts"

const scope = context<Controller>("QrCode")

const RootElement = partComponent("QrCodeRootElement", "div", () => scope.use().root)

const Root = defineComponent({
  name: "QrCodeRoot",
  inheritAttrs: false,
  props: {
    value: { type: String, required: true },
    correction: String as PropType<QrCorrection>,
    id: String,
  },
  setup(props, { attrs, slots }) {
    const generated = useId()
    scope.provide(
      controller(createQrCode, () => ({
        id: props.id ?? generated,
        value: props.value,
        correction: props.correction,
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const Frame = partComponent("QrCodeFrame", "svg", () => scope.use().frame)
const Pattern = partComponent("QrCodePattern", "path", () => scope.use().pattern)

export const QrCode = { Root, Frame, Pattern }
