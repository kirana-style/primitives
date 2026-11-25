import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRating } from "@kirana-ui/core/rating"
import type { Rating as Controller, RatingProps } from "@kirana-ui/core/rating"
import { Fragment, defineComponent, h, useId } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"rating">

const scope = context<Controller>("Rating")

const Input = partComponent("RatingInput", "input", () => scope.use().input)

// The input a form reads is the element's last child, whatever element was asked for.
const RootElement = partComponent(
  "RatingRootElement",
  "div",
  () => scope.use().root,
  (content) => [content, h(Input)]
)

export type RootProps = Omit<RatingProps, "id" | "onValueChange" | "onHoverChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", number> & {
  /** The value the pointer is over, `null` once it leaves. */
  hoverChange: (value: number | null) => void
}

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "RatingRoot",
  inheritAttrs: false,
  props: {
    value: optional(Number),
    defaultValue: Number,
    count: Number,
    allowHalf: Boolean,
    disabled: Boolean,
    readOnly: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "hoverChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const field = useFieldAround()
    scope.provide(
      controller(within(createRating, { field, direction: useDirectionAround() }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        count: props.count,
        allowHalf: props.allowHalf,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        form: props.form,
        onValueChange(value: number, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onHoverChange: (value: number | null) => emit("hoverChange", value),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type ItemsProps = Record<never, never>

/** Draws its slot once for each item, from 1 to `count` (`v-slot="{ place }"`). */
const Items = defineComponent({
  name: "RatingItems",
  setup(_props, { slots }) {
    const places = fromSignal(scope.use().places)
    return () =>
      places.value.map((place) => h(Fragment, { key: place }, slots.default?.({ place })))
  },
}) as unknown as PlainComponent<ItemsProps, {}, { place: number }>

export interface ItemProps extends PartComponentProps {
  /** Its place among the items, from 1. */
  place: number
}

const Item = defineComponent({
  name: "RatingItem",
  inheritAttrs: false,
  props: { place: { type: Number, required: true } },
  setup(props, { attrs, slots }) {
    const made = scope.use()
    const Element = partComponent("RatingItemElement", "span", () => made.item(props.place))
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["item"], ItemProps>

export const Rating = { Root, Items, Item }
