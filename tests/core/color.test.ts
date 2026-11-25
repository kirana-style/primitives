import { describe, expect, it } from "vite-plus/test"

import {
  cssColor,
  formatColor,
  hslToHsv,
  hsvToHsl,
  hsvToRgb,
  hueColor,
  parseColor,
  rgbToHsv,
  sameColor,
} from "../../packages/core/src/services/color.ts"
import type { ColorFormat, Hsva } from "../../packages/core/src/services/color.ts"

/** A colour's channels to a byte, and its alpha to two decimals: what a page draws. */
const rgba = (color: Hsva | null) => {
  if (!color) return null
  const { r, g, b, a } = hsvToRgb(color)
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(a * 100) / 100]
}

describe("reading a colour", () => {
  it("reads hex of three, four, six and eight digits", () => {
    expect(rgba(parseColor("#f00"))).toEqual([255, 0, 0, 1])
    expect(rgba(parseColor("#f008"))).toEqual([255, 0, 0, 0.53])
    expect(rgba(parseColor("#3366CC"))).toEqual([51, 102, 204, 1])
    expect(rgba(parseColor("#3366cc80"))).toEqual([51, 102, 204, 0.5])
  })

  it("reads rgb() and rgba(), with commas or with spaces and a slash", () => {
    expect(rgba(parseColor("rgb(255, 128, 0)"))).toEqual([255, 128, 0, 1])
    expect(rgba(parseColor("rgba(255, 128, 0, 0.25)"))).toEqual([255, 128, 0, 0.25])
    expect(rgba(parseColor("rgb(255 128 0 / 50%)"))).toEqual([255, 128, 0, 0.5])
    expect(rgba(parseColor("rgb(100% 0% 50%)"))).toEqual([255, 0, 128, 1])
    // Out of range is held to the range, as CSS holds it.
    expect(rgba(parseColor("rgb(300, -5, 0, 2)"))).toEqual([255, 0, 0, 1])
  })

  it("reads hsl() and hsla(), keeping the hue the text names", () => {
    expect(rgba(parseColor("hsl(120, 100%, 50%)"))).toEqual([0, 255, 0, 1])
    expect(rgba(parseColor("hsla(240deg, 100%, 50%, 0.5)"))).toEqual([0, 0, 255, 0.5])
    expect(rgba(parseColor("hsl(0 0% 100% / 0.1)"))).toEqual([255, 255, 255, 0.1])
    // A grey said in HSL still has the hue it was given.
    expect(parseColor("hsl(200, 0%, 50%)")!.h).toBe(200)
  })

  it("refuses what is not a colour", () => {
    for (const text of [
      "",
      "red",
      "#ff",
      "#fffff",
      "#ggg",
      "ff0000",
      "rgb(1, 2)",
      "rgb(1 2 3 4)",
      "rgb(1, 2, 3, 4, 5)",
      "rgb(1deg, 2, 3)",
      "hsl(10%, 50%, 50%)",
      "rgb(1 2 3 /)",
      "rgb(a, b, c)",
    ]) {
      expect(parseColor(text), text).toBe(null)
    }
  })
})

describe("writing a colour", () => {
  const color = parseColor("rgba(51, 102, 204, 0.5)")!

  it("writes each format, with the alpha only when asked", () => {
    expect(formatColor(color, "hex")).toBe("#3366cc")
    expect(formatColor(color, "hex", true)).toBe("#3366cc80")
    expect(formatColor(color, "rgb")).toBe("rgb(51, 102, 204)")
    expect(formatColor(color, "rgb", true)).toBe("rgba(51, 102, 204, 0.5)")
    expect(formatColor(color, "hsl")).toBe("hsl(220, 60%, 50%)")
    expect(formatColor(color, "hsl", true)).toBe("hsla(220, 60%, 50%, 0.5)")
  })

  it("writes colours for a style", () => {
    expect(cssColor(color)).toBe("rgba(51, 102, 204, 0.5)")
    expect(cssColor(color, true)).toBe("rgb(51, 102, 204)")
    expect(hueColor(220)).toBe("hsl(220, 100%, 50%)")
  })

  it("writes again what it read, in every format", () => {
    const texts: [string, ColorFormat, boolean][] = [
      ["#000000", "hex", false],
      ["#ffffff", "hex", false],
      ["#123456", "hex", false],
      ["#abcdef12", "hex", true],
      ["rgb(1, 2, 3)", "rgb", false],
      ["rgba(250, 128, 7, 0.33)", "rgb", true],
      ["hsl(359, 99%, 1%)", "hsl", false],
      ["hsl(200, 0%, 50%)", "hsl", false],
      ["hsla(45, 80%, 60%, 0.75)", "hsl", true],
    ]
    for (const [text, format, alpha] of texts) {
      expect(formatColor(parseColor(text)!, format, alpha)).toBe(text)
    }
  })
})

describe("converting between models", () => {
  it("knows the corners of the cube", () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 100, v: 100, a: 1 })
    expect(rgbToHsv({ r: 0, g: 255, b: 0, a: 1 })).toEqual({ h: 120, s: 100, v: 100, a: 1 })
    expect(rgbToHsv({ r: 0, g: 0, b: 255, a: 1 })).toEqual({ h: 240, s: 100, v: 100, a: 1 })
    expect(rgbToHsv({ r: 255, g: 0, b: 255, a: 1 }).h).toBe(300)
    expect(hsvToHsl({ h: 0, s: 100, v: 100, a: 1 })).toEqual({ h: 0, s: 100, l: 50, a: 1 })
    expect(hsvToHsl({ h: 0, s: 0, v: 100, a: 1 })).toEqual({ h: 0, s: 0, l: 100, a: 1 })
  })

  it("comes back to the same bytes from RGB through HSV and HSL", () => {
    for (let r = 0; r <= 255; r += 17)
      for (let g = 0; g <= 255; g += 51)
        for (let b = 0; b <= 255; b += 15) {
          const hsv = rgbToHsv({ r, g, b, a: 1 })
          const back = hsvToRgb(hslToHsv(hsvToHsl(hsv), hsv))
          expect([back.r, back.g, back.b].map(Math.round)).toEqual([r, g, b])
        }
  })

  it("comes back to the same HSL written whole", () => {
    // Black and white have no saturation to come back with: they are kept apart below.
    for (let h = 0; h <= 360; h += 30)
      for (let s = 0; s <= 100; s += 25)
        for (let l = 10; l <= 90; l += 20) {
          const text = `hsl(${h}, ${s}%, ${l}%)`
          expect(formatColor(parseColor(text)!, "hsl")).toBe(text)
        }
  })

  it("keeps a hue through grey, and a hue and saturation through black", () => {
    const keep: Hsva = { h: 210, s: 70, v: 60, a: 1 }
    expect(rgbToHsv({ r: 128, g: 128, b: 128, a: 1 }, keep)).toMatchObject({ h: 210, s: 0 })
    expect(rgbToHsv({ r: 0, g: 0, b: 0, a: 1 }, keep)).toEqual({ h: 210, s: 70, v: 0, a: 1 })
    expect(parseColor("#000", keep)).toEqual({ h: 210, s: 70, v: 0, a: 1 })
    expect(hslToHsv({ h: 30, s: 50, l: 0, a: 1 }, keep)).toEqual({ h: 30, s: 70, v: 0, a: 1 })
    // Without a colour to keep from, a grey is red's hue.
    expect(rgbToHsv({ r: 9, g: 9, b: 9, a: 1 }).h).toBe(0)
  })

  it("keeps a hue of 360 at the end of the circle, and brings others onto it", () => {
    expect(parseColor("hsl(360, 100%, 50%)")!.h).toBe(360)
    expect(parseColor("hsl(-90, 100%, 50%)")!.h).toBe(270)
    expect(parseColor("hsl(450, 100%, 50%)")!.h).toBe(90)
  })

  it("says two colours are the same when they draw the same", () => {
    expect(sameColor({ h: 10, s: 0, v: 50, a: 1 }, { h: 300, s: 0, v: 50, a: 1 })).toBe(true)
    expect(sameColor({ h: 10, s: 0, v: 50, a: 1 }, { h: 10, s: 0, v: 50, a: 0.5 })).toBe(false)
    expect(sameColor({ h: 10, s: 50, v: 50, a: 1 }, { h: 11, s: 50, v: 50, a: 1 })).toBe(false)
  })
})
