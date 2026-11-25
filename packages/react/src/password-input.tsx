import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createPasswordInput } from "@kirana-ui/core/password-input"
import type {
  PasswordInput as Controller,
  PasswordInputProps,
} from "@kirana-ui/core/password-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["passwordInput"]

const Context = createContext<Controller | null>(null)

function usePasswordInput(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<PasswordInput.${part}> must be inside <PasswordInput.Root>`)
  return controller
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>, PasswordInputProps>

function Root({
  visible,
  defaultVisible,
  onVisibleChange,
  disabled,
  onValueChange,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<PasswordInputProps, Controller>(
    within(createPasswordInput, { field }),
    { visible, defaultVisible, onVisibleChange, disabled, onValueChange }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

/** It takes what an `<input>` takes (`value`, `defaultValue`, `autoComplete`). */
const Input = (props: InputProps) => usePart(usePasswordInput("Input").input, "input", props)

export type ToggleProps = PartComponentProps<"button", StateOf<Parts["toggle"]>>

const Toggle = (props: ToggleProps) => usePart(usePasswordInput("Toggle").toggle, "button", props)

export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>

const Indicator = (props: IndicatorProps) =>
  usePart(usePasswordInput("Indicator").indicator, "span", props)

export const PasswordInput = /* @__PURE__ */ parts("PasswordInput", {
  Root,
  Input,
  Toggle,
  Indicator,
})
