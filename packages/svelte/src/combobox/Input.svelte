<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.input} tag="input" {...props} />
