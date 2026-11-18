import type { StateOf } from "@kirana-ui/core"
import { createProgress } from "@kirana-ui/core/progress"
import type { ProgressProps } from "@kirana-ui/core/progress"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import type { PartComponentProps } from "./runtime.tsx"
import { valueBar } from "./value-bar.tsx"
import type { ValueOptions } from "./value-bar.tsx"

type Parts = Vocabulary["progress"]

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<ProgressProps, "id"> & { id?: string }
>
export type TrackProps = PartComponentProps<"div", StateOf<Parts["track"]>>
export type IndicatorProps = PartComponentProps<"div", StateOf<Parts["indicator"]>>
export type ValueProps = PartComponentProps<"span", StateOf<Parts["value"]>, ValueOptions>
export type LabelProps = PartComponentProps<"span", StateOf<Parts["label"]>>

export const Progress = /* @__PURE__ */ valueBar<
  ProgressProps,
  {
    Root: RootProps
    Track: TrackProps
    Indicator: IndicatorProps
    Value: ValueProps
    Label: LabelProps
  }
>("Progress", createProgress)
