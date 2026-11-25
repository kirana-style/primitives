<script lang="ts">
  import Part from "../Part.svelte"
  import { useColorPicker, useSliderOf } from "./context.ts"
  import type { ChannelSliderTrackProps } from "./types.ts"

  let props: ChannelSliderTrackProps = $props()
  const { channel, orientation } = useSliderOf()
  const part = useColorPicker().channelSliderTrack(channel, orientation)
</script>

<Part of={part} tag="div" {...props} />
