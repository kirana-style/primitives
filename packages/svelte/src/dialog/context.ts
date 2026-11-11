import type { Dialog } from "@kirana-ui/core/dialog"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Dialog")

export const provide = (controller: Dialog): Dialog => setContext(KEY, controller)

export function useDialog(): Dialog {
  const controller = getContext<Dialog | undefined>(KEY)
  if (!controller) throw new Error("A Dialog part must be inside <Dialog.Root>")
  return controller
}
