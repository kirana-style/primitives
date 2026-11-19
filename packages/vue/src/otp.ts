import type { ChangeDetails } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"otp">

const scope = context<Controller>("Otp")
const SLOT: InjectionKey<OtpSlot> = Symbol("OtpSlot")

const RootElement = partComponent("OtpRootElement", "div", () => scope.use().root)

export type RootProps = Omit<OtpProps, "id" | "onValueChange" | "onComplete"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", string> & {
  /** The finished code, once every cell is filled. */
  complete: (value: string) => void
}

/** `v-model:value`; `@value-change` carries the details, `@complete` the finished code. */
const Root = defineComponent({
  name: "OtpRoot",
  inheritAttrs: false,
  props: {
    length: Number,
    value: optional(String),
    defaultValue: String,
    mode: String as PropType<OtpProps["mode"]>,
    pattern: String,
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
        pattern: props.pattern,
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
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export interface SlotProps extends PartComponentProps {
  /** Which character of the code the cell shows, from 0. */
  index: number
}

/** One cell: it shows its character, then whatever it is given (a caret). */
const Slot = defineComponent({
  name: "OtpSlot",
  inheritAttrs: false,
  props: { index: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const slot = scope.use().slot(props.index)
    provide(SLOT, slot)
    const char = fromSignal(slot.char)
    // Its character comes first, whatever element the caller asked for.
    const Element = partComponent(
      "OtpSlotElement",
      "div",
      () => slot.part,
      (content) => [char.value, content]
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["slot"], SlotProps>

export type CaretProps = PartComponentProps

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
}) as unknown as PartComponent<"div", State["caret"], CaretProps>

export type InputProps = PartComponentProps
export type GroupProps = PartComponentProps
export type SeparatorProps = PartComponentProps
export const Otp = {
  Root,
  Input: partComponent<"input", State["input"]>("OtpInput", "input", () => scope.use().input),
  Group: partComponent<"div", State["group"]>("OtpGroup", "div", () => scope.use().group),
  Slot,
  Separator: partComponent<"div", State["separator"]>(
    "OtpSeparator",
    "div",
    () => scope.use().separator
  ),
  Caret,
}
