import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCodeProps, QrCorrection } from "@kirana-ui/core/qr-code"
import { defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { context, controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"qrCode">

const scope = context<Controller>("QrCode")

const RootElement = partComponent("QrCodeRootElement", "div", () => scope.use().root)

export type RootProps = Omit<QrCodeProps, "id"> & {
  id?: string | undefined
} & PartComponentProps

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
}) as unknown as PartComponent<"div", State["root"], RootProps>

export type FrameProps = PartComponentProps
export type PatternProps = PartComponentProps
const Frame = partComponent<"svg", State["frame"]>("QrCodeFrame", "svg", () => scope.use().frame)
const Pattern = partComponent<"path", State["pattern"]>(
  "QrCodePattern",
  "path",
  () => scope.use().pattern
)

export const QrCode = { Root, Frame, Pattern }
