import {
  DestroyRef,
  Directive,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  numberAttribute,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createField } from "@kirana-ui/core/field"
import type { Field, FieldProps, FieldValidity, ValidityKey } from "@kirana-ui/core/field"
import type { ValidationMode } from "@kirana-ui/core/form"

import { KP_FIELD } from "./field-token"
import { KpFieldset } from "./fieldset"
import { KpForm } from "./form"
import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({
  selector: "[kpField]",
  exportAs: "kpField",
  providers: [{ provide: KP_FIELD, useExisting: forwardRef(() => KpField) }],
})
export class KpField implements OnInit {
  readonly name = input<string>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly invalid = input(false, { transform: booleanAttribute })
  readonly validate = input<FieldProps["validate"]>()
  readonly validationMode = input<ValidationMode>()
  readonly validationDebounceTime = input(undefined, {
    transform: (value: unknown) => (value == null ? undefined : numberAttribute(value)),
  })
  readonly kpId = input<string>()

  controller!: Field
  private readonly form = inject(KpForm, { optional: true })
  private readonly fieldset = inject(KpFieldset, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    name: this.name(),
    disabled: this.disabled(),
    invalid: this.invalid(),
    validate: this.validate(),
    validationMode: this.validationMode(),
    validationDebounceTime: this.validationDebounceTime(),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

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
  const root = inject(KpField)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpFieldLabel]" })
export class KpFieldLabel implements OnInit {
  private readonly init = part("label")

  ngOnInit(): void {
    this.init()
  }
}

/** On the control: an `<input>`, a `<textarea>` or a `<select>`. */
@Directive({ selector: "[kpFieldControl]" })
export class KpFieldControl implements OnInit {
  private readonly init = part("control")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpFieldDescription]" })
export class KpFieldDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * `<div *kpFieldError>`: in the page while something is wrong, with the message as its text
 * unless it has content of its own. `*kpFieldError="'valueMissing'"` shows for only that finding
 * of the browser's, `*kpFieldError="true"` always.
 */
@Directive({ selector: "[kpFieldError]" })
export class KpFieldError implements OnInit {
  readonly match = input<ValidityKey | boolean | "" | undefined>(undefined, {
    alias: "kpFieldError",
  })
  private readonly root = inject(KpField)
  private readonly destroy = inject(DestroyRef)
  private readonly present = presentWhile()
  private readonly options = inputsSignal(this, () => ({ match: this.match() || undefined }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

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

/** `<ng-container *kpFieldValidity="let validity">`: draws its template with the field's validity. */
@Directive({ selector: "[kpFieldValidity]" })
export class KpFieldValidity implements OnInit {
  private readonly root = inject(KpField)
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
    _directive: KpFieldValidity,
    _context: unknown
  ): _context is { $implicit: FieldValidity } {
    return true
  }
}
