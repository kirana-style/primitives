import {
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel } from "@kirana-ui/core/carousel"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted } from "./runtime"

@Directive({ selector: "[kpCarousel]", exportAs: "kpCarousel" })
export class KpCarousel implements OnInit {
  /** Which slide is at the start of the view: `[(index)]`. */
  readonly index = model<number | undefined>(undefined)
  readonly defaultIndex = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly orientation = input<Orientation>()
  readonly loop = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  readonly indexChanged = output<{ index: number; details: ChangeDetails }>()

  controller!: Carousel
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    index: this.index(),
    defaultIndex: this.defaultIndex(),
    orientation: this.orientation(),
    loop: this.loop(),
    onIndexChange: (index: number, details: ChangeDetails) => {
      this.indexChanged.emit({ index, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.index() !== undefined) {
        this.index.set(index)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createCarousel(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "viewport" | "previous" | "next") {
  const root = inject(KpCarousel)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpCarouselViewport]" })
export class KpCarouselViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpCarouselPrevious]" })
export class KpCarouselPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpCarouselNext]" })
export class KpCarouselNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpCarouselItem]" })
export class KpCarouselItem implements OnInit {
  /**
   * Its place among the slides, from 0. Left out, its place in the page, once it is there:
   * give it on a page a server draws, which cannot count them.
   */
  readonly index = input<number | undefined, unknown>(undefined, {
    transform: (given: unknown) => (given == null ? undefined : numberAttribute(given)),
  })
  private readonly root = inject(KpCarousel)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.item(this.index()))
  }
}

@Directive({ selector: "[kpCarouselIndicator]" })
export class KpCarouselIndicator implements OnInit {
  readonly index = input.required<number, unknown>({ transform: numberAttribute })
  private readonly root = inject(KpCarousel)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.indicator(this.index()))
  }
}
