<script lang="ts">
  import Part from "../Part.svelte"
  import { useFileUpload } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let props: ListProps = $props()
  const controller = useFileUpload()
</script>

<Part of={controller.list} tag="ul" {...props} />
