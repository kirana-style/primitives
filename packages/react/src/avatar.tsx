import type { StateOf } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type {
  AvatarFallbackProps,
  AvatarImageProps,
  Avatar as Controller,
} from "@kirana-ui/core/avatar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useRef, useState } from "react"
import type { ReactElement } from "react"

import {
  PartElement,
  parts,
  useController,
  useIsomorphicLayoutEffect,
  useMount,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["avatar"]

const Context = createContext<Controller | null>(null)

function useAvatar(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Avatar.${part}> must be inside <Avatar.Root>`)
  return controller
}

export type RootProps = PartComponentProps<"span", StateOf<Parts["root"]>>

function Root(props: RootProps): ReactElement {
  const controller = useController(createAvatar, {})
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="span" {...props} />
    </Context.Provider>
  )
}

export type ImageProps = PartComponentProps<
  "img",
  StateOf<Parts["image"]>,
  {
    /**
     * Called each time the picture's loading status changes: `loading` once it has an address,
     * then `loaded` or `error`; `idle` again when its address is taken away. The root says the
     * same in `data-image-loading-status`.
     */
    onLoadingStatusChange?: AvatarImageProps["onLoadingStatusChange"]
    /**
     * Keeps the element in the page while the picture loads, as Base UI's: it loads the
     * picture itself (`loading="lazy"` works), and until it has loaded it is `aria-hidden`,
     * with `data-loading` or `data-error` for the design to hide or fade it by. Default:
     * `false`, the element is drawn once the picture has loaded.
     */
    keepMounted?: boolean
  }
>

/** The picture: in the page once `src` has loaded, or all along with `keepMounted`. */
function Image({
  src,
  onLoadingStatusChange,
  keepMounted,
  ...props
}: ImageProps): ReactElement | null {
  const controller = useAvatar("Image")
  // After the render commits, never during it: the load it starts changes the status, which
  // other parts are drawn from, and React forbids updating them mid-render.
  useIsomorphicLayoutEffect(() => controller.source.set(src), [controller, src])
  const told = useRef(onLoadingStatusChange)
  told.current = onLoadingStatusChange
  const [report] = useState(() => controller.statusReport(() => told.current))
  useMount(report)
  const mounted = useSignal(controller.imageMounted)
  if (keepMounted) return <PartElement of={controller.keptImage} tag="img" src={src} {...props} />
  // From when it has loaded, and through its exit.
  if (!mounted) return null
  return <PartElement of={controller.image} tag="img" {...props} />
}

export type FallbackProps = PartComponentProps<
  "span",
  StateOf<Parts["fallback"]>,
  {
    /**
     * How long to wait before showing, in milliseconds, so a picture that loads sooner never
     * lets the fallback be seen. Read once. Default: `0`, at once.
     */
    delay?: AvatarFallbackProps["delay"]
  }
>

/** What shows until the picture has loaded, or when it cannot; after `delay`, when given one. */
function Fallback({ delay, ...props }: FallbackProps): ReactElement | null {
  const controller = useAvatar("Fallback")
  const [presence] = useState(() => controller.fallbackPresence({ delay }))
  useMount(presence)
  const shown = useSignal(presence.shown)
  if (!shown) return null
  return <PartElement of={controller.fallback} tag="span" {...props} />
}

export const Avatar = /* @__PURE__ */ parts("Avatar", { Root, Image, Fallback })
