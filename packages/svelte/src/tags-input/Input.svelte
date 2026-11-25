<script lang="ts">
  import Part from "../Part.svelte"
  import { useTagsInput } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useTagsInput()
</script>

<Part of={controller.input} tag="input" {...props} />
