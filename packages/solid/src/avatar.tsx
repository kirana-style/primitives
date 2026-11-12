import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import { Show, createComputed, createContext, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useAvatar(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Avatar part must be inside <Avatar.Root>")
  return made
}

function Root(props: PartComponentProps): JSX.Element {
  const made = controller(createAvatar, () => ({}))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="span" {...props} />
    </Context.Provider>
  )
}

/** The picture: in the page once `src` has loaded. */
function Image(props: PartComponentProps & { src?: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["src"])
  const made = useAvatar()
  createComputed(() => made.source.set(local.src))
  const status = fromSignal(made.status)
  return (
    <Show when={status() === "loaded"}>
      <Part part={made.image} tag="img" {...rest} />
    </Show>
  )
}

/** What shows until the picture has loaded, or when it cannot. */
function Fallback(props: PartComponentProps): JSX.Element {
  const made = useAvatar()
  const status = fromSignal(made.status)
  return (
    <Show when={status() !== "loaded"}>
      <Part part={made.fallback} tag="span" {...props} />
    </Show>
  )
}

export const Avatar = { Root, Image, Fallback }
