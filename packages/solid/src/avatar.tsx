import type { StateOf } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createComputed, createContext, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["avatar"]

const Context = createContext<Controller>()

function useAvatar(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Avatar part must be inside <Avatar.Root>")
  return made
}

export type RootProps = PartComponentProps<"span", StateOf<Parts["root"]>>

function Root(props: RootProps): JSX.Element {
  const made = controller(createAvatar, () => ({}))
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="span" {...props} />
    </Context.Provider>
  )
}

export type ImageProps = PartComponentProps<
  "img",
  StateOf<Parts["image"]>,
  {
    /** The picture's address: the element is in the page once it has loaded. */
    src?: string
  }
>

/** The picture: in the page once `src` has loaded. */
function Image(props: ImageProps): JSX.Element {
  const [local, rest] = splitProps(props, ["src"])
  const made = useAvatar()
  createComputed(() => made.source.set(local.src))
  const status = fromSignal(made.status)
  return (
    <Show when={status() === "loaded"}>
      <Part of={made.image} tag="img" {...rest} />
    </Show>
  )
}

export type FallbackProps = PartComponentProps<"span", StateOf<Parts["fallback"]>>

/** What shows until the picture has loaded, or when it cannot. */
function Fallback(props: FallbackProps): JSX.Element {
  const made = useAvatar()
  const status = fromSignal(made.status)
  return (
    <Show when={status() !== "loaded"}>
      <Part of={made.fallback} tag="span" {...props} />
    </Show>
  )
}

export const Avatar = { Root, Image, Fallback }
