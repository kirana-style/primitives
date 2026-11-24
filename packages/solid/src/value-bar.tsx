import type { ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, controller, fromSignal, split } from "./runtime.tsx"

/** A value bar's own props: its value, its range and how the value is written. */
export type RootOptions = Omit<ValueBarProps, "id"> & { id?: string }
/** A written value's own props: a function child draws something else of the text. */
export type ValueOptions = { children?: (text: () => string | undefined) => JSX.Element }

/** The props of each part, as the component's entry names them. */
type PartsProps = {
  Root: RootOptions
  Value: ValueOptions
  Track: Record<string, unknown>
  Indicator: Record<string, unknown>
  Label: Record<string, unknown>
}

/** The parts of a value drawn as a filled track: a progress bar's, a meter's. */
export function valueBar<Props extends PartsProps>(
  name: string,
  create: (props: ReadonlySignal<ValueBarProps>) => ValueBar
) {
  const Context = createContext<ValueBar | null>(null)

  function use(): ValueBar {
    const made = useContext(Context)
    if (!made) throw new Error(`A ${name} part must be inside <${name}.Root>`)
    return made
  }

  function Root(props: Props["Root"]): JSX.Element {
    const [local, rest] = split(props as RootOptions, [
      "value",
      "min",
      "max",
      "format",
      "locale",
      "getAriaValueText",
      "id",
    ])
    const generated = createUniqueId()
    const made = controller(create, () => ({ ...local, id: local.id ?? generated }))
    return (
      <Context value={made}>
        <Part of={made.root} tag="div" {...rest} />
      </Context>
    )
  }

  /** The written value, or what its child, a function, makes of it. */
  function Value(props: Props["Value"]): JSX.Element {
    const [local, rest] = split(props as ValueOptions, ["children"])
    const made = use()
    const text = fromSignal(made.text)
    return (
      <Part of={made.value} tag="span" {...rest}>
        {local.children ? local.children(text) : text()}
      </Part>
    )
  }

  const part =
    <Own extends Record<string, unknown>>(key: "track" | "indicator" | "label", tag: string) =>
    (props: Own): JSX.Element => <Part of={use()[key]} tag={tag} {...props} />

  return {
    Root,
    Value,
    Track: part<Props["Track"]>("track", "div"),
    Indicator: part<Props["Indicator"]>("indicator", "div"),
    Label: part<Props["Label"]>("label", "span"),
  }
}
