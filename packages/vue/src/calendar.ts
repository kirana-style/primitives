import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarProps,
  CalendarValue,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"

const scope = context<Controller>("Calendar")

const RootElement = partComponent("CalendarRootElement", "div", () => scope.use().root)

/** `v-model:value`, `@value-change="(value, details) => …"`, `@month-change="(month) => …"`. */
const Root = defineComponent({
  name: "CalendarRoot",
  inheritAttrs: false,
  props: {
    value: optional([String, Object] as PropType<CalendarValue>),
    defaultValue: [String, Object] as PropType<CalendarValue>,
    mode: String as PropType<"single" | "range">,
    defaultFocusedValue: String,
    locale: String,
    calendarSystem: Object as PropType<CalendarProps["calendarSystem"]>,
    min: String,
    max: String,
    isDateUnavailable: Function as PropType<(date: string) => boolean>,
    disabled: Boolean,
    readOnly: Boolean,
    fixedWeeks: Boolean,
    id: String,
  },
  emits: ["update:value", "valueChange", "monthChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createCalendar, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        mode: props.mode,
        defaultFocusedValue: props.defaultFocusedValue,
        locale: props.locale,
        calendarSystem: props.calendarSystem,
        min: props.min,
        max: props.max,
        isDateUnavailable: props.isDateUnavailable,
        disabled: props.disabled,
        readOnly: props.readOnly,
        fixedWeeks: props.fixedWeeks,
        onValueChange(value: CalendarValue, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onMonthChange: (month: string) => emit("monthChange", month),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
})

const HeadingElement = partComponent("CalendarHeadingElement", "div", () => scope.use().heading)

/** Names the month shown, unless it is given something else to say. */
const Heading = defineComponent({
  name: "CalendarHeading",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const title = fromSignal(scope.use().title)
    return () => h(HeadingElement, attrs, slots.default ?? (() => title.value))
  },
})

/** Its slot once for each day of the week, in the locale's order: `v-slot="{ weekday }"`. */
const Weekdays = defineComponent({
  name: "CalendarWeekdays",
  setup(_, { slots }) {
    const weekdays = fromSignal(scope.use().weekdays)
    return () =>
      weekdays.value.map((weekday) =>
        h(Fragment, { key: weekday.index }, slots.default?.({ weekday }))
      )
  },
})

/** Its slot once for each week of the month shown: `v-slot="{ week }"`. */
const Weeks = defineComponent({
  name: "CalendarWeeks",
  setup(_, { slots }) {
    const weeks = fromSignal(scope.use().weeks)
    return () =>
      weeks.value.map((week) => h(Fragment, { key: week[0]!.date }, slots.default?.({ week })))
  },
})

const HeadCell = defineComponent({
  name: "CalendarHeadCell",
  inheritAttrs: false,
  props: { weekday: { type: Object as PropType<CalendarWeekday>, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().headCell(props.weekday)
    const Element = partComponent("CalendarHeadCellElement", "th", () => part)
    return () => h(Element, attrs, slots)
  },
})

const dated = (name: string, tag: string, member: "cell" | "day") =>
  defineComponent({
    name,
    inheritAttrs: false,
    props: { date: { type: String, required: true } },
    setup(props, { attrs, slots }) {
      const part = scope.use()[member](props.date)
      const Element = partComponent(`${name}Element`, tag, () => part)
      return () => h(Element, attrs, slots)
    },
  })

export const Calendar = {
  Root,
  Heading,
  Previous: partComponent("CalendarPrevious", "button", () => scope.use().previous),
  Next: partComponent("CalendarNext", "button", () => scope.use().next),
  Grid: partComponent("CalendarGrid", "table", () => scope.use().grid),
  Weekdays,
  HeadCell,
  Weeks,
  Cell: dated("CalendarCell", "td", "cell"),
  Day: dated("CalendarDay", "button", "day"),
}
