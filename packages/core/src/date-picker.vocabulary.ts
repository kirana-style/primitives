import { calendarVocabulary } from "./calendar.vocabulary.ts"
import { dateFieldVocabulary } from "./date-field.vocabulary.ts"
import { defineComponent } from "./part.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"
import { DISABLED, state } from "./states.ts"

// A date picker's parts are a date field's, a popover's and a calendar's.
export const datePickerVocabulary = defineComponent({
  root: {
    description:
      "Holds the date picker: its value, the month shown and whether the calendar is open. It draws no element.",
  },
  field: {
    ...dateFieldVocabulary.root,
    description:
      'The field a day is typed in: with `mode: "range"`, one for the first day (`range="start"`) and one for the last (`range="end"`).',
    inside: "root",
    repeated: true,
  },
  segments: { ...dateFieldVocabulary.segments, inside: "field" },
  segment: dateFieldVocabulary.segment,
  input: { ...dateFieldVocabulary.input, inside: "field" },
  trigger: popoverVocabulary.trigger,
  portal: popoverVocabulary.portal,
  positioner: popoverVocabulary.positioner,
  popup: popoverVocabulary.popup,
  calendar: { ...calendarVocabulary.root, inside: "popup" },
  months: { ...calendarVocabulary.months, inside: "calendar" },
  heading: calendarVocabulary.heading,
  previous: { ...calendarVocabulary.previous, inside: "calendar" },
  next: { ...calendarVocabulary.next, inside: "calendar" },
  grid: calendarVocabulary.grid,
  weekdays: calendarVocabulary.weekdays,
  headCell: calendarVocabulary.headCell,
  weeks: calendarVocabulary.weeks,
  cell: calendarVocabulary.cell,
  day: calendarVocabulary.day,
  clear: {
    inside: "root",
    optional: true,
    description: "Empties the value, and gives focus to the field. Disabled while there is none.",
    states: { disabled: DISABLED },
  },
  preset: {
    inside: "root",
    optional: true,
    repeated: true,
    description:
      "Makes the value the day, or the range, it is given. Pressed while the value is that.",
    states: {
      pressed: state("data-pressed", "Present while the value is the one it gives."),
      disabled: DISABLED,
    },
  },
})
