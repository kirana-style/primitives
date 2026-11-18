<script lang="ts" generics="As extends 'input' | 'textarea' | 'select' = 'input'">
  import Part from "../Part.svelte"
  import { useField } from "./context.ts"
  import type { ControlProps } from "./types.ts"

  // An `<input>`; `as="textarea"` or `as="select"` for another.
  let { as, ...rest }: ControlProps<As> = $props()
  const controller = useField()
</script>

<Part of={controller.control} tag={as ?? "input"} {...rest} />
