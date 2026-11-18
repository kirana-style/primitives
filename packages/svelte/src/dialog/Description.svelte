<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { DescriptionProps } from "./types.ts"

  let props: DescriptionProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.description} tag="p" {...props} />
