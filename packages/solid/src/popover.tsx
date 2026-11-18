import { defined } from "@kirana-ui/core"
import type { Anchor, ChangeDetails, PositionOptions, Signal, StateOf } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller } from "@kirana-ui/core/popover"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createComputed, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, Portal as BodyPortal, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["popover"]

/**
 * The popover its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the popover's parts).
 */
const Context = createContext<Controller>()
/** For a component made of this one's parts: a date picker. */
export { Context as PopoverContext }

function usePopover(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Popover part must be inside <Popover.Root>")
  return made
}

export type RootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails) => void
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createPopover, () => ({
    id: props.id ?? generated,
    open: props.open,
    defaultOpen: props.defaultOpen,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context.Provider value={made}>{props.children}</Context.Provider>
}

export type PortalProps = { children?: JSX.Element }

const Portal = (props: PortalProps) => (
  <BodyPortal mounted={usePopover().mounted}>{props.children}</BodyPortal>
)

/** A positioner's own props: where its popup goes, and what it is placed against. */
export type PositionerOptions = Partial<Omit<PositionOptions, "anchor">> & {
  /**
   * What the popup is placed against, when that is not its trigger: an element, a place in
   * the viewport (an object with `getBoundingClientRect`), or a function that gives one (a
   * signal's accessor, or `() => element` for a variable a `ref` fills). It may change
   * while the popup is open: the popup follows.
   */
  anchor?: Anchor | (() => Anchor | null | undefined) | null | undefined
}

export type PositionerProps = PartComponentProps<
  "div",
  StateOf<Parts["positioner"]>,
  PositionerOptions
>

/**
 * A positioner's own props, written where its placement reads them, before its element
 * attaches: the one place they are named. Gives back what is left, for the part's element.
 */
export function positioned<P extends PositionerOptions>(
  props: P,
  positioning: Signal<Partial<PositionOptions>>
): Omit<P, keyof PositionerOptions> {
  const [local, rest] = splitProps(props as PositionerOptions, [
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "anchor",
  ])
  createComputed(() => {
    const anchor = local.anchor
    positioning.set(
      defined({
        ...local,
        // A function is asked here, so a change of the signal it reads is followed; and given
        // whole while it has nothing, to be asked again as the popup is placed.
        anchor: typeof anchor === "function" ? (anchor() ?? anchor) : anchor,
      })
    )
  })
  return rest as Omit<P, keyof PositionerOptions>
}

function Positioner(props: PositionerProps): JSX.Element {
  const made = usePopover()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "popup" | "title" | "description" | "close",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={usePopover()[name]} tag={tag} {...props} />

export const Popover = {
  Root,
  Portal,
  Positioner,
  Trigger: part<TriggerProps>("trigger", "button"),
  Popup: part<PopupProps>("popup", "div"),
  Title: part<TitleProps>("title", "h2"),
  Description: part<DescriptionProps>("description", "p"),
  Close: part<CloseProps>("close", "button"),
}
