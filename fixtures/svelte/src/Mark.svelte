<!--
  An element of the page's own with a state of its own, composed as a part is: its own class,
  type and handler under its caller's, its state written as `data-*` and handed to `child`.
-->
<script lang="ts">
  import { Primitive, mergeProps } from "@kirana-ui/svelte/primitive"
  import type { PrimitiveProps } from "@kirana-ui/svelte/primitive"

  let props: PrimitiveProps<"button", { active: boolean }> = $props()
  let active = $state(false)
</script>

<Primitive
  as="button"
  {...mergeProps({ class: "mark", type: "button", onclick: () => (active = !active) }, props)}
  state={{ active }}
/>
