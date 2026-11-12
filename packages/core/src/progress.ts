import type { ReadonlySignal } from "./reactivity.ts"
import { createValueBar } from "./value-bar.ts"
import type { ValueBar, ValueBarProps } from "./value-bar.ts"

export type { ValueBar, ValueBarProps } from "./value-bar.ts"
export type ProgressProps = ValueBarProps
export type Progress = ValueBar

/** How far a task has come. A value of `null` is a task under way with no known end. */
export const createProgress = (props: ReadonlySignal<ProgressProps>): Progress =>
  createValueBar(props, "progressbar")
