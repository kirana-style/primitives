<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"
  import type { LabelProps } from "./types.ts"

  let props: LabelProps = $props()
  const controller = useField()
</script>

<Part of={controller.label} tag="label" {...props} />
