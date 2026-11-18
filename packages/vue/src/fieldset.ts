import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller, FieldsetProps } from "@kirana-ui/core/fieldset"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey } from "vue"

import { controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"fieldset">

const KEY: InjectionKey<Controller> = Symbol("Fieldset")

/** The fieldset a field is in, if it is in one. */
export const useFieldset = (): Controller | undefined => inject(KEY, undefined)

function use(): Controller {
  const made = useFieldset()
  if (!made) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
  return made
}

const RootElement = partComponent("FieldsetRootElement", "fieldset", () => use().root)

export type RootProps = Omit<FieldsetProps, "id"> & {
  id?: string | undefined
} & PartComponentProps

const Root = defineComponent({
  name: "FieldsetRoot",
  inheritAttrs: false,
  props: { disabled: Boolean, id: String },
  setup(props, { attrs, slots }) {
    const generated = useId()
    provide(
      KEY,
      controller(createFieldset, () => ({ id: props.id ?? generated, disabled: props.disabled }))
    )
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"fieldset", State["root"], RootProps>

export type LegendProps = PartComponentProps
export const Fieldset = {
  Root,
  Legend: partComponent<"div", State["legend"]>("FieldsetLegend", "div", () => use().legend),
}
