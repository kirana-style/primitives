<script lang="ts">
  import type { ReadonlySignal } from "@kirana-ui/core"
  import { createField } from "@kirana-ui/core/field"
  import type { FieldProps } from "@kirana-ui/core/field"

  import Part from "../Part.svelte"
  import { useFieldset } from "../fieldset/context.ts"
  import { useForm } from "../form/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    name,
    disabled,
    invalid,
    validate,
    validationMode,
    validationDebounceTime,
    id,
    ...rest
  }: RootProps<FieldProps> = $props()
  const generated = $props.id()
  const around = { form: useForm(), fieldset: useFieldset() }
  const made = provide(
    controller(
      (source: ReadonlySignal<FieldProps>) => createField(source, around),
      () => ({
        id: id ?? generated,
        name,
        disabled,
        invalid,
        validate: (value: string) => validate?.(value) ?? null,
        validationMode,
        validationDebounceTime,
      })
    )
  )
</script>

<Part part={made.root} tag="div" {...rest} />
