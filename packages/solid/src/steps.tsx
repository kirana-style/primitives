import { within } from "@kirana-ui/core"
import type { ChangeDetails, ReadonlySignal, StateOf } from "@kirana-ui/core"
import { createSteps } from "@kirana-ui/core/steps"
import type { Steps as Controller, StepsProps } from "@kirana-ui/core/steps"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["steps"]

const Context = createContext<Controller | null>(null)
// The step an item is, for the parts inside it: given, or counted from the page.
const ItemContext = createContext<ReadonlySignal<number> | null>(null)

function useSteps(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Steps part must be inside <Steps.Root>")
  return made
}

function useIndex(part: string): ReadonlySignal<number> {
  const index = useContext(ItemContext)
  if (index === null) throw new Error(`<Steps.${part}> must be inside <Steps.Item>`)
  return index
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<StepsProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "step",
    "defaultStep",
    "onStepChange",
    "count",
    "linear",
    "orientation",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createSteps, { direction: useContext(DirectionContext) ?? undefined }),
    () => ({
      id: local.id ?? generated,
      step: local.step,
      defaultStep: local.defaultStep,
      count: local.count,
      linear: local.linear,
      orientation: local.orientation,
      onStepChange: (step: number, details: ChangeDetails) => local.onStepChange?.(step, details),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const List = (props: ListProps) => <Part of={useSteps().list} tag="div" {...props} />

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /**
     * Which step it is, from 0. Left out, its place among the items in the page, once it is
     * there: give it on a page a server draws, which cannot count them.
     */
    index?: number
  }
>

function Item(props: ItemProps): JSX.Element {
  const [local, rest] = split(props, ["index"])
  // An item is its step for as long as it is in the page.
  const item = useSteps().item(untrack(() => local.index))
  return (
    <ItemContext value={item.index}>
      <Part of={item} tag="div" {...rest} />
    </ItemContext>
  )
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>
export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

// A part of the step its item is.
const inItem =
  <Props extends Record<string, unknown>>(
    name: "trigger" | "indicator" | "separator",
    label: string,
    tag: string
  ) =>
  (props: Props): JSX.Element => (
    <Part of={useSteps()[name](useIndex(label))} tag={tag} {...props} />
  )

export type ContentProps = PartComponentProps<
  "div",
  StateOf<Parts["content"]>,
  {
    /** The step it is shown for, from 0. */
    index: number
  }
>

function Content(props: ContentProps): JSX.Element {
  const [local, rest] = split(props, ["index"])
  const part = useSteps().content(untrack(() => local.index))
  return <Part of={part} tag="div" {...rest} />
}

export type CompletedProps = PartComponentProps<"div", StateOf<Parts["completed"]>>
export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const part =
  <Props extends Record<string, unknown>>(name: "completed" | "previous" | "next", tag: string) =>
  (props: Props): JSX.Element => <Part of={useSteps()[name]} tag={tag} {...props} />

export const Steps = {
  Root,
  List,
  Item,
  Trigger: inItem<TriggerProps>("trigger", "Trigger", "button"),
  Indicator: inItem<IndicatorProps>("indicator", "Indicator", "span"),
  Separator: inItem<SeparatorProps>("separator", "Separator", "div"),
  Content,
  Completed: part<CompletedProps>("completed", "div"),
  Previous: part<PreviousProps>("previous", "button"),
  Next: part<NextProps>("next", "button"),
}
