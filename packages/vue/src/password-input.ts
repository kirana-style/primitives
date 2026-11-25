import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createPasswordInput } from "@kirana-ui/core/password-input"
import type {
  PasswordInput as Controller,
  PasswordInputProps,
} from "@kirana-ui/core/password-input"
import { defineComponent, h } from "vue"

import { useFieldAround } from "./field-context.ts"
import { context, controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"passwordInput">

const scope = context<Controller>("PasswordInput")

const RootElement = partComponent("PasswordInputRootElement", "div", () => scope.use().root)

export type RootProps = Omit<PasswordInputProps, "onVisibleChange" | "onValueChange"> &
  PartComponentProps

export type RootEmits = Changes<"visible", boolean> & {
  /** What was typed, as text, each time it changes. */
  valueChange: (value: string, details: ChangeDetails) => void
}

/** `v-model:visible`, or `visible` with `@visible-change="(visible, details) => …"`. */
const Root = defineComponent({
  name: "PasswordInputRoot",
  inheritAttrs: false,
  props: {
    visible: optional(Boolean),
    defaultVisible: Boolean,
    disabled: Boolean,
  },
  emits: ["update:visible", "visibleChange", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    scope.provide(
      controller(within(createPasswordInput, { field: useFieldAround() }), () => ({
        visible: props.visible,
        defaultVisible: props.defaultVisible,
        disabled: props.disabled,
        onVisibleChange(visible: boolean, details: ChangeDetails) {
          emit("visibleChange", visible, details)
          if (!details.canceled) emit("update:visible", visible)
        },
        onValueChange: (value: string, details: ChangeDetails) =>
          emit("valueChange", value, details),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type InputProps = PartComponentProps
export type ToggleProps = PartComponentProps
export type IndicatorProps = PartComponentProps
export const PasswordInput = {
  Root,
  /** It takes what an `<input>` takes (`value`, `autocomplete`). */
  Input: partComponent<"input", State["input"]>(
    "PasswordInputInput",
    "input",
    () => scope.use().input
  ),
  Toggle: partComponent<"button", State["toggle"]>(
    "PasswordInputToggle",
    "button",
    () => scope.use().toggle
  ),
  Indicator: partComponent<"span", State["indicator"]>(
    "PasswordInputIndicator",
    "span",
    () => scope.use().indicator
  ),
}
