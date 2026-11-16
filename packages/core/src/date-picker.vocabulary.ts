import { calendarVocabulary } from "./calendar.vocabulary.ts"
import { dateFieldVocabulary } from "./date-field.vocabulary.ts"
import { defineComponent } from "./part.ts"
import { popoverVocabulary } from "./popover.vocabulary.ts"

// A date picker's parts are a date field's, a popover's and a calendar's.
export const datePickerVocabulary = defineComponent({
  field: dateFieldVocabulary.root,
  segment: dateFieldVocabulary.segment,
  trigger: popoverVocabulary.trigger,
  positioner: popoverVocabulary.positioner,
  popup: popoverVocabulary.popup,
  calendar: calendarVocabulary.root,
  heading: calendarVocabulary.heading,
  previous: calendarVocabulary.previous,
  next: calendarVocabulary.next,
  grid: calendarVocabulary.grid,
  headCell: calendarVocabulary.headCell,
  cell: calendarVocabulary.cell,
  day: calendarVocabulary.day,
})
