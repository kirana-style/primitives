import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch as Controller, SwitchProps } from "@kirana-ui/core/switch"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["switch"]

const Context = createContext<Controller | null>(null)

function useSwitch(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Switch.${part}> must be inside <Switch.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "span",
  StateOf<Parts["root"]>,
  Omit<SwitchProps, "id"> & { id?: string }
>

function Root({
  checked,
  defaultChecked,
  onCheckedChange,
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
  const create = within(createSwitch, { field })
  const controller = useController(create, {
    checked,
    defaultChecked,
    onCheckedChange,
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

const Input = () => usePart(useSwitch("Root").input, "input", {})

export type ThumbProps = PartComponentProps<"span", StateOf<Parts["thumb"]>>

const Thumb = (props: ThumbProps) => usePart(useSwitch("Thumb").thumb, "span", props)

export const Switch = /* @__PURE__ */ parts("Switch", { Root, Thumb })
