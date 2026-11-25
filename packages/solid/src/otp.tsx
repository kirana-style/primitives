import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["otp"]

const Context = createContext<Controller | null>(null)
const SlotContext = createContext<OtpSlot | null>(null)

function useOtp(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Otp part must be inside <Otp.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  {
    length?: number
    value?: string
    defaultValue?: string
    onValueChange?: (value: string, details: ChangeDetails) => void
    /** Every character is in, with the details of the change that did it. */
    onValueComplete?: (value: string, details: ChangeDetails) => void
    /**
     * Every character is in.
     * @deprecated Use `onValueComplete`, the one called when both are given.
     */
    onComplete?: (value: string) => void
    validationType?: OtpProps["validationType"]
    /**
     * What a character may be.
     * @deprecated Use `validationType`, which wins when both are given.
     */
    mode?: OtpProps["mode"]
    pattern?: string
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    name?: string
    form?: string
    id?: string
  }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "length",
    "value",
    "defaultValue",
    "onValueChange",
    "onValueComplete",
    "onComplete",
    "validationType",
    "mode",
    "pattern",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const field = useContext(FieldContext) ?? undefined
  const made = controller(within(createOtp, { field }), () => ({
    id: local.id ?? generated,
    length: local.length,
    value: local.value,
    defaultValue: local.defaultValue,
    validationType: local.validationType,
    mode: local.mode,
    pattern: local.pattern,
    disabled: local.disabled,
    readOnly: local.readOnly,
    required: local.required,
    name: local.name,
    form: local.form,
    onValueChange: (value: string, details: ChangeDetails) => local.onValueChange?.(value, details),
    // Each only when given: Base UI's is the one called when both are.
    onValueComplete: local.onValueComplete
      ? (value: string, details: ChangeDetails) => local.onValueComplete?.(value, details)
      : undefined,
    onComplete: local.onComplete ? (value: string) => local.onComplete?.(value) : undefined,
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type SlotProps = PartComponentProps<"div", StateOf<Parts["slot"]>, { index: number }>

/** One cell: it shows its character, then whatever it is given (a caret). */
function Slot(props: SlotProps): JSX.Element {
  const [local, rest] = split(props, ["index", "children"])
  const slot = useOtp().slot(untrack(() => local.index))
  const char = fromSignal(slot.char)
  return (
    <SlotContext value={slot}>
      <Part of={slot.part} tag="div" {...rest}>
        {char()}
        {local.children}
      </Part>
    </SlotContext>
  )
}

export type CaretProps = PartComponentProps<"div", StateOf<Parts["caret"]>>

/** Drawn in its cell while the cell is the active one and empty. */
function Caret(props: CaretProps): JSX.Element {
  const made = useOtp()
  const slot = useContext(SlotContext)
  if (!slot) throw new Error("An Otp.Caret must be inside <Otp.Slot>")
  const shown = fromSignal(slot.caret)
  return (
    <Show when={shown()}>
      <Part of={made.caretPart} tag="div" {...props} />
    </Show>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>>
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const part =
  <Props extends Record<string, unknown>>(name: "input" | "group" | "separator", tag: string) =>
  (props: Props): JSX.Element => <Part of={useOtp()[name]} tag={tag} {...props} />

export const Otp = {
  Root,
  Input: part<InputProps>("input", "input"),
  Group: part<GroupProps>("group", "div"),
  Slot,
  Separator: part<SeparatorProps>("separator", "div"),
  Caret,
}
