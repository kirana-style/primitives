<script lang="ts">
  import Part from "../Part.svelte"
  import { useOtp } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let props: PartAttributes = $props()
  const controller = useOtp()
</script>

<Part part={controller.group} tag="div" {...props} />
