import { generateHydrationScript, renderToString } from "solid-js/web"

import { App } from "./App.tsx"

/** The page as a server renders it: no DOM, no effects. */
export const render = () => renderToString(() => <App />)

/** Solid's script that queues events until the page is hydrated. */
export const head = () => generateHydrationScript()
