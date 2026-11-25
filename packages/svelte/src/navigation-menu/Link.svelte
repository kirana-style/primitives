<script lang="ts">
  import { defined } from "@kirana-ui/core"

  import Part from "../Part.svelte"
  import { toSignal } from "../runtime.svelte.ts"
  import { useNavigation } from "./context.ts"
  import type { LinkProps } from "./types.ts"

  let { active, closeOnSelect, closeOnClick, ...rest }: LinkProps = $props()
  const options = toSignal(() => ({ active, closeOnSelect, closeOnClick }))
  const part = useNavigation().link(() => defined(options.get()))
</script>

<Part of={part} tag="a" {...rest} />
