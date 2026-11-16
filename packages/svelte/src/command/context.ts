import type { Command, CommandGroup } from "@kirana-ui/core/command"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Command")
const GROUP = Symbol("CommandGroup")

export const provide = (controller: Command): Command => setContext(KEY, controller)

export function useCommand(): Command {
  const controller = getContext<Command | undefined>(KEY)
  if (!controller) throw new Error("A Command part must be inside <Command.Root>")
  return controller
}

export const provideGroup = (group: CommandGroup): CommandGroup => setContext(GROUP, group)

/** The group an item is in, if it is in one. */
export const useGroup = (): CommandGroup | undefined => getContext<CommandGroup | undefined>(GROUP)
