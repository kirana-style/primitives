import type { QrCode } from "@kirana-ui/core/qr-code"
import { getContext, setContext } from "svelte"

const KEY = Symbol("QrCode")

export const provide = (controller: QrCode): QrCode => setContext(KEY, controller)

export function useQrCode(): QrCode {
  const controller = getContext<QrCode | undefined>(KEY)
  if (!controller) throw new Error("A QrCode part must be inside <QrCode.Root>")
  return controller
}
