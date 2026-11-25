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

/** A value as text, when nothing names it: an object as JSON, anything else as `String` writes it. */
function serialized(value: unknown): string {
  if (typeof value !== "object" || value === null) return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/** Whether a value is an object that carries a field: `{ value, label }` names itself. */
const carries = (value: unknown, key: string): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && key in value && value[key as never] != null

/**
 * What a value that is an object says it is called: `itemToStringLabel`'s answer when it is
 * given, else the object's own `label`. `undefined` when neither names it, so a label given
 * in `items` or read from the markup is asked next.
 */
export function ownLabel<Value>(
  value: Value,
  itemToStringLabel: ((value: Value) => string) | undefined
): string | undefined {
  if (itemToStringLabel) return itemToStringLabel(value)
  return carries(value, "label") ? String(value.label) : undefined
}

/** The last name of a value nothing else names: an object's `value`, else the value as text. */
export function plainLabel(value: unknown): string {
  return carries(value, "value") ? serialized(value.value) : serialized(value)
}

/**
 * What a form is sent for a value: `itemToStringValue`'s answer when it is given, the `value`
 * of an object shaped `{ value, label }`, else the value as text (an object as JSON).
 */
export function formValue<Value>(
  value: Value,
  itemToStringValue: ((value: Value) => string) | undefined
): string {
  if (itemToStringValue) return itemToStringValue(value)
  if (carries(value, "value") && typeof value === "object" && "label" in value)
    return serialized(value.value)
  return serialized(value)
}
