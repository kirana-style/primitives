<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker } from "./context.ts"
  import type { ChannelInputProps } from "./types.ts"

  // Its text is the core's own, written as the colour changes: the page never binds it.
  let { channel, ...rest }: ChannelInputProps = $props()
  // An input is its channel for as long as it is in the page.
  // svelte-ignore state_referenced_locally
  const part = useColorPicker().channelInput(channel)
</script>

<Part of={part} tag="input" {...rest} />
