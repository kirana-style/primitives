import type { StateOf } from "@kirana-ui/core"
import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCorrection } from "@kirana-ui/core/qr-code"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["qrCode"]

const Context = createContext<Controller>()

function useQrCode(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A QrCode part must be inside <QrCode.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  { value: string; correction?: QrCorrection; id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "correction", "id"])
  const generated = createUniqueId()
  const made = controller(createQrCode, () => ({
    id: local.id ?? generated,
    value: local.value,
    correction: local.correction,
  }))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type FrameProps = PartComponentProps<"svg", StateOf<Parts["frame"]>>
export type PatternProps = PartComponentProps<"path", StateOf<Parts["pattern"]>>

const Frame = (props: FrameProps) => <Part of={useQrCode().frame} tag="svg" {...props} />
const Pattern = (props: PatternProps) => <Part of={useQrCode().pattern} tag="path" {...props} />

export const QrCode = { Root, Frame, Pattern }
