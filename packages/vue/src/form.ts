import { createForm } from "@kirana-ui/core/form"
import type { Form as Controller, FormProps } from "@kirana-ui/core/form"
import { defineComponent, h, inject, provide } from "vue"
import type { InjectionKey, PropType } from "vue"

import { controller, partComponent } from "./runtime.ts"

const KEY: InjectionKey<Controller> = Symbol("Form")

/** The form a field is in, if it is in one. */
export const useForm = (): Controller | undefined => inject(KEY, undefined)

const Element = partComponent("FormElement", "form", () => useForm()!.root)

/**
 * A `<form>` whose fields say what is wrong; `@form-submit="(values, details) => …"` takes the
 * values once all are valid, and `@clear-errors` what is left of `errors`.
 */
export const Form = defineComponent({
  name: "Form",
  inheritAttrs: false,
  props: {
    errors: Object as PropType<FormProps["errors"]>,
    validationMode: String as PropType<FormProps["validationMode"]>,
    // Listeners as props, so the form knows whether anyone takes the values.
    onFormSubmit: Function as PropType<FormProps["onFormSubmit"]>,
    onClearErrors: Function as PropType<FormProps["onClearErrors"]>,
  },
  setup(props, { attrs, slots }) {
    provide(
      KEY,
      controller(createForm, () => ({ ...props }))
    )
    return () => h(Element, attrs, slots)
  },
})
