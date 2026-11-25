import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createFileUpload, formatBytes } from "@kirana-ui/core/file-upload"
import type {
  FileUpload as Controller,
  FileUploadEntry,
  FileUploadProps,
} from "@kirana-ui/core/file-upload"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["fileUpload"]

const Context = createContext<Controller | null>(null)
// The file an item is, for the parts inside it.
const ItemContext = createContext<FileUploadEntry | null>(null)

function useFileUpload(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<FileUpload.${part}> must be inside <FileUpload.Root>`)
  return controller
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

function Root({
  files,
  defaultFiles,
  onFilesChange,
  onFilesReject,
  accept,
  multiple,
  maxFiles,
  maxSize,
  minSize,
  validate,
  disabled,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<FileUploadProps, Controller>(
    within(createFileUpload, { field }),
    {
      files,
      defaultFiles,
      onFilesChange,
      onFilesReject,
      accept,
      multiple,
      maxFiles,
      maxSize,
      minSize,
      validate,
      disabled,
      required,
      name,
      form,
      id,
    }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type DropzoneProps = PartComponentProps<"div", StateOf<Parts["dropzone"]>>

function Dropzone(props: DropzoneProps): ReactElement {
  const controller = useFileUpload("Dropzone")
  return usePart(controller.dropzone, "div", props, undefined, (content) => (
    // The native file input is the element's last child, whatever element was asked for.
    <>
      {content}
      <PartElement of={controller.input} tag="input" />
    </>
  ))
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Trigger = (props: TriggerProps) => usePart(useFileUpload("Trigger").trigger, "button", props)

export type ListProps = PartComponentProps<"ul", StateOf<Parts["list"]>>

const List = (props: ListProps) => usePart(useFileUpload("List").list, "ul", props)

export interface ItemsProps {
  /** Draws one file, once for each. */
  children: (entry: FileUploadEntry) => ReactNode
}

/** Draws its child once for each file, kept by the file's key. */
function Items({ children }: ItemsProps): ReactElement {
  const entries = useSignal(useFileUpload("Items").entries)
  return (
    <>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{children(entry)}</Fragment>
      ))}
    </>
  )
}

export type ItemProps = PartComponentProps<
  "li",
  StateOf<Parts["item"]>,
  {
    /** The file it is, as `Items` gave it. */
    entry: FileUploadEntry
  }
>

function Item({ entry, ...props }: ItemProps): ReactElement {
  return (
    <ItemContext.Provider value={entry}>
      {usePart(useFileUpload("Item").item(entry.key), "li", props)}
    </ItemContext.Provider>
  )
}

export type ItemNameProps = PartComponentProps<"span", StateOf<Parts["itemName"]>>

/** Says the file's name unless it is given children. */
function ItemName(props: ItemNameProps): ReactElement {
  const entry = useEntry("ItemName")
  return usePart(useFileUpload("ItemName").itemName(entry.key), "span", {
    ...props,
    children: props.children ?? entry.file.name,
  })
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
function ItemSize({ locale, ...props }: ItemSizeProps): ReactElement {
  const entry = useEntry("ItemSize")
  return usePart(useFileUpload("ItemSize").itemSize(entry.key), "span", {
    ...props,
    children: props.children ?? formatBytes(entry.file.size, locale),
  })
}

export type ItemRemoveProps = PartComponentProps<"button", StateOf<Parts["itemRemove"]>>

const ItemRemove = (props: ItemRemoveProps) =>
  usePart(useFileUpload("ItemRemove").itemRemove(useEntry("ItemRemove").key), "button", props)

export type ClearProps = PartComponentProps<"button", StateOf<Parts["clear"]>>

const Clear = (props: ClearProps) => usePart(useFileUpload("Clear").clear, "button", props)

export const FileUpload = /* @__PURE__ */ parts("FileUpload", {
  Root,
  Dropzone,
  Trigger,
  List,
  Items,
  Item,
  ItemName,
  ItemSize,
  ItemRemove,
  Clear,
})
