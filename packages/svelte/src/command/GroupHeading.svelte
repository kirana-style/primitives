<script lang="ts">
  import Part from "../Part.svelte"
  import { useCommand, useGroup } from "./context.ts"
  import type { GroupHeadingProps } from "./types.ts"

  let props: GroupHeadingProps = $props()
  // With no group around it, a line of text and nothing more.
  const part = useGroup()?.heading ?? useCommand().heading
</script>

<Part of={part} tag="div" {...props} />
