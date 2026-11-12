import { createSSRApp } from "vue"
import { renderToString } from "vue/server-renderer"

import App from "./App.vue"
import Open from "./Open.vue"

/** The page as a server renders it: no DOM, no effects. */
export const render = (page?: string) => renderToString(createSSRApp(page === "open" ? Open : App))
