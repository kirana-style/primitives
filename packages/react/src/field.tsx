import type { ReadonlySignal, StateOf } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type {
  Field as Controller,
  FieldProps,
  FieldValidity,
  ValidityKey,
} from "@kirana-ui/core/field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { useContext, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import { FieldsetContext } from "./fieldset.tsx"
import { FormContext } from "./form.tsx"
import {
  PartElement,
  parts,
  useController,
  useMount,
  useOptions,
  usePart,
  useSignal,
} from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["field"]

function useField(part: string): Controller {
  const controller = useContext(FieldContext)
  if (!controller) throw new Error(`<Field.${part}> must be inside <Field.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<FieldProps, "id"> & { id?: string }
>

function Root({
  name,
  disabled,
  invalid,
  validate,
  validationMode,
  validationDebounceTime,
  id,
  ...rest
}: RootProps): ReactElement {
  const form = useContext(FormContext) ?? undefined
  const fieldset = useContext(FieldsetContext) ?? undefined
  const create = useMemo(
    () => (props: ReadonlySignal<FieldProps>) => createField(props, { form, fieldset }),
    [form, fieldset]
  )
  const controller = useController(create, {
    name,
    disabled,
    invalid,
    validate,
    validationMode,
    validationDebounceTime,
    id,
  })
  return (
    <FieldContext.Provider value={controller}>
      <PartElement of={controller.root} tag="div" {...rest} />
    </FieldContext.Provider>
  )
}

export type LabelProps = PartComponentProps<"label", StateOf<Parts["label"]>>
export type ControlProps = PartComponentProps<"input", StateOf<Parts["control"]>>
export type DescriptionProps = PartComponentProps<"p", StateOf<Parts["description"]>>

const Label = (props: LabelProps) => usePart(useField("Label").label, "label", props)
/** An `<input>`; a `<textarea>` or a `<select>` through `render`. */
const Control = (props: ControlProps) => usePart(useField("Control").control, "input", props)
const Description = (props: DescriptionProps) =>
  usePart(useField("Description").description, "p", props)

export type ErrorProps = PartComponentProps<
  "div",
  StateOf<Parts["error"]>,
  {
    /** One of the browser's findings (`"valueMissing"`) to show for only that; `true` to show always. */
    match?: ValidityKey | boolean
  }
>

/** What is wrong, or `children` in its place. In the page while it applies. */
function FieldError({ match, children, ...rest }: ErrorProps): ReactElement | null {
  const controller = useField("Error")
  const options = useOptions({ match })
  const error = useMemo(() => controller.error(() => options.get().match), [controller, options])
  useMount(error)
  const mounted = useSignal(error.mounted)
  const text = useSignal(error.text)
  if (!mounted) return null
  return (
    <PartElement of={error.part} tag="div" {...rest}>
      {children ?? text}
    </PartElement>
  )
}

export interface ValidityProps {
  /** Draws from the field's validity: whether it is valid, what was found wrong, the messages. */
  children: (validity: FieldValidity) => ReactNode
}

/** Draws nothing itself: `children` is given the field's validity. */
function Validity({ children }: ValidityProps): ReactNode {
  return children(useSignal(useField("Validity").validity))
}

export const Field = /* @__PURE__ */ parts("Field", {
  Root,
  Label,
  Control,
  Description,
  Error: FieldError,
  Validity,
})
