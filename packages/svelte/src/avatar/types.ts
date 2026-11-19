import type { AvatarFallbackProps, AvatarImageProps } from "@kirana-ui/core/avatar"

import type { PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"span", StateFor<"avatar", "root">>

/** The picture: in the page once `src` has loaded. */
export type ImageProps = PartAttributes<
  "img",
  StateFor<"avatar", "image">,
  {
    /** The picture's address: the element is in the page once it has loaded. */
    src?: string | undefined
  } & AvatarImageProps
>

/** What shows until the picture has loaded, or when it cannot; after `delay`, when given one. */
export type FallbackProps = PartAttributes<
  "span",
  StateFor<"avatar", "fallback">,
  AvatarFallbackProps
>
