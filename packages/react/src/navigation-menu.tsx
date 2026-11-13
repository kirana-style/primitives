import { defined, within } from "@kirana-ui/core"
import type { Part, PositionOptions } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
  NavigationMenuLinkOptions,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"
import { createPortal } from "react-dom"

import { DirectionContext } from "./direction-context.ts"
import {
  Portal as BodyPortal,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

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

export type RootProps<Value> = Omit<NavigationMenuProps<Value>, "id"> & {
  id?: string
} & PartComponentProps

function Root<Value>({
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
  const controller = useController<NavigationMenuProps<Value>, Controller<Value>>(
    within(createNavigationMenu<Value>, { direction }),
    { value, defaultValue, onValueChange, delay, closeDelay, orientation, id }
  ) as unknown as Controller
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "nav", rest)}</Context.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

const List = (props: PartComponentProps) => usePart(useNavigation("List").list, "ul", props)

export interface ItemProps {
  /** What tells this item from the others. Not needed for an item that is only a link. */
  value?: unknown
  children?: ReactNode
  [attribute: string]: unknown
}

function Item({ value, children, ...rest }: ItemProps): ReactElement {
  const controller = useNavigation("Item")
  const item = useMemo(
    () => (value === undefined ? null : controller.item(value)),
    [controller, value]
  )
  return <li {...rest}>{item ? <Mounted item={item}>{children}</Mounted> : children}</li>
}

function Mounted({ item, children }: { item: NavigationMenuItem; children?: ReactNode }) {
  useMount(item)
  return <ItemContext.Provider value={item}>{children}</ItemContext.Provider>
}

const Trigger = (props: PartComponentProps) => usePart(useItem("Trigger").trigger, "button", props)
const Icon = (props: PartComponentProps) => usePart(useItem("Icon").icon, "span", props)

/** An item's content: drawn in `<NavigationMenu.Viewport>`, while it is shown. */
function Content(props: PartComponentProps): ReactElement | null {
  const item = useItem("Content")
  const mounted = useSignal(item.mounted)
  const viewport = useSignal(useNavigation("Content").viewportElement)
  if (!mounted || !viewport) return null
  return createPortal(<PartElement part={item.content} tag="div" {...props} />, viewport)
}

export type LinkProps = PartComponentProps & NavigationMenuLinkOptions

function Link({ active, closeOnClick, ...props }: LinkProps): ReactElement {
  const controller = useNavigation("Link")
  const options = useOptions({ active, closeOnClick })
  const part = useMemo(() => controller.link(() => defined(options.get())), [controller, options])
  return usePart(part, "a", props)
}

function Portal({ children }: { children?: ReactNode }): ReactElement | null {
  const mounted = useSignal(useNavigation("Portal").mounted)
  return mounted ? <BodyPortal>{children}</BodyPortal> : null
}

export type PositionerProps = PartComponentProps & Partial<PositionOptions>

function Positioner({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  ...props
}: PositionerProps) {
  const controller = useNavigation("Positioner")
  controller.positioning.set(defined({ side, align, sideOffset, alignOffset, collisionPadding }))
  return usePart(controller.positioner, "div", props)
}

const Popup = (props: PartComponentProps) => usePart(useNavigation("Popup").popup, "div", props)
const Viewport = (props: PartComponentProps) =>
  usePart(useNavigation("Viewport").viewport, "div", props)
const Arrow = (props: PartComponentProps) => usePart(useNavigation("Arrow").arrow, "div", props)
const Backdrop = (props: PartComponentProps) =>
  usePart(useNavigation("Backdrop").backdrop, "div", props)

export const NavigationMenu = {
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
}
