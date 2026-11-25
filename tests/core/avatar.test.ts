import { describe, expect, it, onTestFinished } from "vite-plus/test"

import { createAvatar } from "../../packages/core/src/avatar.ts"
import type { ImageStatus } from "../../packages/core/src/avatar.ts"
import { bind } from "../../packages/core/src/bind.ts"
import { effect, signal } from "../../packages/core/src/reactivity.ts"
import type { Signal } from "../../packages/core/src/reactivity.ts"
import { find, mount, style } from "./page.ts"

// A picture of one pixel, and an address that is not a picture.
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
const BROKEN = "data:image/png;base64,AAAA"

function avatar() {
  const made = createAvatar(signal({}))
  const stop = made.mount()
  onTestFinished(stop)
  return made
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("an avatar", () => {
  it("says on its root where the picture is in its loading", async () => {
    const made = avatar()
    const root = mount(`<span id="root"></span>`)
    onTestFinished(bind(find(root, "root"), made.root))
    const status = () => find(root, "root").getAttribute("data-image-loading-status")
    expect(status()).toBe("idle")
    made.source.set(PIXEL)
    await expect.poll(status).toBe("loaded")
    made.source.set(BROKEN)
    await expect.poll(status).toBe("error")
    made.source.set(undefined)
    expect(status()).toBe("idle")
  })

  it("tells each new status to the image's callback, as Base UI's onLoadingStatusChange", async () => {
    const made = avatar()
    const heard: ImageStatus[] = []
    const report = made.statusReport(() => (status) => heard.push(status))
    onTestFinished(report.mount())
    // Mounted with nothing to load: nothing to tell.
    expect(heard).toEqual([])
    made.source.set(PIXEL)
    await expect.poll(() => heard.at(-1)).toBe("loaded")
    // A picture the browser holds already is complete at once, and `loading` is passed over.
    expect(["loading,loaded", "loaded"]).toContain(heard.join())
    heard.length = 0
    made.source.set(BROKEN)
    await expect.poll(() => heard.at(-1)).toBe("error")
    expect(["loading,error", "error"]).toContain(heard.join())
    heard.length = 0
    made.source.set(undefined)
    expect(heard).toEqual(["idle"])
  })

  it("shows its fallback only after its delay", async () => {
    const made = avatar()
    // A picture that cannot load: the fallback is wanted, and still waits its delay.
    made.source.set(BROKEN)
    const fallback = made.fallbackPresence({ delay: 120 })
    // What a server draws, and the first render in a browser: nothing while there is a wait.
    expect(fallback.shown.peek()).toBe(false)
    onTestFinished(fallback.mount())
    await wait(40)
    expect(fallback.shown.peek()).toBe(false)
    await expect.poll(() => fallback.shown.peek(), { timeout: 1000 }).toBe(true)
  })

  it("never shows a fallback whose picture loads before its delay", async () => {
    const made = avatar()
    const fallback = made.fallbackPresence({ delay: 300 })
    const seen: boolean[] = []
    onTestFinished(effect(() => void seen.push(fallback.shown.get())))
    onTestFinished(fallback.mount())
    made.source.set(PIXEL)
    await expect.poll(() => made.status.peek()).toBe("loaded")
    await wait(400)
    expect(seen.includes(true)).toBe(false)
  })

  it("shows a fallback with no delay from the first render, a server's too", () => {
    const made = createAvatar(signal({}))
    expect(made.fallbackPresence().shown.peek()).toBe(true)
    expect(made.fallbackPresence({ delay: 0 }).shown.peek()).toBe(true)
    expect(made.fallbackPresence({ delay: 200 }).shown.peek()).toBe(false)
  })

  it("follows an image kept in the page, which loads the picture itself", async () => {
    const made = avatar()
    const root = mount(`<span id="root"></span><img id="picture" alt="">`)
    const picture = find<HTMLImageElement>(root, "picture")
    onTestFinished(bind(find(root, "root"), made.root))
    onTestFinished(bind(picture, made.keptImage))
    const status = () => find(root, "root").getAttribute("data-image-loading-status")
    // No address yet: nothing to say of a picture, and nothing for a reader to hear.
    expect(status()).toBe("idle")
    expect(picture.getAttribute("aria-hidden")).toBe("true")
    // Its own address, written on it as a page or a framework writes it.
    picture.setAttribute("src", PIXEL)
    await expect.poll(status).toBe("loaded")
    expect(made.source.peek()).toBe(PIXEL)
    expect(picture.hasAttribute("aria-hidden")).toBe(false)
    expect(picture.hasAttribute("data-loading")).toBe(false)
    picture.setAttribute("src", BROKEN)
    await expect.poll(status).toBe("error")
    expect(picture.hasAttribute("data-error")).toBe(true)
    expect(picture.getAttribute("aria-hidden")).toBe("true")
  })

  it("draws its image with a starting style, and keeps it through its exit, as Base UI's", async () => {
    const made = avatar()
    style(`#picture { transition: opacity 80ms } #picture[data-ending-style] { opacity: 0 }`)
    const root = mount(`<span id="root"></span>`)
    // Drawn as an adapter draws it: in the page while the avatar says so.
    const frames: string[] = []
    let undo: (() => void) | undefined
    onTestFinished(
      effect(() => {
        if (made.imageMounted.get() && !undo) {
          const props = made.image.props.peek()
          frames.push(props["data-starting-style"] === "" ? "starting" : "at once")
          const picture = document.createElement("img")
          picture.id = "picture"
          find(root, "root").append(picture)
          const unbind = bind(picture, made.image)
          undo = () => {
            unbind()
            picture.remove()
          }
        } else if (!made.imageMounted.get() && undo) {
          undo()
          undo = undefined
        }
      })
    )
    onTestFinished(() => undo?.())
    made.source.set(PIXEL)
    await expect.poll(() => made.imageMounted.peek()).toBe(true)
    expect(frames).toEqual(["starting"])
    await expect.poll(() => find(root, "picture").hasAttribute("data-starting-style")).toBe(false)
    // No longer loaded: it stays for its exit, and leaves once that has run.
    made.source.set(BROKEN)
    await expect.poll(() => made.status.peek()).toBe("error")
    expect(find(root, "picture").hasAttribute("data-ending-style")).toBe(true)
    expect(made.imageMounted.peek()).toBe(true)
    await expect.poll(() => made.imageMounted.peek()).toBe(false)
    expect(root.querySelector("#picture")).toBe(null)
  })

  it("gives an image kept in the page a starting style once a picture it waited for arrives", async () => {
    const made = avatar()
    const root = mount(`<img id="picture" alt="">`)
    const picture = find<HTMLImageElement>(root, "picture")
    const starting: boolean[] = []
    onTestFinished(
      effect(() => void starting.push(made.keptImage.props.get()["data-starting-style"] === ""))
    )
    onTestFinished(bind(picture, made.keptImage))
    picture.setAttribute("src", PIXEL)
    await expect.poll(() => made.status.peek()).toBe("loaded")
    // One it waited for: loading, then its own `load`.
    ;(made.status as Signal<ImageStatus>).set("loading")
    picture.dispatchEvent(new Event("load"))
    expect(made.status.peek()).toBe("loaded")
    expect(picture.hasAttribute("data-starting-style")).toBe(true)
    await expect.poll(() => picture.hasAttribute("data-starting-style")).toBe(false)
    expect(starting.includes(true)).toBe(true)
    // It never leaves, so it has no exit.
    picture.setAttribute("src", BROKEN)
    await expect.poll(() => made.status.peek()).toBe("error")
    expect(picture.hasAttribute("data-ending-style")).toBe(false)
  })

  it("reads an image kept in the page that has loaded before it was followed", async () => {
    const root = mount(`<img id="picture" alt="" src="${PIXEL}">`)
    const picture = find<HTMLImageElement>(root, "picture")
    await expect.poll(() => picture.complete && picture.naturalWidth > 0).toBe(true)
    const made = avatar()
    onTestFinished(bind(picture, made.keptImage))
    expect(made.status.peek()).toBe("loaded")
    // Painted before it was followed: no entrance to play again.
    expect(picture.hasAttribute("data-starting-style")).toBe(false)
  })
})
