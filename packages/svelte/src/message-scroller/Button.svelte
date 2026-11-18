<script lang="ts">
  import Part from "../Part.svelte"
  import { useScroller } from "./context.ts"
  import type { ButtonProps } from "./types.ts"

  let props: ButtonProps = $props()
  const controller = useScroller()
</script>

<Part of={controller.button} tag="button" {...props} />
