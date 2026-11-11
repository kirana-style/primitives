import { renderToString } from "react-dom/server"

import { App } from "./App.tsx"

/** The page as a server renders it: no DOM, no effects. */
export const render = () => renderToString(<App />)
