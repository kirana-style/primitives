import type { Avatar } from "@kirana-ui/core/avatar"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Avatar")

export const provide = (controller: Avatar): Avatar => setContext(KEY, controller)

export function useAvatar(): Avatar {
  const controller = getContext<Avatar | undefined>(KEY)
  if (!controller) throw new Error("An Avatar part must be inside <Avatar.Root>")
  return controller
}
