import { PersianCalendar } from "@internationalized/date"
import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createCalendar } from "../../packages/core/src/calendar.ts"
import type { CalendarProps, CalendarValue } from "../../packages/core/src/calendar.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import { find, mount } from "./page.ts"

/** Draws a calendar with no framework: its rows again whenever its weeks change. */
function calendar(given: Partial<CalendarProps> = {}, dir?: "rtl") {
  const root = mount(
    `<div id="root"><button id="previous">Previous</button><div id="heading"></div><button id="next">Next</button><table id="grid"><thead><tr id="head"></tr></thead><tbody id="body"></tbody></table></div>`
  )
  if (dir) root.setAttribute("dir", dir)
  const heard: [CalendarValue, string][] = []
  const months: string[] = []
  const props = signal<CalendarProps>({
    id: "cal",
    locale: "en-US",
    defaultFocusedValue: "2026-03-15",
    onValueChange: (value, details) => void heard.push([value, details.reason]),
    onMonthChange: (month) => void months.push(month),
    ...given,
  })
  const made = createCalendar(props)
  const heading = find(root, "heading")
  const grid = find(root, "grid")
  const head = find(root, "head")
  const body = find(root, "body")
  onTestFinished(bind(find(root, "root"), made.root))
  onTestFinished(bind(heading, made.heading))
  onTestFinished(bind(find(root, "previous"), made.previous))
  onTestFinished(bind(find(root, "next"), made.next))
  onTestFinished(bind(grid, made.grid))
  let stops: (() => void)[] = []
  onTestFinished(
    effect(() => {
      heading.textContent = made.title.get()
      const weekdays = made.weekdays.get()
      const weeks = made.weeks.get()
      for (const stop of stops) stop()
      stops = []
      head.replaceChildren()
      body.replaceChildren()
      for (const weekday of weekdays) {
        const cell = document.createElement("th")
        cell.textContent = weekday.short
        head.append(cell)
        stops.push(bind(cell, made.headCell(weekday)))
      }
      for (const week of weeks) {
        const row = document.createElement("tr")
        body.append(row)
        for (const day of week) {
          const cell = document.createElement("td")
          const button = document.createElement("button")
          button.dataset.date = day.date
          button.textContent = day.label
          cell.append(button)
          row.append(cell)
          stops.push(bind(cell, made.cell(day.date)), bind(button, made.day(day.date)))
        }
      }
    })
  )
  onTestFinished(() => stops.forEach((stop) => stop()))
  const day = (date: string) => root.querySelector<HTMLElement>(`[data-date="${date}"]`)!
  const at = () => (document.activeElement as HTMLElement | null)?.dataset.date
  const rows = () => [...body.children].map((row) => row.textContent)
  return { root, props, made, heard, months, heading, grid, head, day, at, rows }
}

const press = (key: string) => userEvent.keyboard(key)

describe("a calendar", () => {
  it("lays a month out as the locale reads one", () => {
    const { heading, head, rows, grid } = calendar()
    expect(heading.textContent).toBe("March 2026")
    expect(head.textContent).toBe("SunMonTueWedThuFriSat")
    expect(head.querySelector("th")!.getAttribute("abbr")).toBe("Sunday")
    expect(rows()).toEqual([
      "1234567",
      "891011121314",
      "15161718192021",
      "22232425262728",
      "2930311234",
    ])
    expect(grid.getAttribute("role")).toBe("grid")
    expect(grid.getAttribute("aria-labelledby")).toBe("cal-heading")
  })

  it("begins its week where the locale does, with its names and its numerals", () => {
    const french = calendar({ locale: "fr-FR" })
    expect(french.heading.textContent).toBe("mars 2026")
    expect(french.head.textContent!.startsWith("lun.")).toBe(true)
    expect(french.rows()[0]).toBe("2324252627281")
    const arabic = calendar({ locale: "ar-EG" })
    expect(arabic.rows()[1]!.startsWith("٧")).toBe(true)
  })

  it("is laid out in the calendar it is given, and its values stay ISO", async () => {
    const { heading, rows, day, heard } = calendar({
      locale: "fa-IR-u-nu-latn",
      calendarSystem: new PersianCalendar(),
    })
    // Esfand 1404 ends on 20 March 2026: the month shown is the Persian one.
    expect(heading.textContent).toContain("1404")
    expect(rows().some((row) => row.includes("242526"))).toBe(true)
    expect(day("2026-03-15").textContent).toBe("24")
    await userEvent.click(day("2026-03-15"))
    expect(heard).toEqual([["2026-03-15", "day-press"]])
  })

  it("says what each day is: today, chosen, of another month", () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const { day } = calendar({ defaultFocusedValue: undefined, defaultValue: today })
    expect(day(today).hasAttribute("data-today")).toBe(true)
    expect(day(today).hasAttribute("data-selected")).toBe(true)
    expect(day(today).parentElement!.getAttribute("aria-selected")).toBe("true")
    expect(day(today).parentElement!.getAttribute("role")).toBe("gridcell")
    const march = calendar()
    expect(march.day("2026-04-01").hasAttribute("data-outside-month")).toBe(true)
    expect(march.day("2026-03-31").hasAttribute("data-outside-month")).toBe(false)
    expect(march.day("2026-03-15").getAttribute("aria-label")).toBe("Sunday, March 15, 2026")
  })

  it("chooses a day by a press, and asks a caller who holds the value", async () => {
    const { day, made, heard } = calendar()
    await userEvent.click(day("2026-03-10"))
    expect(made.value.peek()).toBe("2026-03-10")
    expect(day("2026-03-10").hasAttribute("data-selected")).toBe(true)
    expect(heard).toEqual([["2026-03-10", "day-press"]])
    const held = calendar({ value: "2026-03-05" })
    await userEvent.click(held.day("2026-03-10"))
    expect(held.made.value.peek()).toBe("2026-03-05")
    expect(held.heard).toEqual([["2026-03-10", "day-press"]])
  })

  it("has one day as its stop for Tab, and moves by the keys of a grid", async () => {
    const { root, day, at } = calendar()
    expect(root.querySelectorAll('td button[tabindex="0"]').length).toBe(1)
    day("2026-03-15").focus()
    await press("{ArrowRight}")
    expect(at()).toBe("2026-03-16")
    await press("{ArrowDown}")
    expect(at()).toBe("2026-03-23")
    await press("{ArrowUp}{ArrowLeft}")
    expect(at()).toBe("2026-03-15")
    await press("{End}")
    expect(at()).toBe("2026-03-21")
    await press("{Home}")
    expect(at()).toBe("2026-03-15")
    expect(root.querySelectorAll('td button[tabindex="0"]').length).toBe(1)
    await press("{Enter}")
    expect(day("2026-03-15").hasAttribute("data-selected")).toBe(true)
  })

  it("turns the month when the keys leave it, and focus goes with them", async () => {
    const { heading, day, at, months } = calendar()
    day("2026-03-31").focus()
    await press("{ArrowRight}")
    expect(heading.textContent).toBe("April 2026")
    expect(at()).toBe("2026-04-01")
    await press("{PageDown}")
    expect(at()).toBe("2026-05-01")
    await press("{PageUp}{PageUp}")
    expect(at()).toBe("2026-03-01")
    await press("{Shift>}{PageDown}{/Shift}")
    expect(at()).toBe("2027-03-01")
    expect(heading.textContent).toBe("March 2027")
    expect(months).toEqual(["2026-04-01", "2026-05-01", "2026-04-01", "2026-03-01", "2027-03-01"])
  })

  it("moves the way the text reads", async () => {
    const { day, at } = calendar({ locale: "he-IL" }, "rtl")
    day("2026-03-15").focus()
    await press("{ArrowLeft}")
    expect(at()).toBe("2026-03-16")
    await press("{ArrowRight}{ArrowRight}")
    expect(at()).toBe("2026-03-14")
  })

  it("shows another month by its buttons, and leaves focus where it is", async () => {
    const { root, heading, months } = calendar()
    await userEvent.click(find(root, "next"))
    expect(heading.textContent).toBe("April 2026")
    expect(document.activeElement?.id).toBe("next")
    await userEvent.click(find(root, "previous"))
    await userEvent.click(find(root, "previous"))
    expect(heading.textContent).toBe("February 2026")
    expect(months).toEqual(["2026-04-01", "2026-03-01", "2026-02-01"])
  })

  it("stops at the first and the last day that can be chosen", async () => {
    const { root, day, at, heard } = calendar({ min: "2026-03-10", max: "2026-03-20" })
    expect(find(root, "previous").hasAttribute("disabled")).toBe(true)
    expect(find(root, "next").hasAttribute("disabled")).toBe(true)
    expect(day("2026-03-09").getAttribute("aria-disabled")).toBe("true")
    expect(day("2026-03-09").hasAttribute("data-disabled")).toBe(true)
    // A press the browser would make: a test's own click waits for a day that is "enabled".
    day("2026-03-09").click()
    expect(heard).toEqual([])
    day("2026-03-12").focus()
    await press("{ArrowUp}")
    expect(at()).toBe("2026-03-10")
    await press("{PageDown}")
    expect(at()).toBe("2026-03-20")
  })

  it("reaches a day that cannot be chosen, and does not choose it", async () => {
    const { day, at, heard } = calendar({ isDateUnavailable: (date) => date === "2026-03-16" })
    expect(day("2026-03-16").hasAttribute("data-unavailable")).toBe(true)
    day("2026-03-15").focus()
    await press("{ArrowRight}")
    expect(at()).toBe("2026-03-16")
    await press("{Enter}")
    expect(heard).toEqual([])
  })

  it("chooses nothing while it is read-only or disabled", async () => {
    const readOnly = calendar({ readOnly: true })
    await userEvent.click(readOnly.day("2026-03-10"))
    expect(readOnly.heard).toEqual([])
    expect(readOnly.grid.getAttribute("aria-readonly")).toBe("true")
    const disabled = calendar({ disabled: true })
    disabled.day("2026-03-10").click()
    expect(disabled.heard).toEqual([])
    expect(find(disabled.root, "cal").hasAttribute("data-disabled")).toBe(true)
  })

  it("is always six rows when it is told to be", () => {
    expect(calendar({ fixedWeeks: true }).rows().length).toBe(6)
    expect(calendar({ defaultFocusedValue: "2026-02-10" }).rows().length).toBe(4)
  })

  describe("choosing a first and a last day", () => {
    it("is one calendar in another mode: two presses, in either order", async () => {
      const { grid, day, made, heard } = calendar({ mode: "range" })
      expect(grid.getAttribute("aria-multiselectable")).toBe("true")
      await userEvent.click(day("2026-03-20"))
      // Nothing is chosen until the second.
      expect(made.value.peek()).toBe(null)
      expect(day("2026-03-20").hasAttribute("data-range-start")).toBe(true)
      await userEvent.click(day("2026-03-10"))
      expect(made.value.peek()).toEqual({ start: "2026-03-10", end: "2026-03-20" })
      expect(heard).toEqual([[{ start: "2026-03-10", end: "2026-03-20" }, "day-press"]])
      expect(day("2026-03-10").hasAttribute("data-range-start")).toBe(true)
      expect(day("2026-03-20").hasAttribute("data-range-end")).toBe(true)
      expect(day("2026-03-15").hasAttribute("data-selected")).toBe(true)
      expect(day("2026-03-21").hasAttribute("data-selected")).toBe(false)
    })

    it("shows the range as far as the pointer or the keys while it is chosen", async () => {
      const { day } = calendar({ mode: "range" })
      await userEvent.click(day("2026-03-10"))
      await userEvent.hover(day("2026-03-13"))
      expect(day("2026-03-12").hasAttribute("data-selected")).toBe(true)
      expect(day("2026-03-13").hasAttribute("data-range-end")).toBe(true)
      day("2026-03-13").focus()
      await press("{ArrowDown}")
      expect(day("2026-03-20").hasAttribute("data-range-end")).toBe(true)
      await press("{Enter}")
      expect(day("2026-03-15").hasAttribute("data-selected")).toBe(true)
    })

    it("is given up with Escape", async () => {
      const { day, made, heard } = calendar({
        mode: "range",
        defaultValue: { start: "2026-03-02", end: "2026-03-04" },
      })
      await userEvent.click(day("2026-03-10"))
      expect(day("2026-03-03").hasAttribute("data-selected")).toBe(false)
      await press("{Escape}")
      expect(made.value.peek()).toEqual({ start: "2026-03-02", end: "2026-03-04" })
      expect(day("2026-03-03").hasAttribute("data-selected")).toBe(true)
      expect(heard).toEqual([])
    })
  })

  it("opens on what is chosen, and takes nothing that is no date", () => {
    expect(
      calendar({ defaultFocusedValue: undefined, defaultValue: "2025-12-25" }).heading.textContent
    ).toBe("December 2025")
    expect(
      calendar({ defaultFocusedValue: "not a date", defaultValue: "2025-02-30" }).heading
        .textContent
    ).not.toBe("")
  })
})
