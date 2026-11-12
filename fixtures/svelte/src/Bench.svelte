<script lang="ts">
  import { Collapsible as Ark } from "@ark-ui/svelte/collapsible"
  import { Collapsible } from "@kirana-ui/svelte"

  let { lib, count }: { lib: string; count: number } = $props()
  // The page is drawn once for the count it is opened with.
  // svelte-ignore state_referenced_locally
  const rows = Array.from({ length: count }, (_, index) => index)
</script>

{#if lib === "other"}
  {#each rows as index (index)}
    <Ark.Root lazyMount unmountOnExit>
      <Ark.Trigger>Row {index}</Ark.Trigger>
      <Ark.Content>Content {index}</Ark.Content>
    </Ark.Root>
  {/each}
{:else}
  {#each rows as index (index)}
    <Collapsible.Root>
      <Collapsible.Trigger>Row {index}</Collapsible.Trigger>
      <Collapsible.Panel>Content {index}</Collapsible.Panel>
    </Collapsible.Root>
  {/each}
{/if}
