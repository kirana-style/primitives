import { Directive, ElementRef, inject } from "@angular/core"
import type { DoCheck, OnInit } from "@angular/core"
import { signal } from "@kirana-ui/core"
import { createAutosize } from "@kirana-ui/core/autosize"
import type { Autosize } from "@kirana-ui/core/autosize"

import { hostPart } from "./runtime"

/** `<textarea kuiAutosizeTextarea>`: as tall as its text. */
@Directive({ selector: "textarea[kuiAutosizeTextarea]", exportAs: "kuiAutosizeTextarea" })
export class KuiAutosizeTextarea implements OnInit, DoCheck {
  controller!: Autosize
  private readonly element = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement
  private readonly put = hostPart()
  // The text as last seen: a form that writes it (`ngModel`) makes no event to hear.
  private readonly text = signal<{ value?: unknown }>({})

  ngOnInit(): void {
    this.controller = createAutosize(this.text)
    this.put(this.controller.textarea)
  }

  ngDoCheck(): void {
    const value = this.element.value
    if (this.text.peek().value !== value) this.text.set({ value })
  }
}
