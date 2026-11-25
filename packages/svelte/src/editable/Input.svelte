<script lang="ts">
  import Part from "../Part.svelte"
  import { useEditable } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useEditable()
</script>

<Part of={controller.input} tag="input" {...props} />
