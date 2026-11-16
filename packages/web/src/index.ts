// Importing an entry defines its element: `import "@kirana-ui/web/dialog"`. This one defines
// them all.
import "./checkbox.ts"
import "./collapsible.ts"
import "./dialog.ts"
import "./switch.ts"
import "./tabs.ts"

export { defineElement, innerInput } from "./runtime.ts"
export type { ElementSpec, PresentPart } from "./runtime.ts"
