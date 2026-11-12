import "../../shared/styles.css"
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"

import { App } from "./app"
import { Open } from "./open"

// `open.html` and `open-ssr.html` draw the second page.
const open = location.pathname.includes("open")
void bootstrapApplication(open ? Open : App, { providers: [provideZonelessChangeDetection()] })
