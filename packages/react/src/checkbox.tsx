import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox as Controller, CheckboxProps } from "@kirana-ui/core/checkbox"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { CheckboxGroupContext } from "./checkbox-group-context.ts"
import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["checkbox"]

const Context = createContext<Controller | null>(null)

function useCheckbox(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Checkbox.${part}> must be inside <Checkbox.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "span",
  StateOf<Parts["root"]>,
  Omit<CheckboxProps, "id"> & {
    /** The id of the box's hidden native checkbox, not of the box: a `<label for>` names it. Inside a `Field`, that input takes the field's id instead. */
    id?: string
  }
>

function Root({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  parent,
  disabled,
  readOnly,
  required,
  name,
  form,
  value,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const group = useContext(CheckboxGroupContext) ?? undefined
  const create = within(createCheckbox, { field, group })
  const controller = useController(create, {
    checked,
    defaultChecked,
    onCheckedChange,
    indeterminate,
    parent,
    disabled,
    readOnly,
    required,
    name,
    form,
    value,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="span" hold={withInput} {...rest} />
    </Context.Provider>
  )
}

// Its native input is the element's last child, whatever element the caller asked for.
const withInput = (content: ReactNode) => (
  <>
    {content}
    <Input />
  </>
)

const Input = () => usePart(useCheckbox("Root").input, "input", {})

/**
 * A dash while mixed and a tick while checked, from the part's state: `<Checkbox.Indicator
 * render={(props, state) => <span {...props}>{state.indeterminate ? "–" : "✓"}</span>} />`.
 */
export type IndicatorProps = PartComponentProps<
  "span",
  StateOf<Parts["indicator"]>,
  {
    /** Keeps the mark in the page while the box is unchecked. */
    keepMounted?: boolean
  }
>

function Indicator({ keepMounted, ...props }: IndicatorProps): ReactElement | null {
  const controller = useCheckbox("Indicator")
  const mounted = useSignal(controller.indicatorMounted)
  if (!mounted && !keepMounted) return null
  return <PartElement of={controller.indicator} tag="span" {...props} />
}

export const Checkbox = /* @__PURE__ */ parts("Checkbox", { Root, Indicator })
