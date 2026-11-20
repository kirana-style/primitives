import { Directive, inject, input, numberAttribute, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller } from "@kirana-ui/core/message-scroller"

import { KpIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kpMessageScroller]", exportAs: "kpMessageScroller" })
export class KpMessageScroller implements OnInit {
  /** Where it begins: at the newest message (the default), or at the first. */
  readonly initial = input<"bottom" | "top">()
  readonly threshold = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly kpId = input<string>()
  /** It came to the end, or left it. */
  readonly atBottomChanged = output<{ atBottom: boolean; details: ChangeDetails }>()

  controller!: MessageScroller
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    initial: this.initial(),
    threshold: this.threshold(),
    onAtBottomChange: (atBottom: boolean, details: ChangeDetails) =>
      this.atBottomChanged.emit({ atBottom, details }),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createMessageScroller(this.props())
    this.put(this.controller.root)
  }
}

function part(name: "viewport" | "content" | "button") {
  const root = inject(KpMessageScroller)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpMessageScrollerViewport]" })
export class KpMessageScrollerViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMessageScrollerContent]" })
export class KpMessageScrollerContent implements OnInit {
  private readonly init = part("content")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMessageScrollerButton]" })
export class KpMessageScrollerButton implements OnInit {
  private readonly init = part("button")

  ngOnInit(): void {
    this.init()
  }
}
