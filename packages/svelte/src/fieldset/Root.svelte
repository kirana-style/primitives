<script lang="ts">
  import { createFieldset } from "@kirana-ui/core/fieldset"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let { disabled, id, ...rest }: RootProps = $props()
  const generated = $props.id()
  const made = provide(controller(createFieldset, () => ({ id: id ?? generated, disabled })))
</script>

<Part of={made.root} tag="fieldset" {...rest} />
