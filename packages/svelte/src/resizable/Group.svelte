<script lang="ts">
  import type { ResizableProps } from "@kirana-ui/core/resizable"
  import { within } from "@kirana-ui/core"
  import { createResizable } from "@kirana-ui/core/resizable"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { orientation, onSizesChange, keyboardStep, disabled, id, ...rest }: RootProps<ResizableProps> = $props()
  const generated = $props.id()
  const made = provide(
    controller(within(createResizable, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      orientation,
      keyboardStep,
      disabled,
      onSizesChange,
    }))
  )
</script>

<Part part={made.group} tag="div" {...rest} />
