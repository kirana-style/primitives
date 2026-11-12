import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication, provideClientHydration } from "@angular/platform-browser"
import type { BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, renderApplication } from "@angular/platform-server"

import { App } from "./app"
import { Open } from "./open"

const bootstrap = (page?: string) => (context: BootstrapContext) =>
  bootstrapApplication(
    page === "open" ? Open : App,
    {
      providers: [
        provideZonelessChangeDetection(),
        provideClientHydration(),
        provideServerRendering(),
      ],
    },
    context
  )

/** The page as a server renders it: what is inside `<body>`, with what hydration reads. */
export async function render(which?: string): Promise<string> {
  const page = await renderApplication(bootstrap(which), {
    document: "<html><head></head><body><app-root></app-root></body></html>",
    url: "/",
  })
  return page.slice(page.indexOf("<body>") + 6, page.lastIndexOf("</body>"))
}
