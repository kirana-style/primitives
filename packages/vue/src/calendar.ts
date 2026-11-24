import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarMode,
  CalendarMonth,
  CalendarProps,
  CalendarValue,
  CalendarValueOf,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import { Fragment, defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { written } from "./element.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
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

/** The place of the month its parts are drawn in, inside `Calendar.Months`. */
const MONTH: InjectionKey<number> = Symbol("CalendarMonth")
/** The month a part is drawn in: the one `Calendar.Months` gave, or the first. */
const useMonth = () => scope.use().monthAt(inject(MONTH, 0))

/** `value` and its events are typed by `mode`: a day, a range, or a list of days. */
export type RootProps<Mode extends CalendarMode = "single"> = Omit<
  CalendarProps<Mode>,
  "id" | "onValueChange" | "onMonthChange"
> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits<Mode extends CalendarMode = "single"> = Changes<
  "value",
  CalendarValueOf<Mode>
> &
  Changes<"month", string>

/**
 * `v-model:value`, `@value-change="(value, details) => …"`; `v-model:month` (the first day of
 * the month shown), `@month-change="(month, details) => …"`.
 */
const Root = defineComponent({
  name: "CalendarRoot",
  inheritAttrs: false,
  props: {
    value: optional([String, Object, Array] as PropType<CalendarValue>),
    defaultValue: [String, Object, Array] as PropType<CalendarValue>,
    mode: String as PropType<CalendarMode>,
    required: Boolean,
    minDays: Number,
    maxDays: Number,
    months: Number,
    pagedNavigation: Boolean,
    month: optional(String),
    defaultMonth: String,
    defaultFocusedValue: String,
    locale: String,
    calendarSystem: Object as PropType<CalendarProps["calendarSystem"]>,
    min: String,
    max: String,
    isDateUnavailable: Function as PropType<(date: string) => boolean>,
    disabled: Boolean,
    readOnly: Boolean,
    fixedWeeks: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:value", "valueChange", "update:month", "monthChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createCalendar, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        mode: props.mode,
        required: props.required,
        minDays: props.minDays,
        maxDays: props.maxDays,
        months: props.months,
        pagedNavigation: props.pagedNavigation,
        month: props.month,
        defaultMonth: props.defaultMonth,
        defaultFocusedValue: props.defaultFocusedValue,
        locale: props.locale,
        calendarSystem: props.calendarSystem,
        min: props.min,
        max: props.max,
        isDateUnavailable: props.isDateUnavailable,
        disabled: props.disabled,
        readOnly: props.readOnly,
        fixedWeeks: props.fixedWeeks,
        name: props.name,
        form: props.form,
        onValueChange(value: CalendarValue, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
        onMonthChange(month: string, details: ChangeDetails) {
          emit("monthChange", month, details)
          if (!details.canceled) emit("update:month", month)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Mode extends CalendarMode = "single", As extends string = "div">(
  props: PartGiven<As, RootProps<Mode>, RootEmits<Mode>> & PublicProps
) => PartInstance<As, RootProps<Mode>, RootEmits<Mode>, { state: State["root"] }>

export type HeadingProps = PartComponentProps

/** Names the month shown, unless it is given something else to say. */
const Heading = defineComponent({
  name: "CalendarHeading",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const month = useMonth()
    const title = fromSignal(month.title)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const HeadingElement = partComponent(
      "CalendarHeadingElement",
      "div",
      () => month.heading,
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

export type MonthsProps = Record<never, never>

/** Holds the parts of one month: they are that month's. */
const MonthScope = defineComponent({
  name: "CalendarMonthScope",
  props: { index: { type: Number, required: true } },
  setup(props, { slots }) {
    // Keyed by its place: a scope is one month's for as long as it is drawn.
    provide(MONTH, props.index)
    return () => slots.default?.()
  },
})

/**
 * Its slot once for each month shown (`months` on the root), side by side: `v-slot="{ month }"`.
 * The parts inside each are that month's. Left out for one month.
 */
const Months = defineComponent({
  name: "CalendarMonths",
  setup(_, { slots }) {
    const months = fromSignal(scope.use().months)
    return () =>
      months.value.map((month) =>
        h(MonthScope, { key: month.index, index: month.index }, () => slots.default?.({ month }))
      )
  },
}) as unknown as PlainComponent<MonthsProps, {}, { month: CalendarMonth }>

export type WeeksProps = Record<never, never>

/** Its slot once for each week of the month shown: `v-slot="{ week }"`. */
const Weeks = defineComponent({
  name: "CalendarWeeks",
  setup(_, { slots }) {
    const weeks = fromSignal(useMonth().weeks)
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
export type InputProps = PartComponentProps

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
      const part = scope.use()[member](props.date, inject(MONTH, undefined))
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
  Months,
  Grid: partComponent<"table", State["grid"]>("CalendarGrid", "table", () => useMonth().grid),
  Weekdays,
  HeadCell,
  Weeks,
  Cell: dated("CalendarCell", "td", "cell"),
  Day: dated("CalendarDay", "button", "day"),
  /** The hidden input the value is submitted by, when the root has a `name`. */
  Input: partComponent<"input", State["input"]>("CalendarInput", "input", () => scope.use().input),
}
