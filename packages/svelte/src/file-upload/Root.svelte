<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createFileUpload } from "@kirana-ui/core/file-upload"

  import Part from "../Part.svelte"
  import { useFieldAround } from "../field/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // `bind:files` is the files held.
  let {
    files = $bindable(),
    defaultFiles,
    onFilesChange,
    onFilesReject,
    accept,
    multiple,
    maxFiles,
    maxSize,
    minSize,
    validate,
    disabled,
    required,
    name,
    form,
    id,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function change(next: File[], by: ChangeDetails) {
    onFilesChange?.(next, by)
    if (!by.canceled) files = next
  }

  const made = provide(
    controller(within(createFileUpload, { field: useFieldAround() }), () => ({
      id: id ?? generated,
      files,
      defaultFiles,
      onFilesReject,
      accept,
      multiple,
      maxFiles,
      maxSize,
      minSize,
      validate,
      disabled,
      required,
      name,
      form,
      onFilesChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
