<script lang="ts">
  import Part from "../Part.svelte"
  import { useCommand } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let props: ListProps = $props()
  const controller = useCommand()
</script>

<Part of={controller.list} tag="div" {...props} />
