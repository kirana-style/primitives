import { describe, expect, it, onTestFinished } from "vite-plus/test"
import { userEvent } from "vite-plus/test/browser"

import { bind } from "../../packages/core/src/bind.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import type { Direction } from "../../packages/core/src/direction.ts"
import { faults, known, recorder } from "../../packages/core/src/testing.ts"
import { createTree } from "../../packages/core/src/tree.ts"
import type { Tree, TreeItemOptions, TreeProps } from "../../packages/core/src/tree.ts"
import { treeVocabulary } from "../../packages/core/src/tree.vocabulary.ts"
import { focused, mount, style } from "./page.ts"

// Three levels: Documents holds Work (which holds Report and Budget), Letter and a disabled
// Old letter; Music holds Song; Notes is a leaf at the top. Every group is in the page from the
// start, as a group its caller keeps mounted is: a closed one is `hidden`.
const PAGE = `
  <button id="before">Before</button>
  <ul id="tree">
    <li id="docs">
      <span id="docs-row"><span id="docs-ind">&gt;</span><span id="docs-text">Documents</span></span>
      <ul id="docs-group">
        <li id="work">
          <span id="work-row"><span id="work-ind">&gt;</span><span id="work-text">Work</span></span>
          <ul id="work-group">
            <li id="report"><span id="report-text">Report</span></li>
            <li id="budget"><span id="budget-text">Budget</span></li>
          </ul>
        </li>
        <li id="letter"><span id="letter-text">Letter</span></li>
        <li id="old"><span id="old-text">Old letter</span></li>
      </ul>
    </li>
    <li id="music">
      <span id="music-row"><span id="music-ind">&gt;</span><span id="music-text">Music</span></span>
      <ul id="music-group"><li id="song"><span id="song-text">Song</span></li></ul>
    </li>
    <li id="notes"><span id="notes-text">Notes</span></li>
  </ul>
  <button id="after">After</button>`

const NODES = ["docs", "work", "report", "budget", "letter", "old", "music", "song", "notes"]
const BRANCHES = new Set(["docs", "work", "music"])

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const press = (key: string) => userEvent.keyboard(key.length === 1 ? key : `{${key}}`)
const attribute = (element: Element, name: string) => element.getAttribute(name)

/** Draws one node's parts on the elements the page has for it (found before any is renamed). */
function draw(
  made: Tree<string>,
  value: string,
  elements: Map<string, HTMLElement>,
  options: () => TreeItemOptions
) {
  const item = made.item(value, options)
  const stops = [bind(elements.get(value)!, item.root)]
  const part = (suffix: string, of: (typeof item)["row"]) => {
    const element = elements.get(`${value}-${suffix}`)
    if (element) stops.push(bind(element, of))
  }
  part("row", item.row)
  part("ind", item.indicator)
  part("text", item.text)
  part("group", item.group)
  stops.push(item.mount())
  const stop = () => {
    for (const each of stops.reverse()) each()
  }
  onTestFinished(stop)
  return { item, stop }
}

function collect(root: HTMLElement) {
  return new Map([...root.querySelectorAll<HTMLElement>("[id]")].map((each) => [each.id, each]))
}

// The page's elements by the ids they had before any part was bound: the tree and the texts
// are given ids of their own by their parts.
let drawnPage = new Map<string, HTMLElement>()
function get(id: string): HTMLElement {
  const element = drawnPage.get(id)
  if (!element) throw new Error(`no #${id} in the page`)
  return element
}

function tree(
  given: Partial<TreeProps<string>> = {},
  page = PAGE,
  direction?: ReturnType<typeof signal<Direction>>
) {
  const root = mount(page)
  const elements = collect(root)
  drawnPage = elements
  const expanded = recorder<string[]>()
  const selected = recorder<string[]>()
  const props = signal<TreeProps<string>>({
    id: "t",
    onExpandedChange: expanded.listen,
    onSelectedChange: selected.listen,
    ...given,
  })
  const made = createTree(props, { direction })
  // Each node's options, which a test may change while it is in the page.
  const extra = signal<Record<string, TreeItemOptions>>({})
  const options = (value: string) => () => ({
    branch: BRANCHES.has(value),
    disabled: value === "old",
    ...extra.get()[value],
  })
  onTestFinished(bind(get("tree"), made.root))
  for (const value of NODES) draw(made, value, elements, options(value))
  onTestFinished(made.mount())
  const node = (value: string) => elements.get(value)!
  return { root, made, props, expanded, selected, extra, elements, node, options }
}

const chosen = (root: HTMLElement) =>
  [...root.querySelectorAll('[aria-selected="true"]')].map((each) => each.id)

describe("a tree", () => {
  it("says what the pattern asks of every node: level, set size, place, open, chosen", async () => {
    const { root, node } = tree({ defaultExpandedValue: ["docs", "work"] })
    await tick()
    expect(attribute(get("tree"), "role")).toBe("tree")
    expect(attribute(get("tree"), "aria-multiselectable")).toBe(null)
    const said = (value: string) =>
      ["aria-level", "aria-setsize", "aria-posinset"].map((name) => attribute(node(value), name))
    expect(said("docs")).toEqual(["1", "3", "1"])
    expect(said("work")).toEqual(["2", "3", "1"])
    expect(said("report")).toEqual(["3", "2", "1"])
    expect(said("budget")).toEqual(["3", "2", "2"])
    expect(said("letter")).toEqual(["2", "3", "2"])
    expect(said("old")).toEqual(["2", "3", "3"])
    expect(said("music")).toEqual(["1", "3", "2"])
    expect(said("song")).toEqual(["2", "1", "1"])
    expect(said("notes")).toEqual(["1", "3", "3"])
    for (const value of NODES) {
      expect(attribute(node(value), "role")).toBe("treeitem")
      expect(attribute(node(value), "aria-selected")).toBe("false")
    }
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
    expect(attribute(node("music"), "aria-expanded")).toBe("false")
    expect(node("music").hasAttribute("data-closed")).toBe(true)
    expect(attribute(node("notes"), "aria-expanded")).toBe(null)
    expect(node("notes").hasAttribute("data-closed")).toBe(false)
    expect(attribute(node("old"), "aria-disabled")).toBe("true")
    expect(node("old").hasAttribute("data-disabled")).toBe(true)
    // A branch's group is its child, and a closed one is not shown.
    expect(attribute(get("docs-group"), "role")).toBe("group")
    expect(get("docs-group").hidden).toBe(false)
    expect(get("music-group").hidden).toBe(true)
    // Named by its text alone, not by the children it holds.
    const name = attribute(node("docs"), "aria-labelledby")!
    expect(document.getElementById(name)?.textContent).toBe("Documents")
    expect(faults(root, known(treeVocabulary))).toEqual([])
  })

  it("is one stop for Tab: the first node while none is chosen, and left by Tab", async () => {
    tree()
    await tick()
    expect(attribute(get("docs"), "tabindex")).toBe("0")
    expect(attribute(get("notes"), "tabindex")).toBe("-1")
    get("before").focus()
    await press("Tab")
    expect(focused()).toBe("docs")
    await press("ArrowDown")
    expect(focused()).toBe("music")
    // While focus is in the tree, the node it is on is the stop.
    expect(attribute(get("music"), "tabindex")).toBe("0")
    expect(attribute(get("docs"), "tabindex")).toBe("-1")
    await press("Tab")
    expect(focused()).toBe("after")
  })

  it("is entered at the chosen node, and left backwards by Shift+Tab", async () => {
    tree({ defaultExpandedValue: ["docs"], defaultSelectedValue: ["letter"] })
    await tick()
    get("before").focus()
    await press("Tab")
    expect(focused()).toBe("letter")
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focused()).toBe("before")
  })

  it("moves Up and Down over the nodes that are shown, past disabled ones; Home and End", async () => {
    tree({ defaultExpandedValue: ["docs", "work"] })
    await tick()
    get("before").focus()
    await press("Tab")
    const seen = [focused()]
    for (let step = 0; step < 7; step++) {
      await press("ArrowDown")
      seen.push(focused())
    }
    // Past Old letter (disabled) and Song (in a closed branch); no further than the last.
    expect(seen).toEqual(["docs", "work", "report", "budget", "letter", "music", "notes", "notes"])
    expect(get("notes").hasAttribute("data-highlighted")).toBe(true)
    await press("ArrowUp")
    expect(focused()).toBe("music")
    await press("Home")
    expect(focused()).toBe("docs")
    await press("End")
    expect(focused()).toBe("notes")
  })

  it("opens a branch with Right then goes to its first child; Left closes it, then goes up", async () => {
    const { expanded } = tree()
    await tick()
    get("before").focus()
    await press("Tab")
    await press("ArrowRight")
    expect(attribute(get("docs"), "aria-expanded")).toBe("true")
    expect(focused()).toBe("docs")
    await press("ArrowRight")
    expect(focused()).toBe("work")
    await press("ArrowRight")
    await press("ArrowRight")
    expect(focused()).toBe("report")
    // A leaf goes nowhere.
    await press("ArrowRight")
    expect(focused()).toBe("report")
    await press("ArrowLeft")
    expect(focused()).toBe("work")
    await press("ArrowLeft")
    expect(attribute(get("work"), "aria-expanded")).toBe("false")
    expect(focused()).toBe("work")
    await press("ArrowLeft")
    expect(focused()).toBe("docs")
    await press("ArrowLeft")
    await press("ArrowLeft")
    expect(focused()).toBe("docs")
    expect(expanded.said()).toEqual([
      "docs keyboard",
      "docs,work keyboard",
      "docs keyboard",
      " keyboard",
    ])
  })

  it("follows the reading direction: right to left, Left opens and Right closes", async () => {
    tree()
    get("tree").dir = "rtl"
    await tick()
    get("before").focus()
    await press("Tab")
    await press("ArrowLeft")
    expect(attribute(get("docs"), "aria-expanded")).toBe("true")
    await press("ArrowLeft")
    expect(focused()).toBe("work")
    await press("ArrowRight")
    expect(focused()).toBe("docs")
    await press("ArrowRight")
    expect(attribute(get("docs"), "aria-expanded")).toBe("false")
  })

  it("follows a direction provider over the page's own", async () => {
    tree({}, PAGE, signal<Direction>("rtl"))
    await tick()
    get("before").focus()
    await press("Tab")
    await press("ArrowLeft")
    expect(attribute(get("docs"), "aria-expanded")).toBe("true")
  })

  it("chooses with Enter or a press, which also opens or closes a branch", async () => {
    const { root, node, selected, expanded, props } = tree()
    await tick()
    get("before").focus()
    await press("Tab")
    await press("Enter")
    expect(chosen(root)).toEqual(["docs"])
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
    await press("Enter")
    expect(chosen(root)).toEqual(["docs"])
    expect(attribute(node("docs"), "aria-expanded")).toBe("false")
    await userEvent.click(get("music-text"))
    expect(focused()).toBe("music")
    expect(chosen(root)).toEqual(["music"])
    expect(attribute(node("music"), "aria-expanded")).toBe("true")
    expect(get("music-row").hasAttribute("data-selected")).toBe(true)
    // A press on a child is the child's, not its parent's too.
    await userEvent.click(get("song"))
    expect(chosen(root)).toEqual(["song"])
    expect(attribute(node("music"), "aria-expanded")).toBe("true")
    // Enter is the node's own press.
    expect(selected.said()).toEqual(["docs item-press", "music item-press", "song item-press"])
    // The indicator opens and closes, and chooses nothing.
    await userEvent.click(get("music-ind"))
    expect(attribute(node("music"), "aria-expanded")).toBe("false")
    expect(chosen(root)).toEqual(["song"])
    expect(expanded.said().at(-1)).toBe(" indicator-press")
    // Without `expandOnClick` a press only chooses; the indicator still opens.
    props.set({ ...props.peek(), expandOnClick: false })
    await userEvent.click(get("docs-text"))
    expect(chosen(root)).toEqual(["docs"])
    expect(attribute(node("docs"), "aria-expanded")).toBe("false")
    await userEvent.click(get("docs-ind"))
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
  })

  it("opens every closed branch beside the node with *", async () => {
    const { expanded } = tree()
    await tick()
    get("before").focus()
    await press("Tab")
    await press("*")
    expect(expanded.said()).toEqual(["docs,music keyboard"])
    expect(attribute(get("work"), "aria-expanded")).toBe("false")
    expect(focused()).toBe("docs")
  })

  it("finds a shown node by typing its name", async () => {
    tree({ defaultExpandedValue: ["docs"] })
    await tick()
    get("before").focus()
    await press("Tab")
    await press("l")
    expect(focused()).toBe("letter")
    await new Promise((resolve) => setTimeout(resolve, 600))
    await press("n")
    expect(focused()).toBe("notes")
    await new Promise((resolve) => setTimeout(resolve, 600))
    // Song is in a closed branch, and Old letter is disabled: neither is found.
    await press("s")
    expect(focused()).toBe("notes")
    await new Promise((resolve) => setTimeout(resolve, 600))
    await press("o")
    expect(focused()).toBe("notes")
  })

  it("passes over a disabled node, which no press chooses", async () => {
    const { root, node, selected } = tree({ defaultExpandedValue: ["docs"] })
    await tick()
    await userEvent.click(get("old-text"))
    expect(chosen(root)).toEqual([])
    expect(focused()).not.toBe("old")
    expect(attribute(node("old"), "tabindex")).toBe("-1")
    expect(selected.said()).toEqual([])
  })

  it("chooses several with Ctrl, Shift, Space and Ctrl+A", async () => {
    const { root, node, made } = tree({
      selectionMode: "multiple",
      defaultExpandedValue: ["docs", "work"],
    })
    await tick()
    expect(attribute(get("tree"), "aria-multiselectable")).toBe("true")
    const click = (value: string, modifiers: MouseEventInit = {}) =>
      node(value).dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, ...modifiers })
      )
    click("report")
    expect(chosen(root)).toEqual(["report"])
    click("letter", { ctrlKey: true })
    expect(chosen(root)).toEqual(["report", "letter"])
    click("report", { metaKey: true })
    expect(chosen(root)).toEqual(["letter"])
    // A press with no key held chooses that one alone, and is where a range begins.
    click("budget")
    expect(chosen(root)).toEqual(["budget"])
    // The range in the page's order, past the disabled node.
    click("music", { shiftKey: true })
    expect(made.selectedValue.peek()).toEqual(["budget", "letter", "music"])
    expect(attribute(node("music"), "aria-expanded")).toBe("false")
    // Space adds or takes away the node focus is on.
    node("notes").focus()
    await press(" ")
    expect(chosen(root)).toEqual(["budget", "letter", "music", "notes"])
    await press(" ")
    expect(chosen(root)).toEqual(["budget", "letter", "music"])
    // Shift with an arrow moves and takes the range from where it began.
    await userEvent.keyboard("{Shift>}{ArrowUp}{ArrowUp}{/Shift}")
    expect(focused()).toBe("letter")
    expect(made.selectedValue.peek()).toEqual(["letter", "music", "notes"])
    await userEvent.keyboard("{Control>}a{/Control}")
    expect(chosen(root)).toEqual(["docs", "work", "report", "budget", "letter", "music", "notes"])
  })

  it("chooses nothing in `none`: a press only opens or closes", async () => {
    const { root, node, selected } = tree({ selectionMode: "none" })
    await tick()
    expect(attribute(node("docs"), "aria-selected")).toBe(null)
    await userEvent.click(get("docs-text"))
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
    await press(" ")
    await press("Enter")
    expect(attribute(node("docs"), "aria-expanded")).toBe("false")
    expect(selected.said()).toEqual([])
    expect(root.querySelector("[data-selected]")).toBe(null)
  })

  it("draws a branch's group in through its entrance and out through its exit", async () => {
    style(`#docs-group { transition: opacity 150ms } #docs-group[data-ending-style] { opacity: 0 }`)
    const { root } = tree()
    const group = get("docs-group")
    await tick()
    expect(group.hidden).toBe(true)
    await userEvent.click(get("docs-ind"))
    expect(group.hidden).toBe(false)
    expect(group.hasAttribute("data-open")).toBe(true)
    await expect.poll(() => group.style.getPropertyValue("--tree-group-height")).toBe("auto")
    await userEvent.click(get("docs-ind"))
    // Through its exit it is in the page, at the height it had, then it is gone.
    expect(group.hasAttribute("data-ending-style")).toBe(true)
    expect(group.hasAttribute("data-closed")).toBe(true)
    expect(group.hidden).toBe(false)
    expect(group.style.getPropertyValue("--tree-group-height")).toMatch(/px$/)
    await expect.poll(() => group.hidden).toBe(true)
    expect(group.hasAttribute("data-ending-style")).toBe(false)
    expect(faults(root, known(treeVocabulary))).toEqual([])
  })

  it("keeps what it was refused", async () => {
    const { root, node, expanded, selected } = tree({ defaultExpandedValue: ["docs"] })
    await tick()
    expanded.refuse()
    selected.refuse()
    node("music").focus()
    // Not opened, so focus does not go in.
    await press("ArrowRight")
    await press("ArrowRight")
    expect(attribute(node("music"), "aria-expanded")).toBe("false")
    expect(focused()).toBe("music")
    node("docs").focus()
    await press("ArrowLeft")
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
    expect(focused()).toBe("docs")
    await press("Enter")
    expect(chosen(root)).toEqual([])
    expect(attribute(node("docs"), "aria-expanded")).toBe("true")
    expect(expanded.said()).toEqual([
      "docs,music keyboard",
      "docs,music keyboard",
      " keyboard",
      " item-press",
    ])
    expect(selected.said()).toEqual(["docs item-press"])
  })

  it("shows the values its caller holds, and only those", async () => {
    const heard: string[] = []
    const { root, node, props } = tree({
      expandedValue: ["docs"],
      selectedValue: [],
      onExpandedChange: (value) => void heard.push(`open ${value}`),
      onSelectedChange: (value) => void heard.push(`chose ${value}`),
    })
    await tick()
    await userEvent.click(get("work-text"))
    expect(heard).toEqual(["chose work", "open docs,work"])
    expect(chosen(root)).toEqual([])
    expect(attribute(node("work"), "aria-expanded")).toBe("false")
    props.set({ ...props.peek(), expandedValue: ["docs", "work"], selectedValue: ["work"] })
    await tick()
    expect(chosen(root)).toEqual(["work"])
    expect(attribute(node("work"), "aria-expanded")).toBe("true")
    // The caller closes the branch around the node focus is on: focus goes to the branch.
    node("budget").focus()
    props.set({ ...props.peek(), expandedValue: [] })
    await tick()
    expect(focused()).toBe("docs")
  })

  it("says the loading of a branch's children", async () => {
    const { node, extra } = tree()
    extra.set({ music: { loading: true } })
    await tick()
    expect(attribute(node("music"), "aria-busy")).toBe("true")
    expect(node("music").hasAttribute("data-loading")).toBe(true)
    expect(get("music-ind").hasAttribute("data-loading")).toBe(true)
    extra.set({})
    expect(attribute(node("music"), "aria-busy")).toBe(null)
    expect(node("music").hasAttribute("data-loading")).toBe(false)
  })

  it("reads nodes that come, go and move while it is in the page", async () => {
    const { root, node, made, options } = tree({ defaultExpandedValue: ["docs", "work"] })
    await tick()
    const memo = document.createElement("li")
    memo.id = "memo"
    memo.textContent = "Memo"
    get("work-group").append(memo)
    const drawn = draw(made, "memo", new Map([["memo", memo]]), options("memo"))
    await tick()
    expect(attribute(memo, "aria-level")).toBe("3")
    expect(attribute(memo, "aria-posinset")).toBe("3")
    expect(attribute(node("report"), "aria-setsize")).toBe("3")
    node("budget").focus()
    await press("ArrowDown")
    expect(focused()).toBe("memo")
    // Moved to the front by the page: read again.
    get("work-group").prepend(memo)
    await tick()
    expect(attribute(memo, "aria-posinset")).toBe("1")
    expect(attribute(node("report"), "aria-posinset")).toBe("2")
    // Taken out.
    drawn.stop()
    memo.remove()
    await tick()
    expect(attribute(node("report"), "aria-setsize")).toBe("2")
    expect(attribute(node("report"), "aria-posinset")).toBe("1")
    expect(attribute(node("budget"), "aria-posinset")).toBe("2")
    // The node focus was on left: the first node is the stop again.
    expect(attribute(node("docs"), "tabindex")).toBe("0")
    expect(root.querySelectorAll('[tabindex="0"]').length).toBe(1)
  })

  it("takes a level from its adapter, and is drawn by a server with no page", () => {
    const made = createTree(signal<TreeProps<string>>({ id: "s", defaultSelectedValue: ["notes"] }))
    const docs = made.item("docs", () => ({ branch: true, level: 1 }))
    const notes = made.item("notes", () => ({ level: 1 }))
    expect(docs.root.props.peek()).toMatchObject({
      role: "treeitem",
      tabindex: "-1",
      "aria-level": "1",
      "aria-expanded": "false",
      "aria-selected": "false",
    })
    expect(notes.root.props.peek()).toMatchObject({ tabindex: "0", "aria-selected": "true" })
    expect(docs.group.props.peek()).toMatchObject({ role: "group", hidden: "" })
    // With nothing chosen, the first node made is the stop.
    const plain = createTree(signal<TreeProps<string>>({ id: "p" }))
    expect(plain.item("a").root.props.peek().tabindex).toBe("0")
    expect(plain.item("b").root.props.peek().tabindex).toBe("-1")
  })
})
