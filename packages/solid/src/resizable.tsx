import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type { Resizable as Controller } from "@kirana-ui/core/resizable"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useResizable(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Resizable part must be inside <Resizable.Group>")
  return made
}

function Group(
  props: PartComponentProps & {
    orientation?: Orientation
    onSizesChange?: (sizes: number[], details: ChangeDetails) => void
    keyboardStep?: number
    disabled?: boolean
    id?: string
  }
): JSX.Element {
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
      <Part part={made.group} tag="div" {...rest} />
    </Context.Provider>
  )
}

function Panel(
  props: PartComponentProps & { defaultSize?: number; minSize?: number; maxSize?: number }
): JSX.Element {
  const [local, rest] = splitProps(props, ["defaultSize", "minSize", "maxSize"])
  const options = toSignal(() => ({ ...local }))
  const part = useResizable().panel(() => defined(options.get()))
  return <Part part={part} tag="div" {...rest} />
}

function Handle(props: PartComponentProps & { disabled?: boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["disabled"])
  const options = toSignal(() => ({ disabled: local.disabled }))
  const part = useResizable().handle(() => defined(options.get()))
  return <Part part={part} tag="div" {...rest} />
}

export const Resizable = { Group, Panel, Handle }
