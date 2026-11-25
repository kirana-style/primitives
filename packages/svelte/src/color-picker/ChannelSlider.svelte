<script lang="ts">
  import Part from "../Part.svelte"
  import { provideSlider, useColorPicker } from "./context.ts"
  import type { ChannelSliderProps } from "./types.ts"

  let { channel, orientation = "horizontal", ...rest }: ChannelSliderProps = $props()
  // A slider is its channel and its way for as long as it is in the page: its track and its
  // thumb are told them.
  // svelte-ignore state_referenced_locally
  const slider = provideSlider({ channel, orientation })
  const part = useColorPicker().channelSlider(slider.channel, slider.orientation)
</script>

<Part of={part} tag="div" {...rest} />
