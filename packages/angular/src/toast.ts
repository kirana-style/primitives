import {
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  inject,
  input,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createToast, createToaster as createCoreToaster } from "@kirana-ui/core/toast"
import type * as Core from "@kirana-ui/core/toast"

import { KuiIds, drawing, hostPart, inputsSignal, mounted, onServer } from "./runtime"

/**
 * What a toast's title, description and action's label may be here: a string, or a template
 * that draws it (`<ng-template #saved>`, read with `viewChild`).
 */
export type ToastContent = string | TemplateRef<unknown>
export type ToastActionOptions<Content = ToastContent> = Core.ToastActionOptions<Content>
export type ToastOptions<Content = ToastContent> = Core.ToastOptions<Content>
export type ToastRecord<Content = ToastContent> = Core.ToastRecord<Content>
export type ToastState<Content = ToastContent> = Core.ToastState<Content>
export type Toaster<Content = ToastContent> = Core.Toaster<Content>
export type { ToasterOptions } from "@kirana-ui/core/toast"

/**
 * The toasts of a page, made once, in a module: `toaster.add({ title })` from anywhere. A
 * title, a description and an action's label are a string or a template, unless `Content`
 * says otherwise.
 */
export const createToaster: <Content = ToastContent>(
  options?: Core.ToasterOptions
) => Toaster<Content> = createCoreToaster

type Toast = Core.Toast<ToastContent>
type ToastParts = Core.ToastParts<ToastContent>
type ToastProps = Core.ToastProps<ToastContent>

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
@Directive({ selector: "[kuiToastViewport]", exportAs: "kuiToastViewport" })
export class KuiToastViewport implements OnInit {
  /** The page's toaster: one is made with `createToaster()`, once, in a module. */
  readonly toaster = input.required<Toaster>()
  /** What the region of toasts is called, for assistive technology. */
  readonly label = input<string>()
  readonly hotkey = input<string>()
  readonly swipeDirection = input<ToastProps["swipeDirection"]>()
  readonly kuiId = input<string>()

  controller!: Toast
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    toaster: this.toaster(),
    label: this.label(),
    hotkey: this.hotkey(),
    swipeDirection: this.swipeDirection(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createToast(this.props())
    this.put(this.controller.viewport)
    this.mount(this.controller)
  }
}

interface ListContext {
  $implicit: ToastRecord
}

/** `<div *kuiToastList="let toast">`: its template once for each toast, the newest first. */
@Directive({ selector: "[kuiToastList]" })
export class KuiToastList implements OnInit {
  private readonly owner = inject(KuiToastViewport)
  private readonly template = inject<TemplateRef<ListContext>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<string, EmbeddedViewRef<ListContext>>()

  ngOnInit(): void {
    if (this.server) return
    this.destroy.onDestroy(
      effect(() => {
        const toasts = this.owner.controller.toasts.get()
        for (const [id, view] of this.views) {
          if (toasts.some((each) => each.id === id)) continue
          view.destroy()
          this.views.delete(id)
        }
        drawing(() =>
          toasts.forEach((toast, at) => {
            let view = this.views.get(toast.id)
            if (!view) {
              view = this.container.createEmbeddedView(this.template, { $implicit: toast }, at)
              this.views.set(toast.id, view)
            } else {
              view.context.$implicit = toast
              if (this.container.indexOf(view) !== at) this.container.move(view, at)
              view.markForCheck()
            }
            view.detectChanges()
          })
        )
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KuiToastList,
    _context: unknown
  ): _context is { $implicit: ToastRecord } {
    return true
  }
}

/** One toast, on the element `*kuiToastList` draws for it. */
@Directive({ selector: "[kuiToastRoot]" })
export class KuiToastRoot implements OnInit {
  /** The toast it draws: the one `*kuiToastList` gave its template (`let toast`). */
  readonly toast = input.required<ToastRecord>()
  parts!: ToastParts
  private readonly owner = inject(KuiToastViewport)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.parts = this.owner.controller.toast(this.toast().id)
    this.put(this.parts.root)
  }
}

function part(name: "content" | "close") {
  const root = inject(KuiToastRoot)
  const put = hostPart()
  return () => put(root.parts[name])
}

/** What holds a toast's contents, when the design sizes the toast itself. */
@Directive({ selector: "[kuiToastContent]" })
export class KuiToastContent implements OnInit {
  private readonly init = part("content")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * A part that says something of the toast's, when its element was written with nothing in it:
 * the text, or the template drawn inside the element. What the caller wrote there stays the
 * caller's. The element is the caller's too: a template leaves it out (`@if (toast.action)`)
 * for a toast that has nothing to say there.
 */
function said(name: "title" | "description" | "action") {
  const root = inject(KuiToastRoot)
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const container = inject(ViewContainerRef)
  const destroy = inject(DestroyRef)
  const put = hostPart()
  return () => {
    put(root.parts[name])
    if (element.childNodes.length > 0) return
    let view: EmbeddedViewRef<unknown> | undefined
    let drawn: ToastContent | undefined
    const clear = () => {
      view?.destroy()
      view = undefined
    }
    destroy.onDestroy(clear)
    destroy.onDestroy(
      effect(() => {
        const toast = root.parts.record.get()
        const given = name === "action" ? toast?.action?.label : toast?.[name]
        // The toast changed, and not what is said here: what is drawn stays as it is.
        if (given === drawn) return
        drawn = given
        clear()
        if (!(given instanceof TemplateRef)) return void (element.textContent = given ?? "")
        element.textContent = ""
        const made = container.createEmbeddedView(given)
        view = made
        drawing(() => made.detectChanges())
        // A view is drawn beside its container's element: what it drew goes inside it.
        element.append(...(made.rootNodes as Node[]))
      })
    )
  }
}

/** The toast's title, unless something is written in its element. */
@Directive({ selector: "[kuiToastTitle]" })
export class KuiToastTitle implements OnInit {
  private readonly init = said("title")

  ngOnInit(): void {
    this.init()
  }
}

/** The toast's description, unless something is written in its element. */
@Directive({ selector: "[kuiToastDescription]" })
export class KuiToastDescription implements OnInit {
  private readonly init = said("description")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiToastClose]" })
export class KuiToastClose implements OnInit {
  private readonly init = part("close")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * The toast's action, its label unless something is written in its element. A press tells the
 * action (`onAction`), then closes the toast unless the action called `details.cancel()`.
 */
@Directive({ selector: "[kuiToastAction]" })
export class KuiToastAction implements OnInit {
  private readonly init = said("action")

  ngOnInit(): void {
    this.init()
  }
}
