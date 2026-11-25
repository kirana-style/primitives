import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import type { Field, FieldMembership } from "./field.ts"
import { defaultId, details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"
import { restInputs } from "./services/hidden-inputs.ts"

export interface TagsInputProps {
  id: string
  /** The tags, in order. */
  value?: readonly string[] | undefined
  /** The tags it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: readonly string[] | undefined
  /** Heard as the tags are about to change: `details.cancel()` keeps them as they were. */
  onValueChange?: ((value: string[], details: ChangeDetails) => void) | undefined
  /** Told a text that was not made a tag, and why. */
  onValueInvalid?: ((text: string, reason: "duplicate" | "max" | "invalid") => void) | undefined
  /** Whether a text may be a tag. Asked after the text is trimmed, and not for an empty one. */
  validate?: ((text: string, value: readonly string[]) => boolean) | undefined
  /** How many tags it holds at most. */
  max?: number | undefined
  /** Whether the same text may be a tag twice. Default `false`. */
  allowDuplicates?: boolean | undefined
  /** What ends a tag as it is typed or pasted, beside Enter. Default `","`. `null` for nothing. */
  delimiter?: string | RegExp | null | undefined
  /** Whether what is typed becomes a tag as focus leaves the input. Default `false`. */
  addOnBlur?: boolean | undefined
  /** Whether a pasted text is cut into tags at its delimiters and line ends. Default `true`. */
  addOnPaste?: boolean | undefined
  /** Whether a tag can be edited in place, by two presses or Enter on it. Default `true`. */
  editable?: boolean | undefined
  /** Disabled: nothing can be added or taken away. */
  disabled?: boolean | undefined
  /** Shown as they are, focusable, not changeable. */
  readOnly?: boolean | undefined
  /** Needed: in a `Field`, holding none is then invalid. */
  required?: boolean | undefined
  /** With a name, each tag is submitted under it with the form around them. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
}

/** One tag as it is drawn: its text, its place, and what tells it from the others. */
export interface TagsInputEntry {
  /** The same for as long as the tag is there: what a list keeps its element by. */
  readonly key: string
  readonly value: string
  readonly index: number
}

export interface TagsInput {
  readonly value: ReadonlySignal<readonly string[]>
  readonly entries: ReadonlySignal<readonly TagsInputEntry[]>
  /** The key of the tag being edited in place; `null` when none is. */
  readonly editing: ReadonlySignal<string | null>
  /** Makes a text a tag, if it may be one. Says whether it did. */
  add(text: string, details: ChangeDetails): boolean
  /** Takes the tag at a place away. */
  remove(index: number, details: ChangeDetails): void
  setValue(value: readonly string[], details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** What holds the tags: a list. */
  readonly list: Part
  /** A tag, by its entry's key. */
  item(key: string): Part
  /** A tag's text: hidden while the tag is edited. */
  itemText(key: string): Part
  /** Where a tag is edited in place: hidden unless it is being edited. */
  itemInput(key: string): Part
  /** A tag's button that takes it away. */
  itemRemove(key: string): Part
  /** Where a new tag is typed. */
  readonly input: Part
  /** Takes every tag away. */
  readonly clear: Part
  /** The hidden input that submits the first tag; the rest follow it, drawn by the component. */
  readonly hiddenInput: Part
}

const NOTHING = () => {}
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((each, at) => each === b[at])

/**
 * Several short texts held as tags: typed and ended with Enter or a delimiter, pasted several
 * at once, moved between with the arrows, taken away with Backspace, and edited in place.
 */
export function createTagsInput(
  props: ReadonlySignal<TagsInputProps>,
  around: { field?: Field | undefined } & DirectionAround = {}
): TagsInput {
  const { field } = around
  const id = props.peek().id
  let member: FieldMembership | undefined
  const value = bindable<readonly string[]>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? [],
    equals: same,
    onChange: (next, by) => props.peek().onValueChange?.([...next], by),
  })
  const entries = computed<readonly TagsInputEntry[]>(
    () => {
      // A tag is told from the others by its text, and from its twins by which of them it is.
      const seen = new Map<string, number>()
      return value.get().map((each, index) => {
        const nth = seen.get(each) ?? 0
        seen.set(each, nth + 1)
        return { key: `${each}\u0000${nth}`, value: each, index }
      })
    },
    (a, b) => a.length === b.length && a.every((each, at) => each.key === b[at]!.key)
  )
  const editing = signal<string | null>(null)
  const focused = signal(false)
  // What a form's reset goes back to: the tags it began with.
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    const by = details("form-reset", event)
    value.set(initial, by)
    member?.reset((by.canceled ? value.peek() : initial).join(","))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const fixed = () => disabled.peek() || readOnly.peek()
  let input: HTMLInputElement | undefined
  const items = new Map<string, HTMLElement>()
  const inputs = new Map<string, HTMLInputElement>()
  const made = new Map<string, Part>()

  const entryOf = (key: string) => entries.peek().find((each) => each.key === key)

  function setValue(next: readonly string[], by: ChangeDetails) {
    if (fixed() || same(next, value.peek())) return
    value.set(next, by)
    if (!by.canceled) member?.changed(next.join(","))
  }

  /** Why a text may not be a tag among `held`; `undefined` when it may. */
  function refusal(text: string, held: readonly string[]) {
    const { max, allowDuplicates, validate } = props.peek()
    if (max !== undefined && held.length >= max) return "max" as const
    if (!allowDuplicates && held.includes(text)) return "duplicate" as const
    if (validate && !validate(text, held)) return "invalid" as const
    return undefined
  }

  function add(raw: string, by: ChangeDetails): boolean {
    const text = raw.trim()
    if (fixed() || text === "") return false
    const why = refusal(text, value.peek())
    if (why) {
      props.peek().onValueInvalid?.(text, why)
      return false
    }
    setValue([...value.peek(), text], by)
    return !by.canceled
  }

  /** Several at once: each that may be a tag is, in one change. Gives the texts that were not. */
  function addAll(texts: readonly string[], by: ChangeDetails): string[] {
    const next = [...value.peek()]
    const left: string[] = []
    for (const raw of texts) {
      const text = raw.trim()
      if (text === "") continue
      const why = refusal(text, next)
      if (why) {
        props.peek().onValueInvalid?.(text, why)
        left.push(text)
      } else next.push(text)
    }
    setValue(next, by)
    return by.canceled ? texts.map((each) => each.trim()).filter(Boolean) : left
  }

  function remove(index: number, by: ChangeDetails) {
    setValue(
      value.peek().filter((_each, at) => at !== index),
      by
    )
  }

  /** A typed or pasted text cut where tags end. */
  function pieces(text: string): string[] {
    const { delimiter = "," } = props.peek()
    const lines = text.split(/\r?\n/)
    return delimiter === null ? lines : lines.flatMap((each) => each.split(delimiter))
  }

  /** Starts editing a tag in place, where the page drew an input for it. */
  function edit(key: string) {
    const entry = entryOf(key)
    const own = inputs.get(key)
    if (fixed() || !(props.peek().editable ?? true) || !entry || !own) return
    editing.set(key)
    // Shown here and now, as the part's props will say: focus cannot go to what is hidden.
    own.hidden = false
    own.value = entry.value
    own.focus()
    own.select()
  }

  /** Ends an edit in place: keeps what was typed, or with `keep` false, drops it. */
  function settle(key: string, keep: boolean, by: ChangeDetails, back: boolean) {
    if (editing.peek() !== key) return
    const entry = entryOf(key)
    const text = inputs.get(key)?.value.trim() ?? ""
    editing.set(null)
    if (keep && entry && text !== entry.value) {
      const rest = value.peek().filter((_each, at) => at !== entry.index)
      // Emptied, the tag is taken away; a text that may not be a tag leaves it as it was.
      if (text === "") setValue(rest, by)
      else {
        const why = refusal(text, rest)
        if (why) props.peek().onValueInvalid?.(text, why)
        else
          setValue(
            value.peek().map((each, at) => (at === entry.index ? text : each)),
            by
          )
      }
    }
    if (back) (items.get(key) ?? input)?.focus()
  }

  const state = () => ({
    ...field?.state(),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
  })

  /** A part of a tag, made once for its key. */
  function once(name: string, key: string, make: () => Part): Part {
    const at = `${name}:${key}`
    let part = made.get(at)
    if (!part) made.set(at, (part = make()))
    return part
  }

  return {
    value,
    entries,
    editing,
    add,
    remove,
    setValue,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        ...state(),
        "data-focused": flag(focused.get()),
        "data-empty": flag(value.get().length === 0),
        onFocus() {
          focused.set(true)
          member?.focused(true)
        },
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if ((event.currentTarget as HTMLElement).contains(to)) return
          focused.set(false)
          member?.focused(false)
        },
        onClick(event: MouseEvent) {
          // A press on the box itself, between the tags, is a press on the input.
          if (event.target === event.currentTarget) input?.focus()
        },
      })),
      attach(element) {
        member = field?.join({
          element,
          focus: () => input?.focus(),
          kind: "group",
          required: () => Boolean(props.peek().required),
          value: value.peek().join(","),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    list: {
      props: computed(() => ({ role: "list", ...state() })),
      attach: () => NOTHING,
    },
    item: (key) =>
      once("item", key, () => ({
        props: computed(() => ({
          role: "listitem",
          tabindex: disabled.get() ? undefined : "-1",
          ...state(),
          "data-editing": flag(editing.get() === key),
          onClick(event: MouseEvent) {
            if (event.detail === 2) edit(key)
          },
          onKeyDown(event: KeyboardEvent) {
            // Its own keys only: not the ones typed in the input it holds while edited.
            if (event.target !== event.currentTarget) return
            const entry = entryOf(key)
            if (!entry) return
            const all = entries.peek()
            const rtl = directionOf(event.currentTarget as Element, around.direction) === "rtl"
            const to = (index: number) => {
              event.preventDefault()
              const next = all[index]
              if (next) items.get(next.key)?.focus()
              else input?.focus()
            }
            if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) to(Math.max(0, entry.index - 1))
            else if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) to(entry.index + 1)
            else if (event.key === "Home") to(0)
            else if (event.key === "End" || event.key === "Escape") to(all.length)
            else if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault()
              if (fixed()) return
              // Focus goes to the tag that takes its place: the one before for Backspace, the
              // one after for Delete, and the input when there is none.
              const before = all[entry.index - 1]
              const after = all[entry.index + 1]
              const next = event.key === "Backspace" ? (before ?? after) : (after ?? before)
              const by = details("item-remove-key", event)
              remove(entry.index, by)
              if (!by.canceled) ((next && items.get(next.key)) ?? input)?.focus()
            } else if (event.key === "Enter" || event.key === "F2") {
              event.preventDefault()
              edit(key)
            }
          },
        })),
        attach(element) {
          items.set(key, element)
          return () => {
            if (items.get(key) === element) items.delete(key)
          }
        },
      })),
    itemText: (key) =>
      once("itemText", key, () => ({
        props: computed(() => ({ hidden: flag(editing.get() === key), ...state() })),
        attach: () => NOTHING,
      })),
    itemInput: (key) =>
      once("itemInput", key, () => ({
        props: computed(() => ({
          hidden: flag(editing.get() !== key),
          "aria-label": `Edit ${entryOf(key)?.value ?? ""}`,
          tabindex: "-1",
          ...state(),
          onKeyDown(event: KeyboardEvent) {
            if (event.isComposing) return
            if (event.key === "Enter") {
              event.preventDefault()
              settle(key, true, details("enter-key", event), true)
            } else if (event.key === "Escape") {
              event.preventDefault()
              settle(key, false, details("escape-key", event), true)
            }
          },
          onBlur: (event: FocusEvent) => settle(key, true, details("blur", event), false),
        })),
        attach(element) {
          inputs.set(key, element as HTMLInputElement)
          return () => {
            if (inputs.get(key) === element) inputs.delete(key)
          }
        },
      })),
    itemRemove: (key) =>
      once("itemRemove", key, () => ({
        props: computed(() => ({
          type: "button",
          // Reached from its tag: Backspace and Delete on the tag do the same.
          tabindex: "-1",
          "aria-label": `Remove ${entryOf(key)?.value ?? ""}`,
          disabled: flag(disabled.get() || readOnly.get()),
          ...state(),
          onClick(event: Event) {
            const entry = entryOf(key)
            if (!entry) return
            const by = details("item-remove-press", event)
            remove(entry.index, by)
            if (!by.canceled) input?.focus()
          },
        })),
        attach: () => NOTHING,
      })),
    input: {
      props: computed(() => ({
        // In a field, the id its label is `for`.
        ...(field ? defaultId(field.controlId) : { id: `${id}-input` }),
        disabled: flag(disabled.get()),
        readonly: flag(readOnly.get()),
        "aria-required": props.get().required ? "true" : undefined,
        ...field?.aria(),
        ...state(),
        onKeyDown(event: KeyboardEvent) {
          if (event.isComposing) return
          const control = event.currentTarget as HTMLInputElement
          const last = entries.peek().at(-1)
          const rtl = directionOf(control, around.direction) === "rtl"
          if (event.key === "Enter") {
            if (control.value.trim() === "") return
            // Enter makes a tag: it does not submit the form the tags are in.
            event.preventDefault()
            if (add(control.value, details("enter-key", event))) control.value = ""
          } else if (
            (event.key === "Backspace" || event.key === (rtl ? "ArrowRight" : "ArrowLeft")) &&
            control.selectionStart === 0 &&
            control.selectionEnd === 0 &&
            last
          ) {
            // From the start of the input, back onto the last tag: Backspace there takes it
            // away, so a held key does not eat the tags one after another unseen.
            event.preventDefault()
            items.get(last.key)?.focus()
          }
        },
        onInput(event: Event) {
          const control = event.currentTarget as HTMLInputElement
          const cut = pieces(control.value)
          if (cut.length < 2) return
          // What is before a delimiter is a tag; what is after it is still being typed.
          const typing = cut.pop()!
          const left = addAll(cut, details("delimiter", event))
          control.value = [...left, typing].join(
            typeof props.peek().delimiter === "string" ? (props.peek().delimiter as string) : ","
          )
        },
        onPaste(event: ClipboardEvent) {
          if (!(props.peek().addOnPaste ?? true) || fixed()) return
          const cut = pieces(event.clipboardData?.getData("text") ?? "")
          // One text with nothing to cut it at is typed in, as any paste.
          if (cut.length < 2) return
          event.preventDefault()
          addAll(cut, details("paste", event))
        },
        onBlur(event: FocusEvent) {
          const control = event.currentTarget as HTMLInputElement
          if (props.peek().addOnBlur && add(control.value, details("blur", event)))
            control.value = ""
        },
      })),
      attach(element) {
        input = element as HTMLInputElement
        return () => {
          if (input === element) input = undefined
        }
      },
    },
    clear: {
      props: computed(() => ({
        type: "button",
        "aria-label": "Remove all",
        disabled: flag(disabled.get() || readOnly.get()),
        hidden: flag(value.get().length === 0),
        ...state(),
        onClick(event: Event) {
          const by = details("clear-press", event)
          setValue([], by)
          if (!by.canceled) input?.focus()
        },
      })),
      attach: () => NOTHING,
    },
    hiddenInput: {
      props: computed(() => {
        const [first] = value.get()
        return {
          type: "hidden",
          // With no tag, nothing is sent.
          name: first === undefined ? undefined : (props.get().name ?? field?.name.get()),
          form: props.get().form,
          value: first ?? "",
          disabled: flag(disabled.get()),
        }
      }),
      attach(element) {
        const leave = inForm.attach(element)
        const stop = restInputs(element, () => ({
          rest: value.get().slice(1),
          name: props.get().name ?? field?.name.get(),
          form: props.get().form,
          disabled: disabled.get(),
        }))
        return () => {
          stop()
          leave()
        }
      },
    },
  }
}
