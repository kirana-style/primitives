import {
  DestroyRef,
  Directive,
  ElementRef,
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
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { effect } from "@kirana-ui/core"
import { createFileUpload, formatBytes } from "@kirana-ui/core/file-upload"
import type { FileRejection, FileUpload, FileUploadEntry } from "@kirana-ui/core/file-upload"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_FIELD } from "./field-token"
import {
  KpIds,
  drawing,
  hostPart,
  innerPart,
  inputsSignal,
  mounted,
  onServer,
  ownText,
  statePart,
} from "./runtime"

type Parts = Vocabulary["fileUpload"]

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/**
 * On the element that holds the file upload's parts. `[(files)]` is the files held, in order. It
 * draws the native file input, hidden, as its last child: what a form submits, and what the
 * picker fills, so a trigger opens it with no dropzone in the page. `state()` is its state, for
 * the template (`#upload="kpFileUpload"`, `upload.state().empty`).
 */
@Directive({ selector: "[kpFileUpload]", exportAs: "kpFileUpload" })
export class KpFileUpload implements OnInit {
  readonly files = model<readonly File[] | undefined>(undefined)
  readonly defaultFiles = input<readonly File[]>()
  /**
   * What may be taken, as a file input's `accept`: extensions (`".png"`), types (`"image/png"`)
   * and kinds (`"image/*"`), in a list or one text with commas. Without it, anything.
   */
  readonly accept = input<string | readonly string[]>()
  /** Whether several files are held. Default `false`: a file taken is the one held. */
  readonly multiple = input(false, { transform: booleanAttribute })
  /** With `multiple`, how many files it holds at most. */
  readonly maxFiles = input(undefined, { transform: optionalNumber })
  /** The largest a file may be, in bytes. */
  readonly maxSize = input(undefined, { transform: optionalNumber })
  /** The smallest a file may be, in bytes. */
  readonly minSize = input(undefined, { transform: optionalNumber })
  /** Whether a file may be taken, asked after the checks above. */
  readonly validate = input<(file: File) => boolean>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  /** The files about to change; `details.cancel()` keeps them as they were. */
  readonly filesChanged = output<{ files: File[]; details: ChangeDetails }>()
  /** The files that were not taken, each with its reasons. */
  readonly filesRejected = output<FileRejection[]>()

  controller!: FileUpload
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    files: this.files(),
    defaultFiles: this.defaultFiles(),
    accept: this.accept(),
    multiple: this.multiple(),
    maxFiles: this.maxFiles(),
    maxSize: this.maxSize(),
    minSize: this.minSize(),
    validate: this.validate(),
    disabled: this.disabled(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onFilesChange: (files: File[], details: ChangeDetails) => {
      this.filesChanged.emit({ files, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.files() !== undefined) {
        this.files.set(files)
        this.props.sync()
      }
    },
    onFilesReject: (rejections: FileRejection[]) => this.filesRejected.emit(rejections),
  }))
  private readonly part = statePart<StateOf<Parts["root"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.part.state
  private readonly inner = innerPart("input")
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createFileUpload(this.props(), { field: this.field?.controller })
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

function part(name: "trigger" | "list" | "clear") {
  const root = inject(KpFileUpload)
  const put = hostPart()
  return () => put(root.controller[name])
}

/**
 * Where files are dropped; a pointer's press on it opens the file picker. A group, not a control:
 * the trigger is the keyboard's way in. `state()` is its state, for the template
 * (`#zone="kpFileUploadDropzone"`, `zone.state().dragging`).
 */
@Directive({ selector: "[kpFileUploadDropzone]", exportAs: "kpFileUploadDropzone" })
export class KpFileUploadDropzone implements OnInit {
  private readonly root = inject(KpFileUpload)
  private readonly put = statePart<StateOf<Parts["dropzone"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.dropzone)
  }
}

/** The button that opens the file picker: the control, with or without a dropzone. */
@Directive({ selector: "[kpFileUploadTrigger]" })
export class KpFileUploadTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

/** What holds the files: a list. */
@Directive({ selector: "[kpFileUploadList]" })
export class KpFileUploadList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

type Drawn = EmbeddedViewRef<{ $implicit: FileUploadEntry }>

/** `<li *kpFileUploadItems="let entry">`: once for each file, kept by the file's key. */
@Directive({ selector: "[kpFileUploadItems]" })
export class KpFileUploadItems implements OnInit {
  private readonly root = inject(KpFileUpload)
  private readonly template = inject<TemplateRef<{ $implicit: FileUploadEntry }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<string, Drawn>()

  ngOnInit(): void {
    const draw = (entries: readonly FileUploadEntry[]) => {
      // By key: a file that stays keeps its element, and focus with it.
      const wanted = new Set(entries.map((each) => each.key))
      for (const [key, view] of this.views) {
        if (wanted.has(key)) continue
        view.destroy()
        this.views.delete(key)
      }
      entries.forEach((entry, at) => {
        let view = this.views.get(entry.key)
        if (!view) {
          view = this.container.createEmbeddedView(this.template, { $implicit: entry }, at)
          this.views.set(entry.key, view)
        } else {
          view.context.$implicit = entry
          // The files a caller gives may come in another order: what stays is moved only then.
          if (this.container.indexOf(view) !== at) this.container.move(view, at)
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
    _directive: KpFileUploadItems,
    _context: unknown
  ): _context is { $implicit: FileUploadEntry } {
    return true
  }
}

/** A file, on the element `*kpFileUploadItems` draws for it. */
@Directive({ selector: "[kpFileUploadItem]" })
export class KpFileUploadItem implements OnInit {
  /** The file it is, as `*kpFileUploadItems` gave it. */
  readonly entry = input.required<FileUploadEntry>()
  readonly root = inject(KpFileUpload)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.item(this.entry().key))
  }
}

/** Writes a file's text into its element once, unless the element has content of its own. */
function said(name: "itemName" | "itemSize", say: (file: File) => string) {
  const item = inject(KpFileUploadItem)
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const put = hostPart()
  const server = onServer()
  return () => {
    const entry = item.entry()
    put(item.root.controller[name](entry.key))
    // A file's key is its name, size and date: what is said of it never changes.
    const text = ownText(element, server)
    if (text) text.data = say(entry.file)
  }
}

/** Says the file's name unless the element has content of its own. */
@Directive({ selector: "[kpFileUploadItemName]" })
export class KpFileUploadItemName implements OnInit {
  private readonly init = said("itemName", (file) => file.name)

  ngOnInit(): void {
    this.init()
  }
}

/** Says the file's size as people read one unless the element has content of its own. */
@Directive({ selector: "[kpFileUploadItemSize]" })
export class KpFileUploadItemSize implements OnInit {
  /** The language the number is written in. Default: the reader's. */
  readonly locale = input<string>()
  private readonly init = said("itemSize", (file) => formatBytes(file.size, this.locale()))

  ngOnInit(): void {
    this.init()
  }
}

/** A file's button that takes it away. */
@Directive({ selector: "[kpFileUploadItemRemove]" })
export class KpFileUploadItemRemove implements OnInit {
  private readonly item = inject(KpFileUploadItem)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item.root.controller.itemRemove(this.item.entry().key))
  }
}

/** Takes every file away: hidden while there is none. */
@Directive({ selector: "[kpFileUploadClear]" })
export class KpFileUploadClear implements OnInit {
  private readonly init = part("clear")

  ngOnInit(): void {
    this.init()
  }
}
