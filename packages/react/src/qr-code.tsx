import type { StateOf } from "@kirana-ui/core"
import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCodeProps } from "@kirana-ui/core/qr-code"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["qrCode"]

const Context = createContext<Controller | null>(null)

function useQrCode(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<QrCode.${part}> must be inside <QrCode.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<QrCodeProps, "id"> & { id?: string }
>

function Root({ value, correction, id, ...rest }: RootProps): ReactElement {
  const controller = useController<QrCodeProps, Controller>(createQrCode, {
    value,
    correction,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type FrameProps = PartComponentProps<"svg", StateOf<Parts["frame"]>>

const Frame = (props: FrameProps) => usePart(useQrCode("Frame").frame, "svg", props)
export type PatternProps = PartComponentProps<"path", StateOf<Parts["pattern"]>>

const Pattern = (props: PatternProps) => usePart(useQrCode("Pattern").pattern, "path", props)

export const QrCode = /* @__PURE__ */ parts("QrCode", { Root, Frame, Pattern })
