import type { ReadonlySignal } from "@kirana-ui/core"
import { createMeter } from "@kirana-ui/core/meter"
import type { MeterProps } from "@kirana-ui/core/meter"

import type { StatesOf } from "./runtime.ts"
import { valueBar } from "./value-bar.ts"
import type { RootProps as BarProps } from "./value-bar.ts"

export type { IndicatorProps, LabelProps, TrackProps, ValueProps } from "./value-bar.ts"
/** A meter always has a value. */
export type RootProps = BarProps<number>

export const Meter = valueBar<StatesOf<"meter">, number>("Meter", (props) =>
  createMeter(props as ReadonlySignal<MeterProps>)
)
