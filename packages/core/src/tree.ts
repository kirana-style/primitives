import { directionOf } from "./direction.ts"
import type { DirectionAround } from "./direction.ts"
import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createList } from "./services/list.ts"
import type { ListRow } from "./services/list.ts"
import { createPanelPresence } from "./services/panel.ts"
import { textOf } from "./services/typeahead.ts"

/** Whether a tree's nodes can be chosen, and how many at once. */
export type TreeSelectionMode = "none" | "single" | "multiple"

export interface TreeProps<Value = unknown> {
  /** Unique in the page; the adapter passes its framework's id. */
  id: string
  /** The values of the open branches. */
  expandedValue?: readonly Value[] | undefined
  /** The branches open at first, when the caller does not hold `expandedValue`. Read once. */
  defaultExpandedValue?: readonly Value[] | undefined
  /**
   * Heard as a branch is about to open or close, with the values that would then be open:
   * `details.cancel()` keeps them as they were. A page that loads a branch's children loads
   * them when this says the branch opened.
   */
  onExpandedChange?: ((value: Value[], details: ChangeDetails) => void) | undefined
  /** Whether nodes can be chosen: none, one, or several. Default `single`. */
  selectionMode?: TreeSelectionMode | undefined
  /** The values of the chosen nodes. */
  selectedValue?: readonly Value[] | undefined
  /** The nodes chosen at first, when the caller does not hold `selectedValue`. Read once. */
  defaultSelectedValue?: readonly Value[] | undefined
  /**
   * Heard as nodes are about to be chosen or taken away, with the values there would then be:
   * `details.cancel()` keeps them as they were.
   */
  onSelectedChange?: ((value: Value[], details: ChangeDetails) => void) | undefined
  /** Whether a press on a branch (or Enter on it) also opens or closes it. Default `true`. */
  expandOnClick?: boolean | undefined
}

export interface TreeItemOptions {
  /** A branch: it has children, drawn in its group, and opens and closes. A leaf without it. */
  branch?: boolean | undefined
  /** Disables this node: it cannot be chosen, opened or closed, and the keys pass over it. */
  disabled?: boolean | undefined
  /** A branch whose children are being loaded: `aria-busy` and `data-loading` while it is. */
  loading?: boolean | undefined
  /** What typing matches; the node's text when left out. */
  label?: string | undefined
  /**
   * Its depth from 1, when the adapter knows it from how its parts are nested, so a server
   * writes it. Read from the page when left out.
   */
  level?: number | undefined
}

/** One node of a tree: its own state, and the parts that draw it. */
export interface TreeItem {
  /** Whether this branch is open. */
  readonly expanded: ReadonlySignal<boolean>
  /** Whether this node is chosen. */
  readonly selected: ReadonlySignal<boolean>
  /** Whether the branch's group is in the page: `true` through its exit's motion. */
  readonly mounted: ReadonlySignal<boolean>
  mount(): () => void
  /** The node: a leaf, or a branch that holds its row and its group. */
  readonly root: Part
  /** The line the node draws: its indicator and its text, apart from its children. */
  readonly row: Part
  /** The node's name. */
  readonly text: Part
  /** The mark that says whether a branch is open; a press on it opens or closes the branch. */
  readonly indicator: Part
  /** A branch's children. In the page while it is open, and through its exit's motion. */
  readonly group: Part
}

export interface Tree<Value = unknown> {
  readonly expandedValue: ReadonlySignal<readonly Value[]>
  readonly selectedValue: ReadonlySignal<readonly Value[]>
  setExpanded(value: Value[], details: ChangeDetails): void
  setSelected(value: Value[], details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** A node, by its value, which is unique in the tree. */
  item(value: Value, options?: () => TreeItemOptions): TreeItem
}

/** Where a node stands among the nodes in the page. */
interface Placed {
  level: number
  size: number
  position: number
}

interface Entry<Value> {
  value: Value
  row: ListRow
  options: () => TreeItemOptions
}

const NOTHING = () => {}
const NONE: readonly never[] = []
const NOWHERE: ReadonlyMap<HTMLElement, Placed> = new Map()

const slug = (value: unknown) =>
  String(value).replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0)}`)

const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((each, index) => Object.is(each, b[index]))

/** A node's own text: its row's, without the children its group holds. */
function ownText(element: Element): string {
  let text = ""
  for (const node of element.childNodes) {
    if (node.nodeType === 3) text += node.nodeValue ?? ""
    else if (
      node instanceof Element &&
      !node.hasAttribute("hidden") &&
      node.getAttribute("aria-hidden") !== "true" &&
      node.getAttribute("role") !== "group" &&
      node.getAttribute("role") !== "treeitem"
    )
      text += ownText(node)
  }
  return text.replace(/\s+/g, " ").trim()
}

/**
 * A tree view, as the WAI-ARIA pattern has it: nodes the page draws, each a `treeitem` that
 * holds its row and, for a branch, the `group` of its children. Nothing is asked of the caller
 * as data: the nodes, their order, their depth and their place among their siblings are read
 * from the page when a key or an attribute needs them, so a branch's children can be drawn,
 * loaded or taken away at any time. One stop for Tab, real focus on the node.
 */
export function createTree<Value = unknown>(
  props: ReadonlySignal<TreeProps<Value>>,
  around: DirectionAround = {}
): Tree<Value> {
  const id = props.peek().id
  const expanded = bindable<readonly Value[]>({
    value: () => props.get().expandedValue,
    defaultValue: props.peek().defaultExpandedValue ?? NONE,
    onChange: (next, by) => props.peek().onExpandedChange?.([...next], by),
    equals: same,
  })
  const selected = bindable<readonly Value[]>({
    value: () => props.get().selectedValue,
    defaultValue: props.peek().defaultSelectedValue ?? NONE,
    onChange: (next, by) => props.peek().onSelectedChange?.([...next], by),
    equals: same,
  })
  const open = computed(() => new Set(expanded.get()))
  const chosen = computed(() => new Set(selected.get()))
  const mode = computed<TreeSelectionMode>(() => props.get().selectionMode ?? "single")

  // The nodes in the page, by their element. Read in the page's order when a key needs them.
  const byElement = new Map<HTMLElement, Entry<Value>>()
  const byRow = new WeakMap<ListRow, Entry<Value>>()
  let rootElement: HTMLElement | undefined
  // The value of the first node made: the stop for Tab on a server, which has no page to read.
  let firstMade: { value: Value } | undefined
  // The node a range of several begins at: the last one chosen alone, or added or taken away.
  let anchor: { value: Value } | undefined
  // Whether focus is in the tree: the node it is on is then the stop for Tab.
  const within = signal(false)
  // Bumped when nodes come, go or move: what is read from the page is read again.
  const structure = signal(0)
  let queued = false
  function changed() {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      structure.set(structure.peek() + 1)
    })
  }

  /** The node an element stands in: itself, or the nearest node around it, in this tree. */
  function nodeAt(target: EventTarget | null): HTMLElement | undefined {
    for (let at = target instanceof Element ? target : null; at; at = at.parentElement) {
      if (byElement.has(at as HTMLElement)) return at as HTMLElement
      // A tree inside one of this tree's nodes keeps its own nodes.
      if (at === rootElement || at.getAttribute("role") === "tree") return undefined
    }
    return undefined
  }

  /** The node a node is a child of, or `undefined` for one at the top. */
  function parentOf(element: HTMLElement): HTMLElement | undefined {
    return nodeAt(element.parentElement)
  }

  /** Whether every branch around a node is open. Followed when read in a computed. */
  function shown(element: HTMLElement): boolean {
    const now = open.get()
    for (let up = parentOf(element); up; up = parentOf(up)) {
      if (!now.has(byElement.get(up)!.value)) return false
    }
    return true
  }

  const list = createList({ selector: '[role="treeitem"]' })

  // Each node's depth and place among its siblings, read from the page in one pass.
  const layout = computed<ReadonlyMap<HTMLElement, Placed>>(() => {
    structure.get()
    const root = rootElement
    if (!root) return NOWHERE
    const elements = [...byElement.keys()]
      .filter((each) => each.isConnected && root.contains(each))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    const placed = new Map<HTMLElement, Placed>()
    const siblings = new Map<HTMLElement | undefined, HTMLElement[]>()
    for (const element of elements) {
      const parent = parentOf(element)
      const level = parent ? (placed.get(parent)?.level ?? 0) + 1 : 1
      const set = siblings.get(parent) ?? []
      set.push(element)
      siblings.set(parent, set)
      placed.set(element, { level, size: 0, position: set.length })
    }
    for (const set of siblings.values()) for (const each of set) placed.get(each)!.size = set.length
    return placed
  })

  // The node that is the stop for Tab: the one focus is on while it is in the tree; otherwise
  // the first chosen node that is shown, or the first shown. `undefined` before the tree is in
  // a page, where each node decides from what it knows (`fallback` below).
  const stop = computed<{ element: HTMLElement | undefined } | undefined>(() => {
    structure.get()
    open.get()
    const now = chosen.get()
    const focus = within.get() ? list.highlighted.get()?.element() : undefined
    if (focus) return { element: focus }
    if (!rootElement) return undefined
    const rows = list.rows()
    const pick =
      (mode.get() === "none" ? undefined : rows.find((row) => now.has(byRow.get(row)!.value))) ??
      rows[0]
    return { element: pick?.element() }
  })

  function entryOf(row: ListRow | undefined) {
    return row ? byRow.get(row) : undefined
  }

  const setExpanded = (next: Value[], by: ChangeDetails) => expanded.set(next, by)
  const setSelected = (next: Value[], by: ChangeDetails) => selected.set(next, by)

  function toggle(value: Value, by: ChangeDetails) {
    const now = expanded.peek()
    setExpanded(
      open.peek().has(value) ? now.filter((each) => !Object.is(each, value)) : [...now, value],
      by
    )
  }

  function only(value: Value, by: ChangeDetails) {
    anchor = { value }
    setSelected([value], by)
  }

  function flip(value: Value, by: ChangeDetails) {
    anchor = { value }
    const now = selected.peek()
    setSelected(
      chosen.peek().has(value) ? now.filter((each) => !Object.is(each, value)) : [...now, value],
      by
    )
  }

  /** Chooses the shown nodes from the anchor to `value`, in the page's order. */
  function range(value: Value, by: ChangeDetails) {
    const values = list.rows().map((row) => byRow.get(row)!.value)
    const to = values.findIndex((each) => Object.is(each, value))
    const from = anchor ? values.findIndex((each) => Object.is(each, anchor!.value)) : -1
    if (to < 0) return
    if (from < 0) return only(value, by)
    setSelected(values.slice(Math.min(from, to), Math.max(from, to) + 1), by)
  }

  /** What a press on a node, or Enter, does: chooses it, and opens or closes a branch. */
  function press(entry: Entry<Value>, event: MouseEvent) {
    const multiple = mode.peek() === "multiple"
    const several = event.ctrlKey || event.metaKey
    if (mode.peek() !== "none") {
      const by = details("item-press", event)
      if (multiple && event.shiftKey) range(entry.value, by)
      else if (multiple && several) flip(entry.value, by)
      else if (!chosen.peek().has(entry.value) || selected.peek().length > 1) only(entry.value, by)
      else anchor = { value: entry.value }
    }
    const plain = !event.shiftKey && !several
    if (entry.options().branch && plain && (props.peek().expandOnClick ?? true))
      toggle(entry.value, details("item-press", event))
  }

  function key(event: KeyboardEvent) {
    const element = event.target as HTMLElement
    const entry = byElement.get(element)
    // A key in a control a row holds (a text field for a new name) is the control's.
    if (!entry) return
    list.highlight(entry.row)
    const options = entry.options()
    const multiple = mode.peek() === "multiple"
    const rtl = directionOf(element, around.direction) === "rtl"
    const inward = rtl ? "ArrowLeft" : "ArrowRight"
    const outward = rtl ? "ArrowRight" : "ArrowLeft"
    const by = () => details("keyboard", event)

    if (event.key === inward) {
      event.preventDefault()
      if (!options.branch || options.disabled) return
      if (!open.peek().has(entry.value)) return setExpanded([...expanded.peek(), entry.value], by())
      const child = list.rows().find((row) => {
        const own = row.element()
        return own !== undefined && parentOf(own) === element
      })
      if (child) list.highlight(child, true)
      return
    }
    if (event.key === outward) {
      event.preventDefault()
      if (options.branch && !options.disabled && open.peek().has(entry.value)) {
        return setExpanded(
          expanded.peek().filter((each) => !Object.is(each, entry.value)),
          by()
        )
      }
      const parent = parentOf(element)
      const row = parent ? byElement.get(parent)?.row : undefined
      if (row && !row.disabled()) list.highlight(row, true)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      // The node's own press: what a caller's handler on it hears too.
      return element.click()
    }
    if (event.key === " " && !list.typing()) {
      event.preventDefault()
      if (options.disabled || mode.peek() === "none") return
      if (!multiple) {
        if (!chosen.peek().has(entry.value)) only(entry.value, by())
        return
      }
      return event.shiftKey ? range(entry.value, by()) : flip(entry.value, by())
    }
    if (event.key === "*") {
      event.preventDefault()
      // Every closed branch beside this node opens; focus stays.
      const parent = parentOf(element)
      const now = open.peek()
      const more = [...byElement]
        .filter(
          ([each, sibling]) =>
            each.isConnected &&
            parentOf(each) === parent &&
            sibling.options().branch &&
            !sibling.options().disabled &&
            !now.has(sibling.value)
        )
        .map(([, sibling]) => sibling.value)
      if (more.length > 0) setExpanded([...expanded.peek(), ...more], by())
      return
    }
    if (multiple && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault()
      const now = chosen.peek()
      const more = list
        .rows()
        .map((row) => byRow.get(row)!.value)
        .filter((each) => !now.has(each))
      if (more.length > 0) setSelected([...selected.peek(), ...more], by())
      return
    }
    if (multiple && event.shiftKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      // Focus moves, and the nodes from the anchor to where it went are chosen.
      list.key(event)
      const to = entryOf(list.highlighted.peek())
      if (to && to !== entry) range(to.value, by())
      return
    }
    // Up, Down, Home, End and typing, over the nodes that are shown and not disabled.
    list.key(event)
  }

  return {
    expandedValue: expanded,
    selectedValue: selected,
    setExpanded,
    setSelected,
    mount() {
      // A branch that closes around the node focus is on gives the branch focus: the node is
      // about to leave the page, and focus would fall to the page with it.
      return effect(() => {
        const now = open.get()
        untracked(() => {
          const root = rootElement
          const active = root?.ownerDocument.activeElement
          const node = nodeAt(active ?? null)
          if (!root || !node) return
          let target: HTMLElement | undefined
          for (let up = parentOf(node); up; up = parentOf(up)) {
            if (!now.has(byElement.get(up)!.value)) target = up
          }
          if (target) list.highlight(byElement.get(target)!.row, true)
        })
      })
    },
    root: {
      props: computed(() => ({
        id,
        role: "tree",
        "aria-multiselectable": mode.get() === "multiple" ? "true" : undefined,
        onFocus: () => within.set(true),
        onBlur(event: FocusEvent) {
          if ((event.currentTarget as Element).contains(event.relatedTarget as Node | null)) return
          within.set(false)
          list.highlight(undefined)
        },
        onKeyDown: key,
      })),
      attach(element) {
        rootElement = element
        const detach = list.attach(element)
        // Nodes moved without being drawn again (a list reordered) are read again too.
        const view = element.ownerDocument.defaultView
        const observer = view ? new view.MutationObserver(changed) : undefined
        observer?.observe(element, { childList: true, subtree: true })
        changed()
        return () => {
          observer?.disconnect()
          detach()
          if (rootElement === element) rootElement = undefined
          changed()
        }
      },
    },
    item(value, options = () => ({})) {
      firstMade ??= { value }
      const textId = `${id}-text-${slug(value)}`
      const isOpen = computed(() => open.get().has(value))
      const isChosen = computed(() => chosen.get().has(value))
      const presence = createPanelPresence(isOpen, "--tree-group")
      const own = signal<HTMLElement | undefined>(undefined)
      const labelled = signal(false)
      let textElement: HTMLElement | undefined
      const row = list.row(
        () => {
          const element = own.peek()
          return {
            disabled: options().disabled,
            label: options().label,
            // Inside a closed branch (one kept in the page, or on its way out): not there.
            hidden: element ? !shown(element) : false,
          }
        },
        (element) => (textElement ? textOf(textElement) : ownText(element))
      )
      const entry: Entry<Value> = { value, row, options }
      byRow.set(row, entry)

      // What the node, its row and its mark say of it, for a stylesheet.
      const state = () => {
        const given = options()
        const branch = Boolean(given.branch)
        return {
          "data-selected": flag(mode.get() !== "none" && isChosen.get()),
          "data-highlighted": flag(row.active.get()),
          "data-disabled": flag(given.disabled),
          "data-open": flag(branch && isOpen.get()),
          "data-closed": flag(branch && !isOpen.get()),
          "data-loading": flag(branch && given.loading),
        }
      }

      return {
        expanded: isOpen,
        selected: isChosen,
        mounted: presence.mounted,
        mount: () => presence.start(),
        root: {
          props: computed(() => {
            const given = options()
            const off = Boolean(given.disabled)
            const branch = Boolean(given.branch)
            const element = own.get()
            const placed = element ? layout.get().get(element) : undefined
            const level = given.level ?? placed?.level
            const choosing = mode.get() !== "none"
            const at = stop.get()
            // Before the tree is in a page: the first chosen node, or else the first made.
            const fallback = () => {
              const now = choosing ? selected.get() : NONE
              const first = now.length > 0 ? { value: now[0] } : firstMade
              return first !== undefined && Object.is(first.value, value)
            }
            const isStop = at ? at.element !== undefined && at.element === element : fallback()
            return {
              role: "treeitem",
              tabindex: isStop && !off ? "0" : "-1",
              "aria-level": level === undefined ? undefined : String(level),
              "aria-setsize": placed ? String(placed.size) : undefined,
              "aria-posinset": placed ? String(placed.position) : undefined,
              "aria-expanded": branch ? String(isOpen.get()) : undefined,
              "aria-selected": choosing ? String(isChosen.get()) : undefined,
              "aria-disabled": off ? "true" : undefined,
              "aria-busy": branch && given.loading ? "true" : undefined,
              "aria-labelledby": labelled.get() ? textId : undefined,
              ...state(),
              // Focus that came by itself (a press) is where the keys go on from. Focus on a
              // child comes up through its parent too, and is the child's.
              onFocus(event: FocusEvent) {
                if (event.target === event.currentTarget) list.highlight(row)
              },
              // A disabled node does not take focus from a press.
              onMouseDown(event: MouseEvent) {
                if (off && nodeAt(event.target) === own.peek()) event.preventDefault()
              },
              onClick(event: MouseEvent) {
                // A press on a child comes up through its parent, and is the child's; one on
                // the indicator opened or closed the branch and is done.
                if (nodeAt(event.target) !== own.peek() || indicated.has(event)) return
                if (off) return
                list.highlight(row, true)
                press(entry, event)
              },
            }
          }),
          attach(element) {
            own.set(element)
            byElement.set(element, entry)
            const detach = row.attach(element)
            changed()
            return () => {
              detach()
              if (byElement.get(element) === entry) byElement.delete(element)
              if (own.peek() === element) own.set(undefined)
              changed()
            }
          },
        },
        row: { props: computed(state), attach: () => NOTHING },
        text: {
          props: computed(() => ({ id: textId })),
          attach(element) {
            textElement = element
            labelled.set(true)
            return () => {
              if (textElement === element) textElement = undefined
              labelled.set(false)
            }
          },
        },
        indicator: {
          props: computed(() => {
            const given = options()
            const branch = Boolean(given.branch)
            return {
              "aria-hidden": "true",
              "data-open": flag(branch && isOpen.get()),
              "data-closed": flag(branch && !isOpen.get()),
              "data-loading": flag(branch && given.loading),
              onClick(event: MouseEvent) {
                if (!branch || given.disabled || nodeAt(event.target) !== own.peek()) return
                indicated.add(event)
                toggle(value, details("indicator-press", event))
              },
            }
          }),
          attach: () => NOTHING,
        },
        group: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              role: "group",
              // Only seen on a group its caller keeps in the page.
              hidden: flag(!presence.mounted.get()),
              "data-open": flag(isOpen.get()),
              "data-closed": flag(!isOpen.get()),
              "data-starting-style": flag(status === "starting"),
              "data-ending-style": flag(status === "ending"),
            }
          }),
          attach: (element) => presence.attach(element),
        },
      }
    },
  }
}

// Presses on an indicator, which its node's own press then leaves alone.
const indicated = new WeakSet<Event>()
