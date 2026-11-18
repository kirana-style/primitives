<script lang="ts">
  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { DecrementProps } from "./types.ts"

  let props: DecrementProps = $props()
  const controller = useNumberField()
</script>

<Part of={controller.decrement} tag="button" {...props} />
