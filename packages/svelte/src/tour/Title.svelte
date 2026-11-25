<script lang="ts">
  import Part from "../Part.svelte"
  import { useTour } from "./context.ts"
  import type { TitleProps } from "./types.ts"

  let props: TitleProps = $props()
  const part = useTour().title
</script>

<Part of={part} tag="h2" {...props} />
