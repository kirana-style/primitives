<script lang="ts">
  import Part from "../Part.svelte"
  import { useQrCode } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useQrCode()
</script>

<Part part={controller.frame} tag="svg" {...props} />
