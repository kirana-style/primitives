import { Directive, inject, input, numberAttribute, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createMessageScroller } from "@kirana-ui/core/message-scroller"
import type { MessageScroller } from "@kirana-ui/core/message-scroller"

import { KuiIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiMessageScroller]", exportAs: "kuiMessageScroller" })
export class KuiMessageScroller implements OnInit {
  /** Where it begins: at the newest message (the default), or at the first. */
  readonly initial = input<"bottom" | "top">()
  readonly threshold = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly kuiId = input<string>()
  /** It came to the end, or left it. */
  readonly atBottomChanged = output<{ atBottom: boolean; details: ChangeDetails }>()

  controller!: MessageScroller
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    initial: this.initial(),
    threshold: this.threshold(),
    onAtBottomChange: (atBottom: boolean, details: ChangeDetails) =>
      this.atBottomChanged.emit({ atBottom, details }),
  }))

  ngOnInit(): void {
    this.controller = createMessageScroller(this.props())
    this.put(this.controller.root)
  }
}

function part(name: "viewport" | "content" | "button") {
  const root = inject(KuiMessageScroller)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiMessageScrollerViewport]" })
export class KuiMessageScrollerViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMessageScrollerContent]" })
export class KuiMessageScrollerContent implements OnInit {
  private readonly init = part("content")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMessageScrollerButton]" })
export class KuiMessageScrollerButton implements OnInit {
  private readonly init = part("button")

  ngOnInit(): void {
    this.init()
  }
}
