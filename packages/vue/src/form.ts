import { createForm } from "@kirana-ui/core/form"
import type { Form as Controller, FormProps as CoreProps } from "@kirana-ui/core/form"
import { defineComponent, h, inject, provide } from "vue"
import type { InjectionKey, PropType } from "vue"

import { controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

const KEY: InjectionKey<Controller> = Symbol("Form")

/** The form a field is in, if it is in one. */
export const useForm = (): Controller | undefined => inject(KEY, undefined)

const Element = partComponent("FormElement", "form", () => useForm()!.root)

/** `onFormSubmit` and `onClearErrors` are heard as `@form-submit` and `@clear-errors`. */
export interface FormProps extends CoreProps, PartComponentProps {}

/**
 * A `<form>` whose fields say what is wrong; `@form-submit="(values, details) => …"` takes the
 * values once all are valid, and `@clear-errors` what is left of `errors`.
 */
export const Form = defineComponent({
  name: "Form",
  inheritAttrs: false,
  props: {
    errors: Object as PropType<CoreProps["errors"]>,
    validationMode: String as PropType<CoreProps["validationMode"]>,
    // Listeners as props, so the form knows whether anyone takes the values.
    onFormSubmit: Function as PropType<CoreProps["onFormSubmit"]>,
    onClearErrors: Function as PropType<CoreProps["onClearErrors"]>,
  },
  setup(props, { attrs, slots }) {
    provide(
      KEY,
      controller(createForm, () => ({ ...props }))
    )
    return () => h(Element, attrs, slots)
  },
}) as unknown as PartComponent<"form", StatesOf<"form">["root"], FormProps>
