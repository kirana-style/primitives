<script lang="ts">
  import { createAvatar } from "@kirana-ui/core/avatar"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let props: RootProps = $props()
  const made = provide(controller(createAvatar, () => ({})))
</script>

<Part of={made.root} tag="span" {...props} />
