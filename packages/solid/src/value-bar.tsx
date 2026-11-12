import type { ReadonlySignal } from "@kirana-ui/core"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

export type RootProps = PartComponentProps & Omit<ValueBarProps, "id"> & { id?: string }

/** The parts of a value drawn as a filled track: a progress bar's, a meter's. */
export function valueBar(name: string, create: (props: ReadonlySignal<ValueBarProps>) => ValueBar) {
  const Context = createContext<ValueBar>()

  function use(): ValueBar {
    const made = useContext(Context)
    if (!made) throw new Error(`A ${name} part must be inside <${name}.Root>`)
    return made
  }

  function Root(props: RootProps): JSX.Element {
    const [local, rest] = splitProps(props, [
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
      <Context.Provider value={made}>
        <Part part={made.root} tag="div" {...rest} />
      </Context.Provider>
    )
  }

  /** The written value, or what its child, a function, makes of it. */
  function Value(
    props: Omit<PartComponentProps, "children"> & {
      children?: (text: () => string | undefined) => JSX.Element
    }
  ): JSX.Element {
    const [local, rest] = splitProps(props, ["children"])
    const made = use()
    const text = fromSignal(made.text)
    return (
      <Part part={made.value} tag="span" {...rest}>
        {local.children ? local.children(text) : text()}
      </Part>
    )
  }

  const part =
    (key: "track" | "indicator" | "label", tag: string) => (props: PartComponentProps) => (
      <Part part={use()[key]} tag={tag} {...props} />
    )

  return {
    Root,
    Value,
    Track: part("track", "div"),
    Indicator: part("indicator", "div"),
    Label: part("label", "span"),
  }
}
