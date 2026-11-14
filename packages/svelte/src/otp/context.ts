import type { Otp, OtpSlot } from "@kirana-ui/core/otp"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Otp")
const SLOT = Symbol("OtpSlot")

export const provide = (controller: Otp): Otp => setContext(KEY, controller)

export function useOtp(): Otp {
  const controller = getContext<Otp | undefined>(KEY)
  if (!controller) throw new Error("An Otp part must be inside <Otp.Root>")
  return controller
}

export const provideSlot = (slot: OtpSlot): OtpSlot => setContext(SLOT, slot)

export function useSlot(): OtpSlot {
  const slot = getContext<OtpSlot | undefined>(SLOT)
  if (!slot) throw new Error("An Otp.Caret must be inside <Otp.Slot>")
  return slot
}
