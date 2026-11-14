<script lang="ts">
  import type { ToastProps } from "@kirana-ui/core/toast"
  import { createToast } from "@kirana-ui/core/toast"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  // Where a toaster's toasts are drawn. Always in the page: put it once, near the root.
  let { toaster, label, hotkey, swipeDirection, id, ...rest }: RootProps<ToastProps> = $props()
  const generated = $props.id()
  const made = provide(
    controller(createToast, () => ({ id: id ?? generated, toaster, label, hotkey, swipeDirection }))
  )
</script>

<Part part={made.viewport} tag="div" {...rest} />
