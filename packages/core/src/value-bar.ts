import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface ValueBarProps {
  id: string
  /** The value. For a progress bar, `null` is "under way, how far is not known". */
  value: number | null
  /** Default 0. */
  min?: number | undefined
  /** Default 100. */
  max?: number | undefined
  /** How the value is written; a percentage of the range by default. */
  format?: Intl.NumberFormatOptions | undefined
  /** The language the value is written in; the page's by default. */
  locale?: string | undefined
  /** What assistive technology reads for the value, when the written value is not enough. */
  getAriaValueText?: ((text: string | undefined, value: number | null) => string) | undefined
}

export interface ValueBar {
  /** The value as it is written: `"40%"`. `undefined` while it is not known. */
  readonly text: ReadonlySignal<string | undefined>
  mount(): () => void
  readonly root: Part
  readonly track: Part
  /** The filled part of the track: its width is the value's share of the range. */
  readonly indicator: Part
  /** Where the written value goes. */
  readonly value: Part
  /** The bar's name. */
  readonly label: Part
}

const NOTHING = () => {}

/**
 * What a progress bar and a meter share: a value within a range, drawn as a filled track. They
 * differ in meaning (work under way, or a measurement) and so in role and states.
 */
export function createValueBar(
  props: ReadonlySignal<ValueBarProps>,
  role: "progressbar" | "meter"
): ValueBar {
  const id = props.peek().id
  const labelled = signal(false)
  const range = computed(() => {
    const { value, min = 0, max = 100 } = props.get()
    const share = value === null || max === min ? null : (value - min) / (max - min)
    return { value, min, max, share: share === null ? null : Math.min(1, Math.max(0, share)) }
  })
  const text = computed(() => {
    const { value, share } = range.get()
    if (value === null || share === null) return undefined
    const { format, locale } = props.get()
    return format
      ? new Intl.NumberFormat(locale, format).format(value)
      : new Intl.NumberFormat(locale, { style: "percent" }).format(share)
  })
  // A meter measures: it has no "under way" and no "done".
  const state = () => {
    if (role === "meter") return {}
    const { value, max } = range.get()
    return {
      "data-indeterminate": flag(value === null),
      "data-complete": flag(value !== null && value >= max),
      "data-progressing": flag(value !== null && value < max),
    }
  }

  return {
    text,
    mount: () => NOTHING,
    root: {
      props: computed(() => {
        const { value, min, max } = range.get()
        const written = text.get()
        return {
          role,
          "aria-valuemin": String(min),
          "aria-valuemax": String(max),
          "aria-valuenow": value === null ? undefined : String(value),
          "aria-valuetext": props.get().getAriaValueText?.(written, value) ?? written,
          "aria-labelledby": labelled.get() ? `${id}-label` : undefined,
          ...state(),
        }
      }),
      attach: () => NOTHING,
    },
    track: { props: computed(state), attach: () => NOTHING },
    indicator: {
      props: computed(() => {
        const { share } = range.get()
        return {
          ...state(),
          // The value as a length, which a server can write: nothing is measured for it.
          style: share === null ? undefined : { width: `${share * 100}%` },
        }
      }),
      attach: () => NOTHING,
    },
    value: {
      // The root says it to assistive technology already.
      props: computed(() => ({ "aria-hidden": "true", ...state() })),
      attach: () => NOTHING,
    },
    label: {
      props: computed(() => ({ id: `${id}-label`, ...state() })),
      attach() {
        labelled.set(true)
        return () => labelled.set(false)
      },
    },
  }
}
