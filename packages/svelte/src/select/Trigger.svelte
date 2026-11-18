<script lang="ts">
  import Part from "../Part.svelte"
  import { useSelect } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useSelect()
</script>

<Part of={controller.trigger} tag="button" {...props} />
