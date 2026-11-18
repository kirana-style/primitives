<script lang="ts">
  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useNumberField()
</script>

<Part of={controller.input} tag="input" {...props} />
