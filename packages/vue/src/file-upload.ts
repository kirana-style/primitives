import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createFileUpload, formatBytes } from "@kirana-ui/core/file-upload"
import type {
  FileRejection,
  FileUpload as Controller,
  FileUploadEntry,
  FileUploadProps,
} from "@kirana-ui/core/file-upload"
import { Fragment, defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey, PropType } from "vue"

import { written } from "./element.ts"
import { useFieldAround } from "./field-context.ts"
import { context, controller, fromSignal, optional, partComponent } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PlainComponent,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"fileUpload">

const scope = context<Controller>("FileUpload")
// The file an item is, for the parts inside it.
const ITEM: InjectionKey<() => FileUploadEntry> = Symbol("FileUploadItem")

function useEntry(part: string): () => FileUploadEntry {
  const entry = inject(ITEM, undefined)
  if (!entry) throw new Error(`<FileUpload.${part}> must be inside <FileUpload.Item>`)
  return entry
}

const NativeInput = partComponent("FileUploadInput", "input", () => scope.use().input)

// The native file input is the element's last child, whatever element was asked for: a trigger
// opens it with no dropzone in the page.
const RootElement = partComponent(
  "FileUploadRootElement",
  "div",
  () => scope.use().root,
  (content) => [content, h(NativeInput)]
)

export type RootProps = Omit<FileUploadProps, "id" | "onFilesChange" | "onFilesReject"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits = Changes<"files", File[]> & {
  /** The files that were not taken, each with its reasons. */
  filesReject: (rejections: FileRejection[]) => void
}

/** `v-model:files`, or `files` with `@files-change="(files, details) => …"`. */
const Root = defineComponent({
  name: "FileUploadRoot",
  inheritAttrs: false,
  props: {
    files: optional(Array as PropType<readonly File[]>),
    defaultFiles: Array as PropType<readonly File[]>,
    accept: [String, Array] as PropType<string | readonly string[]>,
    multiple: Boolean,
    maxFiles: Number,
    maxSize: Number,
    minSize: Number,
    validate: Function as PropType<FileUploadProps["validate"]>,
    disabled: Boolean,
    required: Boolean,
    name: String,
    form: String,
    id: String,
  },
  emits: ["update:files", "filesChange", "filesReject"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    scope.provide(
      controller(within(createFileUpload, { field: useFieldAround() }), () => ({
        id: props.id ?? generated,
        files: props.files,
        defaultFiles: props.defaultFiles,
        accept: props.accept,
        multiple: props.multiple,
        maxFiles: props.maxFiles,
        maxSize: props.maxSize,
        minSize: props.minSize,
        validate: props.validate,
        disabled: props.disabled,
        required: props.required,
        name: props.name,
        form: props.form,
        onFilesChange(files: File[], details: ChangeDetails) {
          emit("filesChange", files, details)
          if (!details.canceled) emit("update:files", files)
        },
        onFilesReject: (rejections: FileRejection[]) => emit("filesReject", rejections),
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps, RootEmits>

export type DropzoneProps = PartComponentProps

const Dropzone = partComponent<"div", State["dropzone"]>(
  "FileUploadDropzone",
  "div",
  () => scope.use().dropzone
)

export type ItemsProps = Record<never, never>

/** Draws its slot once for each file, kept by the file's key (`v-slot="{ entry }"`). */
const Items = defineComponent({
  name: "FileUploadItems",
  setup(_props, { slots }) {
    const entries = fromSignal(scope.use().entries)
    return () =>
      entries.value.map((entry) => h(Fragment, { key: entry.key }, slots.default?.({ entry })))
  },
}) as unknown as PlainComponent<ItemsProps, {}, { entry: FileUploadEntry }>

export interface ItemProps extends PartComponentProps {
  /** The file it is, as `Items` gave it. */
  entry: FileUploadEntry
}

const Item = defineComponent({
  name: "FileUploadItem",
  inheritAttrs: false,
  props: { entry: { type: Object as PropType<FileUploadEntry>, required: true } },
  setup(props, { attrs, slots }) {
    // An item is its file's key for as long as it is in the page.
    const key = props.entry.key
    const made = scope.use()
    provide(ITEM, () => props.entry)
    const Element = partComponent("FileUploadItemElement", "li", () => made.item(key))
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"li", State["item"], ItemProps>

export type ItemNameProps = PartComponentProps

/** Says the file's name unless its slot says something else. */
const ItemName = defineComponent({
  name: "FileUploadItemName",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const entry = useEntry("ItemName")
    const made = scope.use()
    const text = () => entry().file.name
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const Element = partComponent(
      "FileUploadItemNameElement",
      "span",
      () => made.itemName(entry().key),
      written(text)
    )
    return () => h(Element, attrs, { default: (given: object) => slots.default?.(given) ?? text() })
  },
}) as unknown as PartComponent<"span", State["itemName"], ItemNameProps>

export interface ItemSizeProps extends PartComponentProps {
  /** The language the number is written in. Default: the reader's. */
  locale?: string | undefined
}

/** Says the file's size as people read one unless its slot says something else. */
const ItemSize = defineComponent({
  name: "FileUploadItemSize",
  inheritAttrs: false,
  props: { locale: String },
  setup(props, { attrs, slots }) {
    const entry = useEntry("ItemSize")
    const made = scope.use()
    const text = () => formatBytes(entry().file.size, props.locale)
    // With `as-child` the caller's element holds the text, unless it writes its own.
    const Element = partComponent(
      "FileUploadItemSizeElement",
      "span",
      () => made.itemSize(entry().key),
      written(text)
    )
    return () => h(Element, attrs, { default: (given: object) => slots.default?.(given) ?? text() })
  },
}) as unknown as PartComponent<"span", State["itemSize"], ItemSizeProps>

export type ItemRemoveProps = PartComponentProps

const ItemRemove = defineComponent({
  name: "FileUploadItemRemove",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const entry = useEntry("ItemRemove")
    const made = scope.use()
    const Element = partComponent("FileUploadItemRemoveElement", "button", () =>
      made.itemRemove(entry().key)
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["itemRemove"], ItemRemoveProps>

export type TriggerProps = PartComponentProps
export type ListProps = PartComponentProps
export type ClearProps = PartComponentProps
export const FileUpload = {
  Root,
  Dropzone,
  Trigger: partComponent<"button", State["trigger"]>(
    "FileUploadTrigger",
    "button",
    () => scope.use().trigger
  ),
  List: partComponent<"ul", State["list"]>("FileUploadList", "ul", () => scope.use().list),
  Items,
  Item,
  ItemName,
  ItemSize,
  ItemRemove,
  Clear: partComponent<"button", State["clear"]>(
    "FileUploadClear",
    "button",
    () => scope.use().clear
  ),
}
