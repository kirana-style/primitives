import { defined } from "@kirana-ui/core"
import type { Anchor, ChangeDetails, PositionOptions, Signal, StateOf } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover as Controller, PopoverTriggerOptions } from "@kirana-ui/core/popover"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, Portal as BodyPortal, controller, split, follow } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["popover"]

/**
 * The popover its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the popover's parts).
 */
const Context = createContext<Controller | null>(null)
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
  /**
   * What the page behind it may do while it is open. `false` (the default): everything.
   * `true`: nothing, the page is inert and does not scroll, and Tab stays inside the popover.
   * `"trap-focus"`: Tab stays inside the popover, and the page can still be pressed and
   * scrolled. A popover the pointer opened holds nothing until it is pressed. Read as it opens.
   */
  modal?: boolean | "trap-focus"
  id?: string
  children?: JSX.Element
}

function Root(props: RootProps): JSX.Element {
  const generated = createUniqueId()
  const made = controller(createPopover, () => ({
    id: props.id ?? generated,
    open: props.open,
    modal: props.modal,
    defaultOpen: props.defaultOpen,
    onOpenChange: (open: boolean, details: ChangeDetails) => props.onOpenChange?.(open, details),
  }))
  return <Context value={made}>{props.children}</Context>
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
  const [local, rest] = split(props as PositionerOptions, [
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "collisionBoundary",
    "collisionAvoidance",
    "sticky",
    "arrowPadding",
    "positionMethod",
    "anchor",
  ])
  follow(
    () => {
      const anchor = local.anchor
      return defined({
        ...local,
        // A function is asked here, so a change of the signal it reads is followed; and given
        // whole while it has nothing, to be asked again as the popup is placed.
        anchor: typeof anchor === "function" ? (anchor() ?? anchor) : anchor,
      })
    },
    (options) => positioning.set(options)
  )
  return rest as Omit<P, keyof PositionerOptions>
}

function Positioner(props: PositionerProps): JSX.Element {
  const made = usePopover()
  return <Part of={made.positioner} tag="div" {...positioned(props, made.positioning)} />
}

/** What a trigger takes of its own: whether the pointer opens the popover too, and its waits. */
export type TriggerOptions = PopoverTriggerOptions

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>, TriggerOptions>
export type BackdropProps = PartComponentProps<"div", StateOf<Parts["backdrop"]>>
export type ArrowProps = PartComponentProps<"div", StateOf<Parts["arrow"]>>
export type PopupProps = PartComponentProps<"div", StateOf<Parts["popup"]>>
export type TitleProps = PartComponentProps<"h2", StateOf<Parts["title"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>
export type CloseProps = PartComponentProps<"button", StateOf<Parts["close"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "backdrop" | "popup" | "arrow" | "title" | "description" | "close",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={usePopover()[name]} tag={tag} {...props} />

function Trigger(props: TriggerProps): JSX.Element {
  const [local, rest] = split(props as TriggerOptions, ["openOnHover", "delay", "closeDelay"])
  const made = usePopover()
  follow(
    () => defined({ ...local }),
    (options) => made.hovering.set(options)
  )
  return <Part of={made.trigger} tag="button" {...rest} />
}

export const Popover = {
  Root,
  Portal,
  Backdrop: part<BackdropProps>("backdrop", "div"),
  Positioner,
  Trigger,
  Popup: part<PopupProps>("popup", "div"),
  Arrow: part<ArrowProps>("arrow", "div"),
  Title: part<TitleProps>("title", "h2"),
  Description: part<DescriptionProps>("description", "p"),
  Close: part<CloseProps>("close", "button"),
}
