import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const DAY = {
  selected: state("data-selected", "Present on a chosen day, and on every day of a chosen range."),
  today: state("data-today", "Present on today."),
  outsideMonth: state(
    "data-outside-month",
    "Present on the days of the month before and after that fill the first and last weeks."
  ),
  disabled: DISABLED,
  unavailable: state("data-unavailable", "Present on a day that cannot be chosen."),
  rangeStart: state("data-range-start", "Present on the first day of a range."),
  rangeEnd: state("data-range-end", "Present on the last day of a range."),
}

export const calendarVocabulary = defineComponent({
  root: {
    description: "The calendar.",
    states: {
      disabled: DISABLED,
      readonly: state("data-readonly", "Present when its value cannot be changed."),
    },
  },
  heading: { description: "Names the month shown. Read out when it changes." },
  previous: { description: "Shows the month before.", states: { disabled: DISABLED } },
  next: { description: "Shows the month after.", states: { disabled: DISABLED } },
  grid: { description: "The table of days: a grid the arrows move in." },
  headCell: { description: "A column's heading: a day of the week." },
  cell: { description: "A day's cell.", states: DAY },
  day: { description: "The button for a day.", states: DAY },
})
