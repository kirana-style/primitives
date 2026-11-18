<script lang="ts">
  import Part from "../Part.svelte"
  import { useDateField } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useDateField()
</script>

<Part of={controller.input} tag="input" {...props} />
