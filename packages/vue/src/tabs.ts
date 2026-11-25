import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type {
  Tabs as Controller,
  TabOptions,
  TabsListOptions,
  TabsProps,
} from "@kirana-ui/core/tabs"
import { defineComponent, h, onBeforeUnmount, onMounted, useId, watchEffect } from "vue"
import type { PropType, PublicProps } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { context, controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"
import type {
  Changes,
  PartComponent,
  PartComponentProps,
  PartGiven,
  PartInstance,
  StatesOf,
} from "./runtime.ts"

type State = StatesOf<"tabs">

const scope = context<Controller>("Tabs")
const ANY = null as unknown as PropType<unknown>

const RootElement = partComponent("TabsRootElement", "div", () => scope.use().root)

export type RootProps<Value = unknown> = Omit<TabsProps<Value>, "id" | "onValueChange"> & {
  id?: string | undefined
} & PartComponentProps

export type RootEmits<Value = unknown> = Changes<"value", Value>

/** `v-model:value`, or `value` with `@value-change="(value, details) => …"`. */
const Root = defineComponent({
  name: "TabsRoot",
  inheritAttrs: false,
  props: {
    value: { type: ANY, default: undefined as unknown },
    defaultValue: { type: ANY, default: null as unknown },
    orientation: String as PropType<Orientation>,
    id: String,
  },
  emits: ["update:value", "valueChange"],
  setup(props, { attrs, slots, emit }) {
    const generated = useId()
    const direction = useDirectionAround()
    scope.provide(
      controller(within(createTabs, { direction }), () => ({
        id: props.id ?? generated,
        value: props.value,
        defaultValue: props.defaultValue,
        orientation: props.orientation,
        onValueChange(value: unknown, details: ChangeDetails) {
          emit("valueChange", value, details)
          if (!details.canceled) emit("update:value", value)
        },
      }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as new <Value = unknown, As extends string = "div">(
  props: PartGiven<As, RootProps<Value>, RootEmits<Value>> & PublicProps
) => PartInstance<As, RootProps<Value>, RootEmits<Value>, { state: State["root"] }>

const ListElement = partComponent("TabsListElement", "div", () => scope.use().list)

export interface ListProps extends TabsListOptions, PartComponentProps {}

const List = defineComponent({
  name: "TabsList",
  inheritAttrs: false,
  props: {
    activateOnFocus: optional(Boolean),
    loopFocus: optional(Boolean),
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Use `loopFocus`, which wins when both are given.
     */
    loop: optional(Boolean),
  },
  setup(props, { attrs, slots }) {
    const { listOptions } = scope.use()
    watchEffect(() => listOptions.set(defined({ ...props })), { flush: "sync" })
    return () => h(ListElement, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["list"], ListProps>

export interface TabProps extends TabOptions, PartComponentProps {
  /** What the tabs' value is while this tab is the active one. */
  value: unknown
}

const Tab = defineComponent({
  name: "TabsTab",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true }, disabled: optional(Boolean) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ disabled: props.disabled }))
    // A tab is its value for as long as it is in the page.
    const part = scope.use().tab(props.value, () => defined(options.get()))
    const Element = partComponent("TabsTabElement", "button", () => part)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"button", State["tab"], TabProps>

export interface PanelProps extends PartComponentProps {
  /** The value of the tab this panel belongs to. */
  value: unknown
  /** Keeps the panel in the page, `hidden`, while its tab is not the active one. */
  keepMounted?: boolean | undefined
}

/** `keep-mounted` keeps the panel in the page, `hidden`, while its tab is not the active one. */
const Panel = defineComponent({
  name: "TabsPanel",
  inheritAttrs: false,
  props: { value: { type: ANY, required: true }, keepMounted: Boolean },
  setup(props, { attrs, slots }) {
    const panel = scope.use().panel(props.value)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = panel.mount()
    })
    onBeforeUnmount(() => stop?.())
    const mounted = fromSignal(panel.mounted)
    const Element = partComponent("TabsPanelElement", "div", () => panel.part)
    return () => (mounted.value || props.keepMounted ? h(Element, attrs, slots) : null)
  },
}) as unknown as PartComponent<"div", State["panel"], PanelProps>

export type IndicatorProps = PartComponentProps
export const Tabs = {
  Root,
  List,
  Tab,
  Indicator: partComponent<"span", State["indicator"]>(
    "TabsIndicator",
    "span",
    () => scope.use().indicator
  ),
  Panel,
}
