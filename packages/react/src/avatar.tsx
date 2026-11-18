import type { StateOf } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import {
  PartElement,
  parts,
  useController,
  useIsomorphicLayoutEffect,
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

export type ImageProps = PartComponentProps<"img", StateOf<Parts["image"]>>

/** The picture: in the page once `src` has loaded. */
function Image({ src, ...props }: ImageProps): ReactElement | null {
  const controller = useAvatar("Image")
  // After the render commits, never during it: the load it starts changes the status, which
  // other parts are drawn from, and React forbids updating them mid-render.
  useIsomorphicLayoutEffect(() => controller.source.set(src), [controller, src])
  const status = useSignal(controller.status)
  if (status !== "loaded") return null
  return <PartElement of={controller.image} tag="img" {...props} />
}

export type FallbackProps = PartComponentProps<"span", StateOf<Parts["fallback"]>>

/** What shows until the picture has loaded, or when it cannot. */
function Fallback(props: FallbackProps): ReactElement | null {
  const controller = useAvatar("Fallback")
  const status = useSignal(controller.status)
  if (status === "loaded") return null
  return <PartElement of={controller.fallback} tag="span" {...props} />
}

export const Avatar = /* @__PURE__ */ parts("Avatar", { Root, Image, Fallback })
