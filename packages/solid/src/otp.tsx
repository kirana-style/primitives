import type { ChangeDetails } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import { Show, createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
const SlotContext = createContext<OtpSlot>()

function useOtp(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Otp part must be inside <Otp.Root>")
  return made
}

export type RootProps = PartComponentProps & {
  length?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, details: ChangeDetails) => void
  onComplete?: (value: string) => void
  mode?: OtpProps["mode"]
  disabled?: boolean
  name?: string
  form?: string
  id?: string
}

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "length",
    "value",
    "defaultValue",
    "onValueChange",
    "onComplete",
    "mode",
    "disabled",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createOtp, () => ({
    id: local.id ?? generated,
    length: local.length,
    value: local.value,
    defaultValue: local.defaultValue,
    mode: local.mode,
    disabled: local.disabled,
    name: local.name,
    form: local.form,
    onValueChange: (value: string, details: ChangeDetails) => local.onValueChange?.(value, details),
    onComplete: (value: string) => local.onComplete?.(value),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

/** One cell: it shows its character, then whatever it is given (a caret). */
function Slot(props: PartComponentProps & { index: number }): JSX.Element {
  const [local, rest] = splitProps(props, ["index", "children"])
  const slot = useOtp().slot(untrack(() => local.index))
  const char = fromSignal(slot.char)
  return (
    <SlotContext.Provider value={slot}>
      <Part part={slot.part} tag="div" {...rest}>
        {char()}
        {local.children}
      </Part>
    </SlotContext.Provider>
  )
}

/** Drawn in its cell while the cell is the active one and empty. */
function Caret(props: PartComponentProps): JSX.Element {
  const made = useOtp()
  const slot = useContext(SlotContext)
  if (!slot) throw new Error("An Otp.Caret must be inside <Otp.Slot>")
  const shown = fromSignal(slot.caret)
  return (
    <Show when={shown()}>
      <Part part={made.caretPart} tag="div" {...props} />
    </Show>
  )
}

const part =
  (name: "input" | "group" | "separator", tag: string) => (props: PartComponentProps) => (
    <Part part={useOtp()[name]} tag={tag} {...props} />
  )

export const Otp = {
  Root,
  Input: part("input", "input"),
  Group: part("group", "div"),
  Slot,
  Separator: part("separator", "div"),
  Caret,
}
