<script lang="ts">
  import Part from "../Part.svelte"
  import { useCombobox } from "./context.ts"
  import type { ListProps } from "./types.ts"

  // The items' own box inside the popup, when the popup holds more than items (an input): it
  // is then the listbox.
  let props: ListProps = $props()
  const controller = useCombobox()
</script>

<Part of={controller.list} tag="div" {...props} />
