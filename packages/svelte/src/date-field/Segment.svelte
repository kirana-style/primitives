<script lang="ts">
  import type { DateFieldSegment } from "@kirana-ui/core/date-field"

  import Part from "../Part.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useDateField } from "./context.ts"
  import type { Attributes } from "../types.ts"

  // One piece: a part that is typed, or what stands between two. It writes its own text.
  let { segment, ...rest }: { segment: DateFieldSegment } & Attributes = $props()
  // svelte-ignore state_referenced_locally
  const made = useDateField().segment(segment)
  const shown = fromSignal(made.text)
</script>

<Part part={made.part} tag="span" {...rest}>{shown.current}</Part>
