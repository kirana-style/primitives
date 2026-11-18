import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
  NavigationMenuLinkOptions,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"
import {
  Teleport,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  useId,
} from "vue"
import type { InjectionKey, PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { positionerComponent } from "./popover.ts"
import {
  context,
  controller,
  fromSignal,
  optional,
  partComponent,
  portalComponent,
  toSignal,
} from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  StatesOf,
} from "./runtime.ts"

export type { PositionerProps } from "./popover.ts"
export type { PortalProps } from "./runtime.ts"

type State = StatesOf<"navigationMenu">

const scope = context<Controller>("NavigationMenu")
const ITEM: InjectionKey<NavigationMenuItem> = Symbol("NavigationMenuItem")
const ANY = null as unknown as PropType<unknown>

function useItem(): NavigationMenuItem {
  const item = inject(ITEM, undefined)
  if (!item) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Item>")
  return item
}

const RootElement = partComponent("NavigationMenuRootElement", "nav", () => scope.use().root)

export type RootProps<Value = unknown> = Omit<
  NavigationMenuProps<Value>,
  "id" | "onValueChange"
> & {
  id?: string | undefined
} & PartComponentProps

/** The value is `null` when the menu closes. */
export type RootEmits<Value = unknown> = Changes<"value", Value | null>

/** `v-model:value`; `@value-change` carries the details. */
const Root = defineComponent({
  name: "NavigationMenuRoot",
  inheritAttrs: false,
  props: {
    value: { type: ANY, default: undefined as unknown },
    defaultValue: { type: ANY, default: null as unknown },
    delay: Number,
    closeDelay: Number,
    orientation: String as PropType<Orientation>,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createNavigationMenu, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        delay: props.delay,
        closeDelay: props.closeDelay,
        orientation: props.orientation,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "nav">(
  props: PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps
) => PartInstance<As, RootProps<Value>, RootEmits<Value>, { state: State["root"] }>

const ItemElement = partComponent("NavigationMenuItemElement", "li", () => scope.use().itemPart)

export interface ItemProps extends PartComponentProps {
  /**
   * What tells this item from the others: the menu's `value` while its content is shown. An
   * item that is given none makes its own.
   */
  value?: unknown
}

/** `value` tells this item from the others; an item that is given none makes its own. */
const Item = defineComponent({
  name: "NavigationMenuItem",
  inheritAttrs: false,
  props: { value: { type: ANY, default: undefined as unknown } },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const item = scope.use().item(props.value === undefined ? generated : props.value)
    provide(ITEM, item)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = item.mount()
    })
    onBeforeUnmount(() => stop?.())
    return () => h(ItemElement, attrs, slots)
  },
}) as unknown as PartComponent<"li", State["item"], ItemProps>

export type ContentProps = PartComponentProps

/** An item's content: drawn in `NavigationMenu.Viewport`, while it is shown. */
const Content = defineComponent({
  name: "NavigationMenuContent",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const item = useItem()
    const mounted = fromSignal(item.mounted)
    const viewport = fromSignal(scope.use().viewportElement)
    const Element = partComponent("NavigationMenuContentElement", "div", () => item.content)
    return () =>
      mounted.value && viewport.value
        ? h(Teleport, { to: viewport.value }, h(Element, attrs, slots))
        : null
  },
}) as unknown as PartComponent<"div", State["content"], ContentProps>

export interface LinkProps extends NavigationMenuLinkOptions, PartComponentProps {}

const Link = defineComponent({
  name: "NavigationMenuLink",
  inheritAttrs: false,
  props: { active: optional(Boolean), closeOnClick: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ ...props }))
    const part = scope.use().link(() => defined(options.get()))
    const Element = partComponent("NavigationMenuLinkElement", "a", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"a", State["link"], LinkProps>

export type ListProps = PartComponentProps
export type TriggerProps = PartComponentProps
export type IconProps = PartComponentProps
export type PopupProps = PartComponentProps
export type ViewportProps = PartComponentProps
export type ArrowProps = PartComponentProps
export type BackdropProps = PartComponentProps
export const NavigationMenu = {
  Root,
  List: partComponent<"ul", State["list"]>("NavigationMenuList", "ul", () => scope.use().list),
  Item,
  Trigger: partComponent<"button", State["trigger"]>(
    "NavigationMenuTrigger",
    "button",
    () => useItem().trigger
  ),
  Icon: partComponent<"span", State["icon"]>("NavigationMenuIcon", "span", () => useItem().icon),
  Content,
  Link,
  Portal: portalComponent("NavigationMenuPortal", () => scope.use().mounted),
  Positioner: positionerComponent<State["positioner"]>(
    "NavigationMenuPositioner",
    () => scope.use(),
    partComponent("NavigationMenuPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent<"div", State["popup"]>(
    "NavigationMenuPopup",
    "div",
    () => scope.use().popup
  ),
  Viewport: partComponent<"div", State["viewport"]>(
    "NavigationMenuViewport",
    "div",
    () => scope.use().viewport
  ),
  Arrow: partComponent<"div", State["arrow"]>(
    "NavigationMenuArrow",
    "div",
    () => scope.use().arrow
  ),
  Backdrop: partComponent<"div", State["backdrop"]>(
    "NavigationMenuBackdrop",
    "div",
    () => scope.use().backdrop
  ),
}
