import "../../shared/styles.css"
import "@kirana-ui/web"

// What the other fixtures keep in their framework's state: here, a few listeners.
const find = <T extends HTMLElement>(testid: string) =>
  document.querySelector<T>(`[data-testid="${testid}"]`)!

// A collapsible a caller holds: a button outside it toggles it.
const held = document.querySelector<HTMLElement & { open: boolean }>(
  'kui-collapsible[kui-id="c3"]'
)!
find("c3-outside").addEventListener("click", () => {
  held.open = !held.open
})

// A switch a caller holds, and what the caller heard.
document.querySelector('kui-switch[kui-id="w1"]')!.addEventListener("checked-change", (event) => {
  find("w1-output").textContent = (event as CustomEvent<{ checked: boolean }>).detail.checked
    ? "on"
    : "off"
})
