<!--
  @component
  Says where every popup inside it is drawn, the popups those open included: an element of
  the page (a shadow root's host, a full-screen element) in place of `<body>`.
-->
<script lang="ts">
  import { providePortalContainer } from "./portal-context.ts"
  import type { PortalProviderProps } from "./types.ts"

  // Says where every popup inside it is drawn, the popups those open included: an element of
  // the page (a shadow root's host, a full-screen element) in place of `<body>`.
  let { container, children }: PortalProviderProps = $props()
  providePortalContainer(() => container)
</script>

{@render children?.()}
