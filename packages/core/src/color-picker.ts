import { bindable } from "./bindable.ts"
import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import type { Field, FieldMembership } from "./field.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part, PartStyle } from "./part.ts"
import { batch, computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import {
  COLOR_FORMATS,
  cssColor,
  formatColor,
  hslToHsv,
  hsvToHsl,
  hsvToRgb,
  hueColor,
  namesHue,
  parseColor,
  rgbToHsv,
  sameColor,
} from "./services/color.ts"
import type { ColorFormat, Hsva } from "./services/color.ts"
import { createFormControl } from "./services/form-control.ts"
import type { Orientation } from "./services/roving.ts"

export type { ColorFormat, Hsva } from "./services/color.ts"

/** A channel a slider of the picker moves: the hue, or the alpha. */
export type ColorPickerSliderChannel = "hue" | "alpha"

/** A channel an input of the picker is typed in. */
export type ColorPickerInputChannel =
  | "hex"
  | "red"
  | "green"
  | "blue"
  | "hue"
  | "saturation"
  | "lightness"
  | "alpha"

/** What a thumb of the picker moves: the area's, or a slider's channel. */
export type ColorPickerThumb = "area" | ColorPickerSliderChannel

export interface ColorPickerProps {
  id?: string | undefined
  /** The colour as text in `format`, when the caller holds it. Any format is read. */
  value?: string | undefined
  /** Read once. Default `#000000`. */
  defaultValue?: string | undefined
  /** Each step of a drag, each key, each colour typed or chosen: refusable. */
  onValueChange?: ((value: string, details: ChangeDetails) => void) | undefined
  /** When the pointer lets go, after each key, when a typed channel is left: the value to save. */
  onValueCommitted?: ((value: string, details: ChangeDetails) => void) | undefined
  /** How the value is written, when the caller holds it. */
  format?: ColorFormat | undefined
  /** Read once. Default `"hex"`. */
  defaultFormat?: ColorFormat | undefined
  /** When the format trigger goes to the next format: refusable. */
  onFormatChange?: ((format: ColorFormat, details: ChangeDetails) => void) | undefined
  /**
   * Whether the opacity can be chosen. With it, the value always carries its alpha
   * (`#rrggbbaa`, `rgba()`, `hsla()`); without it, never. Default false.
   */
  alpha?: boolean | undefined
  /**
   * Where a thumb is at the ends of its range. `"center"` (the default): its centre on the
   * edge, so half of it lies outside. `"edge"`: its edge on the edge, so it stays inside.
   */
  thumbAlignment?: "center" | "edge" | undefined
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable; still submitted with the form. */
  readOnly?: boolean | undefined
  /** Needed by the form. A colour always has a value, so this only says so. */
  required?: boolean | undefined
  /** With a name, the value is submitted with the form around the picker. */
  name?: string | undefined
  /** The id of the form the picker belongs to, when it is not inside it. */
  form?: string | undefined
  /** What assistive technology reads for a thumb, when the written one is not enough. */
  getAriaValueText?: ((text: string, thumb: ColorPickerThumb, color: Hsva) => string) | undefined
}

export interface ColorPicker {
  /** The value as the caller holds it, or as the picker does. */
  readonly value: ReadonlySignal<string>
  /** The colour the picker holds: hue, saturation, brightness and alpha. */
  readonly color: ReadonlySignal<Hsva>
  /** The colour written in the current format: what the value text and the form say. */
  readonly text: ReadonlySignal<string>
  readonly format: ReadonlySignal<ColorFormat>
  /** The thumb a pointer holds; `null` when none does. */
  readonly dragging: ReadonlySignal<ColorPickerThumb | null>
  /** Whether the browser can pick a colour from the screen. Known once the trigger is in the page. */
  readonly eyeDropperSupported: ReadonlySignal<boolean>
  /** Sets the colour, from its text or its numbers. Says whether the value changed. */
  setColor(next: string | Hsva, details: ChangeDetails): boolean
  mount(): () => void
  readonly root: Part
  /** The two-dimensional field: saturation across, brightness up. */
  readonly area: Part
  /** The area's thumb: a slider in two dimensions. */
  readonly areaThumb: Part
  /** What a pointer presses and drags on to move a channel: it holds the track and the thumb. */
  channelSlider(channel: ColorPickerSliderChannel, orientation?: Orientation): Part
  channelSliderTrack(channel: ColorPickerSliderChannel, orientation?: Orientation): Part
  channelSliderThumb(channel: ColorPickerSliderChannel, orientation?: Orientation): Part
  /** A text input for one channel, or the whole colour in hex. */
  channelInput(channel: ColorPickerInputChannel): Part
  /** Shows the current colour. */
  readonly swatch: Part
  /** A preset: pressed, the colour is this one. */
  swatchTrigger(value: string): Part
  /** Picks a colour from the screen, where the browser can. Hidden where it cannot. */
  readonly eyeDropperTrigger: Part
  /** Where the colour is written: the adapter draws `text` in it. */
  readonly valueText: Part
  /** Goes to the next format: hex, then rgb, then hsl. */
  readonly formatTrigger: Part
  /** The hidden input that submits the value. */
  readonly input: Part
}

const NOTHING = () => {}
const BLACK: Hsva = { h: 0, s: 0, v: 0, a: 1 }
/** What an arrow moves a thumb by, and what Shift and Page Up and Down move it by. */
const STEP = 1
const LARGE = 10

const sameHsva = (a: Hsva, b: Hsva) => a.h === b.h && a.s === b.s && a.v === b.v && a.a === b.a
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
/** On a whole step, so a dragged colour is one its text can say again. */
const snap = (value: number, low: number, high: number) => clamp(Math.round(value), low, high)
/** A share as a style writes it: no long tail of float digits. */
const percent = (value: number) => `${Number(value.toFixed(4))}%`

/** The highest value of a slider's channel: degrees for the hue, a percentage for the alpha. */
const most = (channel: ColorPickerSliderChannel) => (channel === "hue" ? 360 : 100)
/** A slider's channel as a number in its range. */
const along = (channel: ColorPickerSliderChannel, color: Hsva) =>
  channel === "hue" ? color.h : color.a * 100

interface EyeDropperLike {
  open(): Promise<{ sRGBHex: string }>
}

/**
 * A colour chosen in place: an area for saturation and brightness, sliders for the hue and the
 * alpha, inputs for each channel, presets, the browser's eye dropper. It holds the colour as
 * hue, saturation, brightness and alpha, so a hue survives grey and black, and tells it as
 * text in its format. A page that wants it in a popup puts it in a Popover.
 */
export function createColorPicker(
  props: ReadonlySignal<ColorPickerProps>,
  around: { field?: Field | undefined } & DirectionAround = {}
): ColorPicker {
  const { field } = around
  let member: FieldMembership | undefined

  const value = bindable<string>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? "#000000",
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const format = bindable<ColorFormat>({
    value: () => props.get().format,
    defaultValue: props.peek().defaultFormat ?? "hex",
    onChange: (next, by) => props.peek().onFormatChange?.(next, by),
  })
  const alphaOn = computed(() => Boolean(props.get().alpha))
  const opaque = (color: Hsva): Hsva => (alphaOn.peek() ? color : { ...color, a: 1 })

  // The colour as the picker last set it, with the hue and saturation its text cannot hold.
  const held = signal<Hsva>(parseColor(value.peek()) ?? BLACK, sameHsva)
  const color = computed(() => {
    const keep = held.get()
    const given = value.get()
    const on = alphaOn.get()
    let next = keep
    // The text the picker wrote is the colour it holds; another is read, keeping what grey
    // and black cannot say.
    if (given !== formatColor(keep, format.get(), on)) {
      const parsed = parseColor(given, keep)
      if (parsed && (namesHue(given) || !sameColor(parsed, keep))) next = parsed
    }
    return on ? next : { ...next, a: 1 }
  }, sameHsva)
  const text = computed(() => formatColor(color.get(), format.get(), alphaOn.get()))

  // What a form's reset goes back to: the colour the picker began with.
  const initialColor = held.peek()
  const inForm = createFormControl((event) => {
    const why = details("form-reset", event)
    // The colour it began with, written in the format it is in now.
    const back = formatColor(initialColor, format.peek(), alphaOn.peek())
    value.set(back, why)
    if (!why.canceled) {
      held.set(initialColor)
      latest = undefined
      pending = undefined
    }
    // The browser puts each channel input back to its default next: the default is what it
    // should say.
    const now = why.canceled ? color.peek() : opaque(initialColor)
    batch(() => {
      for (const each of inputs.values()) each.reset(now)
    })
    // What was asked for, not what is read back: a caller who holds the value gives it back
    // in their framework's time.
    member?.reset(why.canceled ? text.peek() : back)
  })
  const disabled = computed(
    () => Boolean(props.get().disabled) || Boolean(field?.disabled.get()) || inForm.disabled.get()
  )
  const readOnly = computed(() => Boolean(props.get().readOnly))
  const locked = () => disabled.peek() || readOnly.peek()
  const inset = computed(() => props.get().thumbAlignment === "edge")
  const dragging = signal<ColorPickerThumb | null>(null)
  const supported = signal(false)
  // The provider's direction, which a server knows too, or read where the picker is once it
  // is in the page.
  const measured = signal(false)
  const rtl = computed(() => (around.direction ? around.direction.get() === "rtl" : measured.get()))

  // The value and the colour last asked for in a gesture. A caller who holds the value gives
  // it back in their framework's time, so what is moved from and committed is this.
  let latest: string | undefined
  let pending: Hsva | undefined
  const current = () => pending ?? color.peek()

  /** Sets the colour; says whether the value changed. A hue moved on grey changes no value. */
  function change(next: Hsva, by: ChangeDetails): boolean {
    if (locked()) return false
    const fixed = opaque(next)
    const written = formatColor(fixed, format.peek(), alphaOn.peek())
    if (written === (latest ?? text.peek())) {
      pending = fixed
      held.set(fixed)
      return false
    }
    value.set(written, by)
    if (by.canceled) return false
    latest = written
    pending = fixed
    held.set(fixed)
    member?.changed(written)
    return true
  }

  function commit(reason: string, event?: Event) {
    props.peek().onValueCommitted?.(latest ?? text.peek(), details(reason, event))
    // From here the value is the caller's again, or the picker's own.
    latest = undefined
    pending = undefined
  }

  function setColor(next: string | Hsva, by: ChangeDetails): boolean {
    const parsed = typeof next === "string" ? parseColor(next, current()) : next
    if (!parsed) return false
    const moved = change(parsed, by)
    latest = undefined
    pending = undefined
    return moved
  }

  const state = () => ({
    ...field?.state(),
    "data-disabled": flag(disabled.get()),
    "data-readonly": flag(readOnly.get()),
    "data-required": flag(props.get().required),
    "data-dragging": flag(dragging.get() !== null),
  })

  const ariaText = (written: string, thumb: ColorPickerThumb) =>
    props.get().getAriaValueText?.(written, thumb, color.get()) ?? written

  // The elements a press is read against.
  let areaElement: HTMLElement | undefined
  let areaThumbElement: HTMLElement | undefined
  const sliderElements = new Map<string, HTMLElement>()
  const trackElements = new Map<string, HTMLElement>()
  const thumbElements = new Map<string, HTMLElement>()
  let stopDrag: (() => void) | undefined

  /** How a press on a field of the picker is read, and what it sets. */
  interface Surface {
    readonly thumb: ColorPickerThumb
    /** What the pointer is read against: where the thumb travels. */
    readonly box: HTMLElement
    readonly thumbElement: HTMLElement | undefined
    /** Which ways it is read: across, up, or both. */
    readonly axes: "both" | Orientation
    /** The colour at a place, each share from 0 to 1, across and up. */
    at(x: number, y: number): Hsva
  }

  /** Where a pointer is on a surface, less how far from its thumb's centre it took hold. */
  function shares(event: PointerEvent, surface: Surface, offset: { x: number; y: number }) {
    const box = surface.box.getBoundingClientRect()
    // Thumbs that stay inside travel the length less a thumb, from half a thumb in.
    const thumb =
      inset.peek() && surface.thumbElement
        ? surface.thumbElement.getBoundingClientRect()
        : { width: 0, height: 0 }
    const width = box.width - thumb.width
    const height = box.height - thumb.height
    let x = width <= 0 ? 0 : (event.clientX - offset.x - box.left - thumb.width / 2) / width
    const y = height <= 0 ? 0 : 1 - (event.clientY - offset.y - box.top - thumb.height / 2) / height
    if (rtl.peek()) x = 1 - x
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) }
  }

  function press(event: PointerEvent, surface: Surface | undefined) {
    if (!surface || disabled.peek() || event.button !== 0) return
    const thumb = surface.thumbElement
    const onThumb = Boolean(thumb?.contains(event.target as Node))
    // No text is selected by the drag, and focus goes to the thumb.
    event.preventDefault()
    thumb?.focus({ preventScroll: true })
    // Read only: the thumb takes focus, and nothing moves.
    if (readOnly.peek()) return
    let offset = { x: 0, y: 0 }
    if (onThumb && thumb) {
      // Held by its edge, a thumb keeps that edge under the pointer.
      const box = thumb.getBoundingClientRect()
      offset = {
        x: surface.axes === "vertical" ? 0 : event.clientX - (box.left + box.width / 2),
        y: surface.axes === "horizontal" ? 0 : event.clientY - (box.top + box.height / 2),
      }
    } else {
      const { x, y } = shares(event, surface, offset)
      change(
        surface.at(x, y),
        details(surface.thumb === "area" ? "area-press" : "track-press", event)
      )
    }
    const page = surface.box.ownerDocument
    const move = (next: PointerEvent) => {
      const { x, y } = shares(next, surface, offset)
      change(surface.at(x, y), details("drag", next))
    }
    const end = (last: Event) => {
      stopDrag?.()
      commit("commit", last)
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
    dragging.set(surface.thumb)
  }

  /** Moves by a key, and commits what moved. The key is the picker's whether or not it moved. */
  function keyed(event: KeyboardEvent, next: Hsva | undefined) {
    if (!next) return
    event.preventDefault()
    if (change(next, details("keyboard", event))) commit("keyboard", event)
    else {
      latest = undefined
      pending = undefined
    }
  }

  function areaKey(event: KeyboardEvent) {
    if (locked()) return
    const now = current()
    const by = event.shiftKey ? LARGE : STEP
    const forward = rtl.peek() ? "ArrowLeft" : "ArrowRight"
    const back = rtl.peek() ? "ArrowRight" : "ArrowLeft"
    const across = (s: number) => ({ ...now, s: snap(s, 0, 100) })
    const up = (v: number) => ({ ...now, v: snap(v, 0, 100) })
    const moves: Record<string, () => Hsva> = {
      [forward]: () => across(now.s + by),
      [back]: () => across(now.s - by),
      ArrowUp: () => up(now.v + by),
      ArrowDown: () => up(now.v - by),
      PageUp: () => up(now.v + LARGE),
      PageDown: () => up(now.v - LARGE),
      Home: () => across(0),
      End: () => across(100),
    }
    keyed(event, moves[event.key]?.())
  }

  /** A slider's channel set to `to`, in its range. */
  const withChannel = (channel: ColorPickerSliderChannel, now: Hsva, to: number): Hsva =>
    channel === "hue" ? { ...now, h: snap(to, 0, 360) } : { ...now, a: snap(to, 0, 100) / 100 }

  function sliderKey(
    channel: ColorPickerSliderChannel,
    orientation: Orientation,
    event: KeyboardEvent
  ) {
    if (locked()) return
    const now = current()
    const at = along(channel, now)
    const by = event.shiftKey ? LARGE : STEP
    // Left and right follow the reading direction; up is more either way the track runs.
    const forward = rtl.peek() ? "ArrowLeft" : "ArrowRight"
    const back = rtl.peek() ? "ArrowRight" : "ArrowLeft"
    let to: number | undefined
    if (event.key === "ArrowUp" || (orientation === "horizontal" && event.key === forward))
      to = at + by
    else if (event.key === "ArrowDown" || (orientation === "horizontal" && event.key === back))
      to = at - by
    else if (event.key === "PageUp") to = at + LARGE
    else if (event.key === "PageDown") to = at - LARGE
    else if (event.key === "Home") to = 0
    else if (event.key === "End") to = most(channel)
    keyed(event, to === undefined ? undefined : withChannel(channel, now, to))
  }

  /**
   * A thumb's place, written whole so a server draws it: its centre at its share, or with
   * thumbs that stay inside, moved back by that share of its own size, which CSS knows
   * without measuring.
   */
  function place(x: number | undefined, y: number | undefined): PartStyle {
    const inside = inset.get()
    const backX = x === undefined ? 50 : inside ? x : 50
    const backY = y === undefined ? 50 : inside ? y : 50
    const style: PartStyle = { position: "absolute" }
    if (x === undefined) style.left = "50%"
    else style["inset-inline-start"] = percent(x)
    if (y === undefined) style.top = "50%"
    else style.bottom = percent(y)
    const tx = x === undefined || !rtl.get() ? -backX : backX
    // Up from the bottom: moved back down by its share.
    const ty = y === undefined ? -backY : backY
    style.translate = `${tx}% ${ty}%`
    return style
  }

  // Each slider's parts, by channel and orientation.
  const sliders = new Map<string, { root: Part; track: Part; thumb: Part }>()

  function slider(channel: ColorPickerSliderChannel, orientation: Orientation = "horizontal") {
    const key = `${channel}:${orientation}`
    const found = sliders.get(key)
    if (found) return found
    const own = () => ({
      ...state(),
      "data-channel": channel,
      "data-orientation": orientation,
    })
    const surface = (): Surface | undefined => {
      const root = sliderElements.get(key)
      if (!root) return undefined
      const track = trackElements.get(key)
      const thumb = thumbElements.get(key)
      return {
        thumb: channel,
        box: track && root.contains(track) ? track : root,
        thumbElement: thumb,
        axes: orientation,
        at: (x, y) =>
          withChannel(channel, current(), (orientation === "vertical" ? y : x) * most(channel)),
      }
    }
    const made = {
      root: {
        props: computed(() => ({
          ...own(),
          "data-dragging": flag(dragging.get() === channel),
          // A finger on the slider drags the thumb, not the page.
          style: { "touch-action": "none" },
          onPointerDown: (event: PointerEvent) => press(event, surface()),
        })),
        attach(element: HTMLElement) {
          measured.set(directionOf(element) === "rtl")
          sliderElements.set(key, element)
          return () => {
            if (sliderElements.get(key) === element) sliderElements.delete(key)
            if (dragging.peek() === channel) stopDrag?.()
          }
        },
      },
      track: {
        props: computed(() => {
          const now = color.get()
          return {
            ...own(),
            "data-dragging": flag(dragging.get() === channel),
            // What a design paints the track with: the colour without its alpha, and its hue.
            style: { "--color": cssColor(now, true), "--hue-color": hueColor(now.h) },
          }
        }),
        attach(element: HTMLElement) {
          trackElements.set(key, element)
          return () => {
            if (trackElements.get(key) === element) trackElements.delete(key)
          }
        },
      },
      thumb: {
        props: computed(() => {
          const now = color.get()
          const at = along(channel, now)
          const shown = Math.round(at)
          const written = channel === "hue" ? `${shown}°` : `${shown}%`
          const share = (at / most(channel)) * 100
          return {
            role: "slider",
            tabindex: disabled.get() ? "-1" : "0",
            "aria-valuemin": "0",
            "aria-valuemax": String(most(channel)),
            "aria-valuenow": String(shown),
            "aria-valuetext": ariaText(written, channel),
            "aria-orientation": orientation,
            "aria-disabled": disabled.get() ? "true" : undefined,
            "aria-readonly": readOnly.get() ? "true" : undefined,
            ...field?.aria(),
            ...own(),
            "data-dragging": flag(dragging.get() === channel),
            style: {
              ...(orientation === "vertical" ? place(undefined, share) : place(share, undefined)),
              // The colour under the thumb: the pure hue, or the colour at this alpha.
              "--color": channel === "hue" ? hueColor(now.h) : cssColor(now),
            },
            onKeyDown: (event: KeyboardEvent) => sliderKey(channel, orientation, event),
          }
        }),
        attach(element: HTMLElement) {
          thumbElements.set(key, element)
          return () => {
            if (thumbElements.get(key) === element) thumbElements.delete(key)
          }
        },
      },
    }
    sliders.set(key, made)
    return made
  }

  /** A channel of the colour as an input writes it. */
  function readChannel(channel: ColorPickerInputChannel, now: Hsva): string {
    if (channel === "hex") return formatColor(now, "hex", alphaOn.get())
    if (channel === "hue") return String(Math.round(now.h))
    if (channel === "alpha") return String(Math.round(now.a * 100))
    if (channel === "saturation" || channel === "lightness") {
      const hsl = hsvToHsl(now)
      return String(Math.round(channel === "saturation" ? hsl.s : hsl.l))
    }
    const rgb = hsvToRgb(now)
    return String(Math.round(channel === "red" ? rgb.r : channel === "green" ? rgb.g : rgb.b))
  }

  const RANGES: Record<Exclude<ColorPickerInputChannel, "hex">, number> = {
    red: 255,
    green: 255,
    blue: 255,
    hue: 360,
    saturation: 100,
    lightness: 100,
    alpha: 100,
  }

  /** The colour with a channel as typed, or `null` when what is typed is not one. */
  function takeChannel(channel: ColorPickerInputChannel, typed: string, now: Hsva): Hsva | null {
    const plain = typed.trim()
    if (channel === "hex") {
      const digits = plain.startsWith("#") ? plain : `#${plain}`
      return /^#[0-9a-f]+$/i.test(digits) ? parseColor(digits, now) : null
    }
    // A number, with the unit its channel is written in, or none.
    const found = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(%|°|deg)?$/i.exec(plain)
    if (!found) return null
    const number = Number(found[1])
    if (!(number >= 0 && number <= RANGES[channel])) return null
    if (channel === "hue") return { ...now, h: number }
    if (channel === "alpha") return { ...now, a: number / 100 }
    if (channel === "saturation" || channel === "lightness") {
      const hsl = hsvToHsl(now)
      return hslToHsv(channel === "saturation" ? { ...hsl, s: number } : { ...hsl, l: number }, now)
    }
    const rgb = hsvToRgb(now)
    const next =
      channel === "red"
        ? { ...rgb, r: number }
        : channel === "green"
          ? { ...rgb, g: number }
          : { ...rgb, b: number }
    return rgbToHsv(next, now)
  }

  interface ChannelInput {
    /** Its form was reset: what is typed is dropped, and the input says the channel of `now`. */
    reset(now: Hsva): void
    readonly part: Part
  }
  const inputs = new Map<ColorPickerInputChannel, ChannelInput>()

  function channelInput(channel: ColorPickerInputChannel): ChannelInput {
    const found = inputs.get(channel)
    if (found) return found
    const typed = signal<string | null>(null)
    const shown = computed(() => typed.get() ?? readChannel(channel, color.get()))
    // The value when focus came in: leaving with another commits it.
    let before: string | undefined

    /** Takes what is typed, or puts the channel back, and commits a change since focus came. */
    function settle(reason: string, event: Event) {
      const was = typed.peek()
      if (was === null) return
      const taken = takeChannel(channel, was, current())
      if (taken) change(taken, details(reason, event))
      typed.set(null)
      const now = latest ?? text.peek()
      if (before !== undefined && now !== before) {
        commit(reason, event)
        before = now
      } else {
        latest = undefined
        pending = undefined
      }
    }

    let element: HTMLInputElement | undefined
    const made: ChannelInput = {
      reset(now) {
        typed.set(null)
        if (element) element.defaultValue = readChannel(channel, now)
      },
      part: {
        props: computed(() => ({
          type: "text",
          // What it says, so a server draws it. In a page the core writes it too: a framework
          // writes in its own time, after what was typed since.
          value: shown.get(),
          inputmode: channel === "hex" ? "text" : "numeric",
          autocomplete: "off",
          spellcheck: "false",
          form: props.get().form,
          disabled: flag(disabled.get()),
          readonly: flag(readOnly.get()),
          ...state(),
          "data-channel": channel,
          onFocus() {
            before = text.peek()
          },
          onBlur(event: FocusEvent) {
            if (!locked()) settle("input-blur", event)
            else typed.set(null)
          },
          onInput(event: Event) {
            if (locked()) return
            const raw = (event.currentTarget as HTMLInputElement).value
            typed.set(raw)
            const taken = takeChannel(channel, raw, current())
            if (taken) change(taken, details("input-change", event))
          },
          onKeyDown(event: KeyboardEvent) {
            if (locked() || event.isComposing) return
            if (event.key === "Enter") return settle("input-commit", event)
            if (event.key === "Escape" && typed.peek() !== null) {
              typed.set(null)
              return
            }
            if (channel === "hex" || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return
            // The caret stays where it is; the channel steps from what it says.
            event.preventDefault()
            const now = current()
            const from = Number(typed.peek() ?? readChannel(channel, now))
            const by = (event.shiftKey ? LARGE : STEP) * (event.key === "ArrowUp" ? 1 : -1)
            const to = clamp(
              Math.round((Number.isFinite(from) ? from : 0) + by),
              0,
              RANGES[channel]
            )
            typed.set(null)
            const next = takeChannel(channel, String(to), now)
            if (next && change(next, details("keyboard", event))) commit("keyboard", event)
            else {
              latest = undefined
              pending = undefined
            }
          },
        })),
        attach(attached) {
          element = attached as HTMLInputElement
          // Heard by the form too: its reset, and a `<fieldset disabled>` around it.
          const leave = inForm.attach(attached)
          // The input's text is the core's to write: a framework that held it would write it
          // in its own time, after what was typed since.
          const stop = effect(() => {
            const said = shown.get()
            if (element && element.value !== said) element.value = said
          })
          return () => {
            stop()
            leave()
            if (element === attached) element = undefined
          }
        },
      },
    }
    inputs.set(channel, made)
    return made
  }

  const swatches = new Map<string, Part>()

  function swatchTrigger(preset: string): Part {
    const found = swatches.get(preset)
    if (found) return found
    const part: Part = {
      props: computed(() => {
        const own = parseColor(preset)
        const now = color.get()
        const chosen = own !== null && sameColor(opaque(own), now)
        return {
          type: "button",
          "aria-pressed": chosen ? "true" : "false",
          disabled: flag(disabled.get()),
          "aria-disabled": readOnly.get() ? "true" : undefined,
          ...state(),
          "data-selected": flag(chosen),
          style: { "--color": own ? cssColor(own) : "transparent" },
          onClick(event: MouseEvent) {
            if (locked() || !own) return
            if (change(own, details("swatch-press", event))) commit("swatch-press", event)
            else {
              latest = undefined
              pending = undefined
            }
          },
        }
      }),
      attach: () => NOTHING,
    }
    swatches.set(preset, part)
    return part
  }

  let eyeDropperView: (Window & { EyeDropper?: new () => EyeDropperLike }) | undefined

  async function pickFromScreen(event: MouseEvent) {
    const Dropper = eyeDropperView?.EyeDropper
    if (locked() || !Dropper) return
    let picked: string
    try {
      // Refused by the reader (Escape), or by the browser: nothing changes.
      picked = (await new Dropper().open()).sRGBHex
    } catch {
      return
    }
    const parsed = parseColor(picked, current())
    if (!parsed || locked()) return
    if (change(parsed, details("eye-dropper", event))) commit("eye-dropper", event)
    else {
      latest = undefined
      pending = undefined
    }
  }

  const areaSurface = (): Surface | undefined =>
    areaElement && {
      thumb: "area",
      box: areaElement,
      thumbElement: areaThumbElement,
      axes: "both",
      at: (x, y) => ({ ...current(), s: snap(x * 100, 0, 100), v: snap(y * 100, 0, 100) }),
    }

  return {
    value,
    color,
    text,
    format,
    dragging,
    eyeDropperSupported: supported,
    setColor,
    mount: () => () => stopDrag?.(),
    root: {
      props: computed(() => ({
        role: "group",
        // In a field, the id its label is `for`.
        id: field?.controlId,
        ...state(),
        "data-format": format.get(),
        // The colour, for anything inside to paint with.
        style: { "--color": cssColor(color.get()) },
        onFocus: () => member?.focused(true),
        onBlur(event: FocusEvent) {
          const to = event.relatedTarget as Node | null
          if (!(event.currentTarget as HTMLElement).contains(to)) member?.focused(false)
        },
      })),
      attach(element) {
        measured.set(directionOf(element) === "rtl")
        member = field?.join({
          element,
          focus: () => (areaThumbElement ?? [...thumbElements.values()][0])?.focus(),
          kind: "range",
          // A colour always has a value.
          required: () => false,
          value: text.peek(),
        })
        return () => {
          member?.leave()
          member = undefined
        }
      },
    },
    area: {
      props: computed(() => ({
        ...state(),
        "data-dragging": flag(dragging.get() === "area"),
        style: {
          // A finger on the area drags the thumb, not the page.
          "touch-action": "none",
          // What a design paints the area from: its hue at full saturation and brightness.
          "--hue-color": hueColor(color.get().h),
        },
        onPointerDown: (event: PointerEvent) => press(event, areaSurface()),
      })),
      attach(element) {
        measured.set(directionOf(element) === "rtl")
        areaElement = element
        return () => {
          if (areaElement === element) areaElement = undefined
          if (dragging.peek() === "area") stopDrag?.()
        }
      },
    },
    areaThumb: {
      props: computed(() => {
        const now = color.get()
        const s = Math.round(now.s)
        const v = Math.round(now.v)
        return {
          role: "slider",
          tabindex: disabled.get() ? "-1" : "0",
          // Two dimensions in one slider: the saturation is its number, and its text says both.
          "aria-roledescription": "2D slider",
          "aria-valuemin": "0",
          "aria-valuemax": "100",
          "aria-valuenow": String(s),
          "aria-valuetext": ariaText(`Saturation ${s}%, Brightness ${v}%`, "area"),
          "aria-disabled": disabled.get() ? "true" : undefined,
          "aria-readonly": readOnly.get() ? "true" : undefined,
          ...field?.aria(),
          ...state(),
          "data-dragging": flag(dragging.get() === "area"),
          style: {
            ...place(now.s, now.v),
            // Its place as shares, and the colour under it, for a design to paint with.
            "--saturation": percent(now.s),
            "--brightness": percent(now.v),
            "--color": cssColor(now, true),
          },
          onKeyDown: areaKey,
        }
      }),
      attach(element) {
        areaThumbElement = element
        return () => {
          if (areaThumbElement === element) areaThumbElement = undefined
        }
      },
    },
    channelSlider: (channel, orientation) => slider(channel, orientation).root,
    channelSliderTrack: (channel, orientation) => slider(channel, orientation).track,
    channelSliderThumb: (channel, orientation) => slider(channel, orientation).thumb,
    channelInput: (channel) => channelInput(channel).part,
    swatch: {
      props: computed(() => ({ ...state(), style: { "--color": cssColor(color.get()) } })),
      attach: () => NOTHING,
    },
    swatchTrigger,
    eyeDropperTrigger: {
      props: computed(() => ({
        type: "button",
        // Hidden until the page says the browser has one: a server cannot know.
        hidden: flag(!supported.get()),
        disabled: flag(disabled.get()),
        "aria-disabled": readOnly.get() ? "true" : undefined,
        ...state(),
        onClick: (event: MouseEvent) => void pickFromScreen(event),
      })),
      attach(element) {
        const view = element.ownerDocument.defaultView as typeof eyeDropperView
        eyeDropperView = view
        supported.set(typeof view?.EyeDropper === "function")
        return () => {
          if (eyeDropperView === view) eyeDropperView = undefined
        }
      },
    },
    valueText: {
      // The thumbs and inputs say the colour to assistive technology.
      props: computed(() => ({ "aria-live": "off", ...state(), "data-format": format.get() })),
      attach: () => NOTHING,
    },
    formatTrigger: {
      props: computed(() => ({
        type: "button",
        disabled: flag(disabled.get()),
        ...state(),
        "data-format": format.get(),
        onClick(event: MouseEvent) {
          if (disabled.peek()) return
          const now = format.peek()
          const next = COLOR_FORMATS[(COLOR_FORMATS.indexOf(now) + 1) % COLOR_FORMATS.length]!
          const by = details("format-change", event)
          format.set(next, by)
          if (by.canceled || readOnly.peek()) return
          // The value is told again in its new format: the same colour, written another way.
          const written = formatColor(current(), next, alphaOn.peek())
          const told = details("format-change", event)
          value.set(written, told)
          if (!told.canceled) member?.changed(written)
        },
      })),
      attach: () => NOTHING,
    },
    input: {
      props: computed(() => ({
        type: "hidden",
        name: props.get().name ?? field?.name.get(),
        form: props.get().form,
        value: text.get(),
        disabled: flag(disabled.get()),
      })),
      attach: (element) => inForm.attach(element),
    },
  }
}
