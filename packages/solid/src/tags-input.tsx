import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createTagsInput } from "@kirana-ui/core/tags-input"
import type {
  TagsInput as Controller,
  TagsInputEntry,
  TagsInputProps,
} from "@kirana-ui/core/tags-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, children, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tagsInput"]

const Context = createContext<Controller | null>(null)
// The tag an item is, for the parts inside it.
const ItemContext = createContext<TagsInputEntry | null>(null)

function useTagsInput(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A TagsInput part must be inside <TagsInput.Root>")
  return made
}

function useEntry(part: string): TagsInputEntry {
  const entry = useContext(ItemContext)
  if (!entry) throw new Error(`<TagsInput.${part}> must be inside <TagsInput.Item>`)
  return entry
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TagsInputProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onValueInvalid",
    "validate",
    "max",
    "allowDuplicates",
    "delimiter",
    "addOnBlur",
    "addOnPaste",
    "editable",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createTagsInput, {
      field: useContext(FieldContext) ?? undefined,
      direction: useContext(DirectionContext) ?? undefined,
    }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      max: local.max,
      validate: local.validate,
      allowDuplicates: local.allowDuplicates,
      delimiter: local.delimiter,
      addOnBlur: local.addOnBlur,
      addOnPaste: local.addOnPaste,
      editable: local.editable,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      onValueChange: (value: string[], details: ChangeDetails) =>
        local.onValueChange?.(value, details),
      onValueInvalid: (text: string, reason: "duplicate" | "max" | "invalid") =>
        local.onValueInvalid?.(text, reason),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest}>
        {local.children}
        {/* The first of the inputs a form reads is the element's last child; the rest follow it. */}
        <Part of={made.hiddenInput} tag="input" />
      </Part>
    </Context>
  )
}

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const List = (props: ListProps) => <Part of={useTagsInput().list} tag="div" {...props} />

export type ItemsProps = {
  /** Draws one tag, once for each. */
  children: (entry: TagsInputEntry) => JSX.Element
}

/** Draws its child once for each tag, kept by the tag's key. */
function Items(props: ItemsProps): JSX.Element {
  const entries = fromSignal(useTagsInput().entries)
  // By key: a tag that stays keeps its element, and the focus on it.
  const keys = () => entries().map((each) => each.key)
  const of = (key: string) => entries().find((each) => each.key === key)!
  // Each key's tag once, as it comes in.
  return <For each={keys()}>{(key) => untrack(() => props.children(of(key)))}</For>
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    /** The tag it is, as `Items` gave it. */
    entry: TagsInputEntry
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["entry"])
  // An item is its tag for as long as it is in the page.
  const entry = untrack(() => local.entry)
  return (
    <ItemContext value={entry}>
      <Part of={useTagsInput().item(entry.key)} tag="span" {...rest} />
    </ItemContext>
  )
}

export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

/** Says the tag's text unless it is given children. */
function ItemText(props: ItemTextProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const entry = useEntry("ItemText")
  const given = children(() => local.children)
  return (
    <Part of={useTagsInput().itemText(entry.key)} tag="span" {...rest}>
      {given() ?? entry.value}
    </Part>
  )
}

export type ItemInputProps = PartComponentProps<"input", StateOf<Parts["itemInput"]>>
export type ItemRemoveProps = PartComponentProps<"button", StateOf<Parts["itemRemove"]>>

// A part of the tag its item is.
const inItem =
  <Props extends Record<string, unknown>>(
    name: "itemInput" | "itemRemove",
    label: string,
    tag: string
  ) =>
  (props: Props): JSX.Element => (
    <Part of={useTagsInput()[name](useEntry(label).key)} tag={tag} {...props} />
  )

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type ClearProps = PartComponentProps<"button", StateOf<Parts["clear"]>>

const part =
  <Props extends Record<string, unknown>>(name: "input" | "clear", tag: string) =>
  (props: Props): JSX.Element => <Part of={useTagsInput()[name]} tag={tag} {...props} />

export const TagsInput = {
  Root,
  List,
  Items,
  Item,
  ItemText,
  ItemInput: inItem<ItemInputProps>("itemInput", "ItemInput", "input"),
  ItemRemove: inItem<ItemRemoveProps>("itemRemove", "ItemRemove", "button"),
  Input: part<InputProps>("input", "input"),
  Clear: part<ClearProps>("clear", "button"),
}
