import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useAvatar(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Avatar.${part}> must be inside <Avatar.Root>`)
  return controller
}

function Root(props: PartComponentProps): ReactElement {
  const controller = useController(createAvatar, {})
  return (
    <Context.Provider value={controller}>
      <RootElement {...props} />
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useAvatar("Root").root, "span", props)

/** The picture: in the page once `src` has loaded. */
function Image({
  src,
  ...props
}: PartComponentProps & { src?: string | undefined }): ReactElement | null {
  const controller = useAvatar("Image")
  // Read by the controller's effect, so written while rendering: nothing re-renders for it.
  controller.source.set(src)
  const status = useSignal(controller.status)
  if (status !== "loaded") return null
  return <ImageElement {...props} />
}

const ImageElement = (props: PartComponentProps) => usePart(useAvatar("Image").image, "img", props)

/** What shows until the picture has loaded, or when it cannot. */
function Fallback(props: PartComponentProps): ReactElement | null {
  const controller = useAvatar("Fallback")
  const status = useSignal(controller.status)
  if (status === "loaded") return null
  return <FallbackElement {...props} />
}

const FallbackElement = (props: PartComponentProps) =>
  usePart(useAvatar("Fallback").fallback, "span", props)

export const Avatar = { Root, Image, Fallback }
