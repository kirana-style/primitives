<script lang="ts">
  import Part from "../Part.svelte"
  import { useNavigation } from "./context.ts"
  import type { ListProps } from "./types.ts"

  let props: ListProps = $props()
  const made = useNavigation()
</script>

<Part of={made.list} tag="ul" {...props} />
