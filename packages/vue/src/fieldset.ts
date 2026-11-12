import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset as Controller } from "@kirana-ui/core/fieldset"
import { defineComponent, h, inject, provide, useId } from "vue"
import type { InjectionKey } from "vue"

import { controller, partComponent } from "./runtime.ts"

const KEY: InjectionKey<Controller> = Symbol("Fieldset")

/** The fieldset a field is in, if it is in one. */
export const useFieldset = (): Controller | undefined => inject(KEY, undefined)

function use(): Controller {
  const made = useFieldset()
  if (!made) throw new Error("A Fieldset part must be inside <Fieldset.Root>")
  return made
}

const RootElement = partComponent("FieldsetRootElement", "fieldset", () => use().root)

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
})

export const Fieldset = {
  Root,
  Legend: partComponent("FieldsetLegend", "div", () => use().legend),
}
