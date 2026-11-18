import { calendarVocabulary } from "./calendar.vocabulary.ts"
import { dateFieldVocabulary } from "./date-field.vocabulary.ts"
import { defineComponent } from "./part.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"

// A date picker's parts are a date field's, a popover's and a calendar's.
export const datePickerVocabulary = defineComponent({
  root: {
    description:
      "Holds the date picker: its value, the month shown and whether the calendar is open. It draws no element.",
  },
  field: { ...dateFieldVocabulary.root, inside: "root" },
  segments: { ...dateFieldVocabulary.segments, inside: "field" },
  segment: dateFieldVocabulary.segment,
  input: { ...dateFieldVocabulary.input, inside: "field" },
  trigger: popoverVocabulary.trigger,
  portal: popoverVocabulary.portal,
  positioner: popoverVocabulary.positioner,
  popup: popoverVocabulary.popup,
  calendar: { ...calendarVocabulary.root, inside: "popup" },
  heading: { ...calendarVocabulary.heading, inside: "calendar" },
  previous: { ...calendarVocabulary.previous, inside: "calendar" },
  next: { ...calendarVocabulary.next, inside: "calendar" },
  grid: { ...calendarVocabulary.grid, inside: "calendar" },
  weekdays: calendarVocabulary.weekdays,
  headCell: calendarVocabulary.headCell,
  weeks: calendarVocabulary.weeks,
  cell: calendarVocabulary.cell,
  day: calendarVocabulary.day,
})
