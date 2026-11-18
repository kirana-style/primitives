import type { StateOf } from "@kirana-ui/core"
import { createProgress } from "@kirana-ui/core/progress"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import type { PartComponentProps } from "./runtime.tsx"
import { valueBar } from "./value-bar.tsx"
import type { RootOptions, ValueOptions } from "./value-bar.tsx"

type Parts = Vocabulary["progress"]

export type RootProps = PartComponentProps<"div", StateOf<Parts["root"]>, RootOptions>
export type ValueProps = PartComponentProps<"span", StateOf<Parts["value"]>, ValueOptions>
export type TrackProps = PartComponentProps<"div", StateOf<Parts["track"]>>
export type IndicatorProps = PartComponentProps<"div", StateOf<Parts["indicator"]>>
export type LabelProps = PartComponentProps<"span", StateOf<Parts["label"]>>

type Props = {
  Root: RootProps
  Value: ValueProps
  Track: TrackProps
  Indicator: IndicatorProps
  Label: LabelProps
}

export const Progress = valueBar<Props>("Progress", createProgress)
