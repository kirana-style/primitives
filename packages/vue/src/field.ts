import type { ReadonlySignal } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type { FieldProps, ValidityKey } from "@kirana-ui/core/field"
import { defineComponent, h, onBeforeUnmount, onMounted, useId } from "vue"
import type { PropType } from "vue"

import { provideField, useField } from "./field-context.ts"
import { useFieldset } from "./fieldset.ts"
import { useForm } from "./form.ts"
import { controller, fromSignal, optional, partComponent, toSignal } from "./runtime.ts"

const scope = { provide: provideField, use: useField }

const RootElement = partComponent("FieldRootElement", "div", () => scope.use().root)

const Root = defineComponent({
  name: "FieldRoot",
  inheritAttrs: false,
  props: {
    name: String,
    disabled: Boolean,
    invalid: Boolean,
    validate: Function as PropType<FieldProps["validate"]>,
    validationMode: String as PropType<FieldProps["validationMode"]>,
    validationDebounceTime: Number,
    id: String,
  },
  setup(props, { attrs, slots }) {
    const generated = useId()
    const around = { form: useForm(), fieldset: useFieldset() }
    scope.provide(
      controller(
        (source: ReadonlySignal<FieldProps>) => createField(source, around),
        () => ({ ...props, id: props.id ?? generated })
      )
    )
    return () => h(RootElement, attrs, slots)
  },
})

/**
 * What is wrong, or its slot in its place. In the page while it applies. `match` is one of the
 * browser's findings (`"valueMissing"`) to show for only that, or `true` to show always.
 */
const FieldError = defineComponent({
  name: "FieldError",
  inheritAttrs: false,
  props: { match: optional([String, Boolean] as PropType<ValidityKey | boolean>) },
  setup(props, { attrs, slots }) {
    const options = toSignal(() => ({ match: props.match }))
    const error = scope.use().error(() => options.get().match)
    let stop: (() => void) | undefined
    onMounted(() => {
      stop = error.mount()
    })
    onBeforeUnmount(() => stop?.())
    const mounted = fromSignal(error.mounted)
    const text = fromSignal(error.text)
    const Element = partComponent("FieldErrorElement", "div", () => error.part)
    return () => (mounted.value ? h(Element, attrs, () => slots.default?.() ?? text.value) : null)
  },
})

/** Draws nothing itself: its slot is given the field's validity (`v-slot="{ validity }"`). */
const Validity = defineComponent({
  name: "FieldValidity",
  setup(_props, { slots }) {
    const validity = fromSignal(scope.use().validity)
    return () => slots.default?.({ validity: validity.value })
  },
})

export const Field = {
  Root,
  Label: partComponent("FieldLabel", "label", () => scope.use().label),
  /** An `<input>`; `as="textarea"` or `as="select"` for another. */
  Control: partComponent("FieldControl", "input", () => scope.use().control),
  Description: partComponent("FieldDescription", "p", () => scope.use().description),
  Error: FieldError,
  Validity,
}
