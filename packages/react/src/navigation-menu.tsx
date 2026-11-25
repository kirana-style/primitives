import { defined, within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
  NavigationMenuLinkOptions,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"
import { createPortal } from "react-dom"

import { DirectionContext } from "./direction-context.ts"
import {
  Portal as BodyPortal,
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  usePositioning,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps, PortalProps, PositionerOptions } from "./runtime.tsx"

export type { PortalProps }

type Parts = Vocabulary["navigationMenu"]

const Context = createContext<Controller | null>(null)
const ItemContext = createContext<NavigationMenuItem | null>(null)

function useNavigation(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<NavigationMenu.${part}> must be inside <NavigationMenu.Root>`)
  return controller
}

function useItem(part: string): NavigationMenuItem {
  const item = useContext(ItemContext)
  if (!item) throw new Error(`<NavigationMenu.${part}> must be inside <NavigationMenu.Item>`)
  return item
}

/** `Value` is what tells an item from the others: the type of `value`. */
export type RootProps<Value = unknown> = PartComponentProps<
  "nav",
  StateOf<Parts["root"]>,
  Omit<NavigationMenuProps<Value>, "id"> & { id?: string }
>

function Root<Value = unknown>({
  value,
  defaultValue,
  onValueChange,
  delay,
  closeDelay,
  orientation,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller: Controller = useController<NavigationMenuProps<Value>, Controller<Value>>(
    within(createNavigationMenu<Value>, { direction }),
    { value, defaultValue, onValueChange, delay, closeDelay, orientation, id }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "nav", rest)}</Context.Provider>
  )
}

export type ListProps = PartComponentProps<"ul", StateOf<Parts["list"]>>

const List = (props: ListProps) => usePart(useNavigation("List").list, "ul", props)

export type ItemProps = PartComponentProps<
  "li",
  StateOf<Parts["item"]>,
  {
    /**
     * What tells this item from the others: the menu's `value` while its content is shown. An
     * item that is given none makes its own.
     */
    value?: unknown
  }
>

function Item({ value, ...props }: ItemProps): ReactElement {
  const controller = useNavigation("Item")
  // The same on every render of this item, a second one in StrictMode included.
  const generated = useId()
  const key = value === undefined ? generated : value
  const item = useMemo(() => controller.item(key), [controller, key])
  // Its trigger and content find the item, whatever element the caller asked for.
  return usePart(controller.itemPart, "li", props, undefined, (content) => (
    <Mounted item={item}>{content}</Mounted>
  ))
}

function Mounted({ item, children }: { item: NavigationMenuItem; children?: ReactNode }) {
  useMount(item)
  return <ItemContext.Provider value={item}>{children}</ItemContext.Provider>
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type IconProps = PartComponentProps<"span", StateOf<Parts["icon"]>>

const Trigger = (props: TriggerProps) => usePart(useItem("Trigger").trigger, "button", props)
const Icon = (props: IconProps) => usePart(useItem("Icon").icon, "span", props)

export type ContentProps = PartComponentProps<"div", StateOf<Parts["content"]>>

/** An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown. */
function Content(props: ContentProps): ReactElement | null {
  const item = useItem("Content")
  const mounted = useSignal(item.mounted)
  const viewport = useSignal(useNavigation("Content").viewportElement)
  if (!mounted || !viewport) return null
  return createPortal(<PartElement of={item.content} tag="div" {...props} />, viewport)
}

export type LinkProps = PartComponentProps<"a", StateOf<Parts["link"]>, NavigationMenuLinkOptions>

function Link({ active, closeOnSelect, closeOnClick, ...props }: LinkProps): ReactElement {
  const controller = useNavigation("Link")
  const options = useOptions({ active, closeOnSelect, closeOnClick })
  const part = useMemo(() => controller.link(() => defined(options.get())), [controller, options])
  return usePart(part, "a", props)
}

function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSignal(useNavigation("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

function Positioner(props: PositionerProps): ReactElement {
  const controller = useNavigation("Positioner")
  return usePart(controller.positioner, "div", usePositioning(controller.positioning, props))
}

export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type ViewportProps = PartComponentProps<"div", StateOf<Parts["viewport"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>

const Popup = (props: PopupProps) => usePart(useNavigation("Popup").popup, "div", props)
const Viewport = (props: ViewportProps) => usePart(useNavigation("Viewport").viewport, "div", props)
const Arrow = (props: ArrowProps) => usePart(useNavigation("Arrow").arrow, "div", props)
const Backdrop = (props: BackdropProps) => usePart(useNavigation("Backdrop").backdrop, "div", props)

export const NavigationMenu = /* @__PURE__ */ parts("NavigationMenu", {
  Root,
  List,
  Item,
  Trigger,
  Icon,
  Content,
  Link,
  Portal,
  Positioner,
  Popup,
  Viewport,
  Arrow,
  Backdrop,
})
