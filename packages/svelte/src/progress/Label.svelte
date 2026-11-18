<script lang="ts">
  import Part from "../Part.svelte"
  import { useProgress } from "./context.ts"
  import type { LabelProps } from "./types.ts"

  let props: LabelProps = $props()
  const controller = useProgress()
</script>

<Part of={controller.label} tag="span" {...props} />
