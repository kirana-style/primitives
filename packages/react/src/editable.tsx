import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createEditable } from "@kirana-ui/core/editable"
import type { Editable as Controller, EditableProps } from "@kirana-ui/core/editable"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement } from "react"

import { FieldContext } from "./field-context.ts"
import { parts, useController, useOwnText, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["editable"]

const Context = createContext<Controller | null>(null)

function useEditable(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Editable.${part}> must be inside <Editable.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<EditableProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  editing,
  defaultEditing,
  onEditingChange,
  placeholder,
  activation,
  submitOnBlur,
  selectOnFocus,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<EditableProps, Controller>(within(createEditable, { field }), {
    value,
    defaultValue,
    onValueChange,
    editing,
    defaultEditing,
    onEditingChange,
    placeholder,
    activation,
    submitOnBlur,
    selectOnFocus,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
  })
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type PreviewProps = PartComponentProps<"span", StateOf<Parts["preview"]>>

/** Says the text, or the placeholder while there is none, unless it is given children. */
function Preview(props: PreviewProps): ReactElement {
  const controller = useEditable("Preview")
  const text = useSignal(controller.text)
  return usePart(controller.preview, "span", { ...props, children: props.children ?? text })
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

/** An `<input>`; a `<textarea>` through `render`. */
const Input = (props: InputProps) => usePart(useOwnText(useEditable("Input").input), "input", props)

export type EditTriggerProps = PartComponentProps<"button", StateOf<Parts["editTrigger"]>>

const EditTrigger = (props: EditTriggerProps) =>
  usePart(useEditable("EditTrigger").editTrigger, "button", props)

export type SubmitTriggerProps = PartComponentProps<"button", StateOf<Parts["submitTrigger"]>>

const SubmitTrigger = (props: SubmitTriggerProps) =>
  usePart(useEditable("SubmitTrigger").submitTrigger, "button", props)

export type CancelTriggerProps = PartComponentProps<"button", StateOf<Parts["cancelTrigger"]>>

const CancelTrigger = (props: CancelTriggerProps) =>
  usePart(useEditable("CancelTrigger").cancelTrigger, "button", props)

export const Editable = /* @__PURE__ */ parts("Editable", {
  Root,
  Preview,
  Input,
  EditTrigger,
  SubmitTrigger,
  CancelTrigger,
})
