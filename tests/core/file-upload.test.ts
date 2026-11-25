import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { bind } from "../../packages/core/src/bind.ts"
import { accepts, createFileUpload, formatBytes } from "../../packages/core/src/file-upload.ts"
import type { FileRejection, FileUploadProps } from "../../packages/core/src/file-upload.ts"
import { signal } from "../../packages/core/src/reactivity.ts"
import { recorder } from "../../packages/core/src/testing.ts"
import { mount } from "./page.ts"

const file = (name: string, size = 4, type = "text/plain") =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1 })

/** A paste carrying `data`. An engine may not let a made event read what it was made with. */
function pasting(data: DataTransfer): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true })
  Object.defineProperty(event, "clipboardData", { value: data })
  return event
}

function carrying(...files: File[]) {
  const data = new DataTransfer()
  for (const each of files) data.items.add(each)
  return data
}

function upload(given: Partial<FileUploadProps> = {}) {
  const root = mount(`
    <form><div class="root"><div class="zone"><button class="pick">Browse</button><input class="input" /></div>
      <ul class="list"></ul><button class="clear">Clear</button>
    </div><button type="reset">Reset</button></form>`)
  const changed = recorder<File[]>()
  const rejected: FileRejection[] = []
  const made = createFileUpload(
    signal<FileUploadProps>({
      id: "fu",
      name: "docs",
      onFilesChange: changed.listen,
      onFilesReject: (list) => void rejected.push(...list),
      ...given,
    })
  )
  const find = <T extends HTMLElement = HTMLElement>(name: string) => root.querySelector<T>(name)!
  onTestFinished(bind(find(".root"), made.root))
  onTestFinished(bind(find(".zone"), made.dropzone))
  onTestFinished(bind(find(".pick"), made.trigger))
  onTestFinished(bind(find(".input"), made.input))
  onTestFinished(bind(find(".list"), made.list))
  onTestFinished(bind(find(".clear"), made.clear))
  const drop = (...files: File[]) => {
    const zone = find(".zone")
    const data = carrying(...files)
    zone.dispatchEvent(
      new DragEvent("dragenter", { dataTransfer: data, bubbles: true, cancelable: true })
    )
    const entered = made.dragging.peek()
    zone.dispatchEvent(
      new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true })
    )
    return entered
  }
  const held = () => made.files.peek().map((each) => each.name)
  const sent = () =>
    new FormData(root.querySelector("form")!).getAll("docs").map((each) => (each as File).name)
  return { root, made, find, drop, held, sent, changed, rejected }
}

describe("a file upload", () => {
  it("holds a native file input, hidden, which its dropzone and its button open", () => {
    const { find } = upload({ accept: ["image/*", ".pdf"], multiple: true })
    const input = find<HTMLInputElement>(".input")
    expect(input.type).toBe("file")
    expect(input.hidden).toBe(true)
    expect(input.accept).toBe("image/*,.pdf")
    expect(input.multiple).toBe(true)
    expect(find(".zone").getAttribute("role")).toBe("button")
    expect(find(".zone").getAttribute("tabindex")).toBe("0")
    let opened = 0
    input.addEventListener("click", (event) => {
      opened++
      event.preventDefault()
    })
    find(".zone").click()
    find<HTMLButtonElement>(".pick").click()
    find(".zone").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    // The button is inside the dropzone: its press opens the picker once, not twice.
    expect(opened).toBe(3)
  })

  it("takes dropped files, says while they are dragged over, and a form submits them", () => {
    const { drop, held, sent, made, changed } = upload({ multiple: true })
    expect(drop(file("a.txt"), file("b.txt"))).toBe(true)
    expect(made.dragging.peek()).toBe(false)
    expect(held()).toEqual(["a.txt", "b.txt"])
    expect(sent()).toEqual(["a.txt", "b.txt"])
    expect(changed.calls.at(-1)!.reason).toBe("drop")
    // The same file again is held once.
    drop(file("a.txt"))
    expect(held()).toEqual(["a.txt", "b.txt"])
  })

  it("holds one file unless told several: a file taken is the one held", () => {
    const { drop, held, rejected } = upload()
    drop(file("a.txt"))
    drop(file("b.txt"), file("c.txt"))
    expect(held()).toEqual(["b.txt"])
    expect(rejected.map((each) => [each.file.name, each.reasons])).toEqual([
      ["c.txt", ["too-many"]],
    ])
  })

  it("refuses what it may not take, with every reason, and keeps the rest", () => {
    const { drop, held, rejected } = upload({
      multiple: true,
      accept: ".txt",
      maxSize: 10,
      minSize: 2,
      maxFiles: 2,
      validate: (each) => each.name !== "no.txt",
    })
    drop(
      file("a.txt"),
      file("big.png", 20, "image/png"),
      file("tiny.txt", 1),
      file("no.txt"),
      file("b.txt"),
      file("c.txt")
    )
    expect(held()).toEqual(["a.txt", "b.txt"])
    expect(rejected.map((each) => [each.file.name, each.reasons])).toEqual([
      ["big.png", ["type", "too-large"]],
      ["tiny.txt", ["too-small"]],
      ["no.txt", ["invalid"]],
      ["c.txt", ["too-many"]],
    ])
  })

  it("takes what the picker chose and what is pasted", () => {
    const { find, held, changed } = upload({ multiple: true })
    const input = find<HTMLInputElement>(".input")
    input.files = carrying(file("picked.txt")).files
    input.dispatchEvent(new Event("change", { bubbles: true }))
    expect(changed.calls.at(-1)!.reason).toBe("pick")
    const paste = pasting(carrying(file("pasted.txt")))
    find(".zone").dispatchEvent(paste)
    expect(paste.defaultPrevented).toBe(true)
    expect(held()).toEqual(["picked.txt", "pasted.txt"])
  })

  it("leaves a drag of text alone", () => {
    const { find, made } = upload()
    const data = new DataTransfer()
    data.setData("text/plain", "hello")
    const over = new DragEvent("dragover", { dataTransfer: data, bubbles: true, cancelable: true })
    find(".zone").dispatchEvent(new DragEvent("dragenter", { dataTransfer: data, bubbles: true }))
    find(".zone").dispatchEvent(over)
    expect(made.dragging.peek()).toBe(false)
    expect(over.defaultPrevented).toBe(false)
  })

  it("takes files away one by one and all at once, may be refused, and resets with its form", () => {
    const { drop, made, find, held, sent, root } = upload({ multiple: true })
    drop(file("a.txt"), file("b.txt"), file("c.txt"))
    const [first] = made.entries.peek()
    const remove = document.createElement("button")
    find(".list").append(remove)
    onTestFinished(bind(remove, made.itemRemove(first!.key)))
    expect(remove.getAttribute("aria-label")).toBe("Remove a.txt")
    remove.click()
    expect(held()).toEqual(["b.txt", "c.txt"])
    expect(sent()).toEqual(["b.txt", "c.txt"])
    find<HTMLButtonElement>(".clear").click()
    expect(held()).toEqual([])
    expect(find(".clear").hidden).toBe(true)
    drop(file("d.txt"))
    root.querySelector<HTMLButtonElement>("[type=reset]")!.click()
    expect(held()).toEqual([])
    const refused = upload({ onFilesChange: (_files, by) => by.cancel() })
    refused.drop(file("a.txt"))
    expect(refused.held()).toEqual([])
    const off = upload({ disabled: true })
    off.drop(file("a.txt"))
    expect(off.held()).toEqual([])
    expect(off.find(".zone").getAttribute("tabindex")).toBe("-1")
  })

  it("reads what a file input's accept says, and a size as people do", () => {
    expect(accepts(file("a.PNG", 1, "image/png"), ".png")).toBe(true)
    expect(accepts(file("a.png", 1, "image/png"), "image/*, .pdf")).toBe(true)
    expect(accepts(file("a.txt"), ["image/*", "text/plain"])).toBe(true)
    expect(accepts(file("a.txt"), "image/*")).toBe(false)
    expect(accepts(file("a.txt"), undefined)).toBe(true)
    expect(formatBytes(512, "en")).toBe("512 B")
    expect(formatBytes(1536, "en")).toBe("1.5 KB")
    expect(formatBytes(20 * 1024 * 1024, "en")).toBe("20 MB")
  })
})
