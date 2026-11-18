import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part, PartStyle } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createFormControl } from "./services/form-control.ts"
import type { Orientation } from "./services/roving.ts"

/** One number for a slider with one thumb, a list for a range: what comes back is what was given. */
export type SliderValue = number | readonly number[]

/** A slider's change details: the details of any change, and which thumb moved. */
export interface SliderChangeDetails extends ChangeDetails {
  /** The thumb that moved. */
  readonly index: number
}

/**
 * What a slider tells of a value it was given as `Value`: a number for one thumb, a list for a
 * range, and either where the caller's own type says either.
 */
export type SliderTold<Value extends SliderValue = SliderValue> = Value extends number
  ? number
  : number[]

/** `Value` is what the slider is given, `value` or `defaultValue`: a number, or a range's list. */
export interface SliderProps<Value extends SliderValue = SliderValue> {
  id: string
  /** The value, when the caller holds it: a number, or a list of numbers for a range. */
  value?: Value | undefined
  /** Read once. Default `min`. */
  defaultValue?: Value | undefined
  /** Each step of a drag and each key. */
  onValueChange?: ((value: SliderTold<Value>, details: SliderChangeDetails) => void) | undefined
  /** When the pointer lets go, and after each key: the value to save. */
  onValueCommitted?: ((value: SliderTold<Value>, details: SliderChangeDetails) => void) | undefined
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
  /**
   * Whether the track lies across (the default) or stands upright: the arrows that move a thumb
   * follow.
   */
  orientation?: Orientation | undefined
  /**
   * Where a thumb is at the ends of its range. `"center"` (the default): its centre on the
   * control's edge, so half of it lies outside. `"edge"`: its edge on the control's edge, so
   * it stays inside. `"edge-client-only"` is the same here: nothing waits for the browser.
   */
  thumbAlignment?: "center" | "edge" | "edge-client-only" | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /**
   * Shown as it is, focusable, not changeable: no key and no pointer moves a thumb, and its
   * value is still submitted with the form.
   */
  readOnly?: boolean | undefined
  /** With a name, each thumb's value is submitted with the form around the slider. */
  name?: string | undefined
  /** The id of the form the control belongs to, when it is not inside it. */
  form?: string | undefined
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
  /**
   * A thumb, by the index of its value. A thumb that was given none is asked for by a key (an
   * id its framework made) and takes its place among the slider's thumbs, in the order they
   * are written: the order they are first asked for until they are in the page, the page's
   * order from then on. Where the slider holds one value, such a thumb is that value's.
   */
  thumb(at: number | string): Part
  /** The input inside a thumb, hidden: it is what a form reads. */
  thumbInput(at: number | string): Part
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
export function createSlider<Value extends SliderValue = SliderValue>(
  typed: ReadonlySignal<SliderProps<Value>>,
  around: { field?: Field | undefined } & DirectionAround = {}
): Slider {
  // Whatever the caller's type, what is told is shaped as what was given (`shaped`).
  const props = typed as unknown as ReadonlySignal<SliderProps>
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
  // What a form's reset goes back to: the value the slider began with.
  const initial = value.peek()
  const inForm = createFormControl((event) => {
    const why = by("form-reset", 0, event)
    if (!sameList(value.peek(), initial)) {
      props.peek().onValueChange?.(typeof initial === "number" ? initial : [...initial], why)
      if (!why.canceled) {
        latest = undefined
        value.set(initial, why)
      }
    }
    // What was asked for, not what is read back: a caller who holds the value gives it back
    // in their framework's time.
    const next = why.canceled ? value.peek() : initial
    member?.reset((typeof next === "number" ? [next] : next).join(","))
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const orientation = computed(() => props.get().orientation ?? "horizontal")
  const dragging = signal<number | null>(null)
  // What a thumb is centred by depends on the reading direction: the provider's, which a server
  // knows too, or read where the control is once it is in the page.
  const measured = signal(false)
  const rtl = computed(() => (around.direction ? around.direction.get() === "rtl" : measured.get()))

  // Each thumb's element, by what the thumb was asked for with: its index, or its key.
  const thumbs = new Map<number | string, HTMLElement>()
  // The thumbs in the order they were first asked for, which is the order a server writes
  // them in. Never a signal: a thumb is added while its framework renders.
  const asked: (number | string)[] = []
  // Bumped when a thumb's element comes or goes: the thumbs' places are read again.
  const drawn = signal(0)
  let stopDrag: (() => void) | undefined

  /**
   * How many thumbs are written before this one. In the page, the thumbs whose elements come
   * before its own; until it is, the thumbs in the page and those asked for before it.
   */
  function place(at: number | string): number {
    drawn.get()
    const own = thumbs.get(at)
    let before = 0
    let passed = false
    for (const each of asked) {
      if (each === at) {
        passed = true
        continue
      }
      const other = thumbs.get(each)
      if (own) {
        if (other && own.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING) before++
      } else if (other || !passed) before++
    }
    return before
  }

  // With thumbs that stay inside the control, a thumb's centre travels less than the
  // control's length: by its own size. Both are measured, along the way the track runs.
  const inset = computed(() => (props.get().thumbAlignment ?? "center") !== "center")
  const sizes = signal<{ control: number; thumbs: readonly number[] } | undefined>(
    undefined,
    (a, b) =>
      a === b ||
      (a !== undefined &&
        b !== undefined &&
        a.control === b.control &&
        sameList(a.thumbs, b.thumbs))
  )
  let controlElement: HTMLElement | undefined
  let observer: ResizeObserver | undefined

  function measure() {
    if (!controlElement || !inset.peek()) return sizes.set(undefined)
    const side = orientation.peek() === "vertical" ? "height" : "width"
    const list: number[] = []
    // To a thousandth of a pixel: WebKit's box has a seventh digit that changes with where
    // the page is scrolled, and the share written from it would change with it.
    const length = (element: HTMLElement) =>
      Math.round(element.getBoundingClientRect()[side] * 1000) / 1000
    for (const [at, element] of thumbs) list[indexOf(at)] = length(element)
    sizes.set({ control: length(controlElement), thumbs: list })
  }

  /** Measures when an element of the slider changes size, while it is in the page. */
  function watch(element: HTMLElement): () => void {
    if (typeof ResizeObserver === "undefined") return NOTHING
    observer ??= new ResizeObserver(measure)
    observer.observe(element)
    return () => observer?.unobserve(element)
  }

  /**
   * Where a thumb's centre is, as a share of the control, when it stays inside: `undefined`
   * until it has been measured.
   */
  function centre(percent: number, index: number): number | undefined {
    const known = sizes.get()
    const thumb = known?.thumbs[index]
    if (!known || thumb === undefined || known.control === 0) return undefined
    return ((thumb / 2 + ((known.control - thumb) * percent) / 100) / known.control) * 100
  }

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
    "data-readonly": flag(readOnly.get()),
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
    if (disabled.peek() || readOnly.peek()) return false
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
    // Thumbs that stay inside travel the control's length less a thumb, from half a thumb in.
    const thumb = sizes.peek()?.thumbs.find((each) => each !== undefined) ?? 0
    let along: number
    if (orientation.peek() === "vertical") {
      const length = box.height - thumb
      along = length <= 0 ? 0 : 1 - (event.clientY - offset - box.top - thumb / 2) / length
    } else {
      const length = box.width - thumb
      along = length <= 0 ? 0 : (event.clientX - offset - box.left - thumb / 2) / length
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
    const pressed = [...thumbs].find(([, element]) => element.contains(target))
    let index: number
    let offset = 0
    if (readOnly.peek()) {
      // Nothing moves and nothing is dragged: the thumb pressed, or the one nearest, takes focus.
      event.preventDefault()
      const at = pressed ? indexOf(pressed[0]) : nearest(valueAt(event, control, 0))
      return (pressed?.[1] ?? elementAt(at))?.focus({ preventScroll: true })
    }
    if (!pressed) {
      const at = valueAt(event, control, 0)
      index = nearest(at)
      setValue(index, at, by("track-press", index, event))
    } else {
      index = indexOf(pressed[0])
      // Held by its edge, a thumb keeps that edge under the pointer.
      const box = pressed[1].getBoundingClientRect()
      offset =
        orientation.peek() === "vertical"
          ? event.clientY - (box.top + box.height / 2)
          : event.clientX - (box.left + box.width / 2)
    }
    // No text is selected by the drag, and focus goes where it is put.
    event.preventDefault()
    ;(pressed?.[1] ?? elementAt(index))?.focus({ preventScroll: true })

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
    if (disabled.peek() || readOnly.peek()) return
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

  interface Thumb {
    readonly index: ReadonlySignal<number>
    readonly part: Part
    readonly input: Part
  }
  const made = new Map<number | string, Thumb>()
  const indexOf = (at: number | string) => one(at).index.peek()
  const elementAt = (index: number) => {
    for (const [at, element] of thumbs) if (indexOf(at) === index) return element
    return undefined
  }

  /** A thumb and its input: asked for again by the same index or key, the same. */
  function one(at: number | string): Thumb {
    const found = made.get(at)
    if (found) return found
    asked.push(at)
    // A thumb given an index keeps it. Where there is one value, a thumb with none is its.
    const index = computed(() =>
      typeof at === "number" ? at : values.get().length > 1 ? place(at) : 0
    )
    const thumb: Thumb = {
      index,
      part: {
        props: computed(() => {
          const { min, max } = range.get()
          const nth = index.get()
          const current = values.get()[nth] ?? min
          const vertical = orientation.get() === "vertical"
          const { format, getAriaValueText } = props.get()
          const written = getAriaValueText || format ? write(current) : undefined
          const percent = share(current)
          const inside = inset.get()
          const centred = inside ? centre(percent, nth) : undefined
          // Its centre at its value's share of the control. A thumb that stays inside is
          // moved back by that share of its own size, which CSS knows without measuring;
          // once it is measured, its centre is written as Base UI writes it.
          const back = inside && centred === undefined ? percent : 50
          const where = centred === undefined ? `${percent}%` : "var(--position)"
          const style: PartStyle = vertical
            ? { position: "absolute", bottom: where, left: "50%", translate: `-50% ${back}%` }
            : {
                position: "absolute",
                "inset-inline-start": where,
                top: "50%",
                translate: `${rtl.get() ? back : -back}% -50%`,
              }
          if (centred !== undefined) style["--position"] = `${centred}%`
          return {
            role: "slider",
            tabindex: disabled.get() ? "-1" : "0",
            "aria-valuemin": String(min),
            "aria-valuemax": String(max),
            "aria-valuenow": String(current),
            "aria-valuetext": getAriaValueText?.(written!, current, nth) ?? written,
            "aria-orientation": orientation.get(),
            "aria-disabled": disabled.get() ? "true" : undefined,
            "aria-readonly": readOnly.get() ? "true" : undefined,
            ...field?.aria(),
            "data-index": String(nth),
            ...state(),
            style,
            onKeyDown: (event: KeyboardEvent) => key(index.peek(), event),
          }
        }),
        attach(element) {
          // Asked for again once it had left: it is one of the thumbs again.
          if (!asked.includes(at)) asked.push(at)
          made.set(at, thumb)
          thumbs.set(at, element)
          drawn.set(drawn.peek() + 1)
          const unwatch = watch(element)
          measure()
          return () => {
            unwatch()
            if (thumbs.get(at) !== element) return
            // Gone: the thumbs written after it each move up a place.
            thumbs.delete(at)
            const asAsked = asked.indexOf(at)
            if (asAsked >= 0) asked.splice(asAsked, 1)
            if (made.get(at) === thumb) made.delete(at)
            drawn.set(drawn.peek() + 1)
            measure()
          }
        },
      },
      input: {
        props: computed(() => ({
          type: "hidden",
          name: props.get().name ?? field?.name.get(),
          form: props.get().form,
          value: String(values.get()[index.get()] ?? range.get().min),
          disabled: flag(disabled.get()),
        })),
        attach: (element) => inForm.attach(element),
      },
    }
    made.set(at, thumb)
    return thumb
  }

  return {
    values,
    text,
    dragging,
    setValue,
    mount: () => () => stopDrag?.(),
    root: {
      props: computed(() => ({
        role: "group",
        // In a field, the id its label is `for`.
        id: field?.controlId,
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
          focus: () => elementAt(0)?.focus(),
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
        controlElement = element
        const unwatch = watch(element)
        // And when the thumbs are asked to stay inside, or the track is turned.
        const stop = effect(() => {
          inset.get()
          orientation.get()
          untracked(measure)
        })
        return () => {
          stop()
          unwatch()
          if (controlElement === element) controlElement = undefined
          stopDrag?.()
        }
      },
    },
    track: { props: computed(state), attach: () => NOTHING },
    indicator: {
      props: computed(() => {
        const list = values.get()
        const last = list.length - 1
        // The value as a length, which a server can write. With thumbs that stay inside it
        // ends at a thumb's centre, which is measured: until then, the value's share, which
        // is under the thumb wherever the thumb is.
        const at = (index: number) =>
          (inset.get() ? centre(share(list[index]!), index) : undefined) ?? share(list[index]!)
        const start = list.length > 1 ? at(0) : 0
        const end = list.length > 0 ? at(last) : 0
        const sized = inset.get() && sizes.get() !== undefined
        const from = sized && list.length > 1 ? "var(--start-position)" : `${start}%`
        const length = !sized
          ? `${end - start}%`
          : list.length > 1
            ? "var(--relative-size)"
            : "var(--start-position)"
        const style: PartStyle =
          orientation.get() === "vertical"
            ? { position: "absolute", bottom: from, height: length, width: "inherit" }
            : { position: "relative", "inset-inline-start": from, width: length, height: "inherit" }
        if (sized) {
          style["--start-position"] = `${list.length > 1 ? start : end}%`
          if (list.length > 1) style["--relative-size"] = `${end - start}%`
        }
        return { ...state(), style }
      }),
      attach: () => NOTHING,
    },
    thumb: (at) => one(at).part,
    thumbInput: (at) => one(at).input,
  }
}
