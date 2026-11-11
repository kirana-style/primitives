import { createChecked } from "./checked.ts"
import type { CheckedProps } from "./checked.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type SwitchProps = CheckedProps

export interface Switch {
  readonly checked: ReadonlySignal<boolean>
  setChecked(checked: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  readonly input: Part
  readonly thumb: Part
}

export function createSwitch(props: ReadonlySignal<SwitchProps>): Switch {
  const made = createChecked(props, "switch")
  return {
    checked: made.checked,
    setChecked: made.setChecked,
    mount: () => () => {},
    root: made.root,
    input: made.input,
    thumb: { props: computed(() => made.state()), attach: () => () => {} },
  }
}
