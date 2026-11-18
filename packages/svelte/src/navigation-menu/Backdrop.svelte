<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { BackdropProps } from "./types.ts"

  let props: BackdropProps = $props()
  const made = useNavigation()
</script>

<Part of={made.backdrop} tag="div" {...props} />
