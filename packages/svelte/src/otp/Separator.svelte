<script lang="ts">
  import Part from "../Part.svelte"
  import { useOtp } from "./context.ts"
  import type { SeparatorProps } from "./types.ts"

  let props: SeparatorProps = $props()
  const controller = useOtp()
</script>

<Part of={controller.separator} tag="div" {...props} />
