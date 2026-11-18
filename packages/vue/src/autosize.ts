import { createAutosize } from "@kirana-ui/core/autosize"
import { defineComponent, h } from "vue"

import { controller, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

export interface TextareaProps extends PartComponentProps {
  /** The text: `v-model`. */
  modelValue?: string | undefined
}

export type TextareaEmits = { "update:modelValue": (value: string) => void }

/**
 * A `<textarea>` as tall as its text. It takes what a `<textarea>` takes, and `v-model`.
 */
const Textarea = defineComponent({
  name: "AutosizeTextarea",
  inheritAttrs: false,
  props: { modelValue: String },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots, emit }) {
    const made = controller(createAutosize, () => ({ value: props.modelValue ?? attrs.value }))
    const Element = partComponent("AutosizeTextareaElement", "textarea", () => made.textarea)
    return () =>
      h(
        Element,
        {
          ...attrs,
          ...(props.modelValue === undefined ? {} : { value: props.modelValue }),
          onInput: (event: Event) => {
            emit("update:modelValue", (event.target as HTMLTextAreaElement).value)
            ;(attrs.onInput as ((event: Event) => void) | undefined)?.(event)
          },
        },
        slots
      )
  },
}) as unknown as PartComponent<
  "textarea",
  StatesOf<"autosize">["textarea"],
  TextareaProps,
  TextareaEmits
>

export const Autosize = { Textarea }
