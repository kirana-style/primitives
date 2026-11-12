import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part, PartStyle } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { Orientation } from "./services/roving.ts"

/** One number for a slider with one thumb, a list for a range: what comes back is what was given. */
export type SliderValue = number | readonly number[]

export interface SliderChangeDetails extends ChangeDetails {
  /** The thumb that moved. */
  readonly index: number
}

export interface SliderProps {
  id: string
  value?: SliderValue | undefined
  /** Read once. Default `min`. */
  defaultValue?: SliderValue | undefined
  /** Each step of a drag and each key. */
  onValueChange?: ((value: number | number[], details: SliderChangeDetails) => void) | undefined
  /** When the pointer lets go, and after each key: the value to save. */
  onValueCommitted?: ((value: number | number[], details: SliderChangeDetails) => void) | undefined
  /** Default 0. */
  min?: number | undefined
  /** Default 100. */
  max?: number | undefined
  /** Default 1. */
  step?: number | undefined
  /** What Page Up, Page Down and an arrow with Shift move by. Default 10. */
  largeStep?: number | undefined
  /** How many steps two thumbs of a range stay apart. Default 0. */
  minStepsBetweenValues?: number | undefined
  orientation?: Orientation | undefined
  disabled?: boolean | undefined
  /** With a name, each thumb's value is submitted with the form around the slider. */
  name?: string | undefined
  /** How a value is written. */
  format?: Intl.NumberFormatOptions | undefined
  /** The language a value is written in; the page's by default. */
  locale?: string | undefined
  /** What assistive technology reads for a thumb, when the written value is not enough. */
  getAriaValueText?: ((text: string, value: number, index: number) => string) | undefined
}

export interface Slider {
  /** Every thumb's value, in order. */
  readonly values: ReadonlySignal<readonly number[]>
  /** The values as they are written: `"20 – 80"`. */
  readonly text: ReadonlySignal<string>
  /** The thumb a pointer holds; `null` when none does. */
  readonly dragging: ReadonlySignal<number | null>
  /** Moves a thumb, held to the range, the step and its neighbours. Says whether it moved. */
  setValue(index: number, value: number, details: SliderChangeDetails): boolean
  mount(): () => void
  readonly root: Part
  /** Where the written value goes. */
  readonly value: Part
  /** What a pointer presses and drags on: it holds the track and the thumbs. */
  readonly control: Part
  readonly track: Part
  /** The filled part of the track: up to the thumb, or between the first and the last. */
  readonly indicator: Part
  thumb(index: number): Part
  /** The input inside a thumb, hidden: it is what a form reads. */
  thumbInput(index: number): Part
}

const NOTHING = () => {}

const sameList = (a: SliderValue, b: SliderValue) => {
  if (typeof a === "number" || typeof b === "number") return a === b
  return a.length === b.length && a.every((each, index) => each === b[index])
}

/** How many decimals a step has, so a value held to it is not `0.30000000000000004`. */
function decimals(step: number): number {
  const text = String(step)
  const exponent = text.indexOf("e-")
  if (exponent >= 0) return Number(text.slice(exponent + 2))
  const point = text.indexOf(".")
  return point < 0 ? 0 : text.length - point - 1
}

/**
 * A value chosen along a track by dragging a thumb, pressing the track or with the keyboard. One
 * thumb, or several for a range: each is a `role="slider"` of its own, and none passes another.
 */
export function createSlider(
  props: ReadonlySignal<SliderProps>,
  around: { field?: Field | undefined } & DirectionAround = {}
): Slider {
  const { field } = around
  let member: FieldMembership | undefined
  const value = bindable<SliderValue>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? props.peek().min ?? 0,
    equals: sameList,
    // Set through `change`, which gives the caller the details with the thumb.
  })
  const range = computed(
    () => {
      const { min = 0, max = 100, step = 1 } = props.get()
      return { min, max, step: step > 0 ? step : 1 }
    },
    (a, b) => a.min === b.min && a.max === b.max && a.step === b.step
  )
  const values = computed<readonly number[]>(() => {
    const given = value.get()
    const { min, max } = range.get()
    const list = typeof given === "number" ? [given] : given
    return list.map((each) => Math.min(max, Math.max(min, each)))
  }, sameList)
  const disabled = computed(() => Boolean(props.get().disabled) || Boolean(field?.disabled.get()))
  const orientation = computed(() => props.get().orientation ?? "horizontal")
  const dragging = signal<number | null>(null)
  // What a thumb is centred by depends on the reading direction: the provider's, which a server
  // knows too, or read where the control is once it is in the page.
  const measured = signal(false)
  const rtl = computed(() => (around.direction ? around.direction.get() === "rtl" : measured.get()))

  const thumbs = new Map<number, HTMLElement>()
  let stopDrag: (() => void) | undefined

  const share = (each: number) => {
    const { min, max } = range.get()
    return max === min ? 0 : ((each - min) / (max - min)) * 100
  }

  const write = (each: number) => {
    const { format, locale } = props.get()
    return new Intl.NumberFormat(locale, format).format(each)
  }
  const text = computed(() => values.get().map(write).join(" – "))

  const state = () => ({
    ...field?.state(),
    "data-orientation": orientation.get(),
    "data-disabled": flag(disabled.get()),
    "data-dragging": flag(dragging.get() !== null),
  })

  /** The value as the caller holds it: a number if they gave a number. */
  const shaped = (list: readonly number[]) =>
    typeof value.peek() === "number" ? list[0]! : [...list]

  function snap(raw: number) {
    const { min, max, step } = range.peek()
    const held = Math.round((raw - min) / step) * step + min
    return Math.min(max, Math.max(min, Number(held.toFixed(decimals(step)))))
  }

  /** `raw` for the thumb at `index`, on a step and no nearer its neighbours than it may be. */
  function within(list: readonly number[], index: number, raw: number) {
    const { min, max, step } = range.peek()
    const gap = (props.peek().minStepsBetweenValues ?? 0) * step
    const low = index > 0 ? list[index - 1]! + gap : min
    const high = index < list.length - 1 ? list[index + 1]! - gap : max
    return Math.min(Math.max(snap(raw), low), Math.max(low, high))
  }

  // The value last asked for. A caller who holds the value gives it back in their framework's
  // time, so what is committed is this, never the value read back.
  let latest: readonly number[] | undefined

  /** Moves a thumb, and says whether it moved. */
  function setValue(index: number, raw: number, by: SliderChangeDetails): boolean {
    if (disabled.peek()) return false
    const list = latest ?? values.peek()
    if (index < 0 || index >= list.length) return false
    const next = within(list, index, raw)
    if (next === list[index]) return false
    const moved = list.map((each, at) => (at === index ? next : each))
    props.peek().onValueChange?.(shaped(moved), by)
    if (by.canceled) return false
    latest = moved
    value.set(shaped(moved), by)
    member?.changed(moved.join(","))
    return true
  }

  const by = (reason: string, index: number, event?: Event): SliderChangeDetails =>
    Object.assign(details(reason, event), { index })

  function commit(index: number, event: Event) {
    props.peek().onValueCommitted?.(shaped(latest ?? values.peek()), by("commit", index, event))
    // From here the value is the caller's again, or the slider's own.
    latest = undefined
  }

  /** The value under the pointer, less how far from its thumb's centre the pointer took hold. */
  function valueAt(event: PointerEvent, control: HTMLElement, offset: number) {
    const { min, max } = range.peek()
    const box = control.getBoundingClientRect()
    let along: number
    if (orientation.peek() === "vertical") {
      along = box.height === 0 ? 0 : 1 - (event.clientY - offset - box.top) / box.height
    } else {
      along = box.width === 0 ? 0 : (event.clientX - offset - box.left) / box.width
      if (rtl.peek()) along = 1 - along
    }
    return min + Math.min(1, Math.max(0, along)) * (max - min)
  }

  /** The thumb nearest a value; of two at the same distance, the one on the value's side. */
  function nearest(at: number) {
    const list = values.peek()
    let best = 0
    for (let index = 1; index < list.length; index++) {
      const here = Math.abs(list[index]! - at)
      const there = Math.abs(list[best]! - at)
      if (here < there || (here === there && at > list[index]!)) best = index
    }
    return best
  }

  function press(event: PointerEvent) {
    if (disabled.peek() || event.button !== 0 || values.peek().length === 0) return
    const control = event.currentTarget as HTMLElement
    const target = event.target as Node
    let index = [...thumbs].find(([, element]) => element.contains(target))?.[0]
    let offset = 0
    if (index === undefined) {
      const at = valueAt(event, control, 0)
      index = nearest(at)
      setValue(index, at, by("track-press", index, event))
    } else {
      // Held by its edge, a thumb keeps that edge under the pointer.
      const box = thumbs.get(index)!.getBoundingClientRect()
      offset =
        orientation.peek() === "vertical"
          ? event.clientY - (box.top + box.height / 2)
          : event.clientX - (box.left + box.width / 2)
    }
    // No text is selected by the drag, and focus goes where it is put.
    event.preventDefault()
    thumbs.get(index)?.focus({ preventScroll: true })

    const held = index
    const page = control.ownerDocument
    const move = (next: PointerEvent) =>
      setValue(held, valueAt(next, control, offset), by("drag", held, next))
    const end = (last: Event) => {
      stopDrag?.()
      commit(held, last)
    }
    stopDrag?.()
    stopDrag = () => {
      stopDrag = undefined
      page.removeEventListener("pointermove", move)
      page.removeEventListener("pointerup", end)
      page.removeEventListener("pointercancel", end)
      dragging.set(null)
    }
    page.addEventListener("pointermove", move)
    page.addEventListener("pointerup", end)
    page.addEventListener("pointercancel", end)
    dragging.set(held)
  }

  function key(index: number, event: KeyboardEvent) {
    if (disabled.peek()) return
    const { min, max, step } = range.peek()
    const large = props.peek().largeStep ?? 10
    const current = values.peek()[index]
    if (current === undefined) return
    const by1 = event.shiftKey ? large : step
    // Left and right follow the reading direction where the thumb is.
    const forward = rtl.peek() ? "ArrowLeft" : "ArrowRight"
    const back = rtl.peek() ? "ArrowRight" : "ArrowLeft"
    let next: number
    if (event.key === forward || event.key === "ArrowUp") next = current + by1
    else if (event.key === back || event.key === "ArrowDown") next = current - by1
    else if (event.key === "PageUp") next = current + large
    else if (event.key === "PageDown") next = current - large
    else if (event.key === "Home") next = min
    else if (event.key === "End") next = max
    else return
    event.preventDefault()
    if (setValue(index, next, by("keyboard", index, event))) commit(index, event)
    else latest = undefined
  }

  const made = new Map<number, Part>()
  const inputs = new Map<number, Part>()

  return {
    values,
    text,
    dragging,
    setValue,
    mount: () => () => stopDrag?.(),
    root: {
      props: computed(() => ({
        role: "group",
        ...state(),
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          // From one thumb to another, focus has not left the slider.
          const to = event.relatedTarget as Node | null
          if (!(event.currentTarget as HTMLElement).contains(to)) member?.focused(false)
        },
      })),
      attach(element) {
        member = field?.join({
          element,
          focus: () => thumbs.get(0)?.focus(),
          kind: "range",
          // A slider always has a value.
          required: () => false,
          value: values.peek().join(","),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    value: {
      // Each thumb says its own value to assistive technology.
      props: computed(() => ({ "aria-live": "off", ...state() })),
      attach: () => NOTHING,
    },
    control: {
      props: computed(() => ({
        ...state(),
        // A finger on the control drags the thumb, not the page.
        style: { "touch-action": "none" },
        onPointerDown: press,
      })),
      attach(element) {
        measured.set(directionOf(element) === "rtl")
        return () => stopDrag?.()
      },
    },
    track: { props: computed(state), attach: () => NOTHING },
    indicator: {
      props: computed(() => {
        const list = values.get()
        const start = list.length > 1 ? share(list[0]!) : 0
        const end = list.length > 0 ? share(list[list.length - 1]!) : 0
        // The value as a length, which a server can write: nothing is measured for it.
        const style: PartStyle =
          orientation.get() === "vertical"
            ? {
                position: "absolute",
                bottom: `${start}%`,
                height: `${end - start}%`,
                width: "inherit",
              }
            : {
                position: "relative",
                "inset-inline-start": `${start}%`,
                width: `${end - start}%`,
                height: "inherit",
              }
        return { ...state(), style }
      }),
      attach: () => NOTHING,
    },
    thumb(index) {
      let part = made.get(index)
      if (part) return part
      part = {
        props: computed(() => {
          const { min, max } = range.get()
          const current = values.get()[index] ?? min
          const vertical = orientation.get() === "vertical"
          const { format, getAriaValueText } = props.get()
          const written = getAriaValueText || format ? write(current) : undefined
          const style: PartStyle = vertical
            ? {
                position: "absolute",
                bottom: `${share(current)}%`,
                left: "50%",
                translate: "-50% 50%",
              }
            : {
                position: "absolute",
                "inset-inline-start": `${share(current)}%`,
                top: "50%",
                translate: `${rtl.get() ? "50%" : "-50%"} -50%`,
              }
          return {
            role: "slider",
            tabindex: disabled.get() ? "-1" : "0",
            "aria-valuemin": String(min),
            "aria-valuemax": String(max),
            "aria-valuenow": String(current),
            "aria-valuetext": getAriaValueText?.(written!, current, index) ?? written,
            "aria-orientation": orientation.get(),
            "aria-disabled": disabled.get() ? "true" : undefined,
            ...field?.aria(),
            "data-index": String(index),
            ...state(),
            style,
            onKeyDown: (event: KeyboardEvent) => key(index, event),
          }
        }),
        attach(element) {
          thumbs.set(index, element)
          return () => {
            if (thumbs.get(index) === element) thumbs.delete(index)
          }
        },
      }
      made.set(index, part)
      return part
    },
    thumbInput(index) {
      let part = inputs.get(index)
      if (part) return part
      part = {
        props: computed(() => ({
          type: "hidden",
          name: props.get().name ?? field?.name.get(),
          value: String(values.get()[index] ?? range.get().min),
          disabled: flag(disabled.get()),
        })),
        attach: () => NOTHING,
      }
      inputs.set(index, part)
      return part
    },
  }
}
