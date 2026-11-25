import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createPasswordInput } from "@kirana-ui/core/password-input"
import type {
  PasswordInput as Controller,
  PasswordInputProps,
} from "@kirana-ui/core/password-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, controller, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["passwordInput"]

const Context = createContext<Controller | null>(null)

function usePasswordInput(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A PasswordInput part must be inside <PasswordInput.Root>")
  return made
}

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>, PasswordInputProps>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "visible",
    "defaultVisible",
    "onVisibleChange",
    "disabled",
    "onValueChange",
    "toggleLabels",
  ])
  const made = controller(
    within(createPasswordInput, { field: useContext(FieldContext) ?? undefined }),
    () => ({
      visible: local.visible,
      defaultVisible: local.defaultVisible,
      disabled: local.disabled,
      toggleLabels: local.toggleLabels,
      onVisibleChange: (visible: boolean, details: ChangeDetails) =>
        local.onVisibleChange?.(visible, details),
      onValueChange: (value: string, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
    })
  )
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type ToggleProps = PartComponentProps<"button", StateOf<Parts["toggle"]>>
export type IndicatorProps = PartComponentProps<"span", StateOf<Parts["indicator"]>>

const part =
  <Props extends Record<string, unknown>>(name: "input" | "toggle" | "indicator", tag: string) =>
  (props: Props): JSX.Element => <Part of={usePasswordInput()[name]} tag={tag} {...props} />

export const PasswordInput = {
  Root,
  /** It takes what an `<input>` takes (`value`, `autocomplete`). */
  Input: part<InputProps>("input", "input"),
  Toggle: part<ToggleProps>("toggle", "button"),
  Indicator: part<IndicatorProps>("indicator", "span"),
}
