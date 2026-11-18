# @kirana-ui/vocabulary

Kirana UI Primitives' parts, where each goes, its states and its CSS variables, as data. The primitives ship no styles:
this is the whole contract between them and a stylesheet, whatever writes it.

Generated from the part definitions the core runs on (`vp run vocabulary`), so it cannot drift
from what the parts write; the conformance run also fails on any `data-*` attribute or custom
property a part writes that is not in it. To read it as a page: [REFERENCE.md](./REFERENCE.md).

## The three forms

**The data**, for any tool (`@kirana-ui/vocabulary/vocabulary.json`, or `vocabulary` from the
package root, typed):

```json
{
  "version": 1,
  "sharesNamesWith": ["base-ui"],
  "components": {
    "popover": {
      "parts": {
        "popup": {
          "description": "The popover itself.",
          "states": {
            "open": { "attribute": "data-open", "description": "…", "selector": "[data-open]" },
            "side": {
              "attribute": "data-side",
              "description": "…",
              "values": { "top": "[data-side=\"top\"]", "right": "[data-side=\"right\"]" }
            }
          },
          "exclusive": [
            ["open", "closed"],
            ["startingStyle", "endingStyle"]
          ],
          "variables": {},
          "inside": ["positioner"],
          "optional": false,
          "repeated": false
        }
      }
    }
  }
}
```

- `version` is the format's. It changes only when a reader would have to.
- A state has a `selector` when its attribute marks it by being present, and `values` (each
  value's selector) when the attribute carries one. A boolean state is never `="false"`.
- `exclusive` lists, by state name, the states of a part that never hold together. The values of
  one valued state never hold together either.
- `variables` are custom properties on the part's element, each with what it holds.
- `inside` is where the part goes: the parts of the same component it is written inside. The
  first is where an anatomy draws it, the others where it may also be (a submenu's portal is in
  the submenu, a menu's in the menu); the outermost part, which a component has one of, has
  none. `optional` marks a wrapper that may be left out, what it holds then written where the
  wrapper would be; `repeated` a part written once for each entry (an item, a tab), or any
  number of times. A part that draws no element (a popup's root, a `portal`, a list) is in the
  data too, with no states: it has a place like any other. The library's own fixture pages are
  held to it, on every framework.
- `sharesNamesWith` names other vocabularies whose attribute names these are too: a style written
  for Base UI's states holds for these parts.

**The keys**, each state as a selector by component and part, with the groups that never meet
(`@kirana-ui/vocabulary/keys`):

```ts
import { Popover, exclusive } from "@kirana-ui/vocabulary/keys"

Popover.Popup.open // "[data-open]"
Popover.Popup.side.top // '[data-side="top"]'
exclusive // [["[data-open]", "[data-closed]"], …]
```

This is the shape Kirana takes a library's states in (`@kirana-style/states`), so the keys work
as its condition keys, and `exclusive` as its `conditions.exclusive`.

**Plain CSS** needs neither: the attributes and variables are the API.

```css
.popup {
  transform-origin: var(--transform-origin);
  transition: opacity 120ms;
}
.popup[data-starting-style],
.popup[data-ending-style] {
  opacity: 0;
}
.popup[data-side="top"] {
  margin-block-end: 4px;
}
```

## Stability

A part's name, its attributes and its variables are public API: they change only in a major
release. Tailwind reads the same attributes with its own variants (`data-open:`,
`data-[side=top]:`).
