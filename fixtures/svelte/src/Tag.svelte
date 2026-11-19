<!-- An element of the page's own with the `as` and `child` a part takes. -->
<script lang="ts">
  import { Primitive, mergeProps } from "@kirana-ui/svelte/primitive"
  import type { PrimitiveProps } from "@kirana-ui/svelte/primitive"

  let props: PrimitiveProps<"span"> = $props()
</script>

<Primitive as="span" {...mergeProps({ class: "tag" }, props)} />
