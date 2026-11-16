import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { createPagination } from "../../packages/core/src/pagination.ts"
import type { PaginationProps } from "../../packages/core/src/pagination.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { mount } from "./page.ts"

function pagination(given: Partial<PaginationProps> = {}) {
  const heard: string[] = []
  const props = signal<PaginationProps>({
    id: "p",
    count: 200,
    onPageChange: (page, by) => void heard.push(`${page} ${by.reason}`),
    ...given,
  })
  const made = createPagination(props)
  const row = () =>
    made.entries
      .peek()
      .map((each) => (each.type === "page" ? String(each.page) : "…"))
      .join(" ")
  return { props, made, heard, row }
}

describe("pagination", () => {
  it("lists the ends, the pages around the one shown, and a mark for what is left out", () => {
    const { made, row } = pagination()
    expect(made.pages.peek()).toBe(20)
    expect(row()).toBe("1 2 3 4 5 … 20")
    made.setPage(10, {
      reason: "test",
      event: undefined,
      source: "programmatic",
      cancel() {},
      canceled: false,
    })
    expect(row()).toBe("1 … 9 10 11 … 20")
    made.setPage(19, {
      reason: "test",
      event: undefined,
      source: "programmatic",
      cancel() {},
      canceled: false,
    })
    expect(row()).toBe("1 … 16 17 18 19 20")
  })

  it("keeps the row one length, so a button does not move from under a pointer", () => {
    const { props, made } = pagination({ page: 1 })
    const lengths = new Set<number>()
    for (let page = 1; page <= 20; page++) {
      props.set({ ...props.peek(), page })
      lengths.add(made.entries.peek().length)
    }
    expect([...lengths]).toEqual([7])
  })

  it("lists every page when there are few, and more around with more asked for", () => {
    expect(pagination({ count: 70 }).row()).toBe("1 2 3 4 5 6 7")
    expect(pagination({ count: 0 }).row()).toBe("1")
    const wide = pagination({ defaultPage: 10, siblingCount: 2, boundaryCount: 2 })
    expect(wide.row()).toBe("1 2 … 8 9 10 11 12 … 19 20")
    expect(pagination({ count: 95, pageSize: 25 }).made.pages.peek()).toBe(4)
  })

  it("is a navigation of buttons: the page shown is the current one, and the ends stop", () => {
    const root = mount(
      `<nav class="nav"><button class="prev">‹</button><button class="one">1</button><button class="two">2</button><span class="dots">…</span><button class="next">›</button></nav>`
    )
    const { made, heard } = pagination()
    const find = (name: string) => root.querySelector<HTMLButtonElement>(`.${name}`)!
    onTestFinished(bind(find("nav"), made.root))
    onTestFinished(bind(find("prev"), made.previous))
    onTestFinished(bind(find("next"), made.next))
    onTestFinished(bind(find("one"), made.item(1)))
    onTestFinished(bind(find("two"), made.item(2)))
    onTestFinished(bind(find("dots"), made.ellipsis))
    expect(find("nav").getAttribute("aria-label")).toBe("Pagination")
    expect(find("one").getAttribute("aria-current")).toBe("page")
    expect(find("one").hasAttribute("data-selected")).toBe(true)
    expect(find("two").getAttribute("aria-current")).toBe(null)
    expect(find("two").getAttribute("aria-label")).toBe("Page 2")
    expect(find("prev").disabled).toBe(true)
    expect(find("dots").getAttribute("aria-hidden")).toBe("true")
    find("next").click()
    expect(made.page.peek()).toBe(2)
    expect(find("two").getAttribute("aria-current")).toBe("page")
    expect(find("prev").disabled).toBe(false)
    find("one").click()
    find("one").click()
    expect(heard).toEqual(["2 next-press", "1 item-press"])
  })

  it("holds a page a caller gives to the pages there are, and stays when a caller refuses", () => {
    const { made, props } = pagination({ page: 99, onPageChange: (_page, by) => by.cancel() })
    expect(made.page.peek()).toBe(20)
    made.setPage(3, {
      reason: "test",
      event: undefined,
      source: "programmatic",
      cancel() {},
      canceled: false,
    })
    expect(made.page.peek()).toBe(20)
    props.set({ ...props.peek(), count: 30 })
    expect(made.page.peek()).toBe(3)
  })
})
