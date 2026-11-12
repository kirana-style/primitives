import { generateHydrationScript, renderToString } from "solid-js/web"

import { App } from "./App.tsx"
import { Open } from "./Open.tsx"

/** The page as a server renders it: no DOM, no effects. */
export const render = (page?: string) =>
  renderToString(() => (page === "open" ? <Open /> : <App />))

/** Solid's script that queues events until the page is hydrated. */
export const head = () => generateHydrationScript()
