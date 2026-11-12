import { bindable } from "./bindable.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createPanelPresence } from "./services/panel.ts"

export interface CollapsibleProps {
  /** Unique in the page; the adapter passes its framework's id. */
  id: string
  open?: boolean | undefined
  /** Read once. */
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  disabled?: boolean | undefined
}

export interface Collapsible {
  readonly open: ReadonlySignal<boolean>
  /** Whether the panel is in the page: `true` through its exit's motion. */
  readonly mounted: ReadonlySignal<boolean>
  setOpen(open: boolean, details: ChangeDetails): void
  /** Starts the controller's own effects. Returns the stop. */
  mount(): () => void
  readonly root: Part
  readonly trigger: Part
  readonly panel: Part
}

const NOTHING = () => {}

export function createCollapsible(props: ReadonlySignal<CollapsibleProps>): Collapsible {
  const id = props.peek().id
  const panelId = `${id}-panel`
  const open = bindable({
    value: () => props.get().open,
    defaultValue: props.peek().defaultOpen ?? false,
    onChange: (value, by) => props.peek().onOpenChange?.(value, by),
  })
  const disabled = computed(() => Boolean(props.get().disabled))
  const presence = createPanelPresence(open, "--collapsible-panel")

  function setOpen(next: boolean, by: ChangeDetails) {
    if (disabled.peek()) return
    open.set(next, by)
  }

  return {
    open,
    mounted: presence.mounted,
    setOpen,
    mount: () => presence.start(),
    root: {
      props: computed(() => ({
        "data-open": flag(open.get()),
        "data-closed": flag(!open.get()),
        "data-disabled": flag(disabled.get()),
      })),
      attach: () => NOTHING,
    },
    trigger: {
      props: computed(() => ({
        type: "button",
        "aria-expanded": String(open.get()),
        "aria-controls": presence.mounted.get() ? panelId : undefined,
        disabled: flag(disabled.get()),
        "data-panel-open": flag(open.get()),
        "data-disabled": flag(disabled.get()),
        onClick: (event: Event) => setOpen(!open.peek(), details("trigger-press", event)),
      })),
      attach: () => NOTHING,
    },
    panel: {
      props: computed(() => {
        const status = presence.status.get()
        return {
          id: panelId,
          // Only seen on a panel its caller keeps in the page.
          hidden: flag(!presence.mounted.get()),
          "data-open": flag(open.get()),
          "data-closed": flag(!open.get()),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
        }
      }),
      attach: (element) => presence.attach(element),
    },
  }
}
