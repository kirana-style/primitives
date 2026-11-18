<script lang="ts">
  import Part from "../Part.svelte"
  import { useDialog } from "./context.ts"
  import type { TitleProps } from "./types.ts"

  let props: TitleProps = $props()
  const controller = useDialog()
</script>

<Part of={controller.title} tag="h2" {...props} />
