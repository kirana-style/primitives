import { DestroyRef, Directive, TemplateRef, ViewContainerRef, inject, input } from "@angular/core"
import type { EmbeddedViewRef, OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createToast } from "@kirana-ui/core/toast"
import type { Toast, ToastParts, ToastProps, ToastRecord, Toaster } from "@kirana-ui/core/toast"

import { KuiIds, hostPart, inputsSignal, mounted, onServer } from "./runtime"

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
@Directive({ selector: "[kuiToastViewport]", exportAs: "kuiToastViewport" })
export class KuiToastViewport implements OnInit {
  /** The page's toaster. It is needed: one is made with `createToaster()`. */
  readonly toaster = input<Toaster>()
  /** What the region of toasts is called, for assistive technology. */
  readonly label = input<string>()
  readonly hotkey = input<string>()
  readonly swipeDirection = input<ToastProps["swipeDirection"]>()
  readonly kuiId = input<string>()

  controller!: Toast
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    toaster: this.toaster() as Toaster,
    label: this.label(),
    hotkey: this.hotkey(),
    swipeDirection: this.swipeDirection(),
  }))

  ngOnInit(): void {
    if (!this.toaster()) throw new Error("kuiToastViewport needs a [toaster]")
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
      })
    )
  }
}

@Directive({ selector: "[kuiToastRoot]" })
export class KuiToastRoot implements OnInit {
  readonly toast = input.required<ToastRecord>()
  parts!: ToastParts
  private readonly owner = inject(KuiToastViewport)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.parts = this.owner.controller.toast(this.toast().id)
    this.put(this.parts.root)
  }
}

function part(name: "title" | "description" | "close" | "action") {
  const root = inject(KuiToastRoot)
  const put = hostPart()
  return () => put(root.parts[name])
}

@Directive({ selector: "[kuiToastTitle]" })
export class KuiToastTitle implements OnInit {
  private readonly init = part("title")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiToastDescription]" })
export class KuiToastDescription implements OnInit {
  private readonly init = part("description")

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

@Directive({ selector: "[kuiToastAction]" })
export class KuiToastAction implements OnInit {
  private readonly init = part("action")

  ngOnInit(): void {
    this.init()
  }
}

export { createToaster } from "@kirana-ui/core/toast"
