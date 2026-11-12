<script lang="ts">
  import type { MeterProps } from "@kirana-ui/core/meter"
  import { createMeter } from "@kirana-ui/core/meter"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { value, min, max, format, locale, getAriaValueText, id, ...rest }: RootProps<MeterProps> = $props()
  const generated = $props.id()
  const made = provide(
    controller(createMeter, () => ({
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
