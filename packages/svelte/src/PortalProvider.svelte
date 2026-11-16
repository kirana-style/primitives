<script lang="ts">
  import type { Snippet } from "svelte"

  import { providePortalContainer } from "./portal-context.ts"

  // Says where every popup inside it is drawn, the popups those open included: an element of
  // the page (a shadow root's host, a full-screen element) in place of `<body>`.
  let { container, children }: { container?: HTMLElement | null; children?: Snippet } = $props()
  providePortalContainer(() => container)
</script>

{@render children?.()}
