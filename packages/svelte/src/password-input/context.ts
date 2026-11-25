import type { PasswordInput } from "@kirana-ui/core/password-input"
import { getContext, setContext } from "svelte"

const KEY = Symbol("PasswordInput")

export const provide = (controller: PasswordInput): PasswordInput => setContext(KEY, controller)

export function usePasswordInput(): PasswordInput {
  const controller = getContext<PasswordInput | undefined>(KEY)
  if (!controller) throw new Error("A PasswordInput part must be inside <PasswordInput.Root>")
  return controller
}
