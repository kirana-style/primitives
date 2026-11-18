<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { PopupProps } from "./types.ts"

  let props: PopupProps = $props()
  const made = useNavigation()
</script>

<Part of={made.popup} tag="div" {...props} />
