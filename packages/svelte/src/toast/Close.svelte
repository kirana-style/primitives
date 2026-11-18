<script lang="ts">
  import Part from "../Part.svelte"
  import { useParts } from "./context.ts"
  import type { CloseProps } from "./types.ts"

  let props: CloseProps = $props()
  const controller = useParts()
</script>

<Part of={controller.close} tag="button" {...props} />
