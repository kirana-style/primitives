import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { createMessageScroller } from "../../packages/core/src/message-scroller.ts"
import type { MessageScrollerProps } from "../../packages/core/src/message-scroller.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { find, mount, style } from "./page.ts"

function chat(given: Partial<MessageScrollerProps> = {}, lines = 8) {
  style(`
    .view { height: 100px; overflow-y: auto; }
    .line { height: 20px; margin: 0; }`)
  const root = mount(
    `<div id="root"><div id="view" class="view"><div id="content"></div></div><button id="button">Newest</button></div>`
  )
  const content = find(root, "content")
  const add = (count = 1) => {
    for (let n = 0; n < count; n++) {
      const line = document.createElement("p")
      line.className = "line"
      line.textContent = "Message"
      content.append(line)
    }
  }
  add(lines)
  const heard: [boolean, string][] = []
  const made = createMessageScroller(
    signal<MessageScrollerProps>({
      id: "root",
      onAtBottomChange: (at, details) => void heard.push([at, details.reason]),
      ...given,
    })
  )
  const view = find(root, "view")
  onTestFinished(bind(find(root, "root"), made.root))
  onTestFinished(bind(view, made.viewport))
  onTestFinished(bind(content, made.content))
  onTestFinished(bind(find(root, "button"), made.button))
  const top = () => Math.round(view.scrollTop)
  return { root, view, content, add, made, heard, top }
}

describe("a conversation that follows what is written", () => {
  it("is a log the keyboard reaches, and begins at its newest message", () => {
    const { root, view, top } = chat()
    expect(view.getAttribute("role")).toBe("log")
    expect(view.getAttribute("tabindex")).toBe("0")
    expect(top()).toBe(60)
    expect(find(root, "root").hasAttribute("data-at-bottom")).toBe(true)
    expect(find(root, "button").hasAttribute("inert")).toBe(true)
  })

  it("begins at the first message when it is told to", () => {
    const { root, made, top } = chat({ initial: "top" })
    expect(top()).toBe(0)
    expect(made.atBottom.peek()).toBe(false)
    expect(find(root, "button").hasAttribute("inert")).toBe(false)
  })

  it("follows a message that comes, and one that grows", async () => {
    const { content, add, top } = chat()
    add()
    await expect.poll(top).toBe(80)
    // A message being written gets taller without another being added.
    ;(content.lastElementChild as HTMLElement).style.height = "70px"
    await expect.poll(top).toBe(130)
  })

  it("leaves a reader who scrolled up where they are, and says so", async () => {
    const { root, view, add, made, heard, top } = chat()
    view.scrollTo({ top: 10 })
    await expect.poll(() => made.atBottom.peek()).toBe(false)
    expect(heard).toEqual([[false, "scroll"]])
    expect(find(root, "button").hasAttribute("inert")).toBe(false)
    add(3)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(top()).toBe(10)
  })

  it("follows again once the reader is back at the end", async () => {
    const { view, add, made, top } = chat()
    view.scrollTo({ top: 10 })
    await expect.poll(() => made.atBottom.peek()).toBe(false)
    view.scrollTo({ top: 60 })
    await expect.poll(() => made.atBottom.peek()).toBe(true)
    add()
    await expect.poll(top).toBe(80)
  })

  it("counts as the end anything within its threshold", async () => {
    const { view, add, made, top } = chat({ threshold: 30 })
    view.scrollTo({ top: 40 })
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(made.atBottom.peek()).toBe(true)
    add()
    await expect.poll(top).toBe(80)
  })

  it("goes to the newest by its button, and follows from there", async () => {
    const { root, view, add, made, heard, top } = chat()
    view.scrollTo({ top: 0 })
    await expect.poll(() => made.atBottom.peek()).toBe(false)
    add(2)
    await userEvent.click(find(root, "button"))
    await expect.poll(top).toBe(100)
    await expect.poll(() => made.atBottom.peek()).toBe(true)
    expect(heard.at(-1)![0]).toBe(true)
    add()
    await expect.poll(top).toBe(120)
  })

  it("stays at the end when it is made shorter", async () => {
    const { view, top } = chat()
    view.style.height = "60px"
    await expect.poll(top).toBe(100)
  })
})
