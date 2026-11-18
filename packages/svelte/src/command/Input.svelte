<script lang="ts">
  import Part from "../Part.svelte"
  import { useCommand } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useCommand()
</script>

<Part of={controller.input} tag="input" {...props} />
