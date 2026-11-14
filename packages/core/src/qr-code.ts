import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { qr, qrPath } from "./services/qr.ts"
import type { QrCorrection, QrSymbol } from "./services/qr.ts"

export type { QrCorrection, QrSymbol } from "./services/qr.ts"

export interface QrCodeProps {
  id: string
  /** What the code says: a link, a text. Written as UTF-8. */
  value: string
  /** How much of it may be lost and still be read. Default: `"M"`. */
  correction?: QrCorrection | undefined
}

export interface QrCode {
  /** The code's modules; none when the value is longer than a code holds. */
  readonly symbol: ReadonlySignal<QrSymbol | undefined>
  mount(): () => void
  readonly root: Part
  /** The drawing: an `<svg>` a module to the unit, with no margin of its own. */
  readonly frame: Part
  /** The dark modules, one `<path>`. */
  readonly pattern: Part
}

const NOTHING = () => {}
const NONE = () => NOTHING
const SVG = "http://www.w3.org/2000/svg"

/**
 * A QR code drawn in the page: nothing is fetched, and a server draws the same one. The frame
 * has no quiet margin; a design gives it one (four modules, by the standard) and its colours.
 */
export function createQrCode(props: ReadonlySignal<QrCodeProps>): QrCode {
  const id = props.peek().id
  const symbol = computed(() => {
    const { value, correction } = props.get()
    try {
      return qr(value, correction ?? "M")
    } catch {
      return undefined
    }
  })
  const path = computed(() => {
    const drawn = symbol.get()
    return drawn ? qrPath(drawn) : ""
  })
  return {
    symbol,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({ id, "data-invalid": flag(!symbol.get()) })),
      attach: NONE,
    },
    frame: {
      props: computed(() => {
        const size = symbol.get()?.size ?? 0
        return { xmlns: SVG, viewBox: `0 0 ${size} ${size}`, role: "img" }
      }),
      attach: NONE,
    },
    pattern: {
      props: computed(() => ({ xmlns: SVG, d: path.get() })),
      attach: NONE,
    },
  }
}
