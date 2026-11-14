import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCorrection } from "@kirana-ui/core/qr-code"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useQrCode(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A QrCode part must be inside <QrCode.Root>")
  return made
}

function Root(
  props: PartComponentProps & { value: string; correction?: QrCorrection; id?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "correction", "id"])
  const generated = createUniqueId()
  const made = controller(createQrCode, () => ({
    id: local.id ?? generated,
    value: local.value,
    correction: local.correction,
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

const Frame = (props: PartComponentProps) => <Part part={useQrCode().frame} tag="svg" {...props} />
const Pattern = (props: PartComponentProps) => (
  <Part part={useQrCode().pattern} tag="path" {...props} />
)

export const QrCode = { Root, Frame, Pattern }
