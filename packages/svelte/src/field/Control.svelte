<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  // An `<input>`; `as="textarea"` or `as="select"` for another.
  let { as = "input", ...rest }: PartAttributes = $props()
  const controller = useField()
</script>

<Part part={controller.control} tag={as} {...rest} />
