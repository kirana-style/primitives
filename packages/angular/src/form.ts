import { Directive, ElementRef, inject, input, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createForm } from "@kirana-ui/core/form"
import type { Form, FormErrors, FormValues, ValidationMode } from "@kirana-ui/core/form"

import { hostPart, inputsSignal, mounted } from "./runtime"

/**
 * On a `<form>`: its fields say what is wrong, and `(formSubmit)` gives the values once all are
 * valid. As with Angular's own forms, the page is left only when the form has an `action`.
 */
@Directive({ selector: "form[kuiForm]", exportAs: "kuiForm" })
export class KuiForm implements OnInit {
  readonly errors = input<FormErrors>()
  readonly validationMode = input<ValidationMode>()
  readonly formSubmit = output<{ values: FormValues; details: ChangeDetails }>()
  /** A field's value changed while it showed one of `errors`: what is left of them. */
  readonly clearErrors = output<FormErrors>()

  controller!: Form
  private readonly element = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement
  private readonly props = inputsSignal(() => ({
    errors: this.errors(),
    validationMode: this.validationMode(),
    onFormSubmit: this.element.hasAttribute("action")
      ? undefined
      : (values: FormValues, details: ChangeDetails) => this.formSubmit.emit({ values, details }),
    onClearErrors: (errors: FormErrors) => this.clearErrors.emit(errors),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createForm(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}
