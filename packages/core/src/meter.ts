import type { ReadonlySignal } from "./reactivity.ts"
import { createValueBar } from "./value-bar.ts"
import type { ValueBar, ValueBarProps } from "./value-bar.ts"

export type { ValueBar, ValueBarProps } from "./value-bar.ts"
export type MeterProps = Omit<ValueBarProps, "value"> & { value: number }
export type Meter = ValueBar

/** A measurement within a known range: disk used, a password's strength. */
export const createMeter = (props: ReadonlySignal<MeterProps>): Meter =>
  createValueBar(props, "meter")
