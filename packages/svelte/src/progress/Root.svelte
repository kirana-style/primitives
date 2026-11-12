<script lang="ts">
  import type { ProgressProps } from "@kirana-ui/core/progress"
  import { createProgress } from "@kirana-ui/core/progress"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { value, min, max, format, locale, getAriaValueText, id, ...rest }: RootProps<ProgressProps> = $props()
  const generated = $props.id()
  const made = provide(
    controller(createProgress, () => ({
      id: id ?? generated,
      value,
      min,
      max,
      format,
      locale,
      getAriaValueText,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
