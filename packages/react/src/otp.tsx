import type { Part } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp as Controller, OtpProps, OtpSlot } from "@kirana-ui/core/otp"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
const SlotContext = createContext<OtpSlot | null>(null)

function useOtp(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Otp.${part}> must be inside <Otp.Root>`)
  return controller
}

export type RootProps = Omit<OtpProps, "id"> & { id?: string } & PartComponentProps

function Root({
  length,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  mode,
  disabled,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const controller = useController<OtpProps, Controller>(createOtp, {
    length,
    value,
    defaultValue,
    onValueChange,
    onComplete,
    mode,
    disabled,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

const Input = (props: PartComponentProps) => usePart(useOtp("Input").input, "input", props)
const Group = (props: PartComponentProps) => usePart(useOtp("Group").group, "div", props)
const Separator = (props: PartComponentProps) =>
  usePart(useOtp("Separator").separator, "div", props)

/** One cell: it shows its character, then whatever it is given (a caret). */
function Slot({ index, children, ...props }: PartComponentProps & { index: number }) {
  const slot = useOtp("Slot").slot(index)
  const char = useSignal(slot.char)
  return (
    <SlotContext.Provider value={slot}>
      <PartElement part={slot.part} tag="div" {...props}>
        {char}
        {children}
      </PartElement>
    </SlotContext.Provider>
  )
}

/** Drawn in its cell while the cell is the active one and empty. */
function Caret(props: PartComponentProps): ReactElement | null {
  const controller = useOtp("Caret")
  const slot = useContext(SlotContext)
  if (!slot) throw new Error("<Otp.Caret> must be inside <Otp.Slot>")
  const shown = useSignal(slot.caret)
  return shown ? <PartElement part={controller.caretPart} tag="div" {...props} /> : null
}

export const Otp = { Root, Input, Group, Slot, Separator, Caret }
