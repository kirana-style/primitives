import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createRoving } from "./services/roving.ts"
import type { Orientation } from "./services/roving.ts"

export interface MenubarProps {
  id: string
  /** Whether the arrows go round from the last menu to the first. Default: they do. */
  loopFocus?: boolean | undefined
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Use `loopFocus`, which wins when both are given.
   */
  loop?: boolean | undefined
  /** No menu of the bar opens. */
  disabled?: boolean | undefined
  /** A row (the default) or a column of menus. In a column a menu opens beside its trigger. */
  orientation?: Orientation | undefined
  /**
   * Holds the page while one of its menus is open, as a menu's own `modal` does: its scroll is
   * locked, and a press outside closes the menu and reaches nothing. Default: it does not.
   * Read as a menu opens.
   */
  modal?: boolean | undefined
}

/** A menu of the bar, as the bar knows it. */
export interface MenubarMember {
  readonly open: ReadonlySignal<boolean>
  /** Opens it with focus on its first or last item, or on the menu itself. */
  openFor(where: "first" | "last" | "popup", details: ChangeDetails): void
  close(details: ChangeDetails): void
}

/** What a menu needs of the bar it is in. Not for a caller. */
export interface MenubarLink {
  readonly disabled: ReadonlySignal<boolean>
  /** Whether its menus hold the page while open. */
  modal(): boolean
  readonly vertical: ReadonlySignal<boolean>
  /** For a menu's trigger: it joins the bar's row. Returns the leaving. */
  join(trigger: HTMLElement, member: MenubarMember): () => void
  /** The bar is one stop for Tab: the trigger focus was last on, or any before there is one. */
  tabindex(trigger: HTMLElement | undefined): "0" | "-1"
  focused(trigger: HTMLElement): void
  /** The arrows, Home and End along the bar's triggers. Says whether the key was one. */
  key(event: KeyboardEvent): boolean
  /** Whether one of the bar's menus is open: the pointer on another trigger then opens that one. */
  anyOpen(): boolean
  /** A menu opened: the others close. */
  opened(member: MenubarMember): void
  closed(member: MenubarMember): void
  /** From an open menu, to the one before or after it, which opens in its place. */
  step(member: MenubarMember, by: 1 | -1, event: Event): void
}

export interface Menubar {
  readonly root: Part
  readonly link: MenubarLink
  mount(): () => void
}

const NOTHING = () => {}

/**
 * A row of menus that work as one: the arrows go from one trigger to the next, Tab stops on the
 * bar once, and while one menu is open the pointer or an arrow opens the next in its place.
 */
export function createMenubar(
  props: ReadonlySignal<MenubarProps>,
  around: DirectionAround = {}
): Menubar {
  const roving = createRoving()
  const members = new Map<HTMLElement, MenubarMember>()
  const active = signal<HTMLElement | undefined>(undefined)
  let current: MenubarMember | undefined
  const disabled = computed(() => Boolean(props.get().disabled))
  const loop = () => props.peek().loopFocus ?? props.peek().loop ?? true
  const vertical = computed(() => props.get().orientation === "vertical")
  // The menus of the bar that are open: one, but for the moment one hands over to the next.
  const opened = signal<ReadonlySet<MenubarMember>>(new Set())

  const triggerOf = (member: MenubarMember) => [...members].find(([, each]) => each === member)?.[0]

  return {
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        role: "menubar",
        "aria-orientation": vertical.get() ? "vertical" : "horizontal",
        "data-orientation": vertical.get() ? "vertical" : "horizontal",
        "data-disabled": flag(disabled.get()),
        "data-modal": flag(props.get().modal),
        "data-has-submenu-open": flag(opened.get().size > 0),
      })),
      attach: () => NOTHING,
    },
    link: {
      disabled,
      modal: () => Boolean(props.peek().modal),
      vertical,
      join(trigger, member) {
        members.set(trigger, member)
        const leave = roving.register(trigger)
        return () => {
          leave()
          members.delete(trigger)
          if (active.peek() === trigger) active.set(undefined)
          if (current === member) current = undefined
        }
      },
      tabindex(trigger) {
        const on = active.get()
        return on === undefined || on === trigger ? "0" : "-1"
      },
      focused: (trigger) => active.set(trigger),
      key: (event) =>
        roving.move(event, {
          orientation: vertical.peek() ? "vertical" : "horizontal",
          loop: loop(),
          direction: around.direction,
        }) !== undefined,
      anyOpen: () => current !== undefined,
      opened(member) {
        const before = current
        current = member
        opened.set(new Set([...opened.peek(), member]))
        if (before && before !== member) before.close(details("sibling-open"))
      },
      closed(member) {
        if (current === member) current = undefined
        if (!opened.peek().has(member)) return
        const left = new Set(opened.peek())
        left.delete(member)
        opened.set(left)
      },
      step(member, by, event) {
        const from = triggerOf(member)
        const row = roving.enabled()
        const index = from ? row.indexOf(from) : -1
        if (index < 0 || row.length < 2) return
        const to = loop()
          ? (index + by + row.length) % row.length
          : Math.min(row.length - 1, Math.max(0, index + by))
        const next = members.get(row[to]!)
        if (!next || next === member) return
        member.close(details("list-navigation", event))
        next.openFor("first", details("list-navigation", event))
      },
    },
  }
}
