<script lang="ts">
  import Part from "../Part.svelte"
  import { useOtp } from "./context.ts"
  import type { InputProps } from "./types.ts"

  let props: InputProps = $props()
  const controller = useOtp()
</script>

<Part of={controller.input} tag="input" {...props} />
