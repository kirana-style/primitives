<script lang="ts">
  import Said from "./Said.svelte"
  import type { ActionProps } from "./types.ts"

  // The toast's action, its label unless it is given content of its own. A press tells the
  // action (`onAction`), then closes the toast unless the action called `details.cancel()`.
  let props: ActionProps = $props()
</script>

<Said said="action" tag="button" {...props} />
