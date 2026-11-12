import type { ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** The parts of a value drawn as a filled track: a progress bar's, a meter's. */
export function valueBar<Props extends ValueBarProps>(
  name: string,
  create: (props: ReadonlySignal<Props>) => ValueBar
) {
  const Context = createContext<ValueBar | null>(null)

  function use(part: string): ValueBar {
    const controller = useContext(Context)
    if (!controller) throw new Error(`<${name}.${part}> must be inside <${name}.Root>`)
    return controller
  }

  type RootProps = Omit<Props, "id"> & { id?: string } & PartComponentProps

  function Root({
    value,
    min,
    max,
    format,
    locale,
    getAriaValueText,
    id,
    ...rest
  }: RootProps): ReactElement {
    const controller = useController(create, {
      value,
      min,
      max,
      format,
      locale,
      getAriaValueText,
      id,
    } as unknown as Omit<Props, "id"> & { id?: string })
    return (
      <Context.Provider value={controller}>
        <RootElement {...rest} />
      </Context.Provider>
    )
  }

  const RootElement = (props: PartComponentProps) => usePart(use("Root").root, "div", props)
  const Track = (props: PartComponentProps) => usePart(use("Track").track, "div", props)
  const Indicator = (props: PartComponentProps) => usePart(use("Indicator").indicator, "div", props)
  const Label = (props: PartComponentProps) => usePart(use("Label").label, "span", props)

  /** The written value, or what `children` makes of it. */
  function Value({
    children,
    ...props
  }: Omit<PartComponentProps, "children"> & {
    children?: (text: string | undefined) => ReactNode
  }): ReactElement {
    const controller = use("Value")
    const text = useSignal(controller.text)
    return usePart(controller.value, "span", {
      ...props,
      children: children ? children(text) : text,
    })
  }

  return { Root, Track, Indicator, Value, Label }
}
