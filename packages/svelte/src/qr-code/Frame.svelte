<script lang="ts">
  import Part from "../Part.svelte"
  import { useQrCode } from "./context.ts"
  import type { FrameProps } from "./types.ts"

  let props: FrameProps = $props()
  const controller = useQrCode()
</script>

<Part of={controller.frame} tag="svg" {...props} />
