<script lang="ts">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"

  // An `<input>`; `as="textarea"` or `as="select"` for another.
  let { as = "input", ...rest } = $props()
  const controller = useField()
</script>

<Part part={controller.control} tag={as} {...rest} />
