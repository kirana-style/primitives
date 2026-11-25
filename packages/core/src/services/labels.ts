/**
 * The name a `<label>` gives a control that is drawn on an element of its own with its native
 * input hidden inside it (a switch, a checkbox, a radio). The label is the input's, by `for` or
 * by standing around it, so a press on it reaches the control; but the element focus lands on,
 * the one with the role, is not the input and is named by nothing. This says which labels name
 * it, as the ids `aria-labelledby` takes.
 */

// For a label around an input that has no id to take a name from.
let made = 0

/**
 * The ids of the labels of `input`, for the `aria-labelledby` of `owner`, the element with the
 * control's role. A label with no id is given one, since nothing else can point to it.
 * `undefined` when no label names the input, or when the page named `owner` itself:
 * `written` is what this wrote there before, which is not the page's.
 */
export function labelledBy(
  input: HTMLInputElement,
  owner: Element,
  written: string | undefined
): string | undefined {
  if (owner.hasAttribute("aria-label")) return undefined
  const given = owner.getAttribute("aria-labelledby")
  if (given !== null && given !== written) return undefined
  const page = owner.ownerDocument
  const ids: string[] = []
  for (const label of input.labels ?? []) {
    if (!label.id) {
      // Named after the input, so it reads the same on every framework and on every visit.
      const wanted = input.id
        ? `${input.id}${ids.length > 0 ? `-${ids.length + 1}` : ""}-label`
        : undefined
      label.id = wanted && !page.getElementById(wanted) ? wanted : `kp-label-${++made}`
    }
    ids.push(label.id)
  }
  return ids.length > 0 ? ids.join(" ") : undefined
}
