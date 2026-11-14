import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode as Controller, QrCodeProps } from "@kirana-ui/core/qr-code"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useQrCode(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<QrCode.${part}> must be inside <QrCode.Root>`)
  return controller
}

export type RootProps = Omit<QrCodeProps, "id"> & { id?: string } & PartComponentProps

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

const Frame = (props: PartComponentProps) => usePart(useQrCode("Frame").frame, "svg", props)
const Pattern = (props: PartComponentProps) => usePart(useQrCode("Pattern").pattern, "path", props)

export const QrCode = { Root, Frame, Pattern }
