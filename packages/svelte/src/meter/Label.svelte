<script lang="ts">
  import Part from "../Part.svelte"
  import { useMeter } from "./context.ts"
  import type { LabelProps } from "./types.ts"

  let props: LabelProps = $props()
  const controller = useMeter()
</script>

<Part of={controller.label} tag="span" {...props} />
