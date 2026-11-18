<script lang="ts">
  import { untrack } from "svelte"

  import Part from "../Part.svelte"
  import { provideItem, useNavigation } from "./context.ts"
  import type { ItemProps } from "./types.ts"

  // `value` tells this item from the others; an item that is given none makes its own.
  let { value, ...rest }: ItemProps = $props()
  const generated = $props.id()
  const controller = useNavigation()
  // An item is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const item = provideItem(controller.item(value === undefined ? generated : value))
  $effect(() => untrack(() => item.mount()))
</script>

<Part of={controller.itemPart} tag="li" {...rest} />
