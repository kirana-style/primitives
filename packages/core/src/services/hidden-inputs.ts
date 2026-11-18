import { effect } from "../reactivity.ts"

/**
 * A control of several values in a form sends one hidden input for each. The first is the
 * control's own part, which its adapter draws (with nothing chosen it has no name, so nothing
 * is sent); the rest are the core's to draw, after it, for as long as the first is in the page.
 * `read` is followed: what it reads decides when they are drawn again.
 */
export function restInputs(
  first: HTMLElement,
  read: () => {
    /** Every value after the first. */
    rest: readonly unknown[]
    name: string | undefined
    form: string | undefined
    disabled: boolean
  }
): () => void {
  const more: HTMLInputElement[] = []
  const stop = effect(() => {
    const { rest, name, form, disabled } = read()
    while (more.length > rest.length) more.pop()!.remove()
    rest.forEach((each, at) => {
      let extra = more[at]
      if (!extra) {
        extra = first.ownerDocument.createElement("input")
        ;(more[at - 1] ?? first).after(extra)
        more[at] = extra
      }
      extra.type = "hidden"
      extra.name = name ?? ""
      extra.value = String(each)
      extra.disabled = disabled
      if (form === undefined) extra.removeAttribute("form")
      else extra.setAttribute("form", form)
    })
  })
  return () => {
    stop()
    for (const each of more.splice(0)) each.remove()
  }
}
