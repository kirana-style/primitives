<script lang="ts">
  import type { NavigationMenuLinkOptions } from "@kirana-ui/core/navigation-menu"
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useNavigation } from "./context.ts"
  import type { PartAttributes } from "../types.ts"

  let { active, closeOnClick, ...rest }: NavigationMenuLinkOptions & PartAttributes = $props()
  const options = toSignal(() => ({ active, closeOnClick }))
  const part = useNavigation().link(() => defined(options.get()))
</script>

<Part {part} tag="a" {...rest} />
