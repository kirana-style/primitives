import type { PartState, ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

/** What a value bar's written value takes of its own: what to write in its place. */
export interface ValueOptions {
  /** Draws something else than the written value: it is given the text, `undefined` while there is none. */
  children?: (text: string | undefined) => ReactNode
}

/** The props of a value bar's parts, as their component's entry types them. */
export interface ValueBarPartProps {
  Root: object
  Track: object
  Indicator: object
  Value: ValueOptions
  Label: object
}

/** The parts of a value drawn as a filled track: a progress bar's, a meter's. */
export function valueBar<Props extends ValueBarProps, Typed extends ValueBarPartProps>(
  name: string,
  create: (props: ReadonlySignal<Props>) => ValueBar
) {
  const Context = createContext<ValueBar | null>(null)

  function use(part: string): ValueBar {
    const controller = useContext(Context)
    if (!controller) throw new Error(`<${name}.${part}> must be inside <${name}.Root>`)
    return controller
  }

  // Typed here as any bar's: the entry says which states its parts have.
  type RootProps = PartComponentProps<"div"> & Omit<ValueBarProps, "id"> & { id?: string }

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
        <PartElement of={controller.root} tag="div" {...rest} />
      </Context.Provider>
    )
  }

  const Track = (props: PartComponentProps) => usePart(use("Track").track, "div", props)
  const Indicator = (props: PartComponentProps) => usePart(use("Indicator").indicator, "div", props)
  const Label = (props: PartComponentProps<"span">) => usePart(use("Label").label, "span", props)

  /** The written value, or what `children` makes of it. */
  function Value({
    children,
    ...props
  }: PartComponentProps<"span", PartState, ValueOptions>): ReactElement {
    const controller = use("Value")
    const text = useSignal(controller.text)
    return usePart(controller.value, "span", {
      ...props,
      children: children ? children(text) : text,
    })
  }

  return parts(name, { Root, Track, Indicator, Value, Label }) as unknown as {
    Root: (props: Typed["Root"]) => ReactElement
    Track: (props: Typed["Track"]) => ReactElement
    Indicator: (props: Typed["Indicator"]) => ReactElement
    Value: (props: Typed["Value"]) => ReactElement
    Label: (props: Typed["Label"]) => ReactElement
  }
}
