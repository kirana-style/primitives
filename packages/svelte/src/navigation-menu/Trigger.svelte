<script lang="ts">
  import Part from "../Part.svelte"
  import { useItem } from "./context.ts"
  import type { TriggerProps } from "./types.ts"

  let props: TriggerProps = $props()
  const made = useItem()
</script>

<Part of={made.trigger} tag="button" {...props} />
