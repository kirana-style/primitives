import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["otp"]

const Context = createContext<Controller | null>(null)
const SlotContext = createContext<OtpSlot | null>(null)

function useOtp(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Otp.${part}> must be inside <Otp.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<OtpProps, "id"> & {
    /** The id of its input, not of the root: a `<label for>` names it. */
    id?: string
  }
>

function Root({
  length,
  value,
  defaultValue,
  onValueChange,
  onValueComplete,
  onComplete,
  validationType,
  mode,
  pattern,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<OtpProps, Controller>(within(createOtp, { field }), {
    length,
    value,
    defaultValue,
    onValueChange,
    onValueComplete,
    onComplete,
    validationType,
    mode,
    pattern,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => usePart(useOtp("Input").input, "input", props)
export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>>

const Group = (props: GroupProps) => usePart(useOtp("Group").group, "div", props)
export type SeparatorProps = PartComponentProps<"div", StateOf<Parts["separator"]>>

const Separator = (props: SeparatorProps) => usePart(useOtp("Separator").separator, "div", props)

export type SlotProps = PartComponentProps<
  "div",
  StateOf<Parts["slot"]>,
  {
    /** Which character of the code it shows, from 0. */
    index: number
  }
>

/** One cell: it shows its character, then whatever it is given (a caret). */
function Slot({ index, ...props }: SlotProps): ReactElement {
  const slot = useOtp("Slot").slot(index)
  const char = useSignal(slot.char)
  return (
    <SlotContext.Provider value={slot}>
      {usePart(slot.part, "div", props, undefined, (content) => (
        // Its character comes first, whatever element the caller asked for.
        <>
          {char}
          {content}
        </>
      ))}
    </SlotContext.Provider>
  )
}

export type CaretProps = PartComponentProps<"div", StateOf<Parts["caret"]>>

/** Drawn in its cell while the cell is the active one and empty. */
function Caret(props: CaretProps): ReactElement | null {
  const controller = useOtp("Caret")
  const slot = useContext(SlotContext)
  if (!slot) throw new Error("<Otp.Caret> must be inside <Otp.Slot>")
  const shown = useSignal(slot.caret)
  return shown ? <PartElement of={controller.caretPart} tag="div" {...props} /> : null
}

export const Otp = /* @__PURE__ */ parts("Otp", { Root, Input, Group, Slot, Separator, Caret })
