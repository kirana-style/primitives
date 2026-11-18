import type { QrCodeProps } from "@kirana-ui/core/qr-code"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"qrCode", "root">, Controlled<QrCodeProps>>

export type FrameProps = PartAttributes<"svg", StateFor<"qrCode", "frame">>

export type PatternProps = PartAttributes<"path", StateFor<"qrCode", "pattern">>
