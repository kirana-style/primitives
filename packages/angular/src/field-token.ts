import { InjectionToken } from "@angular/core"
import type { Field } from "@kirana-ui/core/field"

/** The field a control is in, if it is in one. */
export const KUI_FIELD = new InjectionToken<{ readonly controller: Field }>("KuiField")
