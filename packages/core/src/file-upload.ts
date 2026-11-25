import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"

/** Why a file was not taken. */
export type FileRejectionReason = "type" | "too-large" | "too-small" | "too-many" | "invalid"

/** A file that was not taken, and every reason it was not. */
export interface FileRejection {
  readonly file: File
  readonly reasons: readonly FileRejectionReason[]
}

export interface FileUploadProps {
  id: string
  /** The files it holds, in order. */
  files?: readonly File[] | undefined
  /** The files it starts with, when the caller does not hold `files`. Read once. */
  defaultFiles?: readonly File[] | undefined
  /** Heard as the files are about to change: `details.cancel()` keeps them as they were. */
  onFilesChange?: ((files: File[], details: ChangeDetails) => void) | undefined
  /** Told the files that were not taken, each with its reasons. */
  onFilesReject?: ((rejections: FileRejection[]) => void) | undefined
  /**
   * What may be taken, as a file input's `accept`: extensions (`".png"`), types (`"image/png"`)
   * and kinds (`"image/*"`), in a list or one text with commas. Without it, anything.
   */
  accept?: string | readonly string[] | undefined
  /** Whether several files are held. Default `false`: a file taken is the one held. */
  multiple?: boolean | undefined
  /** With `multiple`, how many files it holds at most. */
  maxFiles?: number | undefined
  /** The largest a file may be, in bytes. */
  maxSize?: number | undefined
  /** The smallest a file may be, in bytes. */
  minSize?: number | undefined
  /** Whether a file may be taken, asked after the checks above. */
  validate?: ((file: File) => boolean) | undefined
  /** Disabled: no file can be taken or removed. */
  disabled?: boolean | undefined
  /** Needed: in a `Field`, holding none is then invalid. */
  required?: boolean | undefined
  /** With a name, the files are submitted with the form around them. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
}

/** One file as it is drawn: the file, its place, and what tells it from the others. */
export interface FileUploadEntry {
  /** The same for as long as the file is held: what a list keeps its element by. */
  readonly key: string
  readonly file: File
  readonly index: number
}

export interface FileUpload {
  readonly files: ReadonlySignal<readonly File[]>
  readonly entries: ReadonlySignal<readonly FileUploadEntry[]>
  /** Whether files are being dragged over the dropzone. */
  readonly dragging: ReadonlySignal<boolean>
  /** Takes the files that may be taken, and tells of the others. */
  take(files: readonly File[], details: ChangeDetails): void
  remove(index: number, details: ChangeDetails): void
  setFiles(files: readonly File[], details: ChangeDetails): void
  /** Opens the browser's file picker. */
  open(): void
  mount(): () => void
  readonly root: Part
  /** Where files are dropped, pasted, or pressed to be picked. */
  readonly dropzone: Part
  /** A button that opens the file picker. */
  readonly trigger: Part
  /** The native file input, hidden: it is what a form submits, and what the picker fills. */
  readonly input: Part
  /** What holds the files: a list. */
  readonly list: Part
  /** A file, by its entry's key. */
  item(key: string): Part
  itemName(key: string): Part
  itemSize(key: string): Part
  /** A file's button that takes it away. */
  itemRemove(key: string): Part
  /** Takes every file away. */
  readonly clear: Part
}

const NOTHING = () => {}
const keyOf = (file: File) => `${file.name}\u0000${file.size}\u0000${file.lastModified}`
const same = (a: readonly File[], b: readonly File[]) =>
  a.length === b.length && a.every((each, at) => each === b[at])

/** A size in bytes as people read one: `512 B`, `1.5 KB`, `20 MB`. */
export function formatBytes(bytes: number, locale?: string): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  const digits = unit === 0 || size >= 10 ? 0 : 1
  return `${size.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[unit]}`
}

/** Whether a file is one a file input with this `accept` would offer. */
export function accepts(file: File, accept: string | readonly string[] | undefined): boolean {
  const wanted = (typeof accept === "string" ? accept.split(",") : (accept ?? []))
    .map((each) => each.trim().toLowerCase())
    .filter(Boolean)
  if (wanted.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return wanted.some((each) =>
    each.startsWith(".")
      ? name.endsWith(each)
      : each.endsWith("/*")
        ? type.startsWith(each.slice(0, -1))
        : type === each
  )
}

/**
 * Files chosen to be sent: dropped on it, pasted, or picked through the browser's own picker,
 * each checked against what may be taken, listed, and held in a native file input so a form
 * submits them as it would any.
 */
export function createFileUpload(
  props: ReadonlySignal<FileUploadProps>,
  around: { field?: Field | undefined } = {}
): FileUpload {
  const { field } = around
  const id = props.peek().id
  let member: FieldMembership | undefined
  const files = bindable<readonly File[]>({
    value: () => props.get().files,
    defaultValue: props.peek().defaultFiles ?? [],
    equals: same,
    onChange: (next, by) => props.peek().onFilesChange?.([...next], by),
  })
  const entries = computed<readonly FileUploadEntry[]>(
    () => files.get().map((file, index) => ({ key: keyOf(file), file, index })),
    (a, b) => a.length === b.length && a.every((each, at) => each.file === b[at]!.file)
  )
  const dragging = signal(false)
  // How many of its elements a drag is over: it leaves when it has left them all.
  let over = 0
  const initial = files.peek()
  const names = (list: readonly File[]) => list.map((each) => each.name).join(",")
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    files.set(initial, by)
    member?.reset(names(by.canceled ? files.peek() : initial))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  let input: HTMLInputElement | undefined
  let zone: HTMLElement | undefined
  const made = new Map<string, Part>()
  const entryOf = (key: string) => entries.peek().find((each) => each.key === key)

  function setFiles(next: readonly File[], by: ChangeDetails) {
    if (disabled.peek() || same(next, files.peek())) return
    files.set(next, by)
    if (!by.canceled) member?.changed(names(next))
  }

  function take(given: readonly File[], by: ChangeDetails) {
    if (disabled.peek() || given.length === 0) return
    const { accept, multiple, maxFiles, maxSize, minSize, validate } = props.peek()
    const held = multiple ? [...files.peek()] : []
    const room = multiple ? (maxFiles ?? Infinity) : 1
    const rejected: FileRejection[] = []
    for (const file of given) {
      // The same file given twice is held once.
      if (held.some((each) => keyOf(each) === keyOf(file))) continue
      const reasons: FileRejectionReason[] = []
      if (!accepts(file, accept)) reasons.push("type")
      if (maxSize !== undefined && file.size > maxSize) reasons.push("too-large")
      if (minSize !== undefined && file.size < minSize) reasons.push("too-small")
      if (reasons.length === 0 && validate && !validate(file)) reasons.push("invalid")
      if (reasons.length === 0 && held.length >= room) reasons.push("too-many")
      if (reasons.length > 0) rejected.push({ file, reasons })
      else held.push(file)
    }
    // With none that may be taken, what is held stays.
    if (multiple || held.length > 0) setFiles(held, by)
    if (rejected.length > 0) props.peek().onFilesReject?.(rejected)
  }

  function remove(index: number, by: ChangeDetails) {
    setFiles(
      files.peek().filter((_each, at) => at !== index),
      by
    )
  }

  function open() {
    if (!disabled.peek()) input?.click()
  }

  /** Whether a drag carries files: text and links dragged over are not its business. */
  const carries = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes("Files")

  const state = () => ({
    ...field?.state(),
    "data-disabled": flag(disabled.get()),
    "data-dragging": flag(dragging.get()),
    "data-required": flag(props.get().required),
  })

  function once(name: string, key: string, make: () => Part): Part {
    const at = `${name}:${key}`
    let part = made.get(at)
    if (!part) made.set(at, (part = make()))
    return part
  }
  const plain = (name: string, key: string) =>
    once(name, key, () => ({ props: computed(state), attach: () => NOTHING }))

  return {
    files,
    entries,
    dragging,
    take,
    remove,
    setFiles,
    open,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({ ...state(), "data-empty": flag(files.get().length === 0) })),
      attach(element) {
        member = field?.join({
          element,
          focus: () => zone?.focus(),
          kind: "group",
          required: () => Boolean(props.peek().required),
          value: names(files.peek()),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    dropzone: {
      props: computed(() => ({
        role: "button",
        tabindex: disabled.get() ? "-1" : "0",
        "aria-disabled": disabled.get() ? "true" : undefined,
        ...field?.aria(),
        ...state(),
        onClick(event: MouseEvent) {
          // A press on something of its own inside it (a button, the list) is that thing's.
          const on = (event.target as Element).closest("button, a, input, [role='listitem']")
          if (!on || on === event.currentTarget) open()
        },
        onKeyDown(event: KeyboardEvent) {
          if (event.target !== event.currentTarget) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            open()
          }
        },
        onDragEnter(event: DragEvent) {
          if (!carries(event) || disabled.peek()) return
          event.preventDefault()
          over++
          dragging.set(true)
        },
        onDragOver(event: DragEvent) {
          // Without this the browser opens the file where the page was.
          if (carries(event)) event.preventDefault()
        },
        onDragLeave(event: DragEvent) {
          if (!carries(event) || disabled.peek()) return
          over = Math.max(0, over - 1)
          if (over === 0) dragging.set(false)
        },
        onDrop(event: DragEvent) {
          if (!carries(event)) return
          event.preventDefault()
          over = 0
          dragging.set(false)
          take([...(event.dataTransfer?.files ?? [])], details("drop", event))
        },
        onPaste(event: ClipboardEvent) {
          const pasted = [...(event.clipboardData?.files ?? [])]
          if (pasted.length === 0) return
          event.preventDefault()
          take(pasted, details("paste", event))
        },
        onFocus: () => member?.focused(true),
        onBlur: () => member?.focused(false),
      })),
      attach(element) {
        zone = element
        return () => {
          if (zone === element) zone = undefined
        }
      },
    },
    trigger: {
      props: computed(() => ({
        type: "button",
        disabled: flag(disabled.get()),
        ...state(),
        onClick: open,
      })),
      attach: () => NOTHING,
    },
    input: {
      props: computed(() => {
        const { accept, multiple } = props.get()
        return {
          type: "file",
          id: field?.controlId ?? `${id}-input`,
          name: props.get().name ?? field?.name.get(),
          form: props.get().form,
          accept: typeof accept === "string" ? accept : accept?.join(","),
          multiple: flag(multiple),
          disabled: flag(disabled.get()),
          hidden: "",
          tabindex: "-1",
          onChange(event: Event) {
            const control = event.currentTarget as HTMLInputElement
            take([...(control.files ?? [])], details("pick", event))
          },
          // The picker's own press must not come back up as a press on the dropzone.
          onClick: (event: Event) => event.stopPropagation(),
        }
      }),
      attach(element) {
        input = element as HTMLInputElement
        const leave = inForm.attach(element)
        // The input holds what the component holds: it is what a form submits.
        const follow = effect(() => {
          const held = files.get()
          const view = element.ownerDocument.defaultView
          if (!view || !input) return
          const carried = new view.DataTransfer()
          for (const each of held) carried.items.add(each)
          input.files = carried.files
        })
        return () => {
          follow()
          leave()
          if (input === element) input = undefined
        }
      },
    },
    list: { props: computed(() => ({ role: "list", ...state() })), attach: () => NOTHING },
    item: (key) =>
      once("item", key, () => ({
        props: computed(() => ({ role: "listitem", ...state() })),
        attach: () => NOTHING,
      })),
    itemName: (key) => plain("itemName", key),
    itemSize: (key) => plain("itemSize", key),
    itemRemove: (key) =>
      once("itemRemove", key, () => ({
        props: computed(() => ({
          type: "button",
          "aria-label": `Remove ${entryOf(key)?.file.name ?? ""}`,
          disabled: flag(disabled.get()),
          ...state(),
          onClick(event: Event) {
            const entry = entryOf(key)
            if (entry) remove(entry.index, details("item-remove-press", event))
          },
        })),
        attach: () => NOTHING,
      })),
    clear: {
      props: computed(() => ({
        type: "button",
        "aria-label": "Remove all",
        disabled: flag(disabled.get()),
        hidden: flag(files.get().length === 0),
        ...state(),
        onClick: (event: Event) => setFiles([], details("clear-press", event)),
      })),
      attach: () => NOTHING,
    },
  }
}
