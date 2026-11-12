import {
  DestroyRef,
  Directive,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type { Field, FieldProps, FieldValidity, ValidityKey } from "@kirana-ui/core/field"
import type { ValidationMode } from "@kirana-ui/core/form"

import { KuiFieldset } from "./fieldset"
import { KuiForm } from "./form"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiField]", exportAs: "kuiField" })
export class KuiField implements OnInit {
  readonly name = input<string>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly invalid = input(false, { transform: booleanAttribute })
  readonly validate = input<FieldProps["validate"]>()
  readonly validationMode = input<ValidationMode>()
  readonly validationDebounceTime = input(undefined, {
    transform: (value: unknown) => (value == null ? undefined : numberAttribute(value)),
  })
  readonly kuiId = input<string>()

  controller!: Field
  private readonly form = inject(KuiForm, { optional: true })
  private readonly fieldset = inject(KuiFieldset, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    name: this.name(),
    disabled: this.disabled(),
    invalid: this.invalid(),
    validate: this.validate(),
    validationMode: this.validationMode(),
    validationDebounceTime: this.validationDebounceTime(),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createField(this.props(), {
      form: this.form?.controller,
      fieldset: this.fieldset?.controller,
    })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "label" | "control" | "description") {
  const root = inject(KuiField)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiFieldLabel]" })
export class KuiFieldLabel implements OnInit {
  private readonly init = part("label")

  ngOnInit(): void {
    this.init()
  }
}

/** On the control: an `<input>`, a `<textarea>` or a `<select>`. */
@Directive({ selector: "[kuiFieldControl]" })
export class KuiFieldControl implements OnInit {
  private readonly init = part("control")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiFieldDescription]" })
export class KuiFieldDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * `<div *kuiFieldError>`: in the page while something is wrong, with the message as its text
 * unless it has content of its own. `*kuiFieldError="'valueMissing'"` shows for only that finding
 * of the browser's, `*kuiFieldError="true"` always.
 */
@Directive({ selector: "[kuiFieldError]" })
export class KuiFieldError implements OnInit {
  readonly match = input<ValidityKey | boolean | "" | undefined>(undefined, {
    alias: "kuiFieldError",
  })
  private readonly root = inject(KuiField)
  private readonly destroy = inject(DestroyRef)
  private readonly present = presentWhile()
  private readonly options = inputsSignal(() => ({ match: this.match() || undefined }))

  ngOnInit(): void {
    const options = this.options()
    const error = this.root.controller.error(() => options.get().match)
    this.destroy.onDestroy(error.mount())
    this.present(error.mounted, error.part, (element) => {
      // Content of the caller's own stays; an empty element says the message.
      if (element.childNodes.length > 0) return () => {}
      return effect(() => {
        element.textContent = error.text.get()
      })
    })
  }
}

/** `<ng-container *kuiFieldValidity="let validity">`: draws its template with the field's validity. */
@Directive({ selector: "[kuiFieldValidity]" })
export class KuiFieldValidity implements OnInit {
  private readonly root = inject(KuiField)
  private readonly template = inject<TemplateRef<{ $implicit: FieldValidity }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)

  ngOnInit(): void {
    let view: EmbeddedViewRef<{ $implicit: FieldValidity }> | undefined
    this.destroy.onDestroy(
      effect(() => {
        const validity = this.root.controller.validity.get()
        if (view) {
          view.context.$implicit = validity
          view.detectChanges()
        } else {
          view = this.container.createEmbeddedView(this.template, { $implicit: validity })
        }
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KuiFieldValidity,
    _context: unknown
  ): _context is { $implicit: FieldValidity } {
    return true
  }
}
