import type { StateOf } from "@kirana-ui/core"
import { createMeter } from "@kirana-ui/core/meter"
import type { MeterProps } from "@kirana-ui/core/meter"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import type { PartComponentProps } from "./runtime.tsx"
import { valueBar } from "./value-bar.tsx"
import type { ValueOptions } from "./value-bar.tsx"

type Parts = Vocabulary["meter"]

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<MeterProps, "id"> & { id?: string }
>
export type TrackProps = PartComponentProps<"div", StateOf<Parts["track"]>>
export type IndicatorProps = PartComponentProps<"div", StateOf<Parts["indicator"]>>
export type ValueProps = PartComponentProps<"span", StateOf<Parts["value"]>, ValueOptions>
export type LabelProps = PartComponentProps<"span", StateOf<Parts["label"]>>

export const Meter = /* @__PURE__ */ valueBar<
  MeterProps,
  {
    Root: RootProps
    Track: TrackProps
    Indicator: IndicatorProps
    Value: ValueProps
    Label: LabelProps
  }
>("Meter", createMeter)
