<script lang="ts">
  import Part from "../Part.svelte"
  import { useFileUpload } from "./context.ts"
  import type { DropzoneProps } from "./types.ts"

  let props: DropzoneProps = $props()
  const controller = useFileUpload()
</script>

<Part of={controller.dropzone} tag="div" {...props} />
