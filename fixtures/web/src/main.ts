import "../../shared/styles.css"
import { effect } from "@kirana-ui/core"
import type { Field } from "@kirana-ui/core/field"
import type { Tour } from "@kirana-ui/core/tour"
import "@kirana-ui/web"
import type { Placed } from "@kirana-ui/web"
import { toasterOf } from "@kirana-ui/web/toast"

// What the other fixtures keep in their framework's state: here, a few listeners.
const find = <T extends HTMLElement>(testid: string) =>
  document.querySelector<T>(`[data-testid="${testid}"]`)!

// A collapsible a caller holds: a button outside it toggles it.
const held = document.querySelector<HTMLElement & { open: boolean }>(
  'kui-collapsible[kui-id="c3"]'
)!
find("c3-outside").addEventListener("click", () => {
  held.open = !held.open
})

// A switch a caller holds, and what the caller heard.
document.querySelector('kui-switch[kui-id="w1"]')!.addEventListener("checked-change", (event) => {
  find("w1-output").textContent = (event as CustomEvent<{ checked: boolean }>).detail.checked
    ? "on"
    : "off"
})

const element = <T>(tag: string, id: string) =>
  document.querySelector<HTMLElement & T>(`${tag}[kui-id="${id}"]`)!

// Buttons that count.
let count = 0
for (const each of ["b1", "b3", "bl1"]) {
  find(each).addEventListener("click", () => {
    find("b1").textContent = `Count ${++count}`
  })
}
// A tooltip taken out of the page, open or not.
find("h3-remove").addEventListener("click", () => element("kui-tooltip", "h3").remove())
// A submit button in a form: what the form heard.
let submits = 0
find("b4-form").addEventListener("submit", (event) => {
  event.preventDefault()
  find("b4").textContent = `Sent ${++submits}`
})
find("pr1-more").addEventListener("click", () => {
  element<{ value: number }>("kui-progress", "pr1").value = 100
})
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const BROKEN = "data:image/png;base64,AAAA"
find("av-load").addEventListener("click", () => {
  const [first, second] = document.querySelectorAll<HTMLElement & { src: string }>("kui-avatar")
  first!.src = PIXEL
  second!.src = BROKEN
  // A picture kept in the page says its own address.
  find("av3-image").setAttribute("src", PIXEL)
})
document.querySelector("kui-avatar")!.addEventListener("loading-status-change", (event) => {
  find("av1-status").textContent = (event as CustomEvent<{ status: string }>).detail.status
})

// A checkbox group a caller holds, and what the caller heard.
const toppings = element<{ value: string[] }>("kui-checkbox-group", "cg1")
toppings.addEventListener("value-change", (event) => {
  const { value } = (event as CustomEvent<{ value: string[] }>).detail
  toppings.value = value
  find("cg1-output").textContent = value.join(",")
})

// A range a caller holds.
const range = element<{ value: number[] }>("kui-slider", "sl2")
range.addEventListener("value-change", (event) => {
  const { value } = (event as CustomEvent<{ value: number[] }>).detail
  range.value = value
  find("sl2-output").textContent = value.join(",")
})

// A thumb the page takes away and puts back, before the others.
const lowest = find("sl5-low")
find("sl5-toggle").addEventListener("click", () => {
  if (lowest.isConnected) lowest.remove()
  else find("sl5-middle").before(lowest)
})

// A form: a check of the page's own, what a server refused, what was sent.
element<{ validate: unknown }>("kui-field", "fd2").validate = (value: string) =>
  value === "admin" ? "Taken" : null
const form = document.querySelector<HTMLElement & { errors: unknown }>("kui-form")!
form.addEventListener("form-submit", (event) => {
  find("f1-sent").textContent = JSON.stringify(
    (event as CustomEvent<{ values: unknown }>).detail.values
  )
})
find("f1-reject").addEventListener("click", () => {
  form.errors = { user: "Reserved" }
})
// What no part draws is read from the component itself.
void customElements.whenDefined("kui-field").then(() => {
  const { controller } = element<{ controller: Field }>("kui-field", "fd1")
  effect(() => {
    const { valid } = controller.validity.get()
    find("fd1-validity").textContent = valid === null ? "unchecked" : valid ? "valid" : "invalid"
  })
})

// What a caller heard: a list's and a group's values.
const heard = (tag: string, id: string | undefined, output: string) =>
  document
    .querySelector(id ? `${tag}[kui-id="${id}"]` : tag)!
    .addEventListener("value-change", (event) => {
      if (event.target !== event.currentTarget) return
      find(output).textContent = (event as CustomEvent<{ value: string[] }>).detail.value.join(",")
    })
heard("kui-listbox", "lb1", "lb1-output")
heard("kui-toggle-group", undefined, "tg1-output")
// A picture 160 wide: a row of three is wider than its scroll area once they have loaded.
const WIDE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40'%3E%3C/svg%3E"
find("sa2-load").addEventListener("click", () => {
  for (const each of [1, 2, 3]) find<HTMLImageElement>(`sa2-picture-${each}`).src = WIDE
})
find("sa1-grow").addEventListener("click", () => {
  const box = find("sa1-box")
  box.className = box.className === "scroll-tall" ? "scroll-short" : "scroll-tall"
})

// A menu's items do what the page says, which hears them wherever they are drawn.
let action = "none"
let view = "list"
const said = () => (find("mn1-output").textContent = `${action} ${view}`)
const ACTIONS: Record<string, string> = {
  "mn1-new": "new",
  "mn1-print": "print",
  "mn1s-mail": "mail",
  "mn1s-link": "link",
}
document.addEventListener("click", (event) => {
  const pressed = (event.target as Element)
    .closest("[kui-part='popup'] [kui-part='item']")
    ?.getAttribute("data-testid")
  if (!pressed) return
  if (ACTIONS[pressed]) {
    action = ACTIONS[pressed]
    said()
  }
  if (/^(cm1|mb1[a-z]+)-/.test(pressed)) find("mb1-output").textContent = pressed
})
document.addEventListener("value-change", (event) => {
  if ((event.target as Element).getAttribute("data-testid") !== "mn1-views") return
  view = (event as CustomEvent<{ value: string }>).detail.value
  said()
})

// What a caller heard of one value: a select's, a combobox's, a number's, a place's.
const one = (tag: string, id: string, output: string, none = "none") =>
  element(tag, id).addEventListener("value-change", (event) => {
    if (event.target !== event.currentTarget) return
    find(output).textContent = String(
      (event as CustomEvent<{ value: unknown }>).detail.value ?? none
    )
  })
one("kui-select", "s1", "s1-output")
// Several values a caller holds, and labels by value given as a property.
element("kui-select", "sm1").addEventListener("values-change", (event) => {
  if (event.target !== event.currentTarget) return
  find("sm1-output").textContent =
    (event as CustomEvent<{ values: string[] }>).detail.values.join(",") || "none"
})
const SIZES = { s: "Small", m: "Medium", l: "Large" }
for (const each of ["sm2", "sm3"]) {
  element<{ items: Record<string, string> }>("kui-select", each).items = SIZES
}
one("kui-combobox", "cb1", "cb1-output")
one("kui-combobox", "pl3", "pl3-output")
// A combobox's items as data, in groups: the combobox filters them, and a collection draws them.
const PANTRY = [
  {
    value: "Fruits",
    items: [
      { value: "apple", label: "Apple" },
      { value: "apricot", label: "Apricot" },
      { value: "banana", label: "Banana", disabled: true },
    ],
  },
  {
    value: "Roots",
    items: [
      { value: "beet", label: "Beet" },
      { value: "carrot", label: "Carrot" },
    ],
  },
]
const BERRIES = [
  { value: "blackberry", label: "Blackberry" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
]
const pantry = element<{ items: typeof PANTRY }>("kui-combobox", "cd1")
pantry.items = PANTRY
// What a status says of the pantry for what was typed: how many of its items hold the text.
pantry.addEventListener("input-value-change", (event) => {
  if (event.target !== event.currentTarget) return
  const text = (event as CustomEvent<{ inputValue: string }>).detail.inputValue
  const all = PANTRY.flatMap((each) => each.items)
  find("cd1-status").textContent =
    text === ""
      ? ""
      : `${all.filter((each) => each.label.toLowerCase().includes(text.toLowerCase())).length} left`
})
const berries = element<{ items: typeof BERRIES; readOnly: boolean }>("kui-combobox", "cd2")
berries.items = BERRIES
find("cd2-unlock").addEventListener("click", () => {
  berries.readOnly = false
})
// A popover placed against another element, and against a second one while it is open: its
// button is in the popup, which is out of the page while closed, so the page hears it.
document.addEventListener("click", (event) => {
  const move = (event.target as Element).closest('[data-testid="pl2-move"]')
  const positioner = move?.closest('[kui-part="positioner"]')
  if (!positioner) return
  const now = positioner.getAttribute("kui-anchor")
  positioner.setAttribute("kui-anchor", now === "pl2-first" ? "pl2-second" : "pl2-first")
})
// What no attribute can say of a positioner: a gap as tall as the anchor, a padding a side.
element<Placed>("kui-popover", "pm3").positioning = {
  sideOffset: ({ anchor }) => anchor.height,
  collisionPadding: { left: 12, right: 12 },
  collisionAvoidance: { side: "none" },
}
one("kui-number-field", "nf1", "nf1-output", "null")
one("kui-autocomplete", "ac1", "ac1-output")

let outside = 0
find("mm1-outside").addEventListener("click", () => {
  find("mm1-output").textContent = String(++outside)
})
element("kui-otp", "otp1").addEventListener("complete", (event) => {
  find("otp1-output").textContent = (event as CustomEvent<{ value: string }>).detail.value
})
element("kui-resizable", "rs1").addEventListener("sizes-change", (event) => {
  find("rs1-output").textContent = (event as CustomEvent<{ sizes: number[] }>).detail.sizes
    .map(Math.round)
    .join(",")
})
document.querySelectorAll("kui-form")[1]!.addEventListener("form-submit", (event) => {
  find("f2-sent").textContent = JSON.stringify(
    (event as CustomEvent<{ values: unknown }>).detail.values
  )
})

element("kui-carousel", "cr1").addEventListener("index-change", (event) => {
  find("cr1-output").textContent = String((event as CustomEvent<{ index: number }>).detail.index)
})
element("kui-drawer", "dw1").addEventListener("open-change", (event) => {
  const { open, details } = (event as CustomEvent<{ open: boolean; details: { reason: string } }>)
    .detail
  find("dw1-output").textContent = open ? "open" : details.reason
})
element("kui-drawer", "dw2").addEventListener("snap-point-change", (event) => {
  find("dw2-output").textContent = String(
    (event as CustomEvent<{ snapPoint: number | string }>).detail.snapPoint
  )
})
let lines = 8
find("ms1-add").addEventListener("click", () => {
  const line = document.createElement("p")
  line.className = "chat-line"
  line.textContent = `Message ${++lines}`
  find("ms1-content").append(line)
})
document.querySelector("kui-input")!.addEventListener("value-change", (event) => {
  find("in1-output").textContent = (event as CustomEvent<{ value: string }>).detail.value
})
element("kui-command", "cm1").addEventListener("select", (event) => {
  find("cm1-output").textContent = (event as CustomEvent<{ value: string }>).detail.value
})

// Toasts are added from anywhere in the page: to the toaster the element draws.
const toaster = toasterOf(element("kui-toast", "ts1"))
find("ts1-add").addEventListener("click", () => {
  toaster.add({ title: "Saved", description: "Your changes are kept.", type: "success" })
})
find("ts1-brief").addEventListener("click", () => {
  toaster.add({ title: "Gone soon", duration: 300 })
})
find("ts1-undo").addEventListener("click", () => {
  toaster.add({
    title: "Deleted",
    action: { label: "Undo", onAction: () => void (find("ts1-output").textContent = "undone") },
  })
})
find("ts1-alert").addEventListener("click", () => {
  toaster.add({ title: "Connection lost", type: "error", priority: "assertive" })
})
one("kui-calendar", "cal1", "cal1-output")
// Two months and a range, written out whole; several days; the month its caller holds.
element("kui-calendar", "cal2").addEventListener("value-change", (event) => {
  if (event.target !== event.currentTarget) return
  find("cal2-output").textContent = JSON.stringify(
    (event as CustomEvent<{ value: unknown }>).detail.value
  )
})
one("kui-calendar", "cal3", "cal3-output")
const shownMonth = element<{ month: string }>("kui-calendar", "cal4")
shownMonth.addEventListener("month-change", (event) => {
  if (event.target !== event.currentTarget) return
  find("cal4-output").textContent = (event as CustomEvent<{ month: string }>).detail.month
})
find("cal4-jump").addEventListener("click", () => {
  shownMonth.month = "2030-12-01"
  find("cal4-output").textContent = "2030-12-01"
})
one("kui-date-field", "df1", "df1-output", "null")
one("kui-date-picker", "dk1", "dk1-output", "null")
element("kui-pagination", "pg1").addEventListener("page-change", (event) => {
  find("pg1-output").textContent = String((event as CustomEvent<{ page: number }>).detail.page)
})

// What the callers of the "editing" section heard: a rating, steps, a text, a password shown.
element("kui-rating", "rt1").addEventListener("value-change", (event) => {
  find("rt1-output").textContent = String((event as CustomEvent<{ value: number }>).detail.value)
})
element("kui-steps", "st1").addEventListener("step-change", (event) => {
  find("st1-output").textContent = String((event as CustomEvent<{ step: number }>).detail.step)
})
element("kui-editable", "ed1").addEventListener("value-change", (event) => {
  find("ed1-output").textContent = (event as CustomEvent<{ value: string }>).detail.value
})
document.querySelector("kui-password-input")!.addEventListener("visible-change", (event) => {
  find("pw1-output").textContent = String(
    (event as CustomEvent<{ visible: boolean }>).detail.visible
  )
})

// What the callers of the "tagging" section heard: tags, what was refused, files, a time.
element("kui-tags-input", "ti1").addEventListener("value-change", (event) => {
  find("ti1-output").textContent = (event as CustomEvent<{ value: string[] }>).detail.value.join(
    ","
  )
})
element("kui-tags-input", "ti1").addEventListener("value-invalid", (event) => {
  const { text, reason } = (event as CustomEvent<{ text: string; reason: string }>).detail
  find("ti1-refused").textContent = `${text}:${reason}`
})
const upload = element("kui-file-upload", "fu1")
upload.addEventListener("files-change", (event) => {
  find("fu1-output").textContent = (event as CustomEvent<{ files: File[] }>).detail.files
    .map((each) => each.name)
    .join(",")
})
upload.addEventListener("files-reject", (event) => {
  find("fu1-rejected").textContent = (
    event as CustomEvent<{ rejections: { file: File; reasons: string[] }[] }>
  ).detail.rejections
    .map((each) => `${each.file.name}:${each.reasons.join("+")}`)
    .join(",")
})
element("kui-time-field", "tm1").addEventListener("value-change", (event) => {
  find("tm1-output").textContent = String(
    (event as CustomEvent<{ value: string | null }>).detail.value
  )
})

// What the callers of the "exploring" section heard: a tree, a colour, a tour.
const tree = element("kui-tree", "tr1")
tree.addEventListener("expanded-change", (event) => {
  find("tr1-expanded").textContent = (
    event as CustomEvent<{ expandedValue: string[] }>
  ).detail.expandedValue.join(",")
})
tree.addEventListener("selected-change", (event) => {
  find("tr1-selected").textContent = (
    event as CustomEvent<{ selectedValue: string[] }>
  ).detail.selectedValue.join(",")
})
const picker = element("kui-color-picker", "pk1")
picker.addEventListener("value-change", (event) => {
  find("pk1-output").textContent = (event as CustomEvent<{ value: string }>).detail.value
})
picker.addEventListener("value-committed", (event) => {
  find("pk1-committed").textContent = (event as CustomEvent<{ value: string }>).detail.value
})
picker.addEventListener("format-change", (event) => {
  find("pk1-written").textContent = (event as CustomEvent<{ format: string }>).detail.format
})
// A tour's steps: what each says is the page's own, kept beside the step. One is about an element
// of its own section, one about another section's, and the last about none.
interface PageStep {
  id: string
  target?: string
  title: string
  body: string
}
const TOUR: PageStep[] = [
  { id: "files", target: '[data-testid="tr1"]', title: "Files", body: "Documents and music." },
  { id: "stars", target: '[data-testid="rt1"]', title: "Stars", body: "How much it was liked." },
  { id: "done", title: "All set", body: "That is the whole page." },
]
// The page holds whether the tour is open, as the other fixtures' state does.
const tour = element<{ steps: PageStep[]; open: boolean; controller: Tour<PageStep> }>(
  "kui-tour",
  "tu1"
)
tour.steps = TOUR
tour.open = false
const touring = (open: boolean) => {
  tour.open = open
  find("tu1-output").textContent = String(open)
}
find("tu1-open").addEventListener("click", () => touring(true))
tour.addEventListener("open-change", (event) => {
  touring((event as CustomEvent<{ open: boolean }>).detail.open)
})
tour.addEventListener("step-change", (event) => {
  find("tu1-step").textContent = String((event as CustomEvent<{ step: number }>).detail.step)
})
// What a step says is written by the page from the step shown. Its popup is out of the page
// while it is closed, so it is looked for each time, once it has been put back.
void customElements.whenDefined("kui-tour").then(() => {
  const { controller } = tour
  effect(() => {
    const step = controller.shown.get()
    const current = controller.current.get()
    const total = controller.total.get()
    if (!controller.mounted.get()) return
    queueMicrotask(() => {
      const written = (testid: string, text: string) => {
        const at = document.querySelector(`[data-testid="${testid}"]`)
        if (at && at.textContent !== text) at.textContent = text
      }
      written("tu1-title", step?.title ?? "")
      written("tu1-description", step?.body ?? "")
      written("tu1-count", `${current} of ${total}`)
      written("tu1-next", current === total ? "Done" : "Next")
    })
  })
})
