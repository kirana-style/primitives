import { defined, within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type {
  NumberField as Controller,
  NumberFieldProps,
  NumberFieldScrubOptions,
} from "@kirana-ui/core/number-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { Part, Portal, controller, fromSignal, split, follow } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["numberField"]

const Context = createContext<Controller | null>(null)

function useNumberField(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A NumberField part must be inside <NumberField.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<NumberFieldProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommitted",
    "min",
    "max",
    "step",
    "smallStep",
    "largeStep",
    "snapOnStep",
    "allowWheelScrub",
    "format",
    "locale",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
    "children",
  ])
  const generated = createUniqueId()
  const made = controller(
    within(createNumberField, { field: useContext(FieldContext) ?? undefined }),
    () => ({
      id: local.id ?? generated,
      value: local.value,
      defaultValue: local.defaultValue,
      min: local.min,
      max: local.max,
      step: local.step,
      smallStep: local.smallStep,
      largeStep: local.largeStep,
      snapOnStep: local.snapOnStep,
      allowWheelScrub: local.allowWheelScrub,
      format: local.format,
      locale: local.locale,
      disabled: local.disabled,
      readOnly: local.readOnly,
      required: local.required,
      name: local.name,
      form: local.form,
      onValueChange: (value: number | null, details: ChangeDetails) =>
        local.onValueChange?.(value, details),
      onValueCommitted: (value: number | null, details: ChangeDetails) =>
        local.onValueCommitted?.(value, details),
    })
  )
  const named = fromSignal(made.named)
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest}>
        {local.children}
        <Show when={named()}>
          <Part of={made.hidden} tag="input" />
        </Show>
      </Part>
    </Context>
  )
}

export type GroupProps = PartComponentProps<"div", StateOf<Parts["group"]>>
export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type IncrementProps = PartComponentProps<"button", StateOf<Parts["increment"]>>
export type DecrementProps = PartComponentProps<"button", StateOf<Parts["decrement"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "group" | "input" | "increment" | "decrement",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useNumberField()[name]} tag={tag} {...props} />

export type ScrubAreaProps = PartComponentProps<
  "span",
  StateOf<Parts["scrubArea"]>,
  NumberFieldScrubOptions
>
export type ScrubAreaCursorProps = PartComponentProps<"span", StateOf<Parts["scrubAreaCursor"]>>

/** Pressed and dragged to change the number; `direction`, `pixelSensitivity`, `teleportDistance`. */
function ScrubArea(props: ScrubAreaProps): JSX.Element {
  const [local, rest] = split(props as NumberFieldScrubOptions, [
    "direction",
    "pixelSensitivity",
    "teleportDistance",
  ])
  const made = useNumberField()
  follow(
    () => defined({ ...local }),
    (scrub) => made.scrub.set(scrub)
  )
  return <Part of={made.scrubArea} tag="span" {...rest} />
}

/** Drawn in place of the pointer while it is locked for a drag, at the end of `<body>`. */
function ScrubAreaCursor(props: ScrubAreaCursorProps): JSX.Element {
  const made = useNumberField()
  return (
    <Portal mounted={made.scrubAreaCursor.mounted}>
      <Part of={made.scrubAreaCursor.part} tag="span" {...props} />
    </Portal>
  )
}

export const NumberField = {
  Root,
  ScrubArea,
  ScrubAreaCursor,
  Group: part<GroupProps>("group", "div"),
  Input: part<InputProps>("input", "input"),
  Increment: part<IncrementProps>("increment", "button"),
  Decrement: part<DecrementProps>("decrement", "button"),
}
