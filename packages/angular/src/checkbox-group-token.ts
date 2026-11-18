import { InjectionToken } from "@angular/core"
import type { CheckboxGroup } from "@kirana-ui/core/checkbox-group"

/** The group a checkbox is one of the boxes of, if it is in one. */
export const KUI_CHECKBOX_GROUP = new InjectionToken<{ readonly controller: CheckboxGroup } | null>(
  "KuiCheckboxGroup"
)
