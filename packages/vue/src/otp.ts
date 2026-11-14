import type { ChangeDetails } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Otp")
const SLOT: InjectionKey<OtpSlot> = Symbol("OtpSlot")

const RootElement = partComponent("OtpRootElement", "div", () => scope.use().root)

/** `v-model:value`; `@value-change` carries the details, `@complete` the finished code. */
const Root = defineComponent({
  name: "OtpRoot",
  inheritAttrs: false,
  props: {
    length: Number,
    value: optional(String),
    defaultValue: String,
    mode: String as PropType<OtpProps["mode"]>,
    disabled: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "complete"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(createOtp, () => ({
        id: props.id ?? generated,
        length: props.length,
        value: props.value,
        defaultValue: props.defaultValue,
        mode: props.mode,
        disabled: props.disabled,
        name: props.name,
        form: props.form,
        onValueChange(value: string, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onComplete: (value: string) => emit("complete", value),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

/** One cell: it shows its character, then whatever it is given (a caret). */
const Slot = defineComponent({
  name: "OtpSlot",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const slot = scope.use().slot(props.index)
    provide(SLOT, slot)
    const char = fromSignal(slot.char)
    const Element = partComponent("OtpSlotElement", "div", () => slot.part)
    return () => h(Element, attrs, () => [char.value, slots.default?.()])
  },
})

/** Drawn in its cell while the cell is the active one and empty. */
const Caret = defineComponent({
  name: "OtpCaret",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const made = scope.use()
    const slot = inject(SLOT, undefined)
    if (!slot) throw new Error("An Otp.Caret must be inside <Otp.Slot>")
    const shown = fromSignal(slot.caret)
    const Element = partComponent("OtpCaretElement", "div", () => made.caretPart)
    return () => (shown.value ? h(Element, attrs, slots) : null)
  },
})

export const Otp = {
  Root,
  Input: partComponent("OtpInput", "input", () => scope.use().input),
  Group: partComponent("OtpGroup", "div", () => scope.use().group),
  Slot,
  Separator: partComponent("OtpSeparator", "div", () => scope.use().separator),
  Caret,
}
