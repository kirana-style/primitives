import type { StateOf } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type {
  AvatarFallbackProps,
  AvatarImageProps,
  Avatar as Controller,
} from "@kirana-ui/core/avatar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import {
  Show,
  createComputed,
  createContext,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  useContext,
} from "solid-js"
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
  } & AvatarImageProps
>

/** The picture: in the page once `src` has loaded, or all along with `keepMounted`. */
function Image(props: ImageProps): JSX.Element {
  const [local, rest] = splitProps(props, ["src", "onLoadingStatusChange", "keepMounted"])
  const made = useAvatar()
  createComputed(() => made.source.set(local.src))
  const report = made.statusReport(() => local.onLoadingStatusChange)
  onMount(() => onCleanup(report.mount()))
  const status = fromSignal(made.status)
  return (
    <Show
      when={!local.keepMounted}
      fallback={<Part of={made.keptImage} tag="img" src={local.src} {...rest} />}
    >
      <Show when={status() === "loaded"}>
        <Part of={made.image} tag="img" {...rest} />
      </Show>
    </Show>
  )
}

export type FallbackProps = PartComponentProps<
  "span",
  StateOf<Parts["fallback"]>,
  AvatarFallbackProps
>

/** What shows until the picture has loaded, or when it cannot; after `delay`, when given one. */
function Fallback(props: FallbackProps): JSX.Element {
  const [local, rest] = splitProps(props, ["delay"])
  const made = useAvatar()
  const presence = made.fallbackPresence({ delay: untrack(() => local.delay) })
  onMount(() => onCleanup(presence.mount()))
  const shown = fromSignal(presence.shown)
  return (
    <Show when={shown()}>
      <Part of={made.fallback} tag="span" {...rest} />
    </Show>
  )
}

export const Avatar = { Root, Image, Fallback }
