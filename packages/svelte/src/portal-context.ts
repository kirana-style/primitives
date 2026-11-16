import { getContext, setContext } from "svelte"

const KEY = Symbol("PortalContainer")

type Container = () => HTMLElement | null | undefined

export const providePortalContainer = (read: Container): Container => setContext(KEY, read)
/** Where the popups here are drawn, when something around them says. */
export const usePortalContainer = (): Container | undefined =>
  getContext<Container | undefined>(KEY)
