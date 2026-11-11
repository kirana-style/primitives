import "../../shared/styles.css"
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"

import { App } from "./app"

void bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] })
