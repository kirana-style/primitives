import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
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
import type { PortalProps, PositionerOptions } from "./popover.tsx"
import { Into, Part, Portal as BodyPortal, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["navigationMenu"]

export type { PortalProps }

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

/** `Value` is what tells an item from the others: the root's `value` holds the open one's. */
export type RootProps<Value = unknown> = PartComponentProps<
  "nav",
  StateOf<Parts["root"]>,
  Omit<NavigationMenuProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>(props: RootProps<Value>): JSX.Element {
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
  const made = controller(within(createNavigationMenu<Value>, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    delay: local.delay,
    closeDelay: local.closeDelay,
    orientation: local.orientation,
    onValueChange: (value: Value | null, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="nav" {...rest} />
    </Context.Provider>
  )
}

export type ItemProps = PartComponentProps<"li", StateOf<Parts["item"]>, { value?: unknown }>

/** `value` tells this item from the others; an item that is given none makes its own. */
function Item(props: ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value"])
  const made = useNavigation()
  const generated = createUniqueId()
  const value = untrack(() => local.value)
  const item = made.item(value === undefined ? generated : value)
  onMount(() => onCleanup(item.mount()))
  return (
    <ItemContext.Provider value={item}>
      <Part of={made.itemPart} tag="li" {...rest} />
    </ItemContext.Provider>
  )
}

export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>

/** An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown. */
function Content(props: ContentProps): JSX.Element {
  const item = useItem()
  const mounted = fromSignal(item.mounted)
  const viewport = fromSignal(useNavigation().viewportElement)
  return (
    <Show when={mounted() ? viewport() : undefined}>
      {(target) => (
        <Into target={target()}>
          <Part of={item.content} tag="div" {...props} />
        </Into>
      )}
    </Show>
  )
}

export type LinkProps = PartComponentProps<
  "a",
  StateOf<Parts["link"]>,
  { active?: boolean; closeOnClick?: boolean }
>

function Link(props: LinkProps): JSX.Element {
  const [local, rest] = splitProps(props, ["active", "closeOnClick"])
  const options = toSignal(() => ({ ...local }))
  const part = useNavigation().link(() => defined(options.get()))
  return <Part of={part} tag="a" {...rest} />
}

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={useNavigation().mounted}>{props.children}</BodyPortal>
)

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): JSX.Element {
  const made = useNavigation()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

export type ListProps = PartComponentProps<"ul", StateOf<Parts["list"]>>
export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type IconProps = PartComponentProps<"span", StateOf<Parts["icon"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "list" | "popup" | "viewport" | "arrow" | "backdrop",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useNavigation()[name]} tag={tag} {...props} />
const itemPart =
  <Props extends Record<string, unknown>>(name: "trigger" | "icon", tag: string) =>
  (props: Props): JSX.Element => <Part of={useItem()[name]} tag={tag} {...props} />

export const NavigationMenu = {
  Root,
  List: part<ListProps>("list", "ul"),
  Item,
  Trigger: itemPart<TriggerProps>("trigger", "button"),
  Icon: itemPart<IconProps>("icon", "span"),
  Content,
  Link,
  Portal,
  Positioner,
  Popup: part<PopupProps>("popup", "div"),
  Viewport: part<ViewportProps>("viewport", "div"),
  Arrow: part<ArrowProps>("arrow", "div"),
  Backdrop: part<BackdropProps>("backdrop", "div"),
}
