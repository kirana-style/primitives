import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createQrCode } from "../../packages/core/src/qr-code.ts"
import type { QrCodeProps } from "../../packages/core/src/qr-code.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { qr, qrPath } from "../../packages/core/src/services/qr.ts"
import { find, mount } from "./page.ts"

const hash = (text: string) => {
  let value = 5381
  for (const each of text) value = ((value * 33) ^ each.charCodeAt(0)) >>> 0
  return value
}
const rows = (text: string, level: "L" | "M" | "Q" | "H") => {
  const symbol = qr(text, level)
  return Array.from({ length: symbol.size }, (_, y) =>
    Array.from({ length: symbol.size }, (__, x) => (symbol.dark(x, y) ? "#" : ".")).join("")
  )
}

describe("a QR code's modules", () => {
  // Each of these was compared, module for module, with another encoder's (and so were 188
  // more: every version's edge, at each correction).
  it("is the symbol a reader expects, to the module", () => {
    expect(rows("A", "L")).toEqual([
      "#######..#.##.#######",
      "#.....#..###..#.....#",
      "#.###.#.##.##.#.###.#",
      "#.###.#..#.#..#.###.#",
      "#.###.#...#.#.#.###.#",
      "#.....#.....#.#.....#",
      "#######.#.#.#.#######",
      "........##.##........",
      "###.########.##...#..",
      "#.##....#.....#...##.",
      ".#.####..##.#...#...#",
      ".#.##...##....#...#..",
      "..##.##.#...#.#.#.#.#",
      "........#..#.#.#.#.#.",
      "#######.#.##.###.####",
      "#.....#.######.###...",
      "#.###.#.##.#.###.##.#",
      "#.###.#..##...#...##.",
      "#.###.#.##..#...#...#",
      "#.....#.#.....#...##.",
      "#######.###.#.#.#.###",
    ])
  })

  it("grows with the text and with the correction asked for", () => {
    const link = "https://kirana.style"
    expect([qr(link, "M").size, hash(qrPath(qr(link, "M")))]).toEqual([25, 211218534])
    expect([qr(link, "H").size, hash(qrPath(qr(link, "H")))]).toEqual([29, 3971496186])
    const long = "x".repeat(500)
    expect([qr(long, "L").size, hash(qrPath(qr(long, "L")))]).toEqual([77, 53304286])
  })

  it("writes any text, as UTF-8", () => {
    const text = "héllo wörld ✓"
    expect([qr(text, "Q").size, hash(qrPath(qr(text, "Q")))]).toEqual([25, 673538086])
  })

  it("holds 2,953 bytes at the least correction, and says so past that", () => {
    expect(qr("x".repeat(2953), "L").size).toBe(177)
    expect(() => qr("x".repeat(2954), "L")).toThrow(RangeError)
    expect(() => qr("x".repeat(1274), "H")).toThrow(RangeError)
  })
})

describe("a QR code in the page", () => {
  function code(given: Partial<QrCodeProps> = {}) {
    const root = mount(
      `<div id="root"><svg id="frame" xmlns="http://www.w3.org/2000/svg"><path id="pattern"/></svg></div>`
    )
    const props = signal<QrCodeProps>({ id: "root", value: "https://kirana.style", ...given })
    const made = createQrCode(props)
    onTestFinished(bind(find(root, "root"), made.root))
    onTestFinished(bind(root.querySelector<HTMLElement>("#frame")!, made.frame))
    onTestFinished(bind(root.querySelector<HTMLElement>("#pattern")!, made.pattern))
    return { root, props, made }
  }

  it("is one path in a drawing a module to the unit", () => {
    const { root } = code()
    const frame = root.querySelector("#frame")!
    expect(frame.getAttribute("viewBox")).toBe("0 0 25 25")
    expect(frame.getAttribute("role")).toBe("img")
    expect(root.querySelector("#pattern")!.getAttribute("d")).toMatch(/^M0 0h7v1h-7z/)
  })

  it("is drawn again when what it says changes", () => {
    const { root, props } = code()
    const before = root.querySelector("#pattern")!.getAttribute("d")
    props.set({ id: "root", value: "https://kirana.style/docs", correction: "H" })
    expect(root.querySelector("#frame")!.getAttribute("viewBox")).toBe("0 0 33 33")
    expect(root.querySelector("#pattern")!.getAttribute("d")).not.toBe(before)
  })

  it("says so, and draws nothing, when the text is longer than a code holds", () => {
    const { root, made } = code({ value: "x".repeat(3000) })
    expect(made.symbol.peek()).toBeUndefined()
    expect(find(root, "root").hasAttribute("data-invalid")).toBe(true)
    expect(root.querySelector("#pattern")!.getAttribute("d")).toBe("")
  })
})
