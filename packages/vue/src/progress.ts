import { createProgress } from "@kirana-ui/core/progress"

import type { StatesOf } from "./runtime.ts"
import { valueBar } from "./value-bar.ts"

export type * from "./value-bar.ts"

export const Progress = valueBar<StatesOf<"progress">>("Progress", createProgress)
