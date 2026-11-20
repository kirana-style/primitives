import {
  DestroyRef,
  Directive,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createPagination } from "@kirana-ui/core/pagination"
import type { Pagination, PaginationEntry } from "@kirana-ui/core/pagination"

import { KpIds, drawing, hostPart, inputsSignal, mounted, onServer } from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/** On a `<nav>`. `[(page)]` is the page shown, from 1. */
@Directive({ selector: "[kpPagination]", exportAs: "kpPagination" })
export class KpPagination implements OnInit {
  readonly page = model<number | undefined>(undefined)
  readonly defaultPage = input(undefined, { transform: optionalNumber })
  /** How many items there are in all. */
  readonly count = input.required({ transform: numberAttribute })
  readonly pageSize = input(undefined, { transform: optionalNumber })
  readonly siblingCount = input(undefined, { transform: optionalNumber })
  readonly boundaryCount = input(undefined, { transform: optionalNumber })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  readonly pageChanged = output<{ page: number; details: ChangeDetails }>()

  controller!: Pagination
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    page: this.page(),
    defaultPage: this.defaultPage(),
    count: this.count(),
    pageSize: this.pageSize(),
    siblingCount: this.siblingCount(),
    boundaryCount: this.boundaryCount(),
    disabled: this.disabled(),
    onPageChange: (page: number, details: ChangeDetails) => {
      this.pageChanged.emit({ page, details })
      if (!details.canceled) {
        this.page.set(page)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createPagination(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

type Drawn = EmbeddedViewRef<{ $implicit: PaginationEntry }>

/**
 * `<ng-container *kpPaginationItems="let entry">`: once for each piece of the row, a page or
 * the mark for pages left out.
 */
@Directive({ selector: "[kpPaginationItems]" })
export class KpPaginationItems implements OnInit {
  private readonly root = inject(KpPagination)
  private readonly template = inject<TemplateRef<{ $implicit: PaginationEntry }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<string, Drawn>()

  ngOnInit(): void {
    const draw = (entries: readonly PaginationEntry[]) => {
      // By key: a page that stays in the row keeps its element, and focus with it.
      const wanted = new Set(entries.map((each) => each.key))
      for (const [key, view] of this.views) {
        if (wanted.has(key)) continue
        view.destroy()
        this.views.delete(key)
      }
      // What stays is already in order (pages only ever ascend), so nothing is moved: an
      // element taken out and put back loses focus. What is new goes in at its place.
      entries.forEach((entry, at) => {
        let view = this.views.get(entry.key)
        if (!view) {
          view = this.container.createEmbeddedView(this.template, { $implicit: entry }, at)
          this.views.set(entry.key, view)
        }
        view.detectChanges()
      })
    }
    if (this.server) return draw(this.root.controller.entries.peek())
    this.destroy.onDestroy(
      effect(() => {
        const entries = this.root.controller.entries.get()
        drawing(() => draw(entries))
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpPaginationItems,
    _context: unknown
  ): _context is { $implicit: PaginationEntry } {
    return true
  }
}

@Directive({ selector: "[kpPaginationItem]" })
export class KpPaginationItem implements OnInit {
  readonly page = input.required({ transform: numberAttribute })
  private readonly root = inject(KpPagination)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.item(this.page()))
  }
}

function part(name: "ellipsis" | "previous" | "next") {
  const root = inject(KpPagination)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** The mark for pages left out of the row. */
@Directive({ selector: "[kpPaginationEllipsis]" })
export class KpPaginationEllipsis implements OnInit {
  private readonly init = part("ellipsis")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpPaginationPrevious]" })
export class KpPaginationPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpPaginationNext]" })
export class KpPaginationNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}
