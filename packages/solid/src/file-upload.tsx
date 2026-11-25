import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createFileUpload, formatBytes } from "@kirana-ui/core/file-upload"
import type {
  FileRejection,
  FileUpload as Controller,
  FileUploadEntry,
  FileUploadProps,
} from "@kirana-ui/core/file-upload"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, children, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["fileUpload"]

const Context = createContext<Controller | null>(null)
// The file an item is, for the parts inside it.
const ItemContext = createContext<FileUploadEntry | null>(null)

function useFileUpload(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A FileUpload part must be inside <FileUpload.Root>")
  return made
}

function useEntry(part: string): FileUploadEntry {
  const entry = useContext(ItemContext)
  if (!entry) throw new Error(`<FileUpload.${part}> must be inside <FileUpload.Item>`)
  return entry
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<FileUploadProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "files",
    "defaultFiles",
    "onFilesChange",
    "onFilesReject",
    "accept",
    "multiple",
    "maxFiles",
    "maxSize",
    "minSize",
    "validate",
    "disabled",
    "required",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createFileUpload, { field: useContext(FieldContext) ?? undefined }),
    () => ({
      id: local.id ?? generated,
      files: local.files,
      defaultFiles: local.defaultFiles,
      accept: local.accept,
      multiple: local.multiple,
      maxFiles: local.maxFiles,
      maxSize: local.maxSize,
      minSize: local.minSize,
      validate: local.validate,
      disabled: local.disabled,
      required: local.required,
      name: local.name,
      form: local.form,
      onFilesChange: (files: File[], details: ChangeDetails) =>
        local.onFilesChange?.(files, details),
      onFilesReject: (rejections: FileRejection[]) => local.onFilesReject?.(rejections),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type DropzoneProps = PartComponentProps<"div", StateOf<Parts["dropzone"]>>

function Dropzone(props: DropzoneProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const made = useFileUpload()
  return (
    <Part of={made.dropzone} tag="div" {...rest}>
      {local.children}
      {/* The native file input is the element's last child, whatever element was asked for. */}
      <Part of={made.input} tag="input" />
    </Part>
  )
}

export type ListProps = PartComponentProps<"ul", StateOf<Parts["list"]>>

const List = (props: ListProps) => <Part of={useFileUpload().list} tag="ul" {...props} />

export type ItemsProps = {
  /** Draws one file, once for each. */
  children: (entry: FileUploadEntry) => JSX.Element
}

/** Draws its child once for each file, kept by the file's key. */
function Items(props: ItemsProps): JSX.Element {
  const entries = fromSignal(useFileUpload().entries)
  // By key: a file that stays keeps its element, and the focus on it.
  const keys = () => entries().map((each) => each.key)
  const of = (key: string) => entries().find((each) => each.key === key)!
  // Each key's file once, as it comes in.
  return <For each={keys()}>{(key) => untrack(() => props.children(of(key)))}</For>
}

export type ItemProps = PartComponentProps<
  "li",
  StateOf<Parts["item"]>,
  {
    /** The file it is, as `Items` gave it. */
    entry: FileUploadEntry
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["entry"])
  // An item is its file for as long as it is in the page.
  const entry = untrack(() => local.entry)
  return (
    <ItemContext value={entry}>
      <Part of={useFileUpload().item(entry.key)} tag="li" {...rest} />
    </ItemContext>
  )
}

export type ItemNameProps = PartComponentProps<"span", StateOf<Parts["itemName"]>>

/** Says the file's name unless it is given children. */
function ItemName(props: ItemNameProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const entry = useEntry("ItemName")
  const given = children(() => local.children)
  return (
    <Part of={useFileUpload().itemName(entry.key)} tag="span" {...rest}>
      {given() ?? entry.file.name}
    </Part>
  )
}

export type ItemSizeProps = PartComponentProps<
  "span",
  StateOf<Parts["itemSize"]>,
  {
    /** The language the number is written in. Default: the reader's. */
    locale?: string
  }
>

/** Says the file's size as people read one unless it is given children. */
function ItemSize(props: ItemSizeProps): JSX.Element {
  const [local, rest] = split(props, ["locale", "children"])
  const entry = useEntry("ItemSize")
  const given = children(() => local.children)
  return (
    <Part of={useFileUpload().itemSize(entry.key)} tag="span" {...rest}>
      {given() ?? formatBytes(entry.file.size, local.locale)}
    </Part>
  )
}

export type ItemRemoveProps = PartComponentProps<"button", StateOf<Parts["itemRemove"]>>

function ItemRemove(props: ItemRemoveProps): JSX.Element {
  const part = useFileUpload().itemRemove(useEntry("ItemRemove").key)
  return <Part of={part} tag="button" {...props} />
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type ClearProps = PartComponentProps<"button", StateOf<Parts["clear"]>>

const part =
  <Props extends Record<string, unknown>>(name: "trigger" | "clear", tag: string) =>
  (props: Props): JSX.Element => <Part of={useFileUpload()[name]} tag={tag} {...props} />

export const FileUpload = {
  Root,
  Dropzone,
  Trigger: part<TriggerProps>("trigger", "button"),
  List,
  Items,
  Item,
  ItemName,
  ItemSize,
  ItemRemove,
  Clear: part<ClearProps>("clear", "button"),
}
