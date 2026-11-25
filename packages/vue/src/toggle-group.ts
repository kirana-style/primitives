import { within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type { ToggleGroupProps as CoreProps } from "@kirana-ui/core/toggle-group"
import { defineComponent, h, inject, provide } from "vue"
import type { PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { controller, optional, partComponent } from "./runtime.ts"
import type { Changes, PartComponentProps, PartGiven, PartInstance, StatesOf } from "./runtime.ts"
import { TOGGLE_GROUP, TOOLBAR } from "./toolbar-context.ts"

export type ToggleGroupProps<Value = unknown> = Omit<CoreProps<Value>, "onValueChange"> &
  PartComponentProps

export type ToggleGroupEmits<Value = unknown> = Changes<"value", Value[]>

/** `v-model:value` (a list). Each `Toggle` with a `value` inside it is one of its toggles. */
export const ToggleGroup = defineComponent({
  name: "ToggleGroup",
  inheritAttrs: false,
  props: {
    value: optional(Array as PropType<readonly unknown[]>),
    defaultValue: Array as PropType<readonly unknown[]>,
    multiple: Boolean,
    disabled: Boolean,
    orientation: String as PropType<Orientation>,
    loopFocus: optional(Boolean),
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
     */
    loop: optional(Boolean),
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const direction = useDirectionAround()
    const toolbar = inject(TOOLBAR, null) ?? undefined
    const made = controller(within(createToggleGroup, { direction, toolbar }), () => ({
      value: props.value,
      defaultValue: props.defaultValue,
      multiple: props.multiple,
      disabled: props.disabled,
      orientation: props.orientation,
      loop: props.loop,
      loopFocus: props.loopFocus,
      onValueChange(value: unknown[], details: ChangeDetails) {
        emit("valueChange", value, details)
        if (!details.canceled) emit("update:value", value)
      },
    }))
    provide(TOGGLE_GROUP, made)
    const Element = partComponent("ToggleGroupElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "div">(
  props: PartGiven<As, ToggleGroupProps<Value>, ToggleGroupEmits<Value>> & PublicProps
) => PartInstance<
  As,
  ToggleGroupProps<Value>,
  ToggleGroupEmits<Value>,
  { state: StatesOf<"toggleGroup">["root"] }
>
