import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createEditable } from "@kirana-ui/core/editable"
import type { Editable as Controller, EditableProps } from "@kirana-ui/core/editable"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { children, createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["editable"]

const Context = createContext<Controller | null>(null)

function useEditable(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("An Editable part must be inside <Editable.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<EditableProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "editing",
    "defaultEditing",
    "onEditingChange",
    "placeholder",
    "activation",
    "submitOnBlur",
    "selectOnFocus",
    "disabled",
    "readOnly",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createEditable, () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    editing: local.editing,
    defaultEditing: local.defaultEditing,
    placeholder: local.placeholder,
    activation: local.activation,
    submitOnBlur: local.submitOnBlur,
    selectOnFocus: local.selectOnFocus,
    disabled: local.disabled,
    readOnly: local.readOnly,
    name: local.name,
    form: local.form,
    onValueChange: (value: string, details: ChangeDetails) => local.onValueChange?.(value, details),
    onEditingChange: (editing: boolean, details: ChangeDetails) =>
      local.onEditingChange?.(editing, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type PreviewProps = PartComponentProps<"span", StateOf<Parts["preview"]>>

/** Says the text, or the placeholder while there is none, unless it is given children. */
function Preview(props: PreviewProps): JSX.Element {
  const [local, rest] = split(props, ["children"])
  const made = useEditable()
  const text = fromSignal(made.text)
  const given = children(() => local.children)
  return (
    <Part of={made.preview} tag="span" {...rest}>
      {given() ?? text()}
    </Part>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>
export type EditTriggerProps = PartComponentProps<"button", StateOf<Parts["editTrigger"]>>
export type SubmitTriggerProps = PartComponentProps<"button", StateOf<Parts["submitTrigger"]>>
export type CancelTriggerProps = PartComponentProps<"button", StateOf<Parts["cancelTrigger"]>>

const part =
  <Props extends Record<string, unknown>>(
    name: "input" | "editTrigger" | "submitTrigger" | "cancelTrigger",
    tag: string
  ) =>
  (props: Props): JSX.Element => <Part of={useEditable()[name]} tag={tag} {...props} />

export const Editable = {
  Root,
  Preview,
  /** An `<input>` holding the text being edited; `as="textarea"` for a text area. */
  Input: part<InputProps>("input", "input"),
  EditTrigger: part<EditTriggerProps>("editTrigger", "button"),
  SubmitTrigger: part<SubmitTriggerProps>("submitTrigger", "button"),
  CancelTrigger: part<CancelTriggerProps>("cancelTrigger", "button"),
}
