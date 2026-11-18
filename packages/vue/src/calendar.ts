import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarProps,
  CalendarValue,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import { Fragment, defineComponent, h, useId } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { written } from "./element.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"calendar">

/**
 * The calendar its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the calendar's parts).
 */
const scope = context<Controller>("Calendar")
/** For a component made of this one's parts: a date picker. */
export { scope as calendarScope }

const RootElement = partComponent("CalendarRootElement", "div", () => scope.use().root)

export type RootProps = Omit<CalendarProps, "id" | "onValueChange" | "onMonthChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"value", CalendarValue> & {
  /** The month shown has changed: its first day. */
  monthChange: (month: string) => void
}

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
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type HeadingProps = PartComponentProps

/** Names the month shown, unless it is given something else to say. */
const Heading = defineComponent({
  name: "CalendarHeading",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const title = fromSignal(scope.use().title)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const HeadingElement = partComponent(
      "CalendarHeadingElement",
      "div",
      () => scope.use().heading,
      written(() => title.value)
    )
    return () => h(HeadingElement, attrs, slots.default ?? (() => title.value))
  },
}) as unknown as PartComponent<"div", State["heading"], HeadingProps>

export type WeekdaysProps = Record<never, never>

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
}) as unknown as PlainComponent<WeekdaysProps, {}, { weekday: CalendarWeekday }>

export type WeeksProps = Record<never, never>

/** Its slot once for each week of the month shown: `v-slot="{ week }"`. */
const Weeks = defineComponent({
  name: "CalendarWeeks",
  setup(_, { slots }) {
    const weeks = fromSignal(scope.use().weeks)
    return () =>
      weeks.value.map((week) => h(Fragment, { key: week[0]!.date }, slots.default?.({ week })))
  },
}) as unknown as PlainComponent<WeeksProps, {}, { week: readonly CalendarDay[] }>

export interface HeadCellProps extends PartComponentProps {
  /** The day of the week it names, as `Calendar.Weekdays` gives it. */
  weekday: CalendarWeekday
}

const HeadCell = defineComponent({
  name: "CalendarHeadCell",
  inheritAttrs: false,
  props: { weekday: { type: Object as PropType<CalendarWeekday>, required: true } },
  setup(props, { attrs, slots }) {
    const part = scope.use().headCell(props.weekday)
    const Element = partComponent("CalendarHeadCellElement", "th", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"th", State["headCell"], HeadCellProps>

export interface CellProps extends PartComponentProps {
  /** The day it is for, as a week of `Calendar.Weeks` gives it. */
  date: string
}
export type DayProps = CellProps
export type PreviousProps = PartComponentProps
export type NextProps = PartComponentProps
export type GridProps = PartComponentProps

const dated = <Tag extends string, Member extends "cell" | "day">(
  name: string,
  tag: Tag,
  member: Member
) =>
  defineComponent({
    name,
    inheritAttrs: false,
    props: { date: { type: String, required: true } },
    setup(props, { attrs, slots }) {
      const part = scope.use()[member](props.date)
      const Element = partComponent<string>(`${name}Element`, tag, () => part)
      return () => h(Element, attrs, slots)
    },
  }) as unknown as PartComponent<Tag, State[Member], CellProps>

export const Calendar = {
  Root,
  Heading,
  Previous: partComponent<"button", State["previous"]>(
    "CalendarPrevious",
    "button",
    () => scope.use().previous
  ),
  Next: partComponent<"button", State["next"]>("CalendarNext", "button", () => scope.use().next),
  Grid: partComponent<"table", State["grid"]>("CalendarGrid", "table", () => scope.use().grid),
  Weekdays,
  HeadCell,
  Weeks,
  Cell: dated("CalendarCell", "td", "cell"),
  Day: dated("CalendarDay", "button", "day"),
}
