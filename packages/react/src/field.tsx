import type { Part, ReadonlySignal } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type {
  Field as Controller,
  FieldProps,
  FieldValidity,
  ValidityKey,
} from "@kirana-ui/core/field"
import { useContext, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import { FieldsetContext } from "./fieldset.tsx"
import { FormContext } from "./form.tsx"
import { useController, useMount, useOptions, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

function useField(part: string): Controller {
  const controller = useContext(FieldContext)
  if (!controller) throw new Error(`<Field.${part}> must be inside <Field.Root>`)
  return controller
}

export type RootProps = Omit<FieldProps, "id"> & { id?: string } & PartComponentProps

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
      <RootElement {...rest} />
    </FieldContext.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useField("Root").root, "div", props)
const Label = (props: PartComponentProps) => usePart(useField("Label").label, "label", props)
/** An `<input>`; a `<textarea>` or a `<select>` through `render`. */
const Control = (props: PartComponentProps) => usePart(useField("Control").control, "input", props)
const Description = (props: PartComponentProps) =>
  usePart(useField("Description").description, "p", props)

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export interface ErrorProps extends PartComponentProps {
  /** One of the browser's findings (`"valueMissing"`) to show for only that; `true` to show always. */
  match?: ValidityKey | boolean
}

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
    <PartElement part={error.part} tag="div" {...rest}>
      {children ?? text}
    </PartElement>
  )
}

/** Draws nothing itself: `children` is given the field's validity. */
function Validity({ children }: { children: (validity: FieldValidity) => ReactNode }): ReactNode {
  return children(useSignal(useField("Validity").validity))
}

export const Field = { Root, Label, Control, Description, Error: FieldError, Validity }
