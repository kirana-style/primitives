<script lang="ts">
  import type { QrCodeProps } from "@kirana-ui/core/qr-code"
  import { createQrCode } from "@kirana-ui/core/qr-code"

  import Part from "../Part.svelte"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let { value, correction, id, ...rest }: RootProps<QrCodeProps> = $props()
  const generated = $props.id()
  const made = provide(controller(createQrCode, () => ({ id: id ?? generated, value, correction })))
</script>

<Part part={made.root} tag="div" {...rest} />
