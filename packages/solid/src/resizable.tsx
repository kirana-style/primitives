import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation, StateOf } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type { Resizable as Controller } from "@kirana-ui/core/resizable"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["resizable"]

const Context = createContext<Controller>()

function useResizable(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Resizable part must be inside <Resizable.Group>")
  return made
}

export type GroupProps = PartComponentProps<
  "div",
  StateOf<Parts["group"]>,
  {
    orientation?: Orientation
    onSizesChange?: (sizes: number[], details: ChangeDetails) => void
    keyboardStep?: number
    disabled?: boolean
    id?: string
  }
>

function Group(props: GroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "orientation",
    "onSizesChange",
    "keyboardStep",
    "disabled",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createResizable, { direction }), () => ({
    id: local.id ?? generated,
    orientation: local.orientation,
    keyboardStep: local.keyboardStep,
    disabled: local.disabled,
    onSizesChange: (sizes: number[], details: ChangeDetails) =>
      local.onSizesChange?.(sizes, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.group} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type PanelProps = PartComponentProps<
  "div",
  StateOf<Parts["panel"]>,
  { defaultSize?: number; minSize?: number; maxSize?: number }
>

function Panel(props: PanelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["defaultSize", "minSize", "maxSize"])
  const options = toSignal(() => ({ ...local }))
  const part = useResizable().panel(() => defined(options.get()))
  return <Part of={part} tag="div" {...rest} />
}

export type HandleProps = PartComponentProps<
  "div",
  StateOf<Parts["handle"]>,
  { disabled?: boolean }
>

function Handle(props: HandleProps): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  const part = useResizable().handle(() => defined(options.get()))
  return <Part of={part} tag="div" {...rest} />
}

export const Resizable = { Group, Panel, Handle }
