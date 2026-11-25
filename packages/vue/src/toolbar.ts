import { defined, within } from "@kirana-ui/core"
import type { Orientation } from "@kirana-ui/core"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type {
  Toolbar as Controller,
  ToolbarItemOptions,
  ToolbarProps,
} from "@kirana-ui/core/toolbar"
import { defineComponent, h, inject, provide } from "vue"
import type { PropType } from "vue"

import { useDirectionAround } from "./direction-context.ts"
import { controller, optional, partComponent, toSignal } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"
import { TOGGLE_GROUP, TOOLBAR } from "./toolbar-context.ts"

type State = StatesOf<"toolbar">

function useToolbar(): Controller {
  const made = inject(TOOLBAR, null)
  if (!made) throw new Error("A Toolbar part must be inside <Toolbar.Root>")
  return made
}

export interface RootProps extends ToolbarProps, PartComponentProps {}

const Root = defineComponent({
  name: "ToolbarRoot",
  inheritAttrs: false,
  props: {
    orientation: String as PropType<Orientation>,
    loopFocus: optional(Boolean),
    /**
     * Whether the arrows wrap from the last item to the first.
     * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
     */
    loop: optional(Boolean),
    disabled: Boolean,
  },
  setup(props, { attrs, slots }) {
    const direction = useDirectionAround()
    const made = controller(within(createToolbar, { direction }), () => ({
      orientation: props.orientation,
      loop: props.loop,
      loopFocus: props.loopFocus,
      disabled: props.disabled,
    }))
    provide(TOOLBAR, made)
    // A toggle group around the toolbar is not the group of the toolbar's toggles.
    provide(TOGGLE_GROUP, null)
    const Element = partComponent("ToolbarRootElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps>

/** `focusable-when-disabled` keeps it focusable while disabled, as Base UI's. Default `true`. */
export interface ButtonProps extends ToolbarItemOptions, PartComponentProps {}
export type InputProps = ButtonProps
export type GroupProps = Omit<ButtonProps, "focusableWhenDisabled">
export type LinkProps = PartComponentProps
export type SeparatorProps = PartComponentProps

const item = <Item extends "button" | "input" | "group", Tag extends string>(
  name: Item,
  label: string,
  tag: Tag
) =>
  defineComponent({
    name: `Toolbar${label}`,
    inheritAttrs: false,
    props: {
      disabled: optional(Boolean),
      // Absent is `undefined`, which the core reads as Base UI's default, `true`.
      focusableWhenDisabled: { type: Boolean, default: undefined as unknown },
    },
    setup(props, { attrs, slots }) {
      const options = toSignal(() => ({
        disabled: props.disabled,
        focusableWhenDisabled: props.focusableWhenDisabled as boolean | undefined,
      }))
      const part = useToolbar()[name](() => defined(options.get()))
      const Element = partComponent<string>(`Toolbar${label}Element`, tag, () => part)
      return () => h(Element, attrs, slots)
    },
  }) as unknown as PartComponent<Tag, State[Item], ButtonProps>

export const Toolbar = {
  Root,
  Button: item("button", "Button", "button"),
  Link: partComponent<"a", State["link"]>("ToolbarLink", "a", () => useToolbar().link()),
  Input: item("input", "Input", "input"),
  Group: item("group", "Group", "div"),
  Separator: partComponent<"div", State["separator"]>(
    "ToolbarSeparator",
    "div",
    () => useToolbar().separator
  ),
}
