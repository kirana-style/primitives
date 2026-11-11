import { render as renderToString } from "svelte/server"

import App from "./App.svelte"

/** The page as a server renders it: no DOM, no effects. */
export const render = () => renderToString(App).body
