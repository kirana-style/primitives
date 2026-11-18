<script lang="ts">
  import Part from "../Part.svelte"
  import { useNumberField } from "./context.ts"
  import type { GroupProps } from "./types.ts"

  let props: GroupProps = $props()
  const controller = useNumberField()
</script>

<Part of={controller.group} tag="div" {...props} />
