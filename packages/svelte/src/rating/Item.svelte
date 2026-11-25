<script lang="ts">
  import Part from "../Part.svelte"
  import { useRating } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  let { place, ...rest }: ItemProps = $props()
  const controller = useRating()
</script>

<Part of={controller.item(place)} tag="span" {...rest} />
