import {
  DestroyRef,
  ElementRef,
  Injectable,
  TemplateRef,
  ViewContainerRef,
  effect as angularEffect,
  inject,
  untracked,
} from "@angular/core"
import type { EmbeddedViewRef } from "@angular/core"
import { bind, effect, sameProps, signal } from "@kirana-ui/core"
import type { Part, ReadonlySignal, Signal } from "@kirana-ui/core"

/** Ids for parts whose caller gave none: one counter per application, so a server and its client agree. */
@Injectable({ providedIn: "root" })
export class KuiIds {
  private next = 0
  make(): string {
    return `kui-${this.next++}`
  }
}

/**
 * A core signal that follows a directive's inputs. Call it where injection works (a field
 * initialiser or the constructor); `read` first runs when the directive's inputs are set.
 */
export function inputsSignal<T extends Record<string, unknown>>(read: () => T): () => Signal<T> {
  let source: Signal<T> | undefined
  angularEffect(() => {
    const next = read()
    untracked(() => source?.set(next))
  })
  // Made on first use, in `ngOnInit`: a default is read once, with the inputs in.
  return () => (source ??= signal(untracked(read), sameProps as (a: T, b: T) => boolean))
}

/**
 * Puts a part on the directive's host element: the core writes its attributes and listens for its
 * events itself, so nothing waits for change detection. Returns a function to call in `ngOnInit`,
 * when the part's controller exists.
 */
export function hostPart(): (part: Part) => void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const destroy = inject(DestroyRef)
  return (part) => destroy.onDestroy(bind(element, part))
}

/** Runs a controller's own effects for the directive's life. */
export function mounted(): (controller: { mount(): () => void }) => void {
  const destroy = inject(DestroyRef)
  return (controller) => destroy.onDestroy(controller.mount())
}

/**
 * For a structural directive (`*kuiCollapsiblePanel`): its template is in the page only while
 * `show` holds, so a closed panel is really gone, its content with it. `part` goes on the
 * template's element. With `portal`, the template is drawn in a container at the end of the page.
 * Returns a function to call in `ngOnInit`.
 */
export function presentWhile(options: { portal?: boolean } = {}) {
  const template = inject(TemplateRef)
  const container = inject(ViewContainerRef)
  const destroy = inject(DestroyRef)
  return (show: ReadonlySignal<boolean> | (() => boolean), part?: Part) => {
    let view: EmbeddedViewRef<unknown> | undefined
    let outlet: HTMLElement | undefined
    let unbind: (() => void) | undefined

    const remove = () => {
      unbind?.()
      unbind = undefined
      view?.destroy()
      view = undefined
      outlet?.remove()
      outlet = undefined
    }

    const stop = effect(() => {
      const wanted = typeof show === "function" ? show() : show.get()
      if (wanted === (view !== undefined)) return
      if (!wanted) return remove()
      untracked(() => {
        view = container.createEmbeddedView(template)
        const nodes = view.rootNodes as Node[]
        if (options.portal) {
          const document = (nodes[0] as Node).ownerDocument!
          outlet = document.createElement("div")
          outlet.setAttribute("data-kirana-portal", "")
          outlet.append(...nodes)
          document.body.appendChild(outlet)
        }
        // The content first, then the part: a panel is measured with its content in it.
        view.detectChanges()
        const element = nodes.find((each): each is HTMLElement => each.nodeType === 1)
        if (part && element) unbind = bind(element, part)
      })
    })
    destroy.onDestroy(() => {
      stop()
      remove()
    })
  }
}
