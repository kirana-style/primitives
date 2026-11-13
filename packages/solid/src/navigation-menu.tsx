import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
} from "@kirana-ui/core/navigation-menu"
import {
  Show,
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { positioned } from "./popover.tsx"
import type { PositionerProps } from "./popover.tsx"
import { Into, Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const ItemContext = createContext<NavigationMenuItem>()

function useNavigation(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Root>")
  return made
}

function useItem(): NavigationMenuItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Item>")
  return item
}

export type RootProps = PartComponentProps & {
  value?: unknown
  defaultValue?: unknown
  onValueChange?: (value: unknown, details: ChangeDetails) => void
  delay?: number
  closeDelay?: number
  orientation?: Orientation
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "delay",
    "closeDelay",
    "orientation",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createNavigationMenu, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    delay: local.delay,
    closeDelay: local.closeDelay,
    orientation: local.orientation,
    onValueChange: (value: unknown, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="nav" {...rest} />
    </Context.Provider>
  )
}

/** `value` tells this item from the others; an item that is only a link needs none. */
function Item(props: { value?: unknown; children?: JSX.Element }): JSX.Element {
  const value = untrack(() => props.value)
  if (value === undefined) return <li>{props.children}</li>
  const item = useNavigation().item(value)
  onMount(() => onCleanup(item.mount()))
  return (
    <ItemContext.Provider value={item}>
      <li>{props.children}</li>
    </ItemContext.Provider>
  )
}

/** An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown. */
function Content(props: PartComponentProps): JSX.Element {
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  const viewport = fromSignal(useNavigation().viewportElement)
  return (
    <Show when={mounted() ? viewport() : undefined}>
      {(target) => (
        <Into target={target()}>
          <Part part={item.content} tag="div" {...props} />
        </Into>
      )}
    </Show>
  )
}

function Link(
  props: PartComponentProps & { active?: boolean; closeOnClick?: boolean }
): JSX.Element {
  const [local, rest] = splitProps(props, ["active", "closeOnClick"])
  const options = toSignal(() => ({ ...local }))
  const part = useNavigation().link(() => defined(options.get()))
  return <Part part={part} tag="a" {...rest} />
}

const Portal = (props: { children?: JSX.Element }) => (
  <BodyPortal mounted={useNavigation().mounted}>{props.children}</BodyPortal>
)

function Positioner(props: PositionerProps): JSX.Element {
  const made = useNavigation()
  return <Part part={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

const part =
  (name: "list" | "popup" | "viewport" | "arrow" | "backdrop", tag: string) =>
  (props: PartComponentProps) => <Part part={useNavigation()[name]} tag={tag} {...props} />
const itemPart = (name: "trigger" | "icon", tag: string) => (props: PartComponentProps) => (
  <Part part={useItem()[name]} tag={tag} {...props} />
)

export const NavigationMenu = {
  Root,
  List: part("list", "ul"),
  Item,
  Trigger: itemPart("trigger", "button"),
  Icon: itemPart("icon", "span"),
  Content,
  Link,
  Portal,
  Positioner,
  Popup: part("popup", "div"),
  Viewport: part("viewport", "div"),
  Arrow: part("arrow", "div"),
  Backdrop: part("backdrop", "div"),
}
