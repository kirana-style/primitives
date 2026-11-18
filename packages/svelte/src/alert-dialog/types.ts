import type { AlertDialogProps } from "@kirana-ui/core/alert-dialog"

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
  ViewportProps,
} from "../dialog/types.ts"

/** A dialog that asks for an answer: a press outside it does not close it. It draws nothing. */
export type RootProps = Renderless<AlertDialogProps>
