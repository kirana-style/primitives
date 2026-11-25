<script lang="ts">
  import Part from "../Part.svelte"
  import { usePasswordInput } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = usePasswordInput()
</script>

<Part of={controller.input} tag="input" {...props} />
