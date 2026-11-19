import { defineComponent } from "./part.ts"
import { DISABLED, state } from "./states.ts"

const DAY = {
  selected: state(
    "data-selected",
    "Present on a chosen day, on every day of a chosen range, and on each day of a list. Never on a copy: a day of the month before or after shown in its own month too."
  ),
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
  months: {
    description:
      "The months shown, with several: each is given to draw its heading and its grid. It draws no element, and is left out for one month.",
    inside: "root",
    optional: true,
  },
  heading: { inside: "months", description: "Names the month shown. Read out when it changes." },
  previous: {
    inside: "root",
    description: "Shows the month before.",
    states: { disabled: DISABLED },
  },
  next: { inside: "root", description: "Shows the month after.", states: { disabled: DISABLED } },
  grid: {
    inside: "months",
    description:
      "The table of a month's days: a grid the arrows move in, from one month shown into the next.",
  },
  weekdays: {
    description: "The days of the week: each is given to draw its head cell. It draws no element.",
    inside: "grid",
  },
  headCell: {
    inside: "weekdays",
    repeated: true,
    description: "A column's heading: a day of the week.",
  },
  weeks: {
    description:
      "The weeks of the month shown: each is given to draw its row of days. It draws no element.",
    inside: "grid",
  },
  cell: { inside: "weeks", repeated: true, description: "A day's cell.", states: DAY },
  day: { inside: "cell", description: "The button for a day.", states: DAY },
  input: {
    inside: "root",
    description:
      "The hidden input it is submitted by, when it has a name: one more is drawn after it for each other day.",
  },
})
