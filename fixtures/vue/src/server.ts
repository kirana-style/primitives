import { createSSRApp } from "vue"
import { renderToString } from "vue/server-renderer"

import App from "./App.vue"

/** The page as a server renders it: no DOM, no effects. */
export const render = () => renderToString(createSSRApp(App))
