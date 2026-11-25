/**
 * Colours as numbers and as text, with no dependency: hex, `rgb()` and `hsl()` read and written,
 * and the three models a picker moves between. Every model carries its alpha.
 *
 * A colour keeps its hue where the numbers alone would lose it: a grey has no hue in RGB, and
 * black has neither hue nor saturation in HSV. Each conversion that can lose them takes the
 * colour it came from (`keep`), and gives back its hue and saturation where it has none of its
 * own, so a picker dragged through grey or black comes out the hue it went in with.
 */

/** Red, green and blue from 0 to 255, alpha from 0 to 1. */
export interface Rgba {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

/** Hue from 0 to 360, saturation and lightness from 0 to 100, alpha from 0 to 1. */
export interface Hsla {
  readonly h: number
  readonly s: number
  readonly l: number
  readonly a: number
}

/**
 * Hue from 0 to 360, saturation and brightness (value) from 0 to 100, alpha from 0 to 1: what a
 * colour area draws, saturation across and brightness up.
 */
export interface Hsva {
  readonly h: number
  readonly s: number
  readonly v: number
  readonly a: number
}

/** How a colour is written: `#rrggbb`, `rgb(…)` or `hsl(…)`. */
export type ColorFormat = "hex" | "rgb" | "hsl"

export const COLOR_FORMATS: readonly ColorFormat[] = ["hex", "rgb", "hsl"]

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

/** A hue on the circle. 360 stays 360, so a thumb at the end of a hue track stays there. */
function circle(hue: number): number {
  if (hue >= 0 && hue <= 360) return hue
  return ((hue % 360) + 360) % 360
}

export function hsvToRgb({ h, s, v, a }: Hsva): Rgba {
  const sat = s / 100
  const val = v / 100
  const at = (n: number) => {
    const k = (n + h / 60) % 6
    return val - val * sat * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return { r: at(5) * 255, g: at(3) * 255, b: at(1) * 255, a }
}

/**
 * HSV from RGB. A grey takes `keep`'s hue, and black its saturation too: RGB says nothing of
 * either.
 */
export function rgbToHsv({ r, g, b, a }: Rgba, keep?: Hsva): Hsva {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let h = keep?.h ?? 0
  if (delta > 0) {
    if (max === red) h = ((green - blue) / delta) % 6
    else if (max === green) h = (blue - red) / delta + 2
    else h = (red - green) / delta + 4
    h = circle(h * 60)
  }
  const v = max * 100
  const s = max === 0 ? (keep?.s ?? 0) : (delta / max) * 100
  return { h, s, v, a }
}

export function hsvToHsl({ h, s, v, a }: Hsva): Hsla {
  const val = v / 100
  const l = val * (1 - s / 200)
  const sat = l === 0 || l === 1 ? 0 : (val - l) / Math.min(l, 1 - l)
  return { h, s: sat * 100, l: l * 100, a }
}

/** HSV from HSL, which always names a hue. Black takes `keep`'s saturation. */
export function hslToHsv({ h, s, l, a }: Hsla, keep?: Hsva): Hsva {
  const light = l / 100
  const v = light + (s / 100) * Math.min(light, 1 - light)
  const sat = v === 0 ? (keep?.s ?? 0) / 100 : 2 * (1 - light / v)
  return { h: circle(h), s: sat * 100, v: v * 100, a }
}

export const rgbToHsl = (rgb: Rgba, keep?: Hsva): Hsla => hsvToHsl(rgbToHsv(rgb, keep))
export const hslToRgb = (hsl: Hsla): Rgba => hsvToRgb(hslToHsv(hsl))

// A number as CSS writes one, with a unit or none.
const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg)?$/i

/** A number and its unit, or `undefined` when the text is not one. */
function numberOf(text: string): { value: number; unit: string } | undefined {
  const found = NUMBER.exec(text.trim())
  if (!found) return undefined
  const value = Number(found[1])
  return Number.isFinite(value) ? { value, unit: (found[2] ?? "").toLowerCase() } : undefined
}

/**
 * The arguments of `rgb()` or `hsl()`: three and an optional alpha, written with commas
 * (`rgb(255, 0, 0, 0.5)`) or with spaces and a slash (`rgb(255 0 0 / 50%)`).
 */
function argumentsOf(inner: string): string[] | undefined {
  const text = inner.trim()
  if (text.includes(",")) {
    const list = text.split(",").map((each) => each.trim())
    return list.length === 3 || list.length === 4 ? list : undefined
  }
  const [channels = "", alpha, extra] = text.split("/")
  if (extra !== undefined) return undefined
  const list = channels.trim().split(/\s+/)
  if (list.length !== 3) return undefined
  if (alpha === undefined) return list
  return alpha.trim() === "" ? undefined : [...list, alpha.trim()]
}

/** An alpha as text: a number from 0 to 1, or a percentage. */
function alphaOf(text: string | undefined): number | undefined {
  if (text === undefined) return 1
  const found = numberOf(text)
  if (!found || found.unit === "deg") return undefined
  return clamp(found.unit === "%" ? found.value / 100 : found.value, 0, 1)
}

function parseHex(text: string): Rgba | undefined {
  const found = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text)
  if (!found) return undefined
  let digits = found[1]!
  if (digits.length <= 4) digits = Array.from(digits, (each) => each + each).join("")
  const byte = (at: number) => parseInt(digits.slice(at, at + 2), 16)
  return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 }
}

function parseRgb(inner: string): Rgba | undefined {
  const list = argumentsOf(inner)
  if (!list) return undefined
  const channels: number[] = []
  for (const each of list.slice(0, 3)) {
    const found = numberOf(each)
    if (!found || found.unit === "deg") return undefined
    channels.push(clamp(found.unit === "%" ? (found.value / 100) * 255 : found.value, 0, 255))
  }
  const a = alphaOf(list[3])
  if (a === undefined) return undefined
  return { r: channels[0]!, g: channels[1]!, b: channels[2]!, a }
}

function parseHsl(inner: string): Hsla | undefined {
  const list = argumentsOf(inner)
  if (!list) return undefined
  const hue = numberOf(list[0]!)
  if (!hue || hue.unit === "%") return undefined
  const rest: number[] = []
  for (const each of list.slice(1, 3)) {
    const found = numberOf(each)
    // A saturation or a lightness is a percentage; written bare, it is taken as one.
    if (!found || found.unit === "deg") return undefined
    rest.push(clamp(found.value, 0, 100))
  }
  const a = alphaOf(list[3])
  if (a === undefined) return undefined
  return { h: circle(hue.value), s: rest[0]!, l: rest[1]!, a }
}

/** Whether a colour's text names its hue itself (`hsl()`), which RGB cannot for a grey. */
export const namesHue = (text: string): boolean => /^\s*hsla?\(/i.test(text)

/**
 * A colour from its text: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`,
 * `hsla()`, with commas or with spaces and a slash. `null` when the text is none of those. A
 * grey or black takes the hue and saturation of `keep`, where its text does not name them.
 */
export function parseColor(text: string, keep?: Hsva): Hsva | null {
  const plain = text.trim()
  if (plain.startsWith("#")) {
    const rgb = parseHex(plain)
    return rgb ? rgbToHsv(rgb, keep) : null
  }
  const call = /^(rgba?|hsla?)\((.*)\)$/is.exec(plain)
  if (!call) return null
  if (call[1]!.toLowerCase().startsWith("rgb")) {
    const rgb = parseRgb(call[2]!)
    return rgb ? rgbToHsv(rgb, keep) : null
  }
  const hsl = parseHsl(call[2]!)
  return hsl ? hslToHsv(hsl, keep) : null
}

const byte = (value: number) => Math.round(clamp(value, 0, 255))
const hex2 = (value: number) => byte(value).toString(16).padStart(2, "0")
/** An alpha as written: two decimals at most, no trailing zeros. */
const alphaText = (a: number) => String(Math.round(clamp(a, 0, 1) * 100) / 100)

/**
 * A colour as text. With `alpha`, the alpha is always written (`#rrggbbaa`, `rgba()`,
 * `hsla()`), so a value keeps one length; without it, never.
 */
export function formatColor(color: Hsva, format: ColorFormat, alpha = false): string {
  if (format === "hsl") {
    const { h, s, l, a } = hsvToHsl(color)
    const head = `${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%`
    return alpha ? `hsla(${head}, ${alphaText(a)})` : `hsl(${head})`
  }
  const { r, g, b, a } = hsvToRgb(color)
  if (format === "hex") return `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha ? hex2(a * 255) : ""}`
  const head = `${byte(r)}, ${byte(g)}, ${byte(b)}`
  return alpha ? `rgba(${head}, ${alphaText(a)})` : `rgb(${head})`
}

/** A colour for a style: `rgb()` with its alpha, or without it when `opaque`. */
export function cssColor(color: Hsva, opaque = false): string {
  const { r, g, b, a } = hsvToRgb(color)
  const head = `${byte(r)}, ${byte(g)}, ${byte(b)}`
  return opaque ? `rgb(${head})` : `rgba(${head}, ${Math.round(clamp(a, 0, 1) * 1000) / 1000})`
}

/** The pure colour of a hue, at full saturation and brightness: what a colour area is painted from. */
export const hueColor = (hue: number): string =>
  `hsl(${Math.round(circle(hue) * 100) / 100}, 100%, 50%)`

/** Whether two colours are drawn the same: their channels and alpha, each to a byte. */
export function sameColor(one: Hsva, other: Hsva): boolean {
  const a = hsvToRgb(one)
  const b = hsvToRgb(other)
  return (
    byte(a.r) === byte(b.r) &&
    byte(a.g) === byte(b.g) &&
    byte(a.b) === byte(b.b) &&
    byte(a.a * 255) === byte(b.a * 255)
  )
}
