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

/**
 * Several months side by side, each with its heading and grid from `monthAt`, and its days
 * drawn as the month they are in: a day of another month shown is a copy there.
 */
function sideBySide(given: Partial<CalendarProps> = {}) {
  const root = mount(
    `<div id="root"><button id="previous">Previous</button><button id="next">Next</button><div id="months"></div></div>`
  )
  const heard: [CalendarValue, string][] = []
  const turned: [string, string][] = []
  const props = signal<CalendarProps>({
    id: "cal",
    locale: "en-US",
    defaultFocusedValue: "2026-03-15",
    months: 2,
    onValueChange: (value, details) => void heard.push([value, details.reason]),
    onMonthChange: (month, details) => void turned.push([month, details.reason]),
    ...given,
  })
  const made = createCalendar(props)
  const holder = find(root, "months")
  onTestFinished(bind(find(root, "root"), made.root))
  onTestFinished(bind(find(root, "previous"), made.previous))
  onTestFinished(bind(find(root, "next"), made.next))
  let stops: (() => void)[] = []
  onTestFinished(
    effect(() => {
      const shown = made.months.get()
      for (const stop of stops) stop()
      stops = []
      holder.replaceChildren()
      for (const month of shown) {
        const parts = made.monthAt(month.index)
        const box = document.createElement("div")
        box.dataset.month = String(month.index)
        const heading = document.createElement("div")
        heading.className = "heading"
        heading.textContent = month.title
        const grid = document.createElement("table")
        box.append(heading, grid)
        holder.append(box)
        stops.push(bind(heading, parts.heading), bind(grid, parts.grid))
        for (const week of month.weeks) {
          const row = document.createElement("tr")
          grid.append(row)
          for (const day of week) {
            const cell = document.createElement("td")
            const button = document.createElement("button")
            button.dataset.date = day.date
            button.textContent = day.label
            cell.append(button)
            row.append(cell)
            stops.push(
              bind(cell, made.cell(day.date, month.index)),
              bind(button, made.day(day.date, month.index))
            )
          }
        }
      }
    })
  )
  onTestFinished(() => stops.forEach((stop) => stop()))
  /** A day's button in the month at `index`. */
  const day = (date: string, index = 0) =>
    root.querySelector<HTMLElement>(`[data-month="${index}"] [data-date="${date}"]`)!
  const titles = () => [...root.querySelectorAll(".heading")].map((each) => each.textContent)
  const at = () => {
    const active = document.activeElement as HTMLElement | null
    const month = active?.closest<HTMLElement>("[data-month]")?.dataset.month
    return active?.dataset.date && `${active.dataset.date}@${month}`
  }
  const stopsForTab = () =>
    [...root.querySelectorAll<HTMLElement>('td button[tabindex="0"]')].map(
      (each) => `${each.dataset.date}@${each.closest<HTMLElement>("[data-month]")!.dataset.month}`
    )
  return { root, props, made, heard, turned, day, titles, at, stopsForTab }
}

describe("choosing several days", () => {
  it("adds a day pressed and takes it away when it is pressed again", async () => {
    const { day, made, heard, grid } = calendar({ mode: "multiple" })
    expect(made.value.peek()).toEqual([])
    expect(grid.getAttribute("aria-multiselectable")).toBe("true")
    await userEvent.click(day("2026-03-10"))
    await userEvent.click(day("2026-03-12"))
    expect(made.value.peek()).toEqual(["2026-03-10", "2026-03-12"])
    expect(day("2026-03-10").hasAttribute("data-selected")).toBe(true)
    expect(day("2026-03-11").hasAttribute("data-selected")).toBe(false)
    expect(day("2026-03-12").parentElement!.getAttribute("aria-selected")).toBe("true")
    // A list is no range: no first and last.
    expect(day("2026-03-10").hasAttribute("data-range-start")).toBe(false)
    await userEvent.click(day("2026-03-10"))
    expect(made.value.peek()).toEqual(["2026-03-12"])
    expect(heard.map(([value]) => value)).toEqual([
      ["2026-03-10"],
      ["2026-03-10", "2026-03-12"],
      ["2026-03-12"],
    ])
    await press("{ArrowRight}")
    await press("{Enter}")
    expect(made.value.peek()).toEqual(["2026-03-12", "2026-03-11"])
  })

  it("asks a caller who holds the list, and is what the caller says", async () => {
    const held = calendar({ mode: "multiple", value: ["2026-03-02"] })
    await userEvent.click(held.day("2026-03-10"))
    expect(held.heard).toEqual([[["2026-03-02", "2026-03-10"], "day-press"]])
    expect(held.made.value.peek()).toEqual(["2026-03-02"])
    held.props.set({ ...held.props.peek(), value: ["2026-03-02", "2026-03-10"] })
    expect(held.day("2026-03-10").hasAttribute("data-selected")).toBe(true)
  })

  it("keeps to the fewest and the most days it is given", async () => {
    const { day, made } = calendar({
      mode: "multiple",
      defaultValue: ["2026-03-02"],
      minDays: 1,
      maxDays: 2,
    })
    await userEvent.click(day("2026-03-02"))
    expect(made.value.peek()).toEqual(["2026-03-02"])
    await userEvent.click(day("2026-03-03"))
    expect(made.value.peek()).toEqual(["2026-03-02", "2026-03-03"])
    // Full: the other days cannot be chosen, and say so.
    expect(day("2026-03-04").hasAttribute("data-disabled")).toBe(true)
    expect(day("2026-03-04").getAttribute("aria-disabled")).toBe("true")
    expect(day("2026-03-03").hasAttribute("data-disabled")).toBe(false)
    day("2026-03-04").click()
    expect(made.value.peek()).toEqual(["2026-03-02", "2026-03-03"])
    await userEvent.click(day("2026-03-02"))
    expect(made.value.peek()).toEqual(["2026-03-03"])
    expect(day("2026-03-04").hasAttribute("data-disabled")).toBe(false)
  })

  it("is submitted as one entry for each day, and a form's reset puts its first list back", async () => {
    const root = mount(`<form id="form"><input id="input" /></form>`)
    const form = find<HTMLFormElement>(root, "form")
    const input = find<HTMLInputElement>(root, "input")
    const { day, made, heard } = calendar({
      mode: "multiple",
      name: "days",
      defaultValue: ["2026-03-02"],
    })
    onTestFinished(bind(input, made.input))
    expect(input.type).toBe("hidden")
    expect(new FormData(form).getAll("days")).toEqual(["2026-03-02"])
    await userEvent.click(day("2026-03-05"))
    await userEvent.click(day("2026-03-09"))
    expect(new FormData(form).getAll("days")).toEqual(["2026-03-02", "2026-03-05", "2026-03-09"])
    form.reset()
    expect(made.value.peek()).toEqual(["2026-03-02"])
    expect(heard.at(-1)).toEqual([["2026-03-02"], "form-reset"])
    expect(new FormData(form).getAll("days")).toEqual(["2026-03-02"])
    await userEvent.click(day("2026-03-02"))
    // None: nothing is sent.
    expect(new FormData(form).getAll("days")).toEqual([])
  })

  it("submits a day, and a range as its first and last", async () => {
    const root = mount(`<form id="form"><input id="one" /><input id="two" /></form>`)
    const form = find<HTMLFormElement>(root, "form")
    const single = calendar({ name: "day", defaultValue: "2026-03-04" })
    onTestFinished(bind(find(root, "one"), single.made.input))
    const range = calendar({
      name: "stay",
      mode: "range",
      defaultValue: { start: "2026-03-04", end: "2026-03-08" },
    })
    onTestFinished(bind(find(root, "two"), range.made.input))
    expect(new FormData(form).getAll("day")).toEqual(["2026-03-04"])
    expect(new FormData(form).getAll("stay")).toEqual(["2026-03-04", "2026-03-08"])
  })
})

describe("several months", () => {
  it("shows them side by side, each with its heading and its grid", () => {
    const { made, titles, root } = sideBySide()
    expect(made.months.peek().map((each) => each.month)).toEqual(["2026-03-01", "2026-04-01"])
    expect(titles()).toEqual(["March 2026", "April 2026"])
    const grids = [...root.querySelectorAll("table")]
    expect(grids.map((each) => each.id)).toEqual(["cal-grid", "cal-grid-1"])
    expect(grids[1]!.getAttribute("aria-labelledby")).toBe("cal-heading-1")
    expect(find(root, "next").getAttribute("aria-controls")).toBe("cal-grid cal-grid-1")
  })

  it("is one grid for the keys: the arrows go from a month into the next", async () => {
    const { day, at, turned, titles } = sideBySide()
    day("2026-03-31").focus()
    await press("{ArrowRight}")
    expect(at()).toBe("2026-04-01@1")
    await press("{ArrowUp}")
    expect(at()).toBe("2026-03-25@0")
    await press("{PageDown}")
    expect(at()).toBe("2026-04-25@1")
    expect(turned).toEqual([])
    // Past the last month shown, they move by one.
    day("2026-04-30", 1).focus()
    await press("{ArrowRight}")
    expect(titles()).toEqual(["April 2026", "May 2026"])
    expect(at()).toBe("2026-05-01@1")
    expect(turned).toEqual([["2026-04-01", "keyboard"]])
    await press("{PageUp}{PageUp}")
    expect(titles()).toEqual(["March 2026", "April 2026"])
    expect(at()).toBe("2026-03-01@0")
  })

  it("has one stop for Tab, and a day of another month shown is a copy where it fills a week", async () => {
    const { day, stopsForTab, made } = sideBySide({ defaultValue: "2026-04-02" })
    expect(stopsForTab()).toEqual(["2026-03-15@0"])
    // April 2 fills March's last week, and is April's own.
    const copy = day("2026-04-02", 0)
    expect(copy.hasAttribute("data-outside-month")).toBe(true)
    expect(copy.hasAttribute("data-selected")).toBe(false)
    expect(copy.parentElement!.hasAttribute("aria-selected")).toBe(false)
    expect(day("2026-04-02", 1).hasAttribute("data-selected")).toBe(true)
    expect(day("2026-04-02", 1).hasAttribute("data-outside-month")).toBe(false)
    // A day before the first month is in no other month shown: it is the day itself.
    expect(day("2026-03-01", 0).hasAttribute("data-outside-month")).toBe(false)
    expect(day("2026-05-02", 1).hasAttribute("data-outside-month")).toBe(true)
    // A press on a copy chooses the day, and focus goes to it in its own month.
    await userEvent.click(day("2026-04-03", 0))
    expect(made.value.peek()).toBe("2026-04-03")
    expect(document.activeElement).toBe(day("2026-04-03", 1))
    expect(stopsForTab()).toEqual(["2026-04-03@1"])
  })

  it("chooses a range across them", async () => {
    const { day, made } = sideBySide({ mode: "range" })
    await userEvent.click(day("2026-03-28"))
    await userEvent.click(day("2026-04-03", 1))
    expect(made.value.peek()).toEqual({ start: "2026-03-28", end: "2026-04-03" })
    expect(day("2026-03-31").hasAttribute("data-selected")).toBe(true)
    expect(day("2026-04-01", 1).hasAttribute("data-selected")).toBe(true)
    expect(day("2026-04-03", 1).hasAttribute("data-range-end")).toBe(true)
    expect(day("2026-04-03", 0).hasAttribute("data-range-end")).toBe(false)
  })

  it("turns by one month with its buttons, or by all of them when paged", async () => {
    const one = sideBySide()
    await userEvent.click(find(one.root, "next"))
    expect(one.titles()).toEqual(["April 2026", "May 2026"])
    expect(one.turned).toEqual([["2026-04-01", "next"]])
    const paged = sideBySide({ pagedNavigation: true })
    await userEvent.click(find(paged.root, "next"))
    expect(paged.titles()).toEqual(["May 2026", "June 2026"])
    await userEvent.click(find(paged.root, "previous"))
    expect(paged.titles()).toEqual(["March 2026", "April 2026"])
    expect(paged.turned).toEqual([
      ["2026-05-01", "next"],
      ["2026-03-01", "previous"],
    ])
  })

  it("stops its next button where the last month shown reaches the last day", () => {
    const { root } = sideBySide({ max: "2026-04-20" })
    expect(find(root, "next").hasAttribute("disabled")).toBe(true)
  })

  it("lays several months out in the calendar it is given", async () => {
    const { titles, day, made } = sideBySide({
      locale: "fa-IR-u-nu-latn",
      calendarSystem: new PersianCalendar(),
    })
    // Esfand 1404, then Farvardin 1405, which begins on 21 March 2026.
    expect(titles()[0]).toContain("1404")
    expect(titles()[1]).toContain("1405")
    expect(made.months.peek()[1]!.month).toBe("2026-03-21")
    expect(day("2026-03-21", 1).hasAttribute("data-outside-month")).toBe(false)
    day("2026-03-20").focus()
    await press("{ArrowRight}")
    expect(document.activeElement).toBe(day("2026-03-21", 1))
  })
})

describe("the month held by the caller", () => {
  it("shows the month it is given, and tells of the month asked for", async () => {
    const { props, heading, root, months: told } = calendar({ month: "2026-07-09" })
    expect(heading.textContent).toBe("July 2026")
    await userEvent.click(find(root, "next"))
    // Asked, not taken: the caller holds it.
    expect(told).toEqual(["2026-08-01"])
    expect(heading.textContent).toBe("July 2026")
    props.set({ ...props.peek(), month: "2027-01-01" })
    expect(heading.textContent).toBe("January 2027")
  })

  it("hears why the month changed, and may keep it", async () => {
    const reasons: string[] = []
    const { root, heading, day } = calendar({
      onMonthChange: (_month, details) => {
        reasons.push(details.reason)
        if (details.reason === "next") details.cancel()
      },
    })
    await userEvent.click(find(root, "next"))
    expect(heading.textContent).toBe("March 2026")
    await userEvent.click(find(root, "previous"))
    expect(heading.textContent).toBe("February 2026")
    day("2026-02-28").focus()
    await press("{ArrowRight}")
    await userEvent.click(day("2026-04-01"))
    expect(reasons).toEqual(["next", "previous", "keyboard", "day-press"])
  })

  it("starts on its default month, and Tab then reaches a day of it", () => {
    const { heading, root } = calendar({ defaultMonth: "2026-09-20" })
    expect(heading.textContent).toBe("September 2026")
    // The day it opens on is not shown: the stop is the month's first day.
    const stops = [...root.querySelectorAll<HTMLElement>('td button[tabindex="0"]')]
    expect(stops.map((each) => each.dataset.date)).toEqual(["2026-09-01"])
    const chosen = calendar({ defaultMonth: "2026-09-20", defaultValue: "2026-09-12" })
    expect(chosen.root.querySelector('td button[tabindex="0"]')!.getAttribute("aria-label")).toBe(
      "Saturday, September 12, 2026"
    )
  })

  it("is set by a caller's own controls: a month and a year chosen, today", () => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const { props, heading, made } = calendar({ month: "2026-03-01" })
    props.set({ ...props.peek(), month: "2026-11-01" })
    props.set({ ...props.peek(), month: "2030-11-01" })
    expect(heading.textContent).toBe("November 2030")
    props.set({ ...props.peek(), month: thisMonth })
    expect(made.month.peek()).toBe(thisMonth)
    expect(made.focused.peek()).toBe(
      `${thisMonth.slice(0, 8)}${String(now.getDate()).padStart(2, "0")}`
    )
  })

  it("follows the keys into a month the caller has not shown yet, once it is shown", async () => {
    const { props, day, at, months: told } = calendar({ month: "2026-03-01" })
    day("2026-03-15").focus()
    await press("{PageDown}")
    expect(told).toEqual(["2026-04-01"])
    props.set({ ...props.peek(), month: told.at(-1)! })
    expect(at()).toBe("2026-04-15")
  })
})
