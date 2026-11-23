import { createChecked } from "./checked.ts"
import type { CheckedAround, CheckedProps } from "./checked.ts"
import type { Field } from "./field.ts"
import { flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, effect } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import { createPresence } from "./services/presence.ts"

export interface CheckboxProps extends CheckedProps {
  /** Neither checked nor unchecked: a parent of boxes that disagree. */
  indeterminate?: boolean | undefined
  /**
   * In a checkbox group with `allValues`: the box that stands for them all, written anywhere
   * inside the group. It is checked when every one is, mixed when some are, and it is not
   * submitted; its `aria-controls` names the boxes. A press from mixed checks them all, the next
   * unchecks them all, and the next brings back the set they were left in (left all checked or
   * none, a press goes between all and none); a disabled box keeps its state. Read once.
   */
  parent?: boolean | undefined
}

/** What a checkbox needs of the group it is in. Not for a caller. */
export interface CheckboxGroupLink {
  /** What one box of the group is given, by what its props say it is: a box, or the parent. */
  box(props: ReadonlySignal<CheckboxProps>): {
    readonly around: CheckedAround
    /** For the box that stands for them all: whether some are checked, and their ids. */
    readonly parent?: { mixed(): boolean; controls(): string | undefined } | undefined
  }
}

export interface Checkbox {
  readonly checked: ReadonlySignal<boolean>
  /** Whether the indicator is in the page: while checked or indeterminate, and through its exit. */
  readonly indicatorMounted: ReadonlySignal<boolean>
  setChecked(checked: boolean, details: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  readonly input: Part
  readonly indicator: Part
}

export function createCheckbox(
  props: ReadonlySignal<CheckboxProps>,
  around: {
    field?: Field | undefined
    /** The group it is one of the boxes of: the field is then the group's control's. */
    group?: { readonly link: CheckboxGroupLink } | undefined
  } = {}
): Checkbox {
  const grouped = around.group?.link.box(props)
  const parent = grouped?.parent
  const mixed = () => Boolean(props.get().indeterminate) || Boolean(parent?.mixed())
  const made = createChecked(
    props,
    "checkbox",
    mixed,
    // In a group, the group is the field's control.
    grouped ? undefined : around.field,
    grouped?.around
  )
  const shown = computed(() => made.checked.get() || mixed())
  const presence = createPresence(shown)

  const state = () => ({
    ...made.state(),
    "data-indeterminate": flag(mixed()),
    "data-parent": flag(props.get().parent),
  })

  return {
    checked: made.checked,
    indicatorMounted: presence.mounted,
    setChecked: made.setChecked,
    mount: () => presence.start(),
    root: {
      props: computed(() => ({
        ...made.root.props.get(),
        "aria-controls": parent?.controls(),
        ...state(),
      })),
      attach: made.root.attach,
    },
    input: {
      props: made.input.props,
      attach(element) {
        const detach = made.input.attach(element)
        // The native state a script and `:indeterminate` read; no attribute sets it.
        const stop = effect(() => {
          ;(element as HTMLInputElement).indeterminate = mixed()
        })
        return () => {
          stop()
          detach()
        }
      },
    },
    indicator: {
      props: computed(() => {
        const status = presence.status.get()
        return {
          ...state(),
          "data-starting-style": flag(status === "starting"),
          "data-ending-style": flag(status === "ending"),
        }
      }),
      attach: (element) => presence.attach(element),
    },
  }
}
