// Importing an entry defines its element: `import "@kirana-ui/web/dialog"`. This one defines
// them all.
import "./accordion.ts"
import "./alert-dialog.ts"
import "./autocomplete.ts"
import "./autosize.ts"
import "./avatar.ts"
import "./button.ts"
import "./calendar.ts"
import "./carousel.ts"
import "./checkbox.ts"
import "./checkbox-group.ts"
import "./collapsible.ts"
import "./combobox.ts"
import "./command.ts"
import "./context-menu.ts"
import "./date-field.ts"
import "./date-picker.ts"
import "./dialog.ts"
import "./drawer.ts"
import "./field.ts"
import "./fieldset.ts"
import "./form.ts"
import "./hover-card.ts"
import "./input.ts"
import "./label.ts"
import "./listbox.ts"
import "./menu.ts"
import "./menubar.ts"
import "./message-scroller.ts"
import "./meter.ts"
import "./navigation-menu.ts"
import "./number-field.ts"
import "./otp.ts"
import "./pagination.ts"
import "./popover.ts"
import "./progress.ts"
import "./qr-code.ts"
import "./radio-group.ts"
import "./resizable.ts"
import "./scroll-area.ts"
import "./select.ts"
import "./separator.ts"
import "./slider.ts"
import "./switch.ts"
import "./tabs.ts"
import "./toast.ts"
import "./toggle.ts"
import "./toggle-group.ts"
import "./toolbar.ts"
import "./tooltip.ts"

export {
  controllerAround,
  defineElement,
  entryAround,
  hostAround,
  partAround,
  partProps,
} from "./runtime.ts"
export type { Drawn, Each, ElementSpec } from "./runtime.ts"
// The core's types an event's detail or a property names: imported from this package, the one
// a project installs.
// Types only: nothing of the core's is drawn in by them.
export type { Placed } from "./around.ts"
export type {
  Align,
  Anchor,
  AnchorOption,
  Bindable,
  ChangeDetails,
  ChangeSource,
  CollisionAvoidance,
  CollisionBoundary,
  CollisionPadding,
  ComponentDefinition,
  Direction,
  ItemLabels,
  ListCollection,
  OffsetData,
  OffsetFunction,
  Orientation,
  Part,
  PartDefinition,
  PartProps,
  PartState,
  PartStyle,
  PhysicalSide,
  PositionOptions,
  ReadonlySignal,
  Side,
  Signal,
  StateDefinition,
  StateOf,
} from "@kirana-ui/core"
export type {
  CalendarDay,
  CalendarValue,
  CalendarWeekday,
  DateRange,
  IsoDate,
} from "@kirana-ui/core/calendar"
export type { DateFieldSegment, DateUnit } from "@kirana-ui/core/date-field"
export type { DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
export type { FieldValidity, ValidityKey } from "@kirana-ui/core/field"
export type { FormErrors, FormValues, ValidationMode } from "@kirana-ui/core/form"
export type { PaginationEntry } from "@kirana-ui/core/pagination"
export type { QrCorrection } from "@kirana-ui/core/qr-code"
export type { SelectShown } from "@kirana-ui/core/select"
export type {
  ComboboxEntry,
  ComboboxGroupData,
  ComboboxGroupEntry,
  ComboboxItemData,
  ComboboxItemEntry,
  ComboboxShown,
} from "@kirana-ui/core/combobox"
export type { SliderChangeDetails, SliderTold } from "@kirana-ui/core/slider"
