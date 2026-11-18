<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"
  import type { DescriptionProps } from "./types.ts"

  let props: DescriptionProps = $props()
  const controller = useField()
</script>

<Part of={controller.description} tag="p" {...props} />
