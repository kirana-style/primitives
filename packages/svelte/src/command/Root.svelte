<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createCommand } from "@kirana-ui/core/command"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    inputValue = $bindable(),
    defaultInputValue,
    onInputValueChange,
    onSelect,
    filter,
    loop,
    autoHighlight,
    disabled,
    id,
    ...rest
  }: RootProps = $props()
  const generated = $props.id()

  function changeInput(next: string, by: ChangeDetails) {
    onInputValueChange?.(next, by)
    if (!by.canceled) inputValue = next
  }

  const made = provide(
    controller(createCommand, () => ({
      id: id ?? generated,
      inputValue,
      defaultInputValue,
      filter,
      loop,
      autoHighlight,
      disabled,
      onInputValueChange: changeInput,
      onSelect: (value: string, by: ChangeDetails) => onSelect?.(value, by),
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
