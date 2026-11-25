import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createSteps } from "@kirana-ui/core/steps"
import type { Steps as Controller, StepsProps } from "@kirana-ui/core/steps"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["steps"]

const Context = createContext<Controller | null>(null)
// The step an item is, for the parts inside it.
const ItemContext = createContext<number | null>(null)

function useSteps(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Steps.${part}> must be inside <Steps.Root>`)
  return controller
}

function useIndex(part: string): number {
  const index = useContext(ItemContext)
  if (index === null) throw new Error(`<Steps.${part}> must be inside <Steps.Item>`)
  return index
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<StepsProps, "id"> & { id?: string }
>

function Root({
  step,
  defaultStep,
  onStepChange,
  count,
  linear,
  orientation,
  id,
  ...rest
}: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createSteps, { direction })
  const controller: Controller = useController(create, {
    step,
    defaultStep,
    onStepChange,
    count,
    linear,
    orientation,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type ListProps = PartComponentProps<"div", StateOf<Parts["list"]>>

const List = (props: ListProps) => usePart(useSteps("List").list, "div", props)

export type ItemProps = PartComponentProps<
  "div",
  StateOf<Parts["item"]>,
  {
    /** Which step it is, from 0. */
    index: number
  }
>

function Item({ index, ...props }: ItemProps): ReactElement {
  return (
    <ItemContext.Provider value={index}>
      {usePart(useSteps("Item").item(index), "div", props)}
    </ItemContext.Provider>
  )
}

export type TriggerProps = PartComponentProps<"button", StateOf<Parts["trigger"]>>

const Trigger = (props: TriggerProps) =>
  usePart(useSteps("Trigger").trigger(useIndex("Trigger")), "button", props)

export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>

const Indicator = (props: IndicatorProps) =>
  usePart(useSteps("Indicator").indicator(useIndex("Indicator")), "span", props)

export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const Separator = (props: SeparatorProps) =>
  usePart(useSteps("Separator").separator(useIndex("Separator")), "div", props)

export type ContentProps = PartComponentProps<
  "div",
  StateOf<Parts["content"]>,
  {
    /** The step it is shown for, from 0. */
    index: number
  }
>

function Content({ index, ...props }: ContentProps): ReactElement {
  return usePart(useSteps("Content").content(index), "div", props)
}

export type CompletedProps = PartComponentProps<"div", StateOf<Parts["completed"]>>

const Completed = (props: CompletedProps) => usePart(useSteps("Completed").completed, "div", props)

export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>

const Previous = (props: PreviousProps) => usePart(useSteps("Previous").previous, "button", props)

export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const Next = (props: NextProps) => usePart(useSteps("Next").next, "button", props)

export const Steps = /* @__PURE__ */ parts("Steps", {
  Root,
  List,
  Item,
  Trigger,
  Indicator,
  Separator,
  Content,
  Completed,
  Previous,
  Next,
})
