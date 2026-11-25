import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createTagsInput } from "@kirana-ui/core/tags-input"
import type {
  TagsInput as Controller,
  TagsInputEntry,
  TagsInputProps,
} from "@kirana-ui/core/tags-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["tagsInput"]

const Context = createContext<Controller | null>(null)
// The tag an item is, for the parts inside it.
const ItemContext = createContext<TagsInputEntry | null>(null)

function useTagsInput(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<TagsInput.${part}> must be inside <TagsInput.Root>`)
  return controller
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

function Root({
  value,
  defaultValue,
  onValueChange,
  onValueInvalid,
  validate,
  max,
  allowDuplicates,
  delimiter,
  addOnBlur,
  addOnPaste,
  editable,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createTagsInput, { field, direction })
  const controller: Controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    onValueInvalid,
    validate,
    max,
    allowDuplicates,
    delimiter,
    addOnBlur,
    addOnPaste,
    editable,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>
      {usePart(controller.root, "div", rest, undefined, (content) => (
        // The first of the inputs a form reads is the element's last child; the rest follow it.
        <>
          {content}
          <PartElement of={controller.hiddenInput} tag="input" />
        </>
      ))}
    </Context.Provider>
  )
}

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const List = (props: ListProps) => usePart(useTagsInput("List").list, "div", props)

export interface ItemsProps {
  /** Draws one tag, once for each. */
  children: (entry: TagsInputEntry) => ReactNode
}

/** Draws its child once for each tag, kept by the tag's key. */
function Items({ children }: ItemsProps): ReactElement {
  const entries = useSignal(useTagsInput("Items").entries)
  return (
    <>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{children(entry)}</Fragment>
      ))}
    </>
  )
}

export type ItemProps = PartComponentProps<
  "span",
  StateOf<Parts["item"]>,
  {
    /** The tag it is, as `Items` gave it. */
    entry: TagsInputEntry
  }
>

function Item({ entry, ...props }: ItemProps): ReactElement {
  return (
    <ItemContext.Provider value={entry}>
      {usePart(useTagsInput("Item").item(entry.key), "span", props)}
    </ItemContext.Provider>
  )
}

export type ItemTextProps = PartComponentProps<"span", StateOf<Parts["itemText"]>>

/** Says the tag's text unless it is given children. */
function ItemText(props: ItemTextProps): ReactElement {
  const entry = useEntry("ItemText")
  return usePart(useTagsInput("ItemText").itemText(entry.key), "span", {
    ...props,
    children: props.children ?? entry.value,
  })
}

export type ItemInputProps = PartComponentProps<"input", StateOf<Parts["itemInput"]>>

const ItemInput = (props: ItemInputProps) =>
  usePart(useTagsInput("ItemInput").itemInput(useEntry("ItemInput").key), "input", props)

export type ItemRemoveProps = PartComponentProps<"button", StateOf<Parts["itemRemove"]>>

const ItemRemove = (props: ItemRemoveProps) =>
  usePart(useTagsInput("ItemRemove").itemRemove(useEntry("ItemRemove").key), "button", props)

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => usePart(useTagsInput("Input").input, "input", props)

export type ClearProps = PartComponentProps<"button", StateOf<Parts["clear"]>>

const Clear = (props: ClearProps) => usePart(useTagsInput("Clear").clear, "button", props)

export const TagsInput = /* @__PURE__ */ parts("TagsInput", {
  Root,
  List,
  Items,
  Item,
  ItemText,
  ItemInput,
  ItemRemove,
  Input,
  Clear,
})
