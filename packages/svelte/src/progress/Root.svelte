<script lang="ts">
  import { createProgress } from "@kirana-ui/core/progress"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  let { value, min, max, format, locale, getAriaValueText, id, ...rest } = $props()
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
