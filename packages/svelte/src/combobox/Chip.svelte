<script lang="ts">
  import { setContext } from "svelte"

  import Part from "../Part.svelte"
  import { CHIP, useCombobox } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // With `multiple`: one chosen value. Its `value` is what its remove button takes away.
  let { value, ...rest }: { value: unknown } & PartAttributes = $props()
  // A chip is its value for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const held = value
  setContext(CHIP, held)
  const part = useCombobox().chip(held)
</script>

<Part {part} tag="span" {...rest} />
