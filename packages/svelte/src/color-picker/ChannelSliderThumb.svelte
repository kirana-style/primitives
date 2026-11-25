<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker, useSliderOf } from "./context.ts"
  import type { ChannelSliderThumbProps } from "./types.ts"

  let props: ChannelSliderThumbProps = $props()
  const { channel, orientation } = useSliderOf()
  const part = useColorPicker().channelSliderThumb(channel, orientation)
</script>

<Part of={part} tag="div" {...props} />
