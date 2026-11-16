<script lang="ts">
  import { getAllContexts, mount, unmount } from "svelte"
  import type { Snippet } from "svelte"

  import PortalContent from "./PortalContent.svelte"
  import { usePortalContainer } from "./portal-context.ts"

  // Its children in a container at the end of the page, while `mounted`. Mounted there, not
  // moved there: an element that is moved loses focus. With `into`, they are children of that
  // element instead, with nothing around them.
  let { mounted, into, children }: { mounted: boolean; into?: HTMLElement; children?: Snippet } = $props()
  const context = getAllContexts()
  const container = usePortalContainer()

  $effect(() => {
    if (!mounted) return
    if (into) {
      const content = mount(PortalContent, { target: into, props: { children }, context })
      return () => void unmount(content)
    }
    const target = document.createElement("div")
    target.setAttribute("data-kirana-portal", "")
    ;(container?.() ?? document.body).appendChild(target)
    const content = mount(PortalContent, { target, props: { children }, context })
    return () => {
      void unmount(content)
      target.remove()
    }
  })
</script>
