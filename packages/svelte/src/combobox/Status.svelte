<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { StatusProps } from "./types.ts"

  // Says how the list stands ("3 results", "Loading") to software that reads the page, as its
  // text changes. Keep it in the page and change what it holds: inside the popup, or beside
  // the input.
  let props: StatusProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.status} tag="div" {...props} />
