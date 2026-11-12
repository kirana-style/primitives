import type { ReadonlySignal } from "@kirana-ui/core"
import { createMeter } from "@kirana-ui/core/meter"
import type { MeterProps } from "@kirana-ui/core/meter"

import { valueBar } from "./value-bar.tsx"

export const Meter = valueBar("Meter", (props) => createMeter(props as ReadonlySignal<MeterProps>))
