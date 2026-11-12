import "../../shared/styles.css"
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication, provideClientHydration } from "@angular/platform-browser"

import { App } from "./app"
import { Open } from "./open"

// The page the server rendered (`ssr.html`), taken over where it stands.
// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
void bootstrapApplication(open ? Open : App, {
  providers: [provideZonelessChangeDetection(), provideClientHydration()],
})
