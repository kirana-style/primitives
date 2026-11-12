<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createForm } from "@kirana-ui/core/form"
  import type { FormErrors, FormValues } from "@kirana-ui/core/form"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  // A `<form>` whose fields say what is wrong; `onFormSubmit` takes the values once all are valid.
  let { errors, onClearErrors, onFormSubmit, validationMode, ...rest } = $props()

  const made = provide(
    controller(createForm, () => ({
      errors,
      validationMode,
      // Only when the caller takes the values: without it the form submits as a form does.
      onFormSubmit: onFormSubmit
        ? (values: FormValues, details: ChangeDetails) => onFormSubmit?.(values, details)
        : undefined,
      onClearErrors: (left: FormErrors) => onClearErrors?.(left),
    }))
  )
</script>

<Part part={made.root} tag="form" {...rest} />
