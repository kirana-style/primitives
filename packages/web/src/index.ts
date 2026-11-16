// Importing an entry defines its element: `import "@kirana-ui/web/dialog"`. This one defines
// them all.
import "./accordion.ts"
import "./checkbox.ts"
import "./collapsible.ts"
import "./dialog.ts"
import "./radio-group.ts"
import "./switch.ts"
import "./tabs.ts"

export { defineElement, partAround } from "./runtime.ts"
export type { Drawn, ElementSpec } from "./runtime.ts"
