<script lang="ts">
  import { createFieldset } from "@kirana-ui/core/fieldset"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { disabled, id, ...rest }: PartAttributes = $props()
  const generated = $props.id()
  const made = provide(controller(createFieldset, () => ({ id: id ?? generated, disabled })))
</script>

<Part part={made.root} tag="fieldset" {...rest} />
