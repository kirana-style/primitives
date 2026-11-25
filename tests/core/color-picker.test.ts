import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createColorPicker } from "../../packages/core/src/color-picker.ts"
import type {
  ColorPickerInputChannel,
  ColorPickerProps,
} from "../../packages/core/src/color-picker.ts"
import { colorPickerVocabulary } from "../../packages/core/src/color-picker.vocabulary.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { formatColor } from "../../packages/core/src/services/color.ts"
import { faults, known } from "../../packages/core/src/testing.ts"
import { mount, style } from "./page.ts"

const CHANNELS: ColorPickerInputChannel[] = [
  "hex",
  "red",
  "green",
  "blue",
  "hue",
  "saturation",
  "lightness",
  "alpha",
]

/** A colour from its numbers, written as the picker writes it. */
const hsv = (h: number, s: number, v: number, a = 1, alpha = false) =>
  formatColor({ h, s, v, a }, "hex", alpha)

/**
 * A picker drawn whole: an area 200 by 100 at the page's top left, a hue slider and an alpha
 * slider 200 long under it, an input per channel, a swatch, two presets, the eye dropper, the
 * value, the format trigger and the hidden input, in a form.
 */
function picker(given: Partial<ColorPickerProps> = {}, options: { dir?: "rtl" } = {}) {
  style(`
    .area { position: fixed; left: 0; top: 0; width: 200px; height: 100px; }
    .slider { position: fixed; left: 0; width: 200px; height: 10px; }
    .hue { top: 120px; }
    .alpha { top: 140px; }
    .track { position: absolute; inset: 0; }
    .thumb { width: 10px; height: 10px; }`)
  const root = mount(`
    <form dir="${options.dir ?? "ltr"}">
      <div class="root">
        <div class="area"><div class="thumb area-thumb"></div></div>
        <div class="slider hue"><div class="track"><div class="thumb"></div></div></div>
        <div class="slider alpha"><div class="track"><div class="thumb"></div></div></div>
        ${CHANNELS.map((channel) => `<input class="channel" data-name="${channel}" />`).join("")}
        <div class="swatch"></div>
        <button class="preset green"></button>
        <button class="preset half"></button>
        <button class="dropper"></button>
        <span class="text"></span>
        <button class="format"></button>
        <input class="hidden" />
      </div>
    </form>`)
  const heard: string[] = []
  const committed: string[] = []
  const formats: string[] = []
  const props = signal<ColorPickerProps>({
    name: "color",
    onValueChange: (value, details) => void heard.push(`${value} ${details.reason}`),
    onValueCommitted: (value, details) => void committed.push(`${value} ${details.reason}`),
    onFormatChange: (format) => void formats.push(format),
    ...given,
  })
  const made = createColorPicker(props)
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!
  const on = (selector: string, part: Parameters<typeof bind>[1]) =>
    onTestFinished(bind(find(selector), part))
  on(".root", made.root)
  on(".area", made.area)
  on(".area-thumb", made.areaThumb)
  on(".hue", made.channelSlider("hue"))
  on(".hue .track", made.channelSliderTrack("hue"))
  on(".hue .thumb", made.channelSliderThumb("hue"))
  on(".alpha", made.channelSlider("alpha"))
  on(".alpha .track", made.channelSliderTrack("alpha"))
  on(".alpha .thumb", made.channelSliderThumb("alpha"))
  for (const channel of CHANNELS) on(`[data-name="${channel}"]`, made.channelInput(channel))
  on(".swatch", made.swatch)
  on(".green", made.swatchTrigger("#00ff00"))
  on(".half", made.swatchTrigger("rgba(0, 0, 255, 0.5)"))
  on(".dropper", made.eyeDropperTrigger)
  on(".text", made.valueText)
  on(".format", made.formatTrigger)
  on(".hidden", made.input)
  onTestFinished(made.mount())

  const pointer = (type: string, x: number, y: number, target: EventTarget = document) =>
    target.dispatchEvent(
      new PointerEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true })
    )
  const key = (target: HTMLElement, name: string, shiftKey = false) => {
    const event = new KeyboardEvent("keydown", {
      key: name,
      shiftKey,
      bubbles: true,
      cancelable: true,
    })
    target.dispatchEvent(event)
    return event
  }
  const input = (channel: ColorPickerInputChannel) =>
    find<HTMLInputElement>(`[data-name="${channel}"]`)
  /** Focus comes in, `text` is typed, and focus leaves unless asked not to. */
  const type = (channel: ColorPickerInputChannel, text: string, leave = true) => {
    const element = input(channel)
    element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))
    element.value = text
    element.dispatchEvent(new InputEvent("input", { bubbles: true }))
    if (leave) element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    return element
  }
  return {
    props,
    made,
    root,
    find,
    heard,
    committed,
    formats,
    pointer,
    key,
    input,
    type,
    form: find<HTMLFormElement>("form"),
    area: find(".area"),
    areaThumb: find(".area-thumb"),
    hue: find(".hue"),
    hueThumb: find(".hue .thumb"),
    alpha: find(".alpha"),
    alphaThumb: find(".alpha .thumb"),
  }
}

describe("a colour picker before there is a page", () => {
  it("says its colour in every part a server draws", () => {
    const made = createColorPicker(
      signal<ColorPickerProps>({ defaultValue: "hsl(200, 50%, 40%)", name: "c" })
    )
    expect(made.text.peek()).toMatch(/^#[0-9a-f]{6}$/)
    expect(made.color.peek().h).toBe(200)
    expect(made.root.props.peek()).toMatchObject({ role: "group", "data-format": "hex" })
    const thumb = made.areaThumb.props.peek()
    expect(thumb).toMatchObject({
      role: "slider",
      "aria-roledescription": "2D slider",
      "aria-valuenow": "67",
      "aria-valuetext": "Saturation 67%, Brightness 60%",
    })
    expect(thumb.style).toMatchObject({
      position: "absolute",
      "inset-inline-start": expect.stringMatching(/^66\.6\d*%$/),
      bottom: "60%",
      translate: "-50% 50%",
    })
    expect(made.area.props.peek().style).toMatchObject({ "--hue-color": "hsl(200, 100%, 50%)" })
    expect(made.channelSliderThumb("hue").props.peek()).toMatchObject({
      "aria-valuenow": "200",
      "aria-valuemax": "360",
      "aria-valuetext": "200°",
    })
    expect(made.channelSliderThumb("hue").props.peek().style).toMatchObject({
      "inset-inline-start": expect.stringMatching(/^55\.5\d*%$/),
      top: "50%",
    })
    expect(made.channelInput("hue").props.peek().value).toBe("200")
    expect(made.channelInput("lightness").props.peek().value).toBe("40")
    expect(made.input.props.peek()).toMatchObject({ type: "hidden", name: "c" })
    // The eye dropper waits for the page to say whether the browser has one.
    expect(made.eyeDropperTrigger.props.peek().hidden).toBe("")
  })

  it("moves a thumb back by its own share when thumbs stay inside", () => {
    const made = createColorPicker(
      // Saturation 100, brightness 50.
      signal<ColorPickerProps>({ defaultValue: "hsl(0, 100%, 25%)", thumbAlignment: "edge" })
    )
    expect(made.areaThumb.props.peek().style).toMatchObject({ translate: "-100% 50%" })
    expect(made.channelSliderThumb("hue", "vertical").props.peek().style).toMatchObject({
      bottom: "0%",
      left: "50%",
      translate: "-50% 0%",
    })
  })

  it("starts black, and starts black from a value that is not a colour", () => {
    expect(createColorPicker(signal({})).text.peek()).toBe("#000000")
    expect(createColorPicker(signal({ defaultValue: "nope" })).text.peek()).toBe("#000000")
  })
})

describe("the colour area", () => {
  it("is dragged from the press on, heard on the page, and committed when let go", () => {
    const { made, area, areaThumb, heard, committed, pointer } = picker({ defaultValue: "#ff0000" })
    pointer("pointerdown", 50, 25, area)
    expect(document.activeElement).toBe(areaThumb)
    expect(made.dragging.peek()).toBe("area")
    expect(area.hasAttribute("data-dragging")).toBe(true)
    pointer("pointermove", 100, 50)
    // Off the area, held to its edges.
    pointer("pointermove", 400, -30)
    pointer("pointerup", 400, -30)
    expect(made.dragging.peek()).toBe(null)
    expect(heard).toEqual([
      `${hsv(0, 25, 75)} area-press`,
      `${hsv(0, 50, 50)} drag`,
      `${hsv(0, 100, 100)} drag`,
    ])
    expect(committed).toEqual([`${hsv(0, 100, 100)} commit`])
    expect(areaThumb.getAttribute("aria-valuetext")).toBe("Saturation 100%, Brightness 100%")
    expect(areaThumb.style.getPropertyValue("--saturation")).toBe("100%")
    expect(areaThumb.style.getPropertyValue("--color")).toBe("rgb(255, 0, 0)")
    // Let go, the page's moves are not the picker's.
    pointer("pointermove", 0, 100)
    expect(heard).toHaveLength(3)
  })

  it("keeps the edge of a thumb it holds under the pointer", () => {
    const { area, areaThumb, heard, pointer } = picker({ defaultValue: hsv(0, 50, 50) })
    // The thumb's centre is at 100, 50.
    pointer("pointerdown", 103, 52, areaThumb)
    expect(heard).toEqual([])
    pointer("pointermove", 113, 52)
    pointer("pointerup", 113, 52)
    expect(heard).toEqual([`${hsv(0, 55, 50)} drag`])
    expect(area.hasAttribute("data-dragging")).toBe(false)
  })

  it("is moved by the arrows, with Shift, Page Up and Down, Home and End", () => {
    const { areaThumb, key, committed, made } = picker({ defaultValue: hsv(0, 50, 50) })
    const said = () => {
      const { s, v } = made.color.peek()
      return [Math.round(s), Math.round(v)]
    }
    const steps: [string, boolean, number[]][] = [
      ["ArrowRight", false, [51, 50]],
      ["ArrowRight", true, [61, 50]],
      ["ArrowLeft", false, [60, 50]],
      ["ArrowUp", false, [60, 51]],
      ["ArrowDown", true, [60, 41]],
      ["PageUp", false, [60, 51]],
      ["PageDown", false, [60, 41]],
      ["Home", false, [0, 41]],
      ["End", false, [100, 41]],
    ]
    for (const [name, shift, expected] of steps) {
      expect(key(areaThumb, name, shift).defaultPrevented).toBe(true)
      expect(said(), name).toEqual(expected)
    }
    expect(committed).toHaveLength(steps.length)
    // At the end, the key is still the picker's, and nothing is committed.
    key(areaThumb, "End")
    expect(committed).toHaveLength(steps.length)
    expect(key(areaThumb, "a").defaultPrevented).toBe(false)
  })
})

describe("a channel slider", () => {
  it("moves the hue with the pointer, and the area's hue with it", () => {
    const { hue, hueThumb, area, heard, committed, pointer, made } = picker({
      defaultValue: "#ff0000",
    })
    pointer("pointerdown", 100, 125, hue)
    expect(document.activeElement).toBe(hueThumb)
    expect(hue.hasAttribute("data-dragging")).toBe(true)
    pointer("pointermove", 200 / 3, 125)
    pointer("pointerup", 0, 0)
    expect(heard).toEqual(["#00ffff track-press", "#00ff00 drag"])
    expect(committed).toEqual(["#00ff00 commit"])
    expect(hueThumb.getAttribute("aria-valuenow")).toBe("120")
    expect(hueThumb.getAttribute("aria-valuetext")).toBe("120°")
    expect(hueThumb.style.getPropertyValue("--color")).toBe("hsl(120, 100%, 50%)")
    expect(area.style.getPropertyValue("--hue-color")).toBe("hsl(120, 100%, 50%)")
    expect(made.color.peek().h).toBe(120)
  })

  it("moves the hue with the keys", () => {
    const { hueThumb, key, made } = picker({ defaultValue: "#ff0000" })
    const hue = () => made.color.peek().h
    key(hueThumb, "ArrowRight")
    expect(hue()).toBe(1)
    key(hueThumb, "ArrowUp", true)
    expect(hue()).toBe(11)
    key(hueThumb, "ArrowDown")
    expect(hue()).toBe(10)
    key(hueThumb, "PageUp")
    expect(hue()).toBe(20)
    key(hueThumb, "PageDown")
    expect(hue()).toBe(10)
    key(hueThumb, "End")
    expect(hue()).toBe(360)
    key(hueThumb, "Home")
    expect(hue()).toBe(0)
    key(hueThumb, "ArrowLeft")
    expect(hue()).toBe(0)
  })

  it("chooses the opacity, written with the value when alpha is on", () => {
    const { alpha, alphaThumb, find, heard, pointer, key, input } = picker({
      defaultValue: "#ff0000",
      alpha: true,
    })
    expect(alphaThumb.getAttribute("aria-valuenow")).toBe("100")
    expect(input("hex").value).toBe("#ff0000ff")
    pointer("pointerdown", 50, 145, alpha)
    pointer("pointerup", 50, 145)
    expect(heard).toEqual(["#ff000040 track-press"])
    expect(alphaThumb.getAttribute("aria-valuetext")).toBe("25%")
    expect(alphaThumb.style.getPropertyValue("--color")).toBe("rgba(255, 0, 0, 0.25)")
    expect(find(".alpha .track").style.getPropertyValue("--color")).toBe("rgb(255, 0, 0)")
    expect(find(".swatch").style.getPropertyValue("--color")).toBe("rgba(255, 0, 0, 0.25)")
    key(alphaThumb, "ArrowRight", true)
    expect(input("alpha").value).toBe("35")
    expect(find<HTMLInputElement>(".hidden").value).toBe("#ff000059")
  })

  it("leaves the alpha out of the value when alpha is off", () => {
    const { input, find, made } = picker({ defaultValue: "#ff000080" })
    expect(made.text.peek()).toBe("#ff0000")
    expect(made.color.peek().a).toBe(1)
    expect(input("alpha").value).toBe("100")
    expect(find<HTMLInputElement>(".hidden").value).toBe("#ff0000")
    // A preset with an alpha is chosen without it.
    find(".half").click()
    expect(made.text.peek()).toBe("#0000ff")
    expect(find(".half").getAttribute("aria-pressed")).toBe("true")
  })

  it("stands upright: up is more, and a press is read from the bottom", () => {
    style(`.upright { position: fixed; left: 300px; top: 0; width: 10px; height: 200px; }
      .upright > div { width: 10px; height: 10px; }`)
    const root = mount(`<div class="upright"><div></div></div>`)
    const heard: string[] = []
    const made = createColorPicker(
      signal<ColorPickerProps>({
        defaultValue: "#ff0000",
        onValueChange: (value) => void heard.push(value),
      })
    )
    const upright = root.querySelector<HTMLElement>(".upright")!
    const thumb = upright.firstElementChild as HTMLElement
    onTestFinished(bind(upright, made.channelSlider("hue", "vertical")))
    onTestFinished(bind(thumb, made.channelSliderThumb("hue", "vertical")))
    expect(upright.getAttribute("data-orientation")).toBe("vertical")
    expect(thumb.getAttribute("aria-orientation")).toBe("vertical")
    upright.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: 305, clientY: 50, button: 0, bubbles: true })
    )
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }))
    expect(made.color.peek().h).toBe(270)
    expect(thumb.style.bottom).toBe("75%")
    // Across the track, left and right are not its keys.
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    })
    thumb.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }))
    expect(made.color.peek().h).toBe(271)
  })
})

describe("the channel inputs", () => {
  it("take a number in range as it is typed, and commit it when focus leaves", () => {
    const { type, heard, committed, made } = picker({ defaultValue: "#000000" })
    const red = type("red", "255", false)
    expect(heard).toEqual(["#ff0000 input-change"])
    expect(committed).toEqual([])
    red.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    expect(committed).toEqual(["#ff0000 input-blur"])
    type("green", "128")
    type("blue", "64")
    expect(made.text.peek()).toBe("#ff8040")
    type("hue", "120")
    expect(made.color.peek().h).toBe(120)
    type("lightness", "50")
    type("saturation", "100")
    expect(made.text.peek()).toBe("#00ff00")
  })

  it("take a hex colour, with or without its mark, of any length", () => {
    const { type, input, made } = picker({ defaultValue: "#000000" })
    type("hex", "#00f")
    expect(made.text.peek()).toBe("#0000ff")
    type("hex", "ff8800")
    expect(made.text.peek()).toBe("#ff8800")
    expect(input("hex").value).toBe("#ff8800")
    expect(input("red").value).toBe("255")
  })

  it("refuse what is not a number in range, and put the channel back when focus leaves", () => {
    const { type, input, heard, committed } = picker({ defaultValue: "#336699" })
    const red = type("red", "300", false)
    // What is typed stays while it is typed.
    expect(red.value).toBe("300")
    red.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    expect(red.value).toBe("51")
    type("hue", "abc")
    expect(input("hue").value).toBe("210")
    type("hex", "#zz")
    expect(input("hex").value).toBe("#336699")
    type("alpha", "-1")
    expect(input("alpha").value).toBe("100")
    expect(heard).toEqual([])
    expect(committed).toEqual([])
  })

  it("commit on Enter, put back on Escape, and step with the arrows", () => {
    const { type, input, key, committed, made } = picker({ defaultValue: "#000000" })
    const blue = type("blue", "10", false)
    key(blue, "Enter")
    expect(committed).toEqual(["#00000a input-commit"])
    type("blue", "zz", false)
    key(blue, "Escape")
    expect(blue.value).toBe("10")
    expect(key(blue, "ArrowUp").defaultPrevented).toBe(true)
    expect(made.text.peek()).toBe("#00000b")
    key(blue, "ArrowDown", true)
    expect(input("blue").value).toBe("1")
    expect(committed).toEqual(["#00000a input-commit", "#00000b keyboard", "#000001 keyboard"])
  })
})

describe("presets, the swatch and the eye dropper", () => {
  it("choose a preset when pressed, and say which is the current one", () => {
    const { find, heard, committed } = picker({ defaultValue: "#ff0000" })
    const green = find(".green")
    expect(green.getAttribute("aria-pressed")).toBe("false")
    expect(green.getAttribute("type")).toBe("button")
    expect(green.style.getPropertyValue("--color")).toBe("rgba(0, 255, 0, 1)")
    green.click()
    expect(heard).toEqual(["#00ff00 swatch-press"])
    expect(committed).toEqual(["#00ff00 swatch-press"])
    expect(green.getAttribute("aria-pressed")).toBe("true")
    expect(green.hasAttribute("data-selected")).toBe(true)
    expect(find(".swatch").style.getPropertyValue("--color")).toBe("rgba(0, 255, 0, 1)")
    expect(find(".root").style.getPropertyValue("--color")).toBe("rgba(0, 255, 0, 1)")
  })

  it("uses the browser's eye dropper where there is one, and never throws", async () => {
    const view = window as unknown as Record<string, unknown>
    const native = view.EyeDropper
    onTestFinished(() => void (view.EyeDropper = native))
    let answer: () => Promise<{ sRGBHex: string }> = () => Promise.resolve({ sRGBHex: "#123456" })
    view.EyeDropper = class {
      open() {
        return answer()
      }
    }
    const { find, committed, made } = picker({ defaultValue: "#ff0000" })
    const dropper = find(".dropper")
    expect(dropper.hasAttribute("hidden")).toBe(false)
    dropper.click()
    await expect.poll(() => made.text.peek()).toBe("#123456")
    expect(committed).toEqual(["#123456 eye-dropper"])
    // Refused by the reader: nothing changes, and nothing is thrown.
    answer = () =>
      Promise.reject(new DOMException("The user canceled the selection.", "AbortError"))
    dropper.click()
    await new Promise((done) => setTimeout(done))
    expect(made.text.peek()).toBe("#123456")
  })

  it("hides the eye dropper where the browser has none", () => {
    const view = window as unknown as Record<string, unknown>
    const native = view.EyeDropper
    onTestFinished(() => void (view.EyeDropper = native))
    view.EyeDropper = undefined
    const { find } = picker()
    expect(find(".dropper").hasAttribute("hidden")).toBe(true)
    find(".dropper").click()
  })
})

describe("the format", () => {
  it("goes from hex to rgb to hsl and back, and tells the value again each time", () => {
    const { find, made, heard, formats, input } = picker({ defaultValue: "#3366cc" })
    const trigger = find(".format")
    trigger.click()
    expect(formats).toEqual(["rgb"])
    expect(made.text.peek()).toBe("rgb(51, 102, 204)")
    expect(heard).toEqual(["rgb(51, 102, 204) format-change"])
    expect(trigger.getAttribute("data-format")).toBe("rgb")
    expect(find(".root").getAttribute("data-format")).toBe("rgb")
    trigger.click()
    expect(made.text.peek()).toBe("hsl(220, 60%, 50%)")
    expect(find<HTMLInputElement>(".hidden").value).toBe("hsl(220, 60%, 50%)")
    trigger.click()
    expect(formats).toEqual(["rgb", "hsl", "hex"])
    expect(made.text.peek()).toBe("#3366cc")
    // The hex input is hex whatever the format.
    expect(input("hex").value).toBe("#3366cc")
  })

  it("writes alpha in each format when alpha is on", () => {
    const { find, made } = picker({ defaultValue: "rgba(51, 102, 204, 0.5)", alpha: true })
    expect(made.text.peek()).toBe("#3366cc80")
    find(".format").click()
    expect(made.text.peek()).toBe("rgba(51, 102, 204, 0.5)")
    find(".format").click()
    expect(made.text.peek()).toBe("hsla(220, 60%, 50%, 0.5)")
  })

  it("stays as it is when the change is refused, and follows a format the caller holds", () => {
    const { find, made, props } = picker({
      defaultValue: "#3366cc",
      onFormatChange: (_format, details) => details.cancel(),
    })
    find(".format").click()
    expect(made.format.peek()).toBe("hex")
    expect(made.text.peek()).toBe("#3366cc")
    props.set({ ...props.peek(), format: "hsl" })
    expect(made.text.peek()).toBe("hsl(220, 60%, 50%)")
  })
})

describe("a colour picker read right to left", () => {
  it("runs saturation and the hue the way the text does", () => {
    const { area, areaThumb, hue, pointer, key, made } = picker(
      { defaultValue: hsv(0, 50, 50) },
      { dir: "rtl" }
    )
    expect(areaThumb.style.translate).toBe("50% 50%")
    pointer("pointerdown", 50, 50, area)
    pointer("pointerup", 50, 50)
    expect(Math.round(made.color.peek().s)).toBe(75)
    key(areaThumb, "ArrowLeft")
    expect(Math.round(made.color.peek().s)).toBe(76)
    key(areaThumb, "ArrowRight", true)
    expect(Math.round(made.color.peek().s)).toBe(66)
    // Its right edge is its start: three quarters of the way in from the right is 50 px in.
    expect(Math.round(areaThumb.getBoundingClientRect().left + 5)).toBe(68)
    pointer("pointerdown", 150, 125, hue)
    pointer("pointerup", 150, 125)
    expect(made.color.peek().h).toBe(90)
  })
})

describe("a change that is refused or held", () => {
  it("keeps the colour when the caller refuses it", () => {
    const { area, areaThumb, hueThumb, find, type, key, pointer, made, committed } = picker({
      defaultValue: "#ff0000",
      onValueChange: (_value, details) => details.cancel(),
    })
    pointer("pointerdown", 50, 25, area)
    pointer("pointermove", 100, 50)
    pointer("pointerup", 100, 50)
    key(areaThumb, "Home")
    key(hueThumb, "ArrowRight")
    type("red", "0")
    find(".green").click()
    expect(made.text.peek()).toBe("#ff0000")
    expect(made.color.peek()).toEqual({ h: 0, s: 100, v: 100, a: 1 })
    expect(areaThumb.getAttribute("aria-valuetext")).toBe("Saturation 100%, Brightness 100%")
    // The drag still ends, with the value as it is.
    expect(committed).toEqual(["#ff0000 commit"])
  })

  it("draws the value the caller holds, whatever was asked", () => {
    const { area, pointer, props, made, heard, hueThumb } = picker({ value: "#ff0000" })
    pointer("pointerdown", 50, 25, area)
    pointer("pointerup", 50, 25)
    expect(heard).toEqual([`${hsv(0, 25, 75)} area-press`])
    // Not given back: the colour is the caller's.
    expect(made.text.peek()).toBe("#ff0000")
    props.set({ ...props.peek(), value: "rgb(0, 0, 255)" })
    expect(made.text.peek()).toBe("#0000ff")
    expect(hueThumb.getAttribute("aria-valuenow")).toBe("240")
  })

  it("moves from the value the caller holds, not from what it asked for", () => {
    // Saturation 100, brightness 50.
    const { areaThumb, key, heard } = picker({ value: "hsl(0, 100%, 25%)" })
    key(areaThumb, "ArrowDown")
    key(areaThumb, "ArrowDown")
    // Each key moves from the value the caller holds, which has not changed.
    expect(heard).toEqual([`${hsv(0, 100, 49)} keyboard`, `${hsv(0, 100, 49)} keyboard`])
  })
})

describe("a colour picker in a form", () => {
  it("submits its value in its format, and goes back with the form's reset", () => {
    const { form, area, find, pointer, made, heard, input } = picker({ defaultValue: "#336699" })
    expect(new FormData(form).get("color")).toBe("#336699")
    pointer("pointerdown", 0, 0, area)
    pointer("pointerup", 0, 0)
    find(".format").click()
    expect(new FormData(form).get("color")).toBe("rgb(255, 255, 255)")
    form.reset()
    // The colour it began with, written in the format it is in now.
    expect(heard.at(-1)).toBe("rgb(51, 102, 153) form-reset")
    expect(made.text.peek()).toBe("rgb(51, 102, 153)")
    expect(new FormData(form).get("color")).toBe("rgb(51, 102, 153)")
    expect(input("red").value).toBe("51")
  })

  it("keeps its value when the reset is refused", () => {
    const { form, find, made } = picker({
      defaultValue: "#336699",
      onValueChange: (_value, details) => {
        if (details.reason === "form-reset") details.cancel()
      },
    })
    find(".green").click()
    form.reset()
    expect(made.text.peek()).toBe("#00ff00")
    expect(new FormData(form).get("color")).toBe("#00ff00")
  })

  it("writes only what its vocabulary names", () => {
    const { root } = picker({ defaultValue: "#336699", alpha: true, required: true })
    expect(faults(root, known(colorPickerVocabulary), { allow: ["data-name"] })).toEqual([])
    expect(root.querySelector(".root")!.hasAttribute("data-required")).toBe(true)
  })
})

describe("a disabled or read-only colour picker", () => {
  it("is moved by nothing while disabled, and is no stop for Tab", () => {
    const { area, areaThumb, hueThumb, find, form, type, key, pointer, made, heard, input } =
      picker({ defaultValue: "#ff0000", disabled: true })
    expect(areaThumb.getAttribute("tabindex")).toBe("-1")
    expect(areaThumb.getAttribute("aria-disabled")).toBe("true")
    expect(area.hasAttribute("data-disabled")).toBe(true)
    expect(input("red").disabled).toBe(true)
    expect(find<HTMLButtonElement>(".green").disabled).toBe(true)
    pointer("pointerdown", 50, 25, area)
    expect(made.dragging.peek()).toBe(null)
    expect(key(areaThumb, "Home").defaultPrevented).toBe(false)
    key(hueThumb, "End")
    type("red", "0")
    expect(heard).toEqual([])
    expect(made.text.peek()).toBe("#ff0000")
    // A disabled control is not submitted.
    expect(new FormData(form).get("color")).toBe(null)
  })

  it("is focusable and submitted while read only, and is moved by nothing", () => {
    const { area, areaThumb, hueThumb, find, form, type, key, pointer, made, heard, input } =
      picker({ defaultValue: "#ff0000", readOnly: true })
    expect(areaThumb.getAttribute("tabindex")).toBe("0")
    expect(areaThumb.getAttribute("aria-readonly")).toBe("true")
    expect(hueThumb.hasAttribute("data-readonly")).toBe(true)
    expect(input("red").readOnly).toBe(true)
    pointer("pointerdown", 50, 25, area)
    expect(document.activeElement).toBe(areaThumb)
    expect(made.dragging.peek()).toBe(null)
    pointer("pointermove", 10, 10)
    pointer("pointerup", 10, 10)
    for (const name of ["ArrowRight", "Home", "PageUp"]) {
      expect(key(areaThumb, name).defaultPrevented).toBe(false)
      expect(key(hueThumb, name).defaultPrevented).toBe(false)
    }
    type("red", "0")
    find(".green").click()
    expect(heard).toEqual([])
    expect(made.text.peek()).toBe("#ff0000")
    expect(new FormData(form).get("color")).toBe("#ff0000")
  })
})

describe("a hue through grey and black", () => {
  it("survives the area's left edge and its bottom", () => {
    const { areaThumb, hueThumb, key, made, input } = picker({
      // Hue 200, saturation 100, brightness 80: numbers a hex value would round.
      defaultValue: "hsl(200, 100%, 40%)",
    })
    // To grey: no saturation.
    key(areaThumb, "Home")
    expect(made.text.peek()).toBe(hsv(0, 0, 80))
    expect(made.color.peek().h).toBe(200)
    expect(hueThumb.getAttribute("aria-valuenow")).toBe("200")
    expect(input("hue").value).toBe("200")
    key(areaThumb, "End")
    expect(made.text.peek()).toBe(hsv(200, 100, 80))
    // To black: no brightness, and the saturation is kept too.
    for (let each = 0; each < 8; each++) key(areaThumb, "PageDown")
    expect(made.text.peek()).toBe("#000000")
    expect(made.color.peek()).toMatchObject({ h: 200, s: 100 })
    key(areaThumb, "PageUp")
    expect(made.text.peek()).toBe(hsv(200, 100, 10))
  })

  it("survives the hue moved while the colour is grey, which changes no value", () => {
    const { hueThumb, areaThumb, key, made, heard, committed } = picker({ defaultValue: "#808080" })
    key(hueThumb, "PageUp")
    expect(made.color.peek().h).toBe(10)
    expect(hueThumb.getAttribute("aria-valuenow")).toBe("10")
    // The value is the same grey: nothing is told.
    expect(heard).toEqual([])
    expect(committed).toEqual([])
    key(areaThumb, "End")
    expect(made.color.peek()).toMatchObject({ h: 10, s: 100 })
  })

  it("survives a grey given by the caller, and an rgb input typed to grey", () => {
    const { props, type, made } = picker({ value: hsv(120, 50, 50) })
    props.set({ ...props.peek(), value: "#808080" })
    expect(made.color.peek().h).toBe(120)
    props.set({ ...props.peek(), value: undefined })
    type("red", "0")
    type("green", "0")
    type("blue", "0")
    expect(made.color.peek().h).toBe(120)
  })
})
