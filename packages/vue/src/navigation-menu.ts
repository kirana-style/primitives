import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu as Controller,
  NavigationMenuItem,
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
import type { InjectionKey, PropType } from "vue"

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

const scope = context<Controller>("NavigationMenu")
const ITEM: InjectionKey<NavigationMenuItem> = Symbol("NavigationMenuItem")
const ANY = null as unknown as PropType<unknown>

function useItem(): NavigationMenuItem {
  const item = inject(ITEM, undefined)
  if (!item) throw new Error("A NavigationMenu part must be inside <NavigationMenu.Item>")
  return item
}

const RootElement = partComponent("NavigationMenuRootElement", "nav", () => scope.use().root)

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
})

/** `value` tells this item from the others; an item that is only a link needs none. */
const Item = defineComponent({
  name: "NavigationMenuItem",
  props: { value: { type: ANY, default: undefined as unknown } },
  setup(props, { slots }) {
    if (props.value !== undefined) {
      const item = scope.use().item(props.value)
      provide(ITEM, item)
      let stop: (() => void) | undefined
      onMounted(() => {
        stop = item.mount()
      })
      onBeforeUnmount(() => stop?.())
    }
    return () => h("li", slots.default?.())
  },
})

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
})

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
})

export const NavigationMenu = {
  Root,
  List: partComponent("NavigationMenuList", "ul", () => scope.use().list),
  Item,
  Trigger: partComponent("NavigationMenuTrigger", "button", () => useItem().trigger),
  Icon: partComponent("NavigationMenuIcon", "span", () => useItem().icon),
  Content,
  Link,
  Portal: portalComponent("NavigationMenuPortal", () => scope.use().mounted),
  Positioner: positionerComponent(
    "NavigationMenuPositioner",
    () => scope.use(),
    partComponent("NavigationMenuPositionerElement", "div", () => scope.use().positioner)
  ),
  Popup: partComponent("NavigationMenuPopup", "div", () => scope.use().popup),
  Viewport: partComponent("NavigationMenuViewport", "div", () => scope.use().viewport),
  Arrow: partComponent("NavigationMenuArrow", "div", () => scope.use().arrow),
  Backdrop: partComponent("NavigationMenuBackdrop", "div", () => scope.use().backdrop),
}
