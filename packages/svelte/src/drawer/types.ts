import type { DrawerProps } from "@kirana-ui/core/drawer"

import type { Renderless } from "../types.ts"

// Its parts are a dialog's.
export type {
  BackdropProps,
  CloseProps,
  DescriptionProps,
  PopupProps,
  PortalProps,
  TitleProps,
  TriggerProps,
} from "../dialog/types.ts"

/** A dialog that comes from an edge and is dragged back to it. It draws nothing. */
export type RootProps = Renderless<DrawerProps>
