<script lang="ts">
  import Said from "./Said.svelte"
  import type { TitleProps } from "./types.ts"

  // The toast's title, unless it is given content of its own.
  let props: TitleProps = $props()
</script>

<Said said="title" tag="div" {...props} />
