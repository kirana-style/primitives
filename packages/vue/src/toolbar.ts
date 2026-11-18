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
    loop: optional(Boolean),
    disabled: Boolean,
  },
  setup(props, { attrs, slots }) {
    const direction = useDirectionAround()
    const made = controller(within(createToolbar, { direction }), () => ({
      orientation: props.orientation,
      loop: props.loop,
      disabled: props.disabled,
    }))
    provide(TOOLBAR, made)
    // A toggle group around the toolbar is not the group of the toolbar's toggles.
    provide(TOGGLE_GROUP, null)
    const Element = partComponent("ToolbarRootElement", "div", () => made.root)
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"div", State["root"], RootProps>

export interface ButtonProps extends ToolbarItemOptions, PartComponentProps {}
export type InputProps = ButtonProps
export type GroupProps = ButtonProps
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
    props: { disabled: optional(Boolean) },
    setup(props, { attrs, slots }) {
      const options = toSignal(() => ({ disabled: props.disabled }))
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
