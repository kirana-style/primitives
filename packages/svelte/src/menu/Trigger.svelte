<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.trigger} tag="button" {...props} />
