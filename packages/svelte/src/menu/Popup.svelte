<script lang="ts">
  import Part from "../Part.svelte"
  import { useMenu } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const controller = useMenu()
</script>

<Part of={controller.popup} tag="div" {...props} />
