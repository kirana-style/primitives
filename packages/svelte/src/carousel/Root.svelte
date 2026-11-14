<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import type { CarouselProps } from "@kirana-ui/core/carousel"
  import { within } from "@kirana-ui/core"
  import { createCarousel } from "@kirana-ui/core/carousel"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    index = $bindable(),
    defaultIndex,
    onIndexChange,
    orientation,
    loop,
    id,
    ...rest
  }: RootProps<CarouselProps> = $props()
  const generated = $props.id()
  const made = provide(
    controller(within(createCarousel, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      index,
      defaultIndex,
      orientation,
      loop,
      onIndexChange: (next: number, details: ChangeDetails) => {
        onIndexChange?.(next, details)
        // Written back only to a caller who holds it: one who does not leaves it the part's.
        if (!details.canceled && index !== undefined) index = next
      },
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
