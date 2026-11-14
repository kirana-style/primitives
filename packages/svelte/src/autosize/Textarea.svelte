<script lang="ts">
  import { createAutosize } from "@kirana-ui/core/autosize"

  import { controller, partProps } from "../runtime.svelte.ts"
  import type { Attributes } from "../types.ts"

  // A `<textarea>` as tall as its text. It takes what a `<textarea>` takes, and `bind:value`.
  let { value = $bindable(), oninput, ...rest }: Attributes & { value?: string } = $props()
  const made = controller(createAutosize, () => ({ value }))
  const typed = (event: Event) => {
    value = (event.currentTarget as HTMLTextAreaElement).value
    ;(oninput as ((event: Event) => void) | undefined)?.(event)
  }
  // Its own element, not the shared one: a text area's content is its text, and what a
  // framework leaves between an element's tags would be read as that.
  const merged = partProps(
    () => made.textarea,
    () => ({ ...rest, ...(value === undefined ? {} : { value }), oninput: typed })
  )
</script>

<textarea {...merged.current}></textarea>
