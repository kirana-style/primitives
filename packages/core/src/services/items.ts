/**
 * The labels of a control's values, as its caller gives them: a list of values with their
 * labels, or, for values that are text, the labels by value (`{ apple: "Apple" }`).
 */
export type ItemLabels<Value = unknown> =
  | readonly { value: Value; label: string }[]
  | Readonly<Record<string, string>>

type Listed<Value> = readonly { value: Value; label: string }[]

const NONE: readonly never[] = []
const isList = <Value>(items: ItemLabels<Value>): items is Listed<Value> => Array.isArray(items)

/** The values with their labels as a list, in the order they were given. */
export function itemsOf<Value>(items: ItemLabels<Value> | undefined): Listed<Value> {
  if (!items) return NONE
  if (isList(items)) return items
  return Object.entries(items).map(([value, label]) => ({ value: value as Value, label }))
}

/** The label given for a value, if one was. */
export function labelIn<Value>(
  items: ItemLabels<Value> | undefined,
  value: Value
): string | undefined {
  if (!items) return undefined
  if (isList(items)) return items.find((each) => Object.is(each.value, value))?.label
  // Only a text is a key: `1` is not the value `"1"` names.
  return typeof value === "string" && Object.hasOwn(items, value) ? items[value] : undefined
}
