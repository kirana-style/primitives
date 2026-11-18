<script lang="ts">
  import Part from "../Part.svelte"
  import Outlet from "../Portal.svelte"
  import { fromSignal } from "../runtime.svelte.ts"
  import { useNumberField } from "./context.ts"
  import type { ScrubAreaCursorProps } from "./types.ts"

  // Drawn in place of the pointer while it is locked for a drag, at the end of `<body>`.
  let props: ScrubAreaCursorProps = $props()
  const cursor = useNumberField().scrubAreaCursor
  const mounted = fromSignal(cursor.mounted)
</script>

<Outlet mounted={mounted.current}>
  <Part of={cursor.part} tag="span" {...props} />
</Outlet>
