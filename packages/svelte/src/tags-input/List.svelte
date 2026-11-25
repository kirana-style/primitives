<script lang="ts">
  import Part from "../Part.svelte"
  import { useTagsInput } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let props: ListProps = $props()
  const controller = useTagsInput()
</script>

<Part of={controller.list} tag="div" {...props} />
