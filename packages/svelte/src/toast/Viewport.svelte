<script lang="ts">
  import { createToast } from "@kirana-ui/core/toast"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { ViewportProps } from "./types.ts"

  // Where a toaster's toasts are drawn. Always in the page: put it once, near the root.
  let { toaster, label, hotkey, swipeDirection, id, ...rest }: ViewportProps = $props()
  const generated = $props.id()
  const made = provide(
    controller(createToast, () => ({ id: id ?? generated, toaster, label, hotkey, swipeDirection }))
  )
</script>

<Part of={made.viewport} tag="div" {...rest} />
