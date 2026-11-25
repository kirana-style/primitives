<script lang="ts">
  import Part from "../Part.svelte"
  import { useTagsInput } from "./context.ts"
  import type { ClearProps } from "./types.ts"

  let props: ClearProps = $props()
  const controller = useTagsInput()
</script>

<Part of={controller.clear} tag="button" {...props} />
