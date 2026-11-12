import type { ReadonlySignal } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type {
  Field as Controller,
  FieldProps,
  FieldValidity,
  ValidityKey,
} from "@kirana-ui/core/field"
import { Show, createUniqueId, onCleanup, onMount, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { FieldContext } from "./field-context.ts"
import { FieldsetContext } from "./fieldset.tsx"
import { FormContext } from "./form.tsx"
import { Part, controller, fromSignal, toSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

function useField(): Controller {
  const made = useContext(FieldContext)
  if (!made) throw new Error("A Field part must be inside <Field.Root>")
  return made
}

export type RootProps = PartComponentProps & Omit<FieldProps, "id"> & { id?: string }

function Root(props: RootProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "name",
    "disabled",
    "invalid",
    "validate",
    "validationMode",
    "validationDebounceTime",
    "id",
  ])
  const generated = createUniqueId()
  const around = { form: useContext(FormContext), fieldset: useContext(FieldsetContext) }
  const made = controller(
    (source: ReadonlySignal<FieldProps>) => createField(source, around),
    () => ({
      ...local,
      id: local.id ?? generated,
      validate: (value: string) => local.validate?.(value) ?? null,
    })
  )
  return (
    <FieldContext.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </FieldContext.Provider>
  )
}

/**
 * What is wrong, or its children in its place. In the page while it applies. `match` is one of
 * the browser's findings (`"valueMissing"`) to show for only that, or `true` to show always.
 */
function FieldError(props: PartComponentProps & { match?: ValidityKey | boolean }): JSX.Element {
  const [local, rest] = splitProps(props, ["match", "children"])
  const options = toSignal(() => ({ match: local.match }))
  const error = useField().error(() => options.get().match)
  onMount(() => onCleanup(error.mount()))
  const mounted = fromSignal(error.mounted)
  const text = fromSignal(error.text)
  return (
    <Show when={mounted()}>
      <Part part={error.part} tag="div" {...rest}>
        {local.children ?? text()}
      </Part>
    </Show>
  )
}

/** Draws nothing itself: its child, a function, is given the field's validity. */
function Validity(props: {
  children: (validity: () => FieldValidity) => JSX.Element
}): JSX.Element {
  return props.children(fromSignal(useField().validity))
}

const part =
  (key: "label" | "control" | "description", tag: string) => (props: PartComponentProps) => (
    <Part part={useField()[key]} tag={tag} {...props} />
  )

export const Field = {
  Root,
  Label: part("label", "label"),
  /** An `<input>`; `as="textarea"` or `as="select"` for another. */
  Control: part("control", "input"),
  Description: part("description", "p"),
  Error: FieldError,
  Validity,
}
