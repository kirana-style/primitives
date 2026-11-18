<script lang="ts">
  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { IncrementProps } from "./types.ts"

  let props: IncrementProps = $props()
  const controller = useNumberField()
</script>

<Part of={controller.increment} tag="button" {...props} />
