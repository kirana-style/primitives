import type { ReadonlySignal, StateOf } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type {
  Field as Controller,
  FieldProps,
  FieldValidity,
  ValidityKey,
} from "@kirana-ui/core/field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Show, createUniqueId, onSettled, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { FieldContext } from "./field-context.ts"
import { FieldsetContext } from "./fieldset.tsx"
import { FormContext } from "./form.tsx"
import { Part, controller, fromSignal, toSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["field"]

function useField(): Controller {
  const made = useContext(FieldContext)
  if (!made) throw new Error("A Field part must be inside <Field.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<FieldProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "name",
    "disabled",
    "invalid",
    "validate",
    "validationMode",
    "validationDebounceTime",
    "id",
  ])
  const generated = createUniqueId()
  const around = {
    form: useContext(FormContext) ?? undefined,
    fieldset: useContext(FieldsetContext) ?? undefined,
  }
  const made = controller(
    (source: ReadonlySignal<FieldProps>) => createField(source, around),
    () => ({
      ...local,
      id: local.id ?? generated,
      validate: (value: string) => local.validate?.(value) ?? null,
    })
  )
  return (
    <FieldContext value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </FieldContext>
  )
}

export type ErrorProps = PartComponentProps<
  "div",
  StateOf<Parts["error"]>,
  { match?: ValidityKey | boolean }
>

/**
 * What is wrong, or its children in its place. In the page while it applies. `match` is one of
 * the browser's findings (`"valueMissing"`) to show for only that, or `true` to show always.
 */
function FieldError(props: ErrorProps): JSX.Element {
  const [local, rest] = split(props, ["match", "children"])
  const options = toSignal(() => ({ match: local.match }))
  const error = useField().error(() => options.get().match)
  onSettled(() => error.mount())
  const mounted = fromSignal(error.mounted)
  const text = fromSignal(error.text)
  return (
    <Show when={mounted()}>
      <Part of={error.part} tag="div" {...rest}>
        {local.children ?? text()}
      </Part>
    </Show>
  )
}

export type ValidityProps = { children: (validity: () => FieldValidity) => JSX.Element }

/** Draws nothing itself: its child, a function, is given the field's validity. */
function Validity(props: ValidityProps): JSX.Element {
  return props.children(fromSignal(useField().validity))
}

export type LabelProps = PartComponentProps<"label", StateOf<Parts["label"]>>
export type ControlProps = PartComponentProps<"input", StateOf<Parts["control"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>

const part =
  <Props extends Record<string, unknown>>(key: "label" | "control" | "description", tag: string) =>
  (props: Props): JSX.Element => <Part of={useField()[key]} tag={tag} {...props} />

export const Field = {
  Root,
  Label: part<LabelProps>("label", "label"),
  /** An `<input>`; `as="textarea"` or `as="select"` for another. */
  Control: part<ControlProps>("control", "input"),
  Description: part<DescriptionProps>("description", "p"),
  Error: FieldError,
  Validity,
}
