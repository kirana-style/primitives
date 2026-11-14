import {
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createCarousel } from "@kirana-ui/core/carousel"
import type { Carousel } from "@kirana-ui/core/carousel"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, mounted } from "./runtime"

@Directive({ selector: "[kuiCarousel]", exportAs: "kuiCarousel" })
export class KuiCarousel implements OnInit {
  /** Which slide is at the start of the view: `[(index)]`. */
  readonly index = model<number | undefined>(undefined)
  readonly defaultIndex = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly orientation = input<Orientation>()
  readonly loop = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly indexChanged = output<{ index: number; details: ChangeDetails }>()

  controller!: Carousel
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
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

  ngOnInit(): void {
    this.controller = createCarousel(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "viewport" | "previous" | "next") {
  const root = inject(KuiCarousel)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiCarouselViewport]" })
export class KuiCarouselViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCarouselPrevious]" })
export class KuiCarouselPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCarouselNext]" })
export class KuiCarouselNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCarouselItem]" })
export class KuiCarouselItem implements OnInit {
  readonly index = input.required<number, unknown>({ transform: numberAttribute })
  private readonly root = inject(KuiCarousel)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.item(this.index()))
  }
}

@Directive({ selector: "[kuiCarouselIndicator]" })
export class KuiCarouselIndicator implements OnInit {
  readonly index = input.required<number, unknown>({ transform: numberAttribute })
  private readonly root = inject(KuiCarousel)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.indicator(this.index()))
  }
}
