import "../../shared/styles.css"
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication, provideClientHydration } from "@angular/platform-browser"

import { App } from "./app"

// The page the server rendered (`ssr.html`), taken over where it stands.
void bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection(), provideClientHydration()],
})
