<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { SubmenuTriggerProps } from "./types.ts"

  let props: SubmenuTriggerProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.trigger} tag="div" {...props} />
