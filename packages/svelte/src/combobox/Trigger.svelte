<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.trigger} tag="button" {...props} />
