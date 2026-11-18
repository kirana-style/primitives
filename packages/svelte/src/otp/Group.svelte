<script lang="ts">
  import Part from "../Part.svelte"
  import { useOtp } from "./context.ts"
  import type { GroupProps } from "./types.ts"

  let props: GroupProps = $props()
  const controller = useOtp()
</script>

<Part of={controller.group} tag="div" {...props} />
