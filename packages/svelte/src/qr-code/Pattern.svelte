<script lang="ts">
  import Part from "../Part.svelte"
  import { useQrCode } from "./context.ts"
  import type { PatternProps } from "./types.ts"

  let props: PatternProps = $props()
  const controller = useQrCode()
</script>

<Part of={controller.pattern} tag="path" {...props} />
