import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createPanelPresence } from "./services/panel.ts"
import { createRoving } from "./services/roving.ts"
import type { Orientation } from "./services/roving.ts"

export interface AccordionProps<Value = unknown> {
  id: string
  /** The values of the open items. */
  value?: readonly Value[] | undefined
  /** Read once. */
  defaultValue?: readonly Value[] | undefined
  onValueChange?: ((value: Value[], details: ChangeDetails) => void) | undefined
  /** Whether several items can be open at once. Default `false`: opening one closes the others. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
  /** The way the arrows move between triggers. Default `vertical`. */
  orientation?: Orientation | undefined
  /** Whether the arrows wrap from the last trigger to the first. Default `true`. */
  loop?: boolean | undefined
}

export interface AccordionItemOptions {
  disabled?: boolean
}

/** One item of an accordion: its own state, and the parts that show it. */
export interface AccordionItem {
  readonly open: ReadonlySignal<boolean>
  /** Whether the panel is in the page: `true` through its exit's motion. */
  readonly mounted: ReadonlySignal<boolean>
  mount(): () => void
  readonly root: Part
  readonly header: Part
  readonly trigger: Part
  readonly panel: Part
}

export interface Accordion<Value = unknown> {
  readonly value: ReadonlySignal<readonly Value[]>
  mount(): () => void
  readonly root: Part
  item(value: Value, options?: () => AccordionItemOptions): AccordionItem
}

const NOTHING = () => {}

const slug = (value: unknown) =>
  String(value).replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0)}`)

const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((each, index) => Object.is(each, b[index]))

export function createAccordion<Value = unknown>(
  props: ReadonlySignal<AccordionProps<Value>>
): Accordion<Value> {
  const id = props.peek().id
  const value = bindable<readonly Value[]>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? [],
    onChange: (next, by) => props.peek().onValueChange?.([...next], by),
    equals: same,
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const orientation = computed<Orientation>(() => props.get().orientation ?? "vertical")
  const roving = createRoving()

  function toggle(item: Value, by: ChangeDetails) {
    const current = value.peek()
    const open = current.some((each) => Object.is(each, item))
    if (open)
      value.set(
        current.filter((each) => !Object.is(each, item)),
        by
      )
    else value.set(props.peek().multiple ? [...current, item] : [item], by)
  }

  return {
    value,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({
        "data-orientation": orientation.get(),
        "data-disabled": flag(disabled.get()),
        onKeyDown(event: KeyboardEvent) {
          roving.move(event, { orientation: orientation.peek(), loop: props.peek().loop ?? true })
        },
      })),
      attach: () => NOTHING,
    },
    item(item, options = () => ({})) {
      const open = computed(() => value.get().some((each) => Object.is(each, item)))
      const off = computed(() => Boolean(options().disabled) || disabled.get())
      const presence = createPanelPresence(open, "--accordion-panel")
      const triggerId = `${id}-trigger-${slug(item)}`
      const panelId = `${id}-panel-${slug(item)}`
      const state = () => ({
        "data-open": flag(open.get()),
        "data-disabled": flag(off.get()),
      })
      return {
        open,
        mounted: presence.mounted,
        mount: () => presence.start(),
        root: { props: computed(state), attach: () => NOTHING },
        header: { props: computed(state), attach: () => NOTHING },
        trigger: {
          props: computed(() => ({
            type: "button",
            id: triggerId,
            "aria-expanded": String(open.get()),
            "aria-controls": presence.mounted.get() ? panelId : undefined,
            disabled: flag(off.get()),
            "data-panel-open": flag(open.get()),
            "data-disabled": flag(off.get()),
            onClick(event: Event) {
              if (off.peek()) return
              toggle(item, details("trigger-press", event))
            },
          })),
          attach: (element) => roving.register(element),
        },
        panel: {
          props: computed(() => {
            const status = presence.status.get()
            return {
              id: panelId,
              role: "region",
              "aria-labelledby": triggerId,
              // Only seen on a panel its caller keeps in the page.
              hidden: flag(!presence.mounted.get()),
              "data-open": flag(open.get()),
              "data-closed": flag(!open.get()),
              "data-disabled": flag(off.get()),
              "data-orientation": orientation.get(),
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
