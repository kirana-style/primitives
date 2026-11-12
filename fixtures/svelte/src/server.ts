import { render as renderToString } from "svelte/server"

import App from "./App.svelte"
import Open from "./Open.svelte"

/** The page as a server renders it: no DOM, no effects. */
export const render = (page?: string) =>
  page === "open" ? renderToString(Open).body : renderToString(App).body
