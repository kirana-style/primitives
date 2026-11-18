<script lang="ts">
  import Said from "./Said.svelte"
  import type { DescriptionProps } from "./types.ts"

  // The toast's description, unless it is given content of its own.
  let props: DescriptionProps = $props()
</script>

<Said said="description" tag="div" {...props} />
