<script lang="ts">
  import Part from "../Part.svelte"
  import { usePasswordInput } from "./context.ts"
  import type { ToggleProps } from "./types.ts"

  let props: ToggleProps = $props()
  const controller = usePasswordInput()
</script>

<Part of={controller.toggle} tag="button" {...props} />
