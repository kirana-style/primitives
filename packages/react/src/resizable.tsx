import { defined, within } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type {
  Resizable as Controller,
  ResizablePanelOptions,
  ResizableProps,
} from "@kirana-ui/core/resizable"
import { createContext, useContext, useMemo } from "react"
import type { ReactElement } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, useOptions, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useResizable(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Resizable.${part}> must be inside <Resizable.Group>`)
  return controller
}

export type GroupProps = Omit<ResizableProps, "id"> & { id?: string } & PartComponentProps

function Group({
  orientation,
  onSizesChange,
  keyboardStep,
  disabled,
  id,
  ...rest
}: GroupProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<ResizableProps, Controller>(
    within(createResizable, { direction }),
    { orientation, onSizesChange, keyboardStep, disabled, id }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.group, "div", rest)}</Context.Provider>
  )
}

export type PanelProps = PartComponentProps & ResizablePanelOptions

function Panel({ defaultSize, minSize, maxSize, ...props }: PanelProps): ReactElement {
  const controller = useResizable("Panel")
  const options = useOptions({ defaultSize, minSize, maxSize })
  const part = useMemo(() => controller.panel(() => defined(options.get())), [controller, options])
  return usePart(part, "div", props)
}

function Handle({ disabled, ...props }: PartComponentProps & { disabled?: boolean }) {
  const controller = useResizable("Handle")
  const options = useOptions({ disabled })
  const part = useMemo(() => controller.handle(() => defined(options.get())), [controller, options])
  return usePart(part, "div", props)
}

export const Resizable = { Group, Panel, Handle }
