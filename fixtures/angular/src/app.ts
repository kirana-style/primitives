import { Component, computed, signal } from "@angular/core"
import {
  KuiAccordion,
  KuiAccordionHeader,
  KuiAccordionItem,
  KuiAccordionPanel,
  KuiAccordionTrigger,
  KuiAvatar,
  KuiAvatarFallback,
  KuiAvatarImage,
  KuiButton,
  KuiCheckbox,
  KuiCheckboxGroup,
  KuiCheckboxIndicator,
  KuiCollapsible,
  KuiCollapsiblePanel,
  KuiCollapsibleTrigger,
  KuiAlertDialog,
  KuiDialog,
  KuiDialogBackdrop,
  KuiDialogClose,
  KuiDialogDescription,
  KuiDialogPopup,
  KuiDialogPortal,
  KuiDialogTitle,
  KuiDialogTrigger,
  KuiDialogViewport,
  KuiHoverCard,
  KuiHoverCardPopup,
  KuiHoverCardPortal,
  KuiHoverCardPositioner,
  KuiHoverCardTrigger,
  KuiCombobox,
  KuiComboboxChip,
  KuiComboboxChipRemove,
  KuiComboboxChips,
  KuiComboboxClear,
  KuiComboboxCollection,
  KuiComboboxEmpty,
  KuiComboboxHiddenInput,
  KuiComboboxInput,
  KuiComboboxItem,
  KuiComboboxItemIndicator,
  KuiComboboxList,
  KuiComboboxPopup,
  KuiComboboxPortal,
  KuiComboboxPositioner,
  KuiComboboxStatus,
  KuiComboboxTrigger,
  KuiComboboxValue,
  KuiContextMenuTrigger,
  KuiListbox,
  KuiListboxGroup,
  KuiListboxGroupLabel,
  KuiListboxItem,
  KuiListboxItemIndicator,
  KuiMenu,
  KuiMenubar,
  KuiMenuCheckboxItem,
  KuiMenuCheckboxItemIndicator,
  KuiMenuGroup,
  KuiMenuGroupLabel,
  KuiMenuItem,
  KuiMenuLinkItem,
  KuiMenuPopup,
  KuiMenuPortal,
  KuiMenuPositioner,
  KuiMenuRadioGroup,
  KuiMenuRadioItem,
  KuiMenuRadioItemIndicator,
  KuiMenuSeparator,
  KuiMenuSubmenuRoot,
  KuiMenuSubmenuTrigger,
  KuiMenuTrigger,
  KuiMeter,
  KuiNavigationMenu,
  KuiNavigationMenuContent,
  KuiNavigationMenuIcon,
  KuiNavigationMenuItem,
  KuiNavigationMenuLink,
  KuiNavigationMenuList,
  KuiNavigationMenuPopup,
  KuiNavigationMenuPortal,
  KuiNavigationMenuPositioner,
  KuiNavigationMenuTrigger,
  KuiNavigationMenuViewport,
  KuiMeterIndicator,
  KuiMeterLabel,
  KuiMeterTrack,
  KuiMeterValue,
  KuiOtp,
  KuiCommand,
  KuiCommandEmpty,
  KuiCommandGroup,
  KuiCommandGroupHeading,
  KuiCommandInput,
  KuiCommandItem,
  KuiCommandList,
  KuiCommandSeparator,
  KuiInput,
  KuiLabel,
  KuiPortalProvider,
  KuiComboboxGroup,
  KuiComboboxGroupLabel,
  KuiComboboxSeparator,
  KuiPagination,
  KuiPaginationEllipsis,
  KuiPaginationItem,
  KuiPaginationItems,
  KuiPaginationNext,
  KuiPaginationPrevious,
  KuiDatePicker,
  KuiDatePickerCalendar,
  KuiDatePickerField,
  KuiSelectGroup,
  KuiSelectGroupLabel,
  KuiSelectSeparator,
  KuiNumberField,
  KuiNumberFieldDecrement,
  KuiNumberFieldGroup,
  KuiNumberFieldIncrement,
  KuiNumberFieldInput,
  KuiNumberFieldScrubArea,
  KuiNumberFieldScrubAreaCursor,
  KuiSelectList,
  KuiSelectScrollDownArrow,
  KuiSelectScrollUpArrow,
  KuiDateField,
  KuiDateFieldInput,
  KuiDateFieldSegment,
  KuiDateFieldSegments,
  KuiCalendar,
  KuiCalendarCell,
  KuiCalendarDay,
  KuiCalendarGrid,
  KuiCalendarHeadCell,
  KuiCalendarHeading,
  KuiCalendarInput,
  KuiCalendarMonths,
  KuiCalendarNext,
  KuiCalendarPrevious,
  KuiCalendarWeekdays,
  KuiCalendarWeeks,
  KuiMessageScroller,
  KuiMessageScrollerButton,
  KuiMessageScrollerContent,
  KuiMessageScrollerViewport,
  KuiQrCode,
  KuiQrCodeFrame,
  KuiQrCodePattern,
  KuiAutosizeTextarea,
  KuiCarousel,
  KuiCarouselIndicator,
  KuiCarouselItem,
  KuiCarouselNext,
  KuiCarouselPrevious,
  KuiCarouselViewport,
  KuiToastAction,
  KuiToastClose,
  KuiToastDescription,
  KuiToastList,
  KuiToastRoot,
  KuiToastContent,
  KuiToastTitle,
  KuiToastViewport,
  createToaster,
  KuiOtpCaret,
  KuiOtpGroup,
  KuiOtpInput,
  KuiOtpSeparator,
  KuiOtpSlot,
  KuiResizableGroup,
  KuiResizableHandle,
  KuiResizablePanel,
  KuiPopover,
  KuiPopoverArrow,
  KuiPopoverBackdrop,
  KuiPopoverClose,
  KuiPopoverDescription,
  KuiPopoverPopup,
  KuiPopoverPortal,
  KuiPopoverPositioner,
  KuiPopoverTitle,
  KuiPopoverTrigger,
  KuiProgress,
  KuiProgressIndicator,
  KuiProgressLabel,
  KuiProgressTrack,
  KuiProgressValue,
  KuiRadioGroup,
  KuiRadioGroupIndicator,
  KuiRadioGroupItem,
  KuiSelect,
  KuiSelectInput,
  KuiSelectItem,
  KuiSelectItemIndicator,
  KuiSelectItemText,
  KuiSelectPopup,
  KuiSelectPortal,
  KuiSelectPositioner,
  KuiSelectTrigger,
  KuiSelectValue,
  KuiField,
  KuiFieldControl,
  KuiFieldDescription,
  KuiFieldError,
  KuiFieldLabel,
  KuiFieldValidity,
  KuiFieldset,
  KuiFieldsetLegend,
  KuiForm,
  KuiDirection,
  KuiSeparator,
  KuiSlider,
  KuiSliderControl,
  KuiSliderIndicator,
  KuiSliderThumb,
  KuiSliderTrack,
  KuiSliderValue,
  KuiSwitch,
  KuiSwitchThumb,
  KuiTabs,
  KuiTabsIndicator,
  KuiTabsList,
  KuiTabsPanel,
  KuiTabsTab,
  KuiScrollArea,
  KuiScrollAreaContent,
  KuiScrollAreaCorner,
  KuiScrollAreaScrollbar,
  KuiScrollAreaThumb,
  KuiScrollAreaViewport,
  KuiToggle,
  KuiToggleGroup,
  KuiToolbar,
  KuiToolbarButton,
  KuiToolbarGroup,
  KuiToolbarInput,
  KuiToolbarLink,
  KuiToolbarSeparator,
  KuiTooltip,
  KuiTooltipArrow,
  KuiTooltipPopup,
  KuiTooltipPortal,
  KuiTooltipPositioner,
  KuiTooltipTrigger,
} from "@kirana-ui/angular"
import type { OffsetFunction } from "@kirana-ui/angular"

import {
  DsCode,
  DsDialog,
  DsDialogClose,
  DsDialogContent,
  DsDialogTitle,
  DsDialogTrigger,
  DsMark,
  DsTooltip,
  DsTooltipPositioner,
} from "./design-system"

/**
 * The page every adapter draws, element for element: the conformance run walks it and compares
 * the DOM of each state across adapters. Change it in all three fixtures at once.
 *
 * An input is bound (`[kuiId]="'c1'"`), not written as an attribute: Angular leaves a static
 * attribute on the element beside the input that reads it.
 */
@Component({
  selector: "app-root",
  imports: [
    DsCode,
    DsDialog,
    DsDialogClose,
    DsDialogContent,
    DsDialogTitle,
    DsDialogTrigger,
    DsMark,
    DsTooltip,
    DsTooltipPositioner,
    KuiAccordion,
    KuiAccordionHeader,
    KuiAccordionItem,
    KuiAccordionPanel,
    KuiAccordionTrigger,
    KuiAvatar,
    KuiAvatarFallback,
    KuiAvatarImage,
    KuiButton,
    KuiCheckbox,
    KuiCheckboxGroup,
    KuiCheckboxIndicator,
    KuiCollapsible,
    KuiCollapsiblePanel,
    KuiCollapsibleTrigger,
    KuiAlertDialog,
    KuiDialog,
    KuiDialogBackdrop,
    KuiDialogClose,
    KuiDialogDescription,
    KuiDialogPopup,
    KuiDialogPortal,
    KuiDialogTitle,
    KuiDialogTrigger,
    KuiDialogViewport,
    KuiHoverCard,
    KuiHoverCardPopup,
    KuiHoverCardPortal,
    KuiHoverCardPositioner,
    KuiHoverCardTrigger,
    KuiCombobox,
    KuiComboboxChip,
    KuiComboboxChipRemove,
    KuiComboboxChips,
    KuiComboboxClear,
    KuiComboboxCollection,
    KuiComboboxEmpty,
    KuiComboboxHiddenInput,
    KuiComboboxInput,
    KuiComboboxItem,
    KuiComboboxItemIndicator,
    KuiComboboxList,
    KuiComboboxPopup,
    KuiComboboxPortal,
    KuiComboboxPositioner,
    KuiComboboxStatus,
    KuiComboboxTrigger,
    KuiComboboxValue,
    KuiContextMenuTrigger,
    KuiListbox,
    KuiListboxGroup,
    KuiListboxGroupLabel,
    KuiListboxItem,
    KuiListboxItemIndicator,
    KuiMenu,
    KuiMenubar,
    KuiMenuCheckboxItem,
    KuiMenuCheckboxItemIndicator,
    KuiMenuGroup,
    KuiMenuGroupLabel,
    KuiMenuItem,
    KuiMenuLinkItem,
    KuiMenuPopup,
    KuiMenuPortal,
    KuiMenuPositioner,
    KuiMenuRadioGroup,
    KuiMenuRadioItem,
    KuiMenuRadioItemIndicator,
    KuiMenuSeparator,
    KuiMenuSubmenuRoot,
    KuiMenuSubmenuTrigger,
    KuiMenuTrigger,
    KuiMeter,
    KuiNavigationMenu,
    KuiNavigationMenuContent,
    KuiNavigationMenuIcon,
    KuiNavigationMenuItem,
    KuiNavigationMenuLink,
    KuiNavigationMenuList,
    KuiNavigationMenuPopup,
    KuiNavigationMenuPortal,
    KuiNavigationMenuPositioner,
    KuiNavigationMenuTrigger,
    KuiNavigationMenuViewport,
    KuiMeterIndicator,
    KuiMeterLabel,
    KuiMeterTrack,
    KuiMeterValue,
    KuiOtp,
    KuiCommand,
    KuiCommandEmpty,
    KuiCommandGroup,
    KuiCommandGroupHeading,
    KuiCommandInput,
    KuiCommandItem,
    KuiCommandList,
    KuiCommandSeparator,
    KuiInput,
    KuiLabel,
    KuiPortalProvider,
    KuiComboboxGroup,
    KuiComboboxGroupLabel,
    KuiComboboxSeparator,
    KuiPagination,
    KuiPaginationEllipsis,
    KuiPaginationItem,
    KuiPaginationItems,
    KuiPaginationNext,
    KuiPaginationPrevious,
    KuiDatePicker,
    KuiDatePickerCalendar,
    KuiDatePickerField,
    KuiSelectGroup,
    KuiSelectGroupLabel,
    KuiSelectSeparator,
    KuiNumberField,
    KuiNumberFieldDecrement,
    KuiNumberFieldGroup,
    KuiNumberFieldIncrement,
    KuiNumberFieldInput,
    KuiNumberFieldScrubArea,
    KuiNumberFieldScrubAreaCursor,
    KuiSelectList,
    KuiSelectScrollDownArrow,
    KuiSelectScrollUpArrow,
    KuiDateField,
    KuiDateFieldInput,
    KuiDateFieldSegment,
    KuiDateFieldSegments,
    KuiCalendar,
    KuiCalendarCell,
    KuiCalendarDay,
    KuiCalendarGrid,
    KuiCalendarHeadCell,
    KuiCalendarHeading,
    KuiCalendarInput,
    KuiCalendarMonths,
    KuiCalendarNext,
    KuiCalendarPrevious,
    KuiCalendarWeekdays,
    KuiCalendarWeeks,
    KuiMessageScroller,
    KuiMessageScrollerButton,
    KuiMessageScrollerContent,
    KuiMessageScrollerViewport,
    KuiQrCode,
    KuiQrCodeFrame,
    KuiQrCodePattern,
    KuiAutosizeTextarea,
    KuiCarousel,
    KuiCarouselIndicator,
    KuiCarouselItem,
    KuiCarouselNext,
    KuiCarouselPrevious,
    KuiCarouselViewport,
    KuiToastAction,
    KuiToastClose,
    KuiToastDescription,
    KuiToastList,
    KuiToastRoot,
    KuiToastContent,
    KuiToastTitle,
    KuiToastViewport,
    KuiOtpCaret,
    KuiOtpGroup,
    KuiOtpInput,
    KuiOtpSeparator,
    KuiOtpSlot,
    KuiResizableGroup,
    KuiResizableHandle,
    KuiResizablePanel,
    KuiPopover,
    KuiPopoverArrow,
    KuiPopoverBackdrop,
    KuiPopoverClose,
    KuiPopoverDescription,
    KuiPopoverPopup,
    KuiPopoverPortal,
    KuiPopoverPositioner,
    KuiPopoverTitle,
    KuiPopoverTrigger,
    KuiProgress,
    KuiProgressIndicator,
    KuiProgressLabel,
    KuiProgressTrack,
    KuiProgressValue,
    KuiRadioGroup,
    KuiRadioGroupIndicator,
    KuiRadioGroupItem,
    KuiSelect,
    KuiSelectInput,
    KuiSelectItem,
    KuiSelectItemIndicator,
    KuiSelectItemText,
    KuiSelectPopup,
    KuiSelectPortal,
    KuiSelectPositioner,
    KuiSelectTrigger,
    KuiSelectValue,
    KuiField,
    KuiFieldControl,
    KuiFieldDescription,
    KuiFieldError,
    KuiFieldLabel,
    KuiFieldValidity,
    KuiFieldset,
    KuiFieldsetLegend,
    KuiForm,
    KuiDirection,
    KuiSeparator,
    KuiSlider,
    KuiSliderControl,
    KuiSliderIndicator,
    KuiSliderThumb,
    KuiSliderTrack,
    KuiSliderValue,
    KuiSwitch,
    KuiSwitchThumb,
    KuiTabs,
    KuiTabsIndicator,
    KuiTabsList,
    KuiTabsPanel,
    KuiTabsTab,
    KuiScrollArea,
    KuiScrollAreaContent,
    KuiScrollAreaCorner,
    KuiScrollAreaScrollbar,
    KuiScrollAreaThumb,
    KuiScrollAreaViewport,
    KuiToggle,
    KuiToggleGroup,
    KuiToolbar,
    KuiToolbarButton,
    KuiToolbarGroup,
    KuiToolbarInput,
    KuiToolbarLink,
    KuiToolbarSeparator,
    KuiTooltip,
    KuiTooltipArrow,
    KuiTooltipPopup,
    KuiTooltipPortal,
    KuiTooltipPositioner,
    KuiTooltipTrigger,
  ],
  template: `
    <main>
      <section data-fixture="collapsible">
        <div kuiCollapsible [kuiId]="'c1'">
          <button kuiCollapsibleTrigger data-testid="c1-trigger">Details</button>
          <div *kuiCollapsiblePanel class="panel" data-testid="c1-panel">
            <p>Panel content</p>
            <div kuiCollapsible [kuiId]="'c2'">
              <button kuiCollapsibleTrigger data-testid="c2-trigger">Nested</button>
              <div *kuiCollapsiblePanel class="panel" data-testid="c2-panel">
                <p>Nested content</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-fixture="collapsible-controlled">
        <button data-testid="c3-outside" (click)="controlled.set(!controlled())">
          Toggle from outside
        </button>
        <div kuiCollapsible [kuiId]="'c3'" [(open)]="controlled">
          <button kuiCollapsibleTrigger data-testid="c3-trigger">Controlled</button>
          <div *kuiCollapsiblePanel="{ keepMounted: true }" class="panel" data-testid="c3-panel">
            <p>Kept in the page</p>
          </div>
        </div>
        <div kuiCollapsible [kuiId]="'c4'" [defaultOpen]="true" [disabled]="true">
          <button kuiCollapsibleTrigger data-testid="c4-trigger">Disabled, open</button>
          <div *kuiCollapsiblePanel class="panel" data-testid="c4-panel">
            <p>Open from the start</p>
          </div>
        </div>
      </section>

      <section data-fixture="composition">
        <label>
          <input
            type="checkbox"
            data-testid="k1-lock"
            [checked]="locked()"
            (change)="locked.set($any($event.target).checked)"
          />
          Lock
        </label>
        <div kuiCollapsible [kuiId]="'k1'">
          <button
            kuiCollapsibleTrigger
            class="mine"
            type="submit"
            aria-expanded="true"
            data-testid="k1-trigger"
            (click)="press($event)"
          >
            Composed {{ presses() }}
          </button>
          <div
            *kuiCollapsiblePanel
            class="panel"
            data-testid="k1-panel"
            [style.color]="presses() % 2 ? 'red' : 'blue'"
          >
            <p>Composed content</p>
          </div>
        </div>
        <div kuiCollapsible [kuiId]="'k2'" [(open)]="layered">
          <button
            kuiCollapsibleTrigger
            class="handed asked"
            title="asked"
            lang="en"
            data-testid="k2-trigger"
            (click)="pressLayered($event)"
          >
            Layered {{ handed() }}/{{ asked() }}
          </button>
          <button kuiCollapsibleTrigger data-testid="k2-state">
            {{ layered() ? "Open" : "Closed" }}
          </button>
          <div *kuiCollapsiblePanel class="panel" data-testid="k2-panel">
            <p>Layered content</p>
          </div>
        </div>
        <div class="item">
          <a class="tag asked" title="handed" href="#k2" data-testid="k3-tag">Tag</a>
          <span class="tag" data-testid="k3-plain">Plain</span>
        </div>
        <div class="item">
          <button
            dsMark
            #mark="dsMark"
            class="mine"
            data-testid="k4-mark"
            (click)="marks.set(marks() + 1)"
          >
            {{ mark.active() ? "On" : "Off" }} {{ marks() }}
          </button>
        </div>
      </section>

      <section data-fixture="design">
        <ng-container dsDialog [kuiId]="'ds1'">
          <button dsDialogTrigger data-testid="ds1-trigger">Wrapped dialog</button>
          <div dsDialogContent [popupTestid]="'ds1-popup'">
            <h2 dsDialogTitle data-testid="ds1-title">Wrapped title</h2>
            <button dsDialogClose data-testid="ds1-close">Close</button>
          </div>
        </ng-container>
        <label class="item">
          <input
            type="checkbox"
            data-testid="ds2-off"
            [checked]="tipOff()"
            (change)="tipOff.set($any($event.target).checked)"
          />
          Off
        </label>
        <ng-container dsTooltip [kuiId]="'ds2'" [off]="tipOff()">
          <button kuiTooltipTrigger data-testid="ds2-trigger">Quick</button>
          <ng-template kuiTooltipPortal>
            <div dsTooltipPositioner>
              <div kuiTooltipPopup class="tip" data-testid="ds2-popup">At once</div>
            </div>
          </ng-template>
        </ng-container>
        <div class="item">
          <div dsCode [kuiId]="'ds3a'" [length]="2">
            <input kuiOtpInput aria-label="Text code" data-testid="ds3a-input" />
          </div>
          <div dsCode [kuiId]="'ds3b'" [length]="2" [mode]="'numeric'">
            <input kuiOtpInput aria-label="Number code" data-testid="ds3b-input" />
          </div>
        </div>
      </section>

      <section data-fixture="controls">
        <form data-testid="f1-form">
          <label data-testid="x1-label">
            <span kuiCheckbox [kuiId]="'x1'" [name]="'terms'" class="box" data-testid="x1">
              <span *kuiCheckboxIndicator class="mark">✓</span>
            </span>
            Accept
          </label>
          <span
            kuiCheckbox
            [kuiId]="'x2'"
            [defaultChecked]="true"
            [disabled]="true"
            class="box"
            data-testid="x2"
          >
            <span *kuiCheckboxIndicator class="mark">✓</span>
          </span>
          <span kuiCheckbox [kuiId]="'x3'" [indeterminate]="true" class="box" data-testid="x3">
            <span *kuiCheckboxIndicator class="mark">–</span>
          </span>
          <span
            kuiSwitch
            [kuiId]="'w1'"
            [name]="'alerts'"
            [(checked)]="alerts"
            class="switch"
            data-testid="w1"
          >
            <span kuiSwitchThumb class="thumb"></span>
          </span>
          <label for="w1" data-testid="w1-label">Alerts</label>
          <div kuiRadioGroup [kuiId]="'r1'" [name]="'plan'" [defaultValue]="'pro'" data-testid="r1">
            @for (each of plans; track each) {
              <label>
                <span
                  kuiRadioGroupItem
                  [value]="each"
                  [disabled]="each === 'team'"
                  class="radio"
                  [attr.data-testid]="'r1-' + each"
                  [kuiId]="'r1-' + each + '-radio'"
                >
                  <span *kuiRadioGroupIndicator class="dot"></span>
                </span>
                {{ each }}
              </label>
            }
          </div>
          <label for="r1-free-radio" data-testid="r1-label">Free plan</label>
          <button type="reset" data-testid="f1-reset">Reset</button>
        </form>
        <output data-testid="w1-output">{{ alerts() ? "on" : "off" }}</output>
      </section>

      <section data-fixture="tabs">
        <div kuiTabs [kuiId]="'t1'" [defaultValue]="'account'" data-testid="t1">
          <div kuiTabsList class="tabs" data-testid="t1-list">
            <button kuiTabsTab [value]="'account'" data-testid="t1-account">Account</button>
            <button kuiTabsTab [value]="'password'" data-testid="t1-password">Password</button>
            <button kuiTabsTab [value]="'billing'" [disabled]="true" data-testid="t1-billing">
              Billing
            </button>
            <button kuiTabsTab [value]="'team'" data-testid="t1-team">Team</button>
            <span kuiTabsIndicator class="tab-mark" data-testid="t1-mark"></span>
          </div>
          <div *kuiTabsPanel="'account'" data-testid="t1-panel-account">
            <p>Account settings</p>
            <div kuiTabs [kuiId]="'t2'" [defaultValue]="'one'" data-testid="t2">
              <div kuiTabsList class="tabs" data-testid="t2-list">
                <button kuiTabsTab [value]="'one'" data-testid="t2-one">One</button>
                <button kuiTabsTab [value]="'two'" data-testid="t2-two">Two</button>
              </div>
              <div *kuiTabsPanel="'one'" data-testid="t2-panel-one">First</div>
              <div *kuiTabsPanel="'two'" data-testid="t2-panel-two">Second</div>
            </div>
          </div>
          <div *kuiTabsPanel="'password'" data-testid="t1-panel-password">
            <p>Password settings</p>
          </div>
          <div *kuiTabsPanel="'billing'" data-testid="t1-panel-billing">
            <p>Billing settings</p>
          </div>
          <div *kuiTabsPanel="'team'" data-testid="t1-panel-team">
            <p>Team settings</p>
          </div>
        </div>
      </section>

      <section data-fixture="accordion">
        <div kuiAccordion [kuiId]="'a1'" data-testid="a1">
          @for (each of sections; track each) {
            <div
              kuiAccordionItem
              [value]="each"
              [disabled]="each === 'three'"
              [attr.data-testid]="'a1-' + each"
            >
              <h3 kuiAccordionHeader>
                <button kuiAccordionTrigger [attr.data-testid]="'a1-' + each + '-trigger'">
                  Section {{ each }}
                </button>
              </h3>
              <div *kuiAccordionPanel class="fold" [attr.data-testid]="'a1-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
        <div kuiAccordion [kuiId]="'a2'" [multiple]="true" [defaultValue]="['x']" data-testid="a2">
          @for (each of ["x", "y"]; track each) {
            <div kuiAccordionItem [value]="each" [attr.data-testid]="'a2-' + each">
              <h3 kuiAccordionHeader>
                <button kuiAccordionTrigger [attr.data-testid]="'a2-' + each + '-trigger'">
                  Part {{ each }}
                </button>
              </h3>
              <div *kuiAccordionPanel class="fold" [attr.data-testid]="'a2-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <section data-fixture="hover">
        <button data-testid="h0">Before</button>
        <ng-container kuiTooltip [kuiId]="'h1'" [delay]="100">
          <button kuiTooltipTrigger data-testid="h1-trigger">Save</button>
          <ng-template kuiTooltipPortal>
            <div kuiTooltipPositioner [sideOffset]="8" data-testid="h1-positioner">
              <div kuiTooltipPopup class="tip" data-testid="h1-popup">
                Save the file
                <div kuiTooltipArrow class="arrow" data-testid="h1-arrow"></div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kuiTooltip [kuiId]="'h2'" [delay]="100">
          <button kuiTooltipTrigger data-testid="h2-trigger">Open</button>
          <ng-template kuiTooltipPortal>
            <div kuiTooltipPositioner [sideOffset]="8" data-testid="h2-positioner">
              <div kuiTooltipPopup class="tip" data-testid="h2-popup">Open a file</div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kuiHoverCard [kuiId]="'v1'" [delay]="100" [closeDelay]="100">
          <a kuiHoverCardTrigger href="#profile" data-testid="v1-trigger">&#64;kirana</a>
          <ng-template kuiHoverCardPortal>
            <div
              kuiHoverCardPositioner
              [side]="'bottom'"
              [sideOffset]="8"
              data-testid="v1-positioner"
            >
              <div kuiHoverCardPopup class="tip" data-testid="v1-popup">
                <p>Styles, compiled.</p>
                <a href="#follow" data-testid="v1-link">Follow</a>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="simple">
        <button kuiButton data-testid="b1" (click)="count.set(count() + 1)">
          Count {{ count() }}
        </button>
        <button kuiButton [disabled]="true" [focusableWhenDisabled]="true" data-testid="b2">
          Disabled, in the tab order
        </button>
        <span kuiButton [nativeButton]="false" data-testid="b3" (click)="count.set(count() + 1)">
          Not a button element
        </span>
        <button kuiToggle aria-label="Bold" data-testid="g1">B</button>
        <div kuiSeparator data-testid="sp1"></div>
        <div kuiSeparator [orientation]="'vertical'" data-testid="sp2"></div>
        <button data-testid="pr1-more" (click)="done.set(100)">Finish</button>
        <div kuiProgress [kuiId]="'pr1'" [value]="done()" data-testid="pr1">
          <span kuiProgressLabel>Upload</span>
          <div kuiProgressTrack class="track">
            <div kuiProgressIndicator class="fill" data-testid="pr1-fill"></div>
          </div>
          <span kuiProgressValue data-testid="pr1-value"></span>
        </div>
        <div kuiProgress [kuiId]="'pr2'" [value]="null" data-testid="pr2">
          <div kuiProgressTrack class="track">
            <div kuiProgressIndicator class="fill" data-testid="pr2-fill"></div>
          </div>
        </div>
        <div kuiMeter [kuiId]="'m1'" [value]="30" [max]="60" data-testid="m1">
          <span kuiMeterLabel>Disk</span>
          <div kuiMeterTrack class="track">
            <div kuiMeterIndicator class="fill" data-testid="m1-fill"></div>
          </div>
          <span kuiMeterValue data-testid="m1-value"></span>
        </div>
        <button data-testid="av-load" (click)="pictures.set(true)">Load pictures</button>
        <span kuiAvatar class="avatar" data-testid="av1" (loadingStatusChanged)="heard.set($event)">
          <img
            *kuiAvatarImage="pictures() ? pixel : undefined"
            alt="Kirana"
            data-testid="av1-image"
          />
          <span *kuiAvatarFallback data-testid="av1-fallback">K</span>
        </span>
        <span data-testid="av1-status">{{ heard() }}</span>
        <span kuiAvatar class="avatar" data-testid="av2">
          <img
            *kuiAvatarImage="pictures() ? broken : undefined"
            alt="Nobody"
            data-testid="av2-image"
          />
          <span *kuiAvatarFallback data-testid="av2-fallback">N</span>
        </span>
        <span kuiAvatar class="avatar" data-testid="av3">
          <img
            kuiAvatarImage
            [attr.src]="pictures() ? pixel : null"
            alt="Kept"
            data-testid="av3-image"
          />
          <span *kuiAvatarFallback="{ delay: 60000 }" data-testid="av3-fallback">L</span>
        </span>
        <ng-container kuiAlertDialog [kuiId]="'ad1'">
          <button kuiDialogTrigger data-testid="ad1-trigger">Delete</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="ad1-backdrop"></div>
            <div kuiDialogPopup class="dialog" data-testid="ad1-popup">
              <h2 kuiDialogTitle>Delete the file?</h2>
              <p kuiDialogDescription>This cannot be undone.</p>
              <button kuiDialogClose data-testid="ad1-cancel">Cancel</button>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="dialog">
        <ng-container kuiDialog [kuiId]="'d1'">
          <button kuiDialogTrigger data-testid="d1-trigger">Open dialog</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="d1-backdrop"></div>
            <div kuiDialogPopup class="dialog" data-testid="d1-popup">
              <h2 kuiDialogTitle>Edit profile</h2>
              <p kuiDialogDescription>Change your name.</p>
              <input data-testid="d1-input" aria-label="Name" />
              <ng-container kuiDialog [kuiId]="'d2'">
                <button kuiDialogTrigger data-testid="d2-trigger">Open nested</button>
                <ng-template kuiDialogPortal>
                  <div kuiDialogBackdrop class="backdrop" data-testid="d2-backdrop"></div>
                  <div kuiDialogPopup class="dialog" data-testid="d2-popup">
                    <h2 kuiDialogTitle>Are you sure?</h2>
                    <button kuiDialogClose data-testid="d2-close">Back</button>
                  </div>
                </ng-template>
              </ng-container>
              <button kuiDialogClose data-testid="d1-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kuiDialog [kuiId]="'d3'">
          <button kuiDialogTrigger data-testid="d3-trigger">Open long dialog</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="d3-backdrop"></div>
            <div kuiDialogViewport class="viewport" data-testid="d3-viewport">
              <div kuiDialogPopup class="dialog long" data-testid="d3-popup">
                <h2 kuiDialogTitle>Terms</h2>
                <p kuiDialogDescription>Longer than the page: its viewport scrolls.</p>
                <button kuiDialogClose data-testid="d3-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="popover">
        <ng-container kuiPopover [kuiId]="'p1'">
          <button kuiPopoverTrigger data-testid="p1-trigger">Open popover</button>
          <ng-template kuiPopoverPortal>
            <div
              kuiPopoverPositioner
              [sideOffset]="8"
              [align]="'start'"
              data-testid="p1-positioner"
            >
              <div kuiPopoverPopup class="popup" data-testid="p1-popup">
                <h2 kuiPopoverTitle>Notifications</h2>
                <p kuiPopoverDescription>You are all caught up.</p>
                <button kuiPopoverClose data-testid="p1-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="select">
        <form data-testid="s1-form">
          <ng-container kuiSelect [kuiId]="'s1'" [name]="'fruit'" [(value)]="fruit">
            <button kuiSelectTrigger data-testid="s1-trigger">
              <span kuiSelectValue [placeholder]="'Pick a fruit'" data-testid="s1-value"></span>
            </button>
            <ng-template kuiSelectPortal>
              <div kuiSelectPositioner [sideOffset]="4" data-testid="s1-positioner">
                <div kuiSelectPopup class="popup" data-testid="s1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kuiSelectItem
                      [value]="each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'s1-' + each"
                    >
                      <span kuiSelectItemText>{{ each }}</span>
                      <span *kuiSelectItemIndicator>✓</span>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kuiSelectInput />
          </ng-container>
        </form>
        <output data-testid="s1-output">{{ fruit() ?? "none" }}</output>
      </section>
      <section data-fixture="select-multiple">
        <form class="bar" data-testid="sm1-form">
          <ng-container
            kuiSelect
            [kuiId]="'sm1'"
            [name]="'basket'"
            [multiple]="true"
            [(values)]="basket"
          >
            <button kuiSelectTrigger data-testid="sm1-trigger">
              <span kuiSelectValue [placeholder]="'Pick fruits'" data-testid="sm1-value"></span>
            </button>
            <ng-template kuiSelectPortal>
              <div kuiSelectPositioner [sideOffset]="4" data-testid="sm1-positioner">
                <div kuiSelectPopup class="popup" data-testid="sm1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kuiSelectItem
                      [value]="each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'sm1-' + each"
                    >
                      <span kuiSelectItemText>{{ each }}</span>
                      <span *kuiSelectItemIndicator>✓</span>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kuiSelectInput />
          </ng-container>
          <button type="reset" data-testid="sm1-reset">Reset</button>
        </form>
        <output data-testid="sm1-output">{{ basket().join(",") || "none" }}</output>
        <ng-container kuiSelect [kuiId]="'sm2'" [items]="sizes" [defaultValue]="'m'">
          <button kuiSelectTrigger data-testid="sm2-trigger">
            <span *kuiSelectValue="let shown" data-testid="sm2-value"
              >{{ shown.label }} ({{ shown.value }})</span
            >
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [sideOffset]="4" data-testid="sm2-positioner">
              <div kuiSelectPopup class="popup" data-testid="sm2-popup">
                @for (each of sizeKeys; track each) {
                  <div kuiSelectItem [value]="each" class="item" [attr.data-testid]="'sm2-' + each">
                    <span kuiSelectItemText>{{ sizes[each] }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container
          kuiSelect
          [kuiId]="'sm3'"
          [items]="sizes"
          [multiple]="true"
          [defaultValues]="['l', 's']"
        >
          <button kuiSelectTrigger data-testid="sm3-trigger">
            <span *kuiSelectValue="let shown" class="bar" data-testid="sm3-value">
              @for (label of shown.labels; track label) {
                <b>{{ label }}</b>
              }
            </span>
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [sideOffset]="4" data-testid="sm3-positioner">
              <div kuiSelectPopup class="popup" data-testid="sm3-popup">
                @for (each of sizeKeys; track each) {
                  <div kuiSelectItem [value]="each" class="item" [attr.data-testid]="'sm3-' + each">
                    <span kuiSelectItemText>{{ sizes[each] }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="menu">
        <ng-container kuiMenu [kuiId]="'mn1'">
          <button kuiMenuTrigger data-testid="mn1-trigger">File</button>
          <ng-template kuiMenuPortal>
            <div kuiMenuPositioner [sideOffset]="4" data-testid="mn1-positioner">
              <div kuiMenuPopup class="popup" data-testid="mn1-popup">
                <div kuiMenuGroupLabel data-testid="mn1-lone">Document</div>
                <div kuiMenuItem class="item" data-testid="mn1-new" (click)="action.set('new')">
                  <span>New</span><kbd aria-hidden="true">⌘N</kbd>
                </div>
                <div kuiMenuItem class="item" [disabled]="true" data-testid="mn1-open">Open</div>
                <div kuiMenuItem class="item" data-testid="mn1-print" (click)="action.set('print')">
                  Print
                </div>
                <div kuiMenuSeparator data-testid="mn1-separator"></div>
                <div
                  kuiMenuCheckboxItem
                  class="item"
                  [defaultChecked]="true"
                  data-testid="mn1-wrap"
                >
                  <span *kuiMenuCheckboxItemIndicator>✓</span>
                  <span>Word wrap</span>
                </div>
                <div kuiMenuGroup [kuiId]="'mn1-g'" data-testid="mn1-group">
                  <div kuiMenuGroupLabel data-testid="mn1-label">View</div>
                  <div kuiMenuRadioGroup [(value)]="view" data-testid="mn1-views">
                    <div kuiMenuRadioItem [value]="'list'" class="item" data-testid="mn1-list">
                      <span *kuiMenuRadioItemIndicator>•</span>
                      <span>List</span>
                    </div>
                    <div kuiMenuRadioItem [value]="'grid'" class="item" data-testid="mn1-grid">
                      <span *kuiMenuRadioItemIndicator>•</span>
                      <span>Grid</span>
                    </div>
                  </div>
                </div>
                <ng-container kuiMenuSubmenuRoot [kuiId]="'mn1s'">
                  <div kuiMenuSubmenuTrigger class="item" data-testid="mn1-share">Share</div>
                  <ng-template kuiMenuPortal>
                    <div kuiMenuPositioner data-testid="mn1s-positioner">
                      <div kuiMenuPopup class="popup" data-testid="mn1s-popup">
                        <div
                          kuiMenuItem
                          class="item"
                          data-testid="mn1s-mail"
                          (click)="action.set('mail')"
                        >
                          Mail
                        </div>
                        <div
                          kuiMenuItem
                          class="item"
                          data-testid="mn1s-link"
                          (click)="action.set('link')"
                        >
                          Link
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </ng-container>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="mn1-output">{{ action() }} {{ view() }}</output>
      </section>
      <section data-fixture="context-menu">
        <ng-container kuiContextMenu [kuiId]="'cm1'">
          <div kuiContextMenuTrigger class="area" data-testid="cm1-area">Press here</div>
          <ng-template kuiMenuPortal>
            <div kuiMenuPositioner data-testid="cm1-positioner">
              <div kuiMenuPopup class="popup" aria-label="Actions" data-testid="cm1-popup">
                <div
                  kuiMenuItem
                  class="item"
                  data-testid="cm1-copy"
                  (click)="picked.set('cm1-copy')"
                >
                  Copy
                </div>
                <div
                  kuiMenuItem
                  class="item"
                  data-testid="cm1-paste"
                  (click)="picked.set('cm1-paste')"
                >
                  Paste
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="menubar">
        <div kuiMenubar [kuiId]="'mb1'" class="bar" data-testid="mb1">
          <ng-container kuiMenu [kuiId]="'mb1f'">
            <button kuiMenuTrigger data-testid="mb1-file">File</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1f-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1f-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1f-new"
                    (click)="picked.set('mb1f-new')"
                  >
                    New
                  </div>
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1f-save"
                    (click)="picked.set('mb1f-save')"
                  >
                    Save
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1e'">
            <button kuiMenuTrigger data-testid="mb1-edit">Edit</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1e-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1e-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1e-undo"
                    (click)="picked.set('mb1e-undo')"
                  >
                    Undo
                  </div>
                  <ng-container kuiMenuSubmenuRoot [kuiId]="'mb1em'">
                    <div kuiMenuSubmenuTrigger class="item" data-testid="mb1e-find">Find</div>
                    <ng-template kuiMenuPortal>
                      <div kuiMenuPositioner data-testid="mb1em-positioner">
                        <div kuiMenuPopup class="popup" data-testid="mb1em-popup">
                          <div
                            kuiMenuItem
                            class="item"
                            data-testid="mb1em-next"
                            (click)="picked.set('mb1em-next')"
                          >
                            Next
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </ng-container>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1v'" [disabled]="true">
            <button kuiMenuTrigger data-testid="mb1-view">View</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1v-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1v-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1v-zoom"
                    (click)="picked.set('mb1v-zoom')"
                  >
                    Zoom
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'mb1h'">
            <button kuiMenuTrigger data-testid="mb1-help">Help</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mb1h-positioner">
                <div kuiMenuPopup class="popup" data-testid="mb1h-popup">
                  <div
                    kuiMenuItem
                    class="item"
                    data-testid="mb1h-about"
                    (click)="picked.set('mb1h-about')"
                  >
                    About
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <output data-testid="mb1-output">{{ picked() }}</output>
      </section>
      <section data-fixture="listbox">
        <div kuiListbox [kuiId]="'lb1'" aria-label="Fruit" [(value)]="chosen" data-testid="lb1">
          @for (each of fruits; track each) {
            <div
              kuiListboxItem
              [value]="each"
              [disabled]="each === 'Blueberry'"
              class="item"
              [attr.data-testid]="'lb1-' + each"
            >
              <span>{{ each }}</span>
              <span *kuiListboxItemIndicator>✓</span>
            </div>
          }
        </div>
        <div kuiListbox [kuiId]="'lb2'" aria-label="Plans" [multiple]="true" data-testid="lb2">
          <div kuiListboxGroup [kuiId]="'lb2-g'" data-testid="lb2-group">
            <div kuiListboxGroupLabel data-testid="lb2-label">Plans</div>
            @for (each of plans; track each) {
              <div kuiListboxItem [value]="each" class="item" [attr.data-testid]="'lb2-' + each">
                <span>{{ each }}</span>
              </div>
            }
          </div>
        </div>
        <output data-testid="lb1-output">{{ chosen().join(",") }}</output>
      </section>
      <section data-fixture="combobox">
        <form data-testid="cb1-form">
          <ng-container
            kuiCombobox
            [kuiId]="'cb1'"
            [name]="'pick'"
            [autoHighlight]="true"
            [(value)]="pick"
          >
            <input kuiComboboxInput aria-label="Fruit" data-testid="cb1-input" />
            <button kuiComboboxTrigger aria-label="Show fruits" data-testid="cb1-trigger">▾</button>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner [sideOffset]="4" data-testid="cb1-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Fruits" data-testid="cb1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kuiComboboxItem
                      [value]="each"
                      [kuiId]="'cb1-' + each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'cb1-' + each"
                    >
                      <span>{{ each }}</span>
                      <span *kuiComboboxItemIndicator>✓</span>
                    </div>
                  }
                  <div *kuiComboboxEmpty data-testid="cb1-empty">No fruit</div>
                </div>
              </div>
            </ng-template>
            <input kuiComboboxHiddenInput />
          </ng-container>
        </form>
        <output data-testid="cb1-output">{{ pick() ?? "none" }}</output>
      </section>
      <section data-fixture="menu-more">
        <div class="bar">
          <button type="button" data-testid="mm1-outside" (click)="outside.set(outside() + 1)">
            Outside
          </button>
          <ng-container kuiMenu [kuiId]="'mm1'" [modal]="true">
            <button kuiMenuTrigger data-testid="mm1-trigger">Modal</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="mm1-positioner">
                <div kuiMenuPopup class="popup" data-testid="mm1-popup">
                  <div kuiMenuItem class="item" data-testid="mm1-plain">Plain</div>
                  <a kuiMenuLinkItem class="item" href="#mm1-linked" data-testid="mm1-link">Link</a>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div kuiMenubar [kuiId]="'vb1'" [orientation]="'vertical'" class="column" data-testid="vb1">
          <ng-container kuiMenu [kuiId]="'vb1a'">
            <button kuiMenuTrigger data-testid="vb1-one">One</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="vb1a-positioner">
                <div kuiMenuPopup class="popup" data-testid="vb1a-popup">
                  <div kuiMenuItem class="item" data-testid="vb1a-x">Alpha</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiMenu [kuiId]="'vb1b'">
            <button kuiMenuTrigger data-testid="vb1-two">Two</button>
            <ng-template kuiMenuPortal>
              <div kuiMenuPositioner data-testid="vb1b-positioner">
                <div kuiMenuPopup class="popup" data-testid="vb1b-popup">
                  <div kuiMenuItem class="item" data-testid="vb1b-x">Beta</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <output data-testid="mm1-output">{{ outside() }}</output>
      </section>
      <section data-fixture="toolbar">
        <div kuiToggleGroup aria-label="Alignment" [(value)]="align" class="bar" data-testid="tg1">
          <button kuiToggle [value]="'left'" data-testid="tg1-left">Left</button>
          <button kuiToggle [value]="'centre'" data-testid="tg1-centre">Centre</button>
          <button kuiToggle [value]="'justify'" [disabled]="true" data-testid="tg1-justify">
            Justify
          </button>
          <button kuiToggle [value]="'right'" data-testid="tg1-right">Right</button>
        </div>
        <output data-testid="tg1-output">{{ align().join(",") }}</output>
        <div kuiToolbar aria-label="Editing" class="bar" data-testid="tb1">
          <button kuiToolbarButton data-testid="tb1-save">Save</button>
          <button kuiToolbarButton [disabled]="true" data-testid="tb1-gone">Gone</button>
          <a kuiToolbarLink href="#tb1-help" data-testid="tb1-link">Help</a>
          <div kuiToolbarSeparator data-testid="tb1-line"></div>
          <input kuiToolbarInput aria-label="Zoom" value="100" data-testid="tb1-zoom" />
          <div kuiToolbarGroup data-testid="tb1-group">
            <div
              kuiToggleGroup
              [multiple]="true"
              aria-label="Marks"
              class="bar"
              data-testid="tb1-marks"
            >
              <button kuiToggle [value]="'bold'" data-testid="tb1-bold">Bold</button>
              <button kuiToggle [value]="'italic'" data-testid="tb1-italic">Italic</button>
            </div>
          </div>
          <button kuiToggle data-testid="tb1-pin">Pin</button>
        </div>
      </section>
      <section data-fixture="scroll-area">
        <div kuiScrollArea class="scroll" data-testid="sa1">
          <div kuiScrollAreaViewport class="scroll-view" data-testid="sa1-view">
            <div kuiScrollAreaContent data-testid="sa1-content">
              <div [class]="tall() ? 'scroll-tall' : 'scroll-short'" data-testid="sa1-box">
                Content
              </div>
            </div>
          </div>
          <div *kuiScrollAreaScrollbar class="scroll-bar" data-testid="sa1-y">
            <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa1-y-thumb"></div>
          </div>
          <div *kuiScrollAreaScrollbar="'horizontal'" class="scroll-bar" data-testid="sa1-x">
            <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa1-x-thumb"></div>
          </div>
          <div *kuiScrollAreaCorner class="scroll-corner" data-testid="sa1-corner"></div>
        </div>
        <button type="button" data-testid="sa1-grow" (click)="tall.set(!tall())">Grow</button>
        <div kuiScrollArea class="scroll-wide" data-testid="sa2">
          <div kuiScrollAreaViewport class="scroll-view" data-testid="sa2-view">
            <div class="scroll-pictures" data-testid="sa2-row">
              <div class="scroll-figure">
                <img
                  class="scroll-picture"
                  [attr.src]="rowLoaded() ? wide : null"
                  alt=""
                  data-testid="sa2-picture-1"
                />
              </div>
              <div class="scroll-figure">
                <img
                  class="scroll-picture"
                  [attr.src]="rowLoaded() ? wide : null"
                  alt=""
                  data-testid="sa2-picture-2"
                />
              </div>
              <div class="scroll-figure">
                <img
                  class="scroll-picture"
                  [attr.src]="rowLoaded() ? wide : null"
                  alt=""
                  data-testid="sa2-picture-3"
                />
              </div>
            </div>
            <div *kuiScrollAreaScrollbar="'horizontal'" class="scroll-bar" data-testid="sa2-x">
              <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa2-x-thumb"></div>
            </div>
          </div>
          <div *kuiScrollAreaScrollbar class="scroll-bar" data-testid="sa2-y">
            <div kuiScrollAreaThumb class="scroll-thumb" data-testid="sa2-y-thumb"></div>
          </div>
          <div *kuiScrollAreaCorner class="scroll-corner" data-testid="sa2-corner"></div>
        </div>
        <button type="button" data-testid="sa2-load" (click)="rowLoaded.set(true)">
          Load pictures
        </button>
      </section>
      <section data-fixture="navigation-menu">
        <nav kuiNavigationMenu [kuiId]="'nm1'" aria-label="Site" data-testid="nm1">
          <ul kuiNavigationMenuList class="nav-list" data-testid="nm1-list">
            <li kuiNavigationMenuItem [value]="'products'">
              <button kuiNavigationMenuTrigger class="nav-trigger" data-testid="nm1-products">
                <span>Products</span>
                <span kuiNavigationMenuIcon>▾</span>
              </button>
              <div *kuiNavigationMenuContent class="nav-content" data-testid="nm1-products-content">
                <a kuiNavigationMenuLink href="#apps" data-testid="nm1-apps">apps</a>
                <a kuiNavigationMenuLink href="#tools" data-testid="nm1-tools">tools</a>
              </div>
            </li>
            <li kuiNavigationMenuItem>
              <button kuiNavigationMenuTrigger class="nav-trigger" data-testid="nm1-docs">
                <span>Docs</span>
                <span kuiNavigationMenuIcon>▾</span>
              </button>
              <div
                *kuiNavigationMenuContent
                class="nav-content nav-narrow"
                data-testid="nm1-docs-content"
              >
                <a kuiNavigationMenuLink href="#guide" data-testid="nm1-guide">guide</a>
              </div>
            </li>
            <li kuiNavigationMenuItem>
              <a kuiNavigationMenuLink href="#pricing" [active]="true" data-testid="nm1-pricing">
                Pricing
              </a>
            </li>
          </ul>
          <ng-template kuiNavigationMenuPortal>
            <div kuiNavigationMenuPositioner [sideOffset]="4" data-testid="nm1-positioner">
              <div kuiNavigationMenuPopup class="popup" data-testid="nm1-popup">
                <div kuiNavigationMenuViewport data-testid="nm1-viewport"></div>
              </div>
            </div>
          </ng-template>
        </nav>
      </section>
      <section data-fixture="virtual">
        <div
          kuiListbox
          [kuiId]="'vl1'"
          aria-label="Rows"
          [virtualized]="rows"
          class="virtual"
          data-testid="vl1"
          (scroll)="first.set(firstRow($any($event.currentTarget).scrollTop))"
        >
          <div class="virtual-space">
            @for (each of rowsFrom(first()); track each) {
              <div
                kuiListboxItem
                [value]="each"
                [index]="each"
                class="item virtual-row"
                [style.top.px]="each * 24"
                [attr.data-testid]="'vl1-' + each"
              >
                {{ "Row " + each }}
              </div>
            }
          </div>
        </div>
        <ng-container
          kuiCombobox
          [kuiId]="'cp1'"
          [inline]="true"
          [autoHighlight]="true"
          (valueChanged)="ran.set($event.value)"
        >
          <input kuiComboboxInput aria-label="Command" data-testid="cp1-input" />
          <div kuiComboboxPopup class="palette" aria-label="Commands" data-testid="cp1-list">
            @for (each of commands; track each) {
              <div
                kuiComboboxItem
                [value]="each"
                [kuiId]="'cp1-' + each"
                class="item"
                [attr.data-testid]="'cp1-' + each"
              >
                {{ each }}
              </div>
            }
            <div *kuiComboboxEmpty data-testid="cp1-empty">Nothing found</div>
          </div>
        </ng-container>
        <output data-testid="cp1-output">{{ ran() }}</output>
        <div kuiField [kuiId]="'fcb'" [name]="'city'" data-testid="fcb">
          <label kuiFieldLabel data-testid="fcb-label">City</label>
          <ng-container kuiCombobox [kuiId]="'fcbc'" [required]="true" [autoHighlight]="true">
            <input kuiComboboxInput data-testid="fcb-input" />
            <button *kuiComboboxClear aria-label="Clear" data-testid="fcb-clear">×</button>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner data-testid="fcb-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Cities" data-testid="fcb-popup">
                  <div
                    kuiComboboxItem
                    [value]="'Oslo'"
                    [kuiId]="'fcb-Oslo'"
                    class="item"
                    data-testid="fcb-Oslo"
                  >
                    Oslo
                  </div>
                  <div
                    kuiComboboxItem
                    [value]="'Rome'"
                    [kuiId]="'fcb-Rome'"
                    class="item"
                    data-testid="fcb-Rome"
                  >
                    Rome
                  </div>
                </div>
              </div>
            </ng-template>
            <input kuiComboboxHiddenInput />
          </ng-container>
        </div>
        <form data-testid="cbm-form">
          <ng-container
            kuiCombobox
            [kuiId]="'cbm'"
            [name]="'tags'"
            [multiple]="true"
            [autoHighlight]="true"
            [(values)]="tags"
          >
            <div kuiComboboxChips class="bar" data-testid="cbm-chips">
              @for (each of tags(); track each) {
                <span
                  kuiComboboxChip
                  [value]="each"
                  class="chip"
                  [attr.data-testid]="'cbm-chip-' + each"
                >
                  <span>{{ each }}</span>
                  <button
                    kuiComboboxChipRemove
                    [attr.aria-label]="'Remove ' + each"
                    [attr.data-testid]="'cbm-remove-' + each"
                  >
                    ×
                  </button>
                </span>
              }
              <input kuiComboboxInput aria-label="Tags" data-testid="cbm-input" />
            </div>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner data-testid="cbm-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Tags" data-testid="cbm-popup">
                  @for (each of commands; track each) {
                    <div
                      kuiComboboxItem
                      [value]="each"
                      [kuiId]="'cbm-' + each"
                      class="item"
                      [attr.data-testid]="'cbm-' + each"
                    >
                      {{ each }}
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kuiComboboxHiddenInput />
          </ng-container>
        </form>
      </section>
      <section data-fixture="widgets">
        <form data-testid="otp1-form">
          <div
            kuiOtp
            [kuiId]="'otp1'"
            [length]="4"
            [name]="'code'"
            class="otp"
            data-testid="otp1"
            (completed)="code.set($event)"
          >
            <input kuiOtpInput aria-label="Code" class="otp-input" data-testid="otp1-input" />
            <div kuiOtpGroup class="otp-group">
              <div kuiOtpSlot [index]="0" class="otp-slot" data-testid="otp1-0">
                <div *kuiOtpCaret class="otp-caret"></div>
              </div>
              <div kuiOtpSlot [index]="1" class="otp-slot" data-testid="otp1-1">
                <div *kuiOtpCaret class="otp-caret"></div>
              </div>
            </div>
            <div kuiOtpSeparator class="otp-mark"></div>
            <div kuiOtpGroup class="otp-group">
              <div kuiOtpSlot [index]="2" class="otp-slot" data-testid="otp1-2">
                <div *kuiOtpCaret class="otp-caret"></div>
              </div>
              <div kuiOtpSlot [index]="3" class="otp-slot" data-testid="otp1-3">
                <div *kuiOtpCaret class="otp-caret"></div>
              </div>
            </div>
          </div>
        </form>
        <output data-testid="otp1-output">{{ code() }}</output>
        <div class="otp-row">
          <div
            kuiOtp
            [kuiId]="'otp2'"
            [length]="2"
            [mode]="'alphabetic'"
            class="otp"
            data-testid="otp2"
          >
            <input kuiOtpInput aria-label="Letters" class="otp-input" data-testid="otp2-input" />
            <div kuiOtpGroup class="otp-group">
              <div kuiOtpSlot [index]="0" class="otp-slot" data-testid="otp2-0"></div>
              <div kuiOtpSlot [index]="1" class="otp-slot" data-testid="otp2-1"></div>
            </div>
          </div>
          <div
            kuiOtp
            [kuiId]="'otp3'"
            [length]="3"
            [pattern]="'[A-F0-9]'"
            class="otp"
            data-testid="otp3"
          >
            <input kuiOtpInput aria-label="Hex" class="otp-input" data-testid="otp3-input" />
            <div kuiOtpGroup class="otp-group">
              <div kuiOtpSlot [index]="0" class="otp-slot" data-testid="otp3-0"></div>
              <div kuiOtpSlot [index]="1" class="otp-slot" data-testid="otp3-1"></div>
              <div kuiOtpSlot [index]="2" class="otp-slot" data-testid="otp3-2"></div>
            </div>
          </div>
        </div>
        <div
          kuiResizableGroup
          [kuiId]="'rs1'"
          class="split"
          data-testid="rs1"
          (sizesChanged)="shares.set(rounded($event.sizes))"
        >
          <div
            kuiResizablePanel
            [defaultSize]="25"
            [minSize]="10"
            class="split-panel"
            data-testid="rs1-a"
          >
            A
          </div>
          <div kuiResizableHandle aria-label="Resize" class="split-bar" data-testid="rs1-bar"></div>
          <div kuiResizablePanel [defaultSize]="75" class="split-panel" data-testid="rs1-b">B</div>
        </div>
        <output data-testid="rs1-output">{{ shares() }}</output>
      </section>
      <section data-fixture="pieces">
        <div
          kuiQrCode
          [kuiId]="'qr1'"
          [value]="'https://kirana.style'"
          class="qr"
          data-testid="qr1"
        >
          <svg kuiQrCodeFrame aria-label="A link" class="qr-frame" data-testid="qr1-frame">
            <path kuiQrCodePattern data-testid="qr1-pattern" />
          </svg>
        </div>
        <textarea
          kuiAutosizeTextarea
          aria-label="Note"
          rows="1"
          class="note"
          data-testid="au1"
        ></textarea>
        <div
          kuiCarousel
          [kuiId]="'cr1'"
          aria-label="Pictures"
          class="carousel"
          data-testid="cr1"
          (indexChanged)="slide.set('' + $event.index)"
        >
          <div kuiCarouselViewport class="carousel-view" data-testid="cr1-view">
            <div kuiCarouselItem [index]="0" class="carousel-item" data-testid="cr1-0">One</div>
            <div kuiCarouselItem [index]="1" class="carousel-item" data-testid="cr1-1">Two</div>
            <div kuiCarouselItem [index]="2" class="carousel-item" data-testid="cr1-2">Three</div>
          </div>
          <button kuiCarouselPrevious data-testid="cr1-previous">Previous</button>
          <button kuiCarouselNext data-testid="cr1-next">Next</button>
          <button
            kuiCarouselIndicator
            [index]="0"
            aria-label="Slide 1"
            data-testid="cr1-dot-0"
          ></button>
          <button
            kuiCarouselIndicator
            [index]="1"
            aria-label="Slide 2"
            data-testid="cr1-dot-1"
          ></button>
          <button
            kuiCarouselIndicator
            [index]="2"
            aria-label="Slide 3"
            data-testid="cr1-dot-2"
          ></button>
        </div>
        <output data-testid="cr1-output">{{ slide() }}</output>
      </section>
      <section data-fixture="toast">
        <button
          type="button"
          data-testid="ts1-add"
          (click)="
            toaster.add({ title: 'Saved', description: 'Your changes are kept.', type: 'success' })
          "
        >
          Add a toast
        </button>
        <button
          type="button"
          data-testid="ts1-brief"
          (click)="toaster.add({ title: 'Gone soon', duration: 300 })"
        >
          Add a brief toast
        </button>
        <button type="button" data-testid="ts1-undo" (click)="addToastWithAction()">
          Add a toast with an action
        </button>
        <button
          type="button"
          data-testid="ts1-alert"
          (click)="toaster.add({ title: 'Connection lost', type: 'error', priority: 'assertive' })"
        >
          Add an urgent toast
        </button>
        <output data-testid="ts1-output">{{ toastAction() }}</output>
        <div kuiToastViewport [kuiId]="'ts1'" [toaster]="toaster" class="toasts" data-testid="ts1">
          <div
            *kuiToastList="let toast"
            kuiToastRoot
            [toast]="toast"
            class="toast"
            [attr.data-testid]="'ts1-' + toast.id"
          >
            <div
              kuiToastContent
              class="toast-content"
              [attr.data-testid]="'ts1-' + toast.id + '-content'"
            >
              <div kuiToastTitle class="toast-title">{{ toast.title }}</div>
              @if (toast.description) {
                <div kuiToastDescription></div>
              }
            </div>
            @if (toast.action) {
              <button kuiToastAction [attr.data-testid]="'ts1-' + toast.id + '-action'"></button>
            }
            <button
              kuiToastClose
              aria-label="Close"
              [attr.data-testid]="'ts1-' + toast.id + '-close'"
            >
              Close
            </button>
          </div>
        </div>
      </section>
      <section data-fixture="sheets">
        <ng-container
          kuiDrawer
          [kuiId]="'dw1'"
          (openChanged)="drawn.set($event.open ? 'open' : $event.details.reason)"
        >
          <button kuiDialogTrigger data-testid="dw1-trigger">Open drawer</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="dw1-backdrop"></div>
            <div kuiDialogPopup class="drawer" data-testid="dw1-popup">
              <h2 kuiDialogTitle>Filters</h2>
              <button type="button" data-testid="dw1-apply">Apply</button>
              <button kuiDialogClose data-testid="dw1-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="dw1-output">{{ drawn() }}</output>
        <ng-container
          kuiDrawer
          [kuiId]="'dw2'"
          [snapPoints]="[0.5, 1]"
          (snapPointChanged)="rests.set('' + $event.snapPoint)"
        >
          <button kuiDialogTrigger data-testid="dw2-trigger">Open a drawer that rests</button>
          <ng-template kuiDialogPortal>
            <div kuiDialogBackdrop class="backdrop" data-testid="dw2-backdrop"></div>
            <div kuiDialogPopup class="drawer" data-testid="dw2-popup">
              <h2 kuiDialogTitle>Details</h2>
              <button kuiDialogClose data-testid="dw2-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="dw2-output">{{ rests() }}</output>
        <div kuiMessageScroller [kuiId]="'ms1'" class="chat" data-testid="ms1">
          <div kuiMessageScrollerViewport class="chat-view" data-testid="ms1-view">
            <div kuiMessageScrollerContent class="chat-lines" data-testid="ms1-content">
              @for (line of lines(); track line) {
                <p class="chat-line">Message {{ line }}</p>
              }
            </div>
          </div>
          <button kuiMessageScrollerButton data-testid="ms1-button">Newest</button>
        </div>
        <button type="button" data-testid="ms1-add" (click)="said.set(said() + 1)">
          Add a message
        </button>
      </section>
      <section data-fixture="dates">
        <div
          kuiCalendar
          [kuiId]="'cal1'"
          [locale]="'en-US'"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar"
          data-testid="cal1"
          (valueChanged)="dated.set('' + $event.value)"
        >
          <button kuiCalendarPrevious aria-label="Previous month" data-testid="cal1-previous">
            Previous
          </button>
          <div kuiCalendarHeading data-testid="cal1-heading"></div>
          <button kuiCalendarNext aria-label="Next month" data-testid="cal1-next">Next</button>
          <table kuiCalendarGrid data-testid="cal1-grid">
            <thead>
              <tr>
                <th *kuiCalendarWeekdays="let weekday" kuiCalendarHeadCell [weekday]="weekday">
                  {{ weekday.short }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *kuiCalendarWeeks="let week">
                @for (day of week; track day.date) {
                  <td kuiCalendarCell [date]="day.date">
                    <button
                      kuiCalendarDay
                      [date]="day.date"
                      [attr.data-testid]="'cal1-' + day.date"
                    >
                      {{ day.label }}
                    </button>
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </div>
        <output data-testid="cal1-output">{{ dated() }}</output>
        <form data-testid="df1-form">
          <div
            kuiDateField
            [kuiId]="'df1'"
            [locale]="'en-US'"
            [name]="'born'"
            aria-label="Date of birth"
            class="date-field"
            data-testid="df1"
            (valueChanged)="born.set('' + $event.value)"
          >
            <span
              *kuiDateFieldSegments="let segment"
              kuiDateFieldSegment
              [segment]="segment"
              [attr.data-testid]="'df1-' + segment.type + '-' + segment.index"
            ></span>
            <input kuiDateFieldInput />
          </div>
        </form>
        <output data-testid="df1-output">{{ born() }}</output>
      </section>
      <section data-fixture="calendars">
        <div
          kuiCalendar
          [kuiId]="'cal2'"
          [locale]="'en-US'"
          [mode]="'range'"
          [months]="2"
          [defaultMonth]="'2026-03-01'"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar calendar-months"
          data-testid="cal2"
          (valueChanged)="stay.set(json($event.value))"
        >
          <button kuiCalendarPrevious aria-label="Previous month" data-testid="cal2-previous">
            Previous
          </button>
          <button kuiCalendarNext aria-label="Next month" data-testid="cal2-next">Next</button>
          <div class="months">
            <div *kuiCalendarMonths="let month" [attr.data-testid]="'cal2-month-' + month.index">
              <div kuiCalendarHeading [attr.data-testid]="'cal2-heading-' + month.index"></div>
              <table kuiCalendarGrid [attr.data-testid]="'cal2-grid-' + month.index">
                <thead>
                  <tr>
                    <th *kuiCalendarWeekdays="let weekday" kuiCalendarHeadCell [weekday]="weekday">
                      {{ weekday.short }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *kuiCalendarWeeks="let week">
                    @for (day of week; track day.date) {
                      <td kuiCalendarCell [date]="day.date">
                        <button
                          kuiCalendarDay
                          [date]="day.date"
                          [attr.data-testid]="'cal2-' + month.index + '-' + day.date"
                        >
                          {{ day.label }}
                        </button>
                      </td>
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <output data-testid="cal2-output">{{ stay() }}</output>
        <form data-testid="cal3-form">
          <div
            kuiCalendar
            [kuiId]="'cal3'"
            [locale]="'en-US'"
            [mode]="'multiple'"
            [name]="'days'"
            [maxDays]="3"
            [defaultValue]="['2026-03-02']"
            [defaultFocusedValue]="'2026-03-15'"
            class="calendar"
            data-testid="cal3"
            (valueChanged)="chosenDays.set('' + $event.value)"
          >
            <div kuiCalendarHeading data-testid="cal3-heading"></div>
            <table kuiCalendarGrid data-testid="cal3-grid">
              <tbody>
                <tr *kuiCalendarWeeks="let week">
                  @for (day of week; track day.date) {
                    <td kuiCalendarCell [date]="day.date">
                      <button
                        kuiCalendarDay
                        [date]="day.date"
                        [attr.data-testid]="'cal3-' + day.date"
                      >
                        {{ day.label }}
                      </button>
                    </td>
                  }
                </tr>
              </tbody>
            </table>
            <input kuiCalendarInput data-testid="cal3-input" />
          </div>
          <button type="reset" data-testid="cal3-reset">Reset</button>
        </form>
        <output data-testid="cal3-output">{{ chosenDays() }}</output>
        <div
          kuiCalendar
          [kuiId]="'cal4'"
          [locale]="'en-US'"
          [(month)]="shownMonth"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar"
          data-testid="cal4"
        >
          <button kuiCalendarPrevious aria-label="Previous month" data-testid="cal4-previous">
            Previous
          </button>
          <div kuiCalendarHeading data-testid="cal4-heading"></div>
          <button kuiCalendarNext aria-label="Next month" data-testid="cal4-next">Next</button>
          <table kuiCalendarGrid data-testid="cal4-grid">
            <tbody>
              <tr *kuiCalendarWeeks="let week">
                @for (day of week; track day.date) {
                  <td kuiCalendarCell [date]="day.date">
                    <button
                      kuiCalendarDay
                      [date]="day.date"
                      [attr.data-testid]="'cal4-' + day.date"
                    >
                      {{ day.label }}
                    </button>
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" data-testid="cal4-jump" (click)="shownMonth.set('2030-12-01')">
          December 2030
        </button>
        <output data-testid="cal4-output">{{ shownMonth() }}</output>
      </section>
      <section data-fixture="command">
        <label kuiLabel for="in1" data-testid="in1-label">Name</label>
        <input kuiInput id="in1" data-testid="in1" (valueChanged)="named.set($event.value)" />
        <output data-testid="in1-output">{{ named() }}</output>
        <div kuiField [kuiId]="'in2'" [name]="'email'" data-testid="in2">
          <label kuiLabel data-testid="in2-label">Email</label>
          <input kuiInput type="email" required data-testid="in2-input" />
        </div>
        <div
          kuiCommand
          [kuiId]="'cm1'"
          [loop]="true"
          class="command"
          data-testid="cm1"
          (itemSelected)="did.set($event.value)"
        >
          <input kuiCommandInput aria-label="Command" data-testid="cm1-input" />
          <div kuiCommandList class="palette" aria-label="Commands" data-testid="cm1-list">
            <div kuiCommandGroup [kuiId]="'cm1-file'" data-testid="cm1-file">
              <div kuiCommandGroupHeading data-testid="cm1-file-heading">File</div>
              <div
                kuiCommandItem
                [value]="'new'"
                [kuiId]="'cm1-new'"
                class="item"
                data-testid="cm1-new"
              >
                New
              </div>
              <div
                kuiCommandItem
                [value]="'open'"
                [kuiId]="'cm1-open'"
                [keywords]="load"
                class="item"
                data-testid="cm1-open"
              >
                Open
              </div>
            </div>
            <div kuiCommandSeparator class="separator" data-testid="cm1-separator"></div>
            <div kuiCommandGroup [kuiId]="'cm1-edit'" data-testid="cm1-edit">
              <div kuiCommandGroupHeading data-testid="cm1-edit-heading">Edit</div>
              <div
                kuiCommandItem
                [value]="'copy'"
                [kuiId]="'cm1-copy'"
                class="item"
                data-testid="cm1-copy"
              >
                Copy
              </div>
              <div
                kuiCommandItem
                [value]="'paste'"
                [kuiId]="'cm1-paste'"
                [disabled]="true"
                class="item"
                data-testid="cm1-paste"
              >
                Paste
              </div>
            </div>
            <div *kuiCommandEmpty data-testid="cm1-empty">Nothing found</div>
          </div>
        </div>
        <output data-testid="cm1-output">{{ did() }}</output>
      </section>
      <section data-fixture="slider">
        <div kuiSlider [kuiId]="'sl1'" [defaultValue]="40" [name]="'volume'" data-testid="sl1">
          <output kuiSliderValue data-testid="sl1-value"></output>
          <div kuiSliderControl class="slider" data-testid="sl1-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl1-fill"></div>
              <div kuiSliderThumb class="thumb" aria-label="Volume" data-testid="sl1-thumb"></div>
            </div>
          </div>
        </div>
        <div kuiSlider [kuiId]="'sl2'" [(value)]="span" [step]="5" data-testid="sl2">
          <output kuiSliderValue data-testid="sl2-value"></output>
          <div kuiSliderControl class="slider" data-testid="sl2-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl2-fill"></div>
              <div
                kuiSliderThumb
                [index]="0"
                class="thumb"
                aria-label="From"
                data-testid="sl2-from"
              ></div>
              <div
                kuiSliderThumb
                [index]="1"
                class="thumb"
                aria-label="To"
                data-testid="sl2-to"
              ></div>
            </div>
          </div>
        </div>
        <span data-testid="sl2-output">{{ list(span()).join(",") }}</span>
        <div
          kuiSlider
          [kuiId]="'sl3'"
          [defaultValue]="30"
          [orientation]="'vertical'"
          [disabled]="true"
          data-testid="sl3"
        >
          <div kuiSliderControl class="slider" data-testid="sl3-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl3-fill"></div>
              <div kuiSliderThumb class="thumb" aria-label="Level" data-testid="sl3-thumb"></div>
            </div>
          </div>
        </div>
        <div kuiSlider [kuiId]="'sl5'" [defaultValue]="[20, 50, 80]" data-testid="sl5">
          <div kuiSliderControl class="slider" data-testid="sl5-control">
            <div kuiSliderTrack class="slider-track">
              @if (low()) {
                <div kuiSliderThumb class="thumb" aria-label="Low" data-testid="sl5-low"></div>
              }
              <div kuiSliderThumb class="thumb" aria-label="Middle" data-testid="sl5-middle"></div>
              <div kuiSliderThumb class="thumb" aria-label="High" data-testid="sl5-high"></div>
            </div>
          </div>
        </div>
        <button data-testid="sl5-toggle" (click)="low.set(!low())">Low</button>
      </section>
      <section data-fixture="measures">
        <div
          kuiSlider
          [kuiId]="'sl4'"
          [defaultValue]="0"
          [thumbAlignment]="'edge'"
          data-testid="sl4"
        >
          <div kuiSliderControl class="slider" data-testid="sl4-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill" data-testid="sl4-fill"></div>
              <div
                kuiSliderThumb
                class="thumb thumb-inside"
                aria-label="Inside"
                data-testid="sl4-thumb"
              ></div>
            </div>
          </div>
        </div>
        <ng-container kuiSelect [kuiId]="'s3'" [defaultValue]="'Cherry'">
          <button kuiSelectTrigger class="select-trigger" data-testid="s3-trigger">
            <span kuiSelectValue data-testid="s3-value"></span>
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [alignItemWithTrigger]="true" data-testid="s3-positioner">
              <div kuiSelectPopup class="popup" data-testid="s3-popup">
                @for (each of fruits; track each) {
                  <div kuiSelectItem [value]="each" class="item" [attr.data-testid]="'s3-' + each">
                    <span kuiSelectItemText [attr.data-testid]="'s3-' + each + '-text'">{{
                      each
                    }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="entry">
        <div
          kuiNumberField
          [kuiId]="'nf1'"
          [name]="'qty'"
          [defaultValue]="5"
          [min]="0"
          [max]="10"
          class="number-field"
          data-testid="nf1"
          (valueChanged)="qty.set('' + $event.value)"
        >
          <span kuiNumberFieldScrubArea class="scrub" data-testid="nf1-scrub">
            <span>Quantity</span>
            <span *kuiNumberFieldScrubAreaCursor class="scrub-cursor"></span>
          </span>
          <div kuiNumberFieldGroup class="number-group" data-testid="nf1-group">
            <button kuiNumberFieldDecrement data-testid="nf1-down">-</button>
            <input kuiNumberFieldInput aria-label="Quantity" data-testid="nf1-input" />
            <button kuiNumberFieldIncrement data-testid="nf1-up">+</button>
          </div>
        </div>
        <output data-testid="nf1-output">{{ qty() }}</output>
        <ng-container
          kuiAutocomplete
          [kuiId]="'ac1'"
          [name]="'place'"
          (valueChanged)="place.set('' + $event.value)"
        >
          <input kuiComboboxInput aria-label="Place" data-testid="ac1-input" />
          <ng-template kuiComboboxPortal>
            <div kuiComboboxPositioner [sideOffset]="4" data-testid="ac1-positioner">
              <div kuiComboboxPopup class="popup" aria-label="Places" data-testid="ac1-popup">
                @for (each of places; track each) {
                  <div
                    kuiComboboxItem
                    [value]="each"
                    [kuiId]="'ac1-' + each"
                    class="item"
                    [attr.data-testid]="'ac1-' + each"
                  >
                    {{ each }}
                  </div>
                }
                <div *kuiComboboxEmpty data-testid="ac1-empty">No place</div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="ac1-output">{{ place() }}</output>
        <ng-container kuiSelect [kuiId]="'s4'" [defaultValue]="'Row 1'">
          <button kuiSelectTrigger data-testid="s4-trigger">
            <span kuiSelectValue data-testid="s4-value"></span>
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [sideOffset]="4" data-testid="s4-positioner">
              <div kuiSelectPopup class="popup arrowed" data-testid="s4-popup">
                <div *kuiSelectScrollUpArrow class="scroll-arrow" data-testid="s4-up"></div>
                <div kuiSelectList class="arrowed-list" data-testid="s4-list">
                  @for (each of numbered; track each) {
                    <div
                      kuiSelectItem
                      [value]="each"
                      class="item"
                      [attr.data-testid]="'s4-' + each"
                    >
                      <span kuiSelectItemText>{{ each }}</span>
                    </div>
                  }
                </div>
                <div *kuiSelectScrollDownArrow class="scroll-arrow" data-testid="s4-down"></div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="picking">
        <ng-container
          kuiDatePicker
          [kuiId]="'dk1'"
          [locale]="'en-US'"
          [name]="'due'"
          [defaultValue]="'2026-03-14'"
          (valueChanged)="due.set('' + $event.value)"
        >
          <div kuiDatePickerField aria-label="Due" class="date-field" data-testid="dk1-field">
            <span
              *kuiDateFieldSegments="let segment"
              kuiDateFieldSegment
              [segment]="segment"
              [attr.data-testid]="'dk1-' + segment.type + '-' + segment.index"
            ></span>
            <input kuiDateFieldInput />
          </div>
          <button kuiPopoverTrigger aria-label="Pick a day" data-testid="dk1-trigger">Pick</button>
          <ng-template kuiPopoverPortal>
            <div kuiPopoverPositioner [sideOffset]="4" data-testid="dk1-positioner">
              <div kuiPopoverPopup class="popup" aria-label="Calendar" data-testid="dk1-popup">
                <div kuiDatePickerCalendar class="calendar" data-testid="dk1-calendar">
                  <button
                    kuiCalendarPrevious
                    aria-label="Previous month"
                    data-testid="dk1-previous"
                  >
                    Previous
                  </button>
                  <div kuiCalendarHeading data-testid="dk1-heading"></div>
                  <button kuiCalendarNext aria-label="Next month" data-testid="dk1-next">
                    Next
                  </button>
                  <table kuiCalendarGrid data-testid="dk1-grid">
                    <thead>
                      <tr>
                        <th
                          *kuiCalendarWeekdays="let weekday"
                          kuiCalendarHeadCell
                          [weekday]="weekday"
                        >
                          {{ weekday.short }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *kuiCalendarWeeks="let week">
                        @for (day of week; track day.date) {
                          <td kuiCalendarCell [date]="day.date">
                            <button
                              kuiCalendarDay
                              [date]="day.date"
                              [attr.data-testid]="'dk1-' + day.date"
                            >
                              {{ day.label }}
                            </button>
                          </td>
                        }
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="dk1-output">{{ due() }}</output>
        <nav
          kuiPagination
          [kuiId]="'pg1'"
          [count]="200"
          class="pagination"
          data-testid="pg1"
          (pageChanged)="paged.set('' + $event.page)"
        >
          <button kuiPaginationPrevious data-testid="pg1-previous">Previous</button>
          <ng-container *kuiPaginationItems="let entry">
            @if (entry.type === "page") {
              <button
                kuiPaginationItem
                [page]="entry.page"
                [attr.data-testid]="'pg1-' + entry.page"
              >
                {{ entry.page }}
              </button>
            } @else {
              <span kuiPaginationEllipsis [attr.data-testid]="'pg1-' + entry.key">…</span>
            }
          </ng-container>
          <button kuiPaginationNext data-testid="pg1-next">Next</button>
        </nav>
        <output data-testid="pg1-output">{{ paged() }}</output>
        <ng-container kuiSelect [kuiId]="'s5'" [defaultValue]="'Apple'">
          <button kuiSelectTrigger data-testid="s5-trigger">
            <span kuiSelectValue data-testid="s5-value"></span>
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [sideOffset]="4" data-testid="s5-positioner">
              <div kuiSelectPopup class="popup" data-testid="s5-popup">
                <div kuiSelectGroupLabel data-testid="s5-lone">Produce</div>
                <div kuiSelectGroup [kuiId]="'s5-fruit'" data-testid="s5-fruit">
                  <div kuiSelectGroupLabel data-testid="s5-fruit-label">Fruit</div>
                  <div kuiSelectItem [value]="'Apple'" class="item" data-testid="s5-Apple">
                    <span kuiSelectItemText>Apple</span>
                  </div>
                  <div kuiSelectItem [value]="'Pear'" class="item" data-testid="s5-Pear">
                    <span kuiSelectItemText>Pear</span>
                  </div>
                </div>
                <div kuiSelectSeparator data-testid="s5-separator"></div>
                <div kuiSelectGroup [kuiId]="'s5-roots'" data-testid="s5-roots">
                  <div kuiSelectGroupLabel data-testid="s5-roots-label">Roots</div>
                  <div kuiSelectItem [value]="'Carrot'" class="item" data-testid="s5-Carrot">
                    <span kuiSelectItemText>Carrot</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="groups">
        <ng-container kuiAutocomplete [kuiId]="'ac2'" [defaultValue]="'Par'">
          <input kuiComboboxInput aria-label="City" data-testid="ac2-input" />
          <ng-template kuiComboboxPortal>
            <div kuiComboboxPositioner [sideOffset]="4" data-testid="ac2-positioner">
              <div kuiComboboxPopup class="popup" aria-label="Cities" data-testid="ac2-popup">
                <div kuiComboboxGroupLabel data-testid="ac2-lone">Cities</div>
                <div kuiComboboxGroup [kuiId]="'ac2-north'" data-testid="ac2-north">
                  <div kuiComboboxGroupLabel data-testid="ac2-north-label">North</div>
                  <div
                    kuiComboboxItem
                    [value]="'Oslo'"
                    [kuiId]="'ac2-Oslo'"
                    class="item"
                    data-testid="ac2-Oslo"
                  >
                    Oslo
                  </div>
                </div>
                <div kuiComboboxSeparator data-testid="ac2-separator"></div>
                <div kuiComboboxGroup [kuiId]="'ac2-west'" data-testid="ac2-west">
                  <div kuiComboboxGroupLabel data-testid="ac2-west-label">West</div>
                  <div
                    kuiComboboxItem
                    [value]="'Paris'"
                    [kuiId]="'ac2-Paris'"
                    class="item"
                    data-testid="ac2-Paris"
                  >
                    Paris
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="container">
        <div #pcbox data-testid="pc1-box"></div>
        <ng-container kuiPortalProvider [container]="pcbox">
          <ng-container kuiPopover [kuiId]="'pc1'">
            <button kuiPopoverTrigger data-testid="pc1-trigger">Open in the box</button>
            <ng-template kuiPopoverPortal>
              <div kuiPopoverPositioner [sideOffset]="4" data-testid="pc1-positioner">
                <div kuiPopoverPopup class="popup" aria-label="In the box" data-testid="pc1-popup">
                  Inside
                </div>
              </div>
            </ng-template>
          </ng-container>
        </ng-container>
      </section>
      <section data-fixture="field">
        <form
          kuiForm
          [errors]="rejected()"
          (formSubmit)="sent.set(json($event.values))"
          data-testid="f1"
        >
          <fieldset kuiFieldset [kuiId]="'fs1'" data-testid="fs1">
            <div kuiFieldsetLegend data-testid="fs1-legend">Account</div>
            <div kuiField [kuiId]="'fd1'" [name]="'email'" data-testid="fd1">
              <label kuiFieldLabel data-testid="fd1-label">Email</label>
              <input kuiFieldControl type="email" required data-testid="fd1-control" />
              <p kuiFieldDescription data-testid="fd1-description">Your work address</p>
              <div *kuiFieldError data-testid="fd1-error"></div>
              <ng-container *kuiFieldValidity="let validity">
                <span data-testid="fd1-validity">{{ word(validity.valid) }}</span>
              </ng-container>
            </div>
            <div
              kuiField
              [kuiId]="'fd2'"
              [name]="'user'"
              [validationMode]="'onBlur'"
              [validate]="taken"
              data-testid="fd2"
            >
              <label kuiFieldLabel>User</label>
              <input kuiFieldControl data-testid="fd2-control" />
              <div *kuiFieldError data-testid="fd2-error"></div>
            </div>
          </fieldset>
          <button type="submit" data-testid="f1-submit">Send</button>
        </form>
        <button data-testid="f1-reject" (click)="rejected.set({ user: 'Reserved' })">Reject</button>
        <span data-testid="f1-sent">{{ sent() }}</span>
      </section>
      <section data-fixture="field-controls">
        <form kuiForm (formSubmit)="sent2.set(json($event.values))" data-testid="f2">
          <div kuiField [kuiId]="'fc1'" [name]="'terms'" data-testid="fc1">
            <span kuiCheckbox [required]="true" class="box" data-testid="fc1-box">
              <span *kuiCheckboxIndicator class="mark">✓</span>
            </span>
            <label kuiFieldLabel data-testid="fc1-label">Accept</label>
            <div *kuiFieldError data-testid="fc1-error"></div>
          </div>
          <div kuiField [kuiId]="'fc2'" [name]="'plan'" data-testid="fc2">
            <label kuiFieldLabel data-testid="fc2-label">Plan</label>
            <div kuiRadioGroup [required]="true" data-testid="fc2-group">
              <span kuiRadioGroupItem [value]="'free'" class="radio" data-testid="fc2-free"></span>
              <span kuiRadioGroupItem [value]="'pro'" class="radio" data-testid="fc2-pro"></span>
            </div>
            <div *kuiFieldError data-testid="fc2-error"></div>
          </div>
          <div kuiField [kuiId]="'fc3'" [name]="'level'" [disabled]="true" data-testid="fc3">
            <label kuiFieldLabel>Level</label>
            <div kuiSlider [defaultValue]="10" data-testid="fc3-slider">
              <div kuiSliderControl class="slider">
                <div kuiSliderTrack class="slider-track">
                  <div kuiSliderThumb class="thumb" data-testid="fc3-thumb"></div>
                </div>
              </div>
            </div>
          </div>
          <div kuiField [kuiId]="'fc4'" [name]="'alerts'" data-testid="fc4">
            <label kuiFieldLabel data-testid="fc4-label">Alerts</label>
            <span kuiSwitch class="switch" data-testid="fc4-switch">
              <span kuiSwitchThumb class="thumb"></span>
            </span>
          </div>
          <div kuiField [kuiId]="'fc5'" [name]="'fruit'" data-testid="fc5">
            <label kuiFieldLabel data-testid="fc5-label">Fruit</label>
            <ng-container kuiSelect [kuiId]="'fc5s'" [required]="true">
              <button kuiSelectTrigger data-testid="fc5-trigger">
                <span kuiSelectValue [placeholder]="'Pick a fruit'"></span>
              </button>
              <ng-template kuiSelectPortal>
                <div kuiSelectPositioner [sideOffset]="4">
                  <div kuiSelectPopup class="popup" data-testid="fc5-popup">
                    <div kuiSelectItem [value]="'Apple'" class="item" data-testid="fc5-Apple">
                      <span kuiSelectItemText>Apple</span>
                    </div>
                  </div>
                </div>
              </ng-template>
              <input kuiSelectInput />
            </ng-container>
            <div *kuiFieldError data-testid="fc5-error"></div>
          </div>
          <button type="submit" data-testid="f2-submit">Send</button>
        </form>
        <span data-testid="f2-sent">{{ sent2() }}</span>
      </section>
      <section data-fixture="checkbox-group">
        <form data-testid="cg1-form">
          <div
            kuiCheckboxGroup
            [kuiId]="'cg1'"
            [(value)]="toppings"
            [allValues]="toppingValues"
            class="bar"
            data-testid="cg1"
          >
            <span
              kuiCheckbox
              [parent]="true"
              [kuiId]="'cg1-all-input'"
              class="box"
              aria-label="All"
              data-testid="cg1-all"
            >
              <span *kuiCheckboxIndicator class="mark">✓</span>
            </span>
            @for (each of toppingValues; track each) {
              <span
                kuiCheckbox
                [kuiId]="'cg1-' + each + '-input'"
                [name]="'topping'"
                [value]="each"
                class="box"
                [attr.aria-label]="each"
                [attr.data-testid]="'cg1-' + each"
              >
                <span *kuiCheckboxIndicator class="mark">✓</span>
              </span>
            }
          </div>
          <button type="reset" data-testid="cg1-reset">Reset</button>
        </form>
        <output data-testid="cg1-output">{{ toppings()?.join(",") }}</output>
        <div kuiField [kuiId]="'cg2'" [name]="'extras'" data-testid="cg2">
          <label kuiFieldLabel data-testid="cg2-label">Extras</label>
          <div kuiCheckboxGroup [defaultValue]="['napkins']" class="bar" data-testid="cg2-group">
            @for (each of extras; track each) {
              <span
                kuiCheckbox
                [kuiId]="'cg2-' + each + '-input'"
                [value]="each"
                class="box"
                [attr.aria-label]="each"
                [attr.data-testid]="'cg2-' + each"
              >
                <span *kuiCheckboxIndicator class="mark">✓</span>
              </span>
            }
          </div>
        </div>
      </section>
      <section data-fixture="read-only">
        <div kuiSlider [kuiId]="'ro1'" [defaultValue]="40" [readOnly]="true" data-testid="ro1">
          <div kuiSliderControl class="slider" data-testid="ro1-control">
            <div kuiSliderTrack class="slider-track">
              <div kuiSliderIndicator class="fill"></div>
              <div kuiSliderThumb class="thumb" aria-label="Level" data-testid="ro1-thumb"></div>
            </div>
          </div>
        </div>
        <ng-container kuiSelect [kuiId]="'ro2'" [defaultValue]="'Banana'" [readOnly]="true">
          <button kuiSelectTrigger data-testid="ro2-trigger">
            <span kuiSelectValue data-testid="ro2-value"></span>
          </button>
          <ng-template kuiSelectPortal>
            <div kuiSelectPositioner [sideOffset]="4">
              <div kuiSelectPopup class="popup" data-testid="ro2-popup">
                @for (each of lockedFruits; track each) {
                  <div kuiSelectItem [value]="each" class="item" [attr.data-testid]="'ro2-' + each">
                    <span kuiSelectItemText>{{ each }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="direction">
        <button
          type="button"
          data-testid="dir-turn"
          (click)="reading.set(reading() === 'rtl' ? 'ltr' : 'rtl')"
        >
          Turn
        </button>
        <div [kuiDirection]="reading()" [attr.dir]="reading()" data-testid="dir-box">
          <div kuiTabs [kuiId]="'dt1'" [defaultValue]="'one'" data-testid="dt1">
            <div kuiTabsList class="tabs" data-testid="dt1-list">
              <button kuiTabsTab [value]="'one'" data-testid="dt1-one">One</button>
              <button kuiTabsTab [value]="'two'" data-testid="dt1-two">Two</button>
            </div>
            <div *kuiTabsPanel="'one'">First</div>
            <div *kuiTabsPanel="'two'">Second</div>
          </div>
          <div kuiSlider [kuiId]="'ds1'" [defaultValue]="40" data-testid="ds1">
            <div kuiSliderControl class="slider" data-testid="ds1-control">
              <div kuiSliderTrack class="slider-track">
                <div kuiSliderIndicator class="fill"></div>
                <div kuiSliderThumb class="thumb" aria-label="Volume" data-testid="ds1-thumb"></div>
              </div>
            </div>
          </div>
          <ng-container kuiPopover [kuiId]="'dp1'">
            <button kuiPopoverTrigger data-testid="dp1-trigger">Open popover</button>
            <ng-template kuiPopoverPortal>
              <div
                kuiPopoverPositioner
                [sideOffset]="8"
                [align]="'start'"
                data-testid="dp1-positioner"
              >
                <div kuiPopoverPopup class="popup" data-testid="dp1-popup">
                  <h2 kuiPopoverTitle>Notifications</h2>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </section>

      <section data-fixture="placing">
        <div dir="rtl" data-testid="pl1-box">
          <ng-container kuiPopover [kuiId]="'pl1'">
            <button kuiPopoverTrigger data-testid="pl1-trigger">Beside</button>
            <ng-template kuiPopoverPortal>
              <div
                kuiPopoverPositioner
                [side]="'inline-end'"
                [sideOffset]="8"
                data-testid="pl1-positioner"
              >
                <div kuiPopoverPopup class="popup" data-testid="pl1-popup">
                  <h2 kuiPopoverTitle>Beside</h2>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container kuiPopover [kuiId]="'pl2'">
            <button kuiPopoverTrigger data-testid="pl2-trigger">Anchored</button>
            <span #firstAnchor id="pl2-first" class="anchor" data-testid="pl2-first">First</span>
            <span #secondAnchor id="pl2-second" class="anchor" data-testid="pl2-second"
              >Second</span
            >
            <ng-template kuiPopoverPortal>
              <div
                kuiPopoverPositioner
                [anchor]="moved() ? secondAnchor : firstAnchor"
                [align]="'start'"
                [sideOffset]="4"
                data-testid="pl2-positioner"
              >
                <div kuiPopoverPopup class="popup" data-testid="pl2-popup">
                  <h2 kuiPopoverTitle>Anchored</h2>
                  <button type="button" data-testid="pl2-move" (click)="moved.set(!moved())">
                    Move
                  </button>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container kuiCombobox [kuiId]="'pl3'" [(value)]="sought">
            <button kuiComboboxTrigger data-testid="pl3-trigger">Pick a fruit</button>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner [sideOffset]="4" data-testid="pl3-positioner">
                <div
                  kuiComboboxPopup
                  class="popup"
                  aria-label="Pick a fruit"
                  data-testid="pl3-popup"
                >
                  <input
                    kuiComboboxInput
                    class="search"
                    aria-label="Search fruits"
                    data-testid="pl3-input"
                  />
                  <div kuiComboboxList aria-label="Fruits" data-testid="pl3-list">
                    @for (each of fruits; track each) {
                      <div
                        kuiComboboxItem
                        [value]="each"
                        [kuiId]="'pl3-' + each"
                        class="item"
                        [attr.data-testid]="'pl3-' + each"
                      >
                        {{ each }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <output data-testid="pl3-output">{{ sought() ?? "none" }}</output>
        </div>
      </section>
      <section data-fixture="popover-more">
        <div class="bar">
          <ng-container kuiPopover [kuiId]="'pm1'" [modal]="true">
            <button kuiPopoverTrigger data-testid="pm1-trigger">Modal popover</button>
            <ng-template kuiPopoverPortal>
              <div kuiPopoverBackdrop class="backdrop" data-testid="pm1-backdrop"></div>
              <div
                kuiPopoverPositioner
                [sideOffset]="8"
                [arrowPadding]="8"
                [sticky]="true"
                data-testid="pm1-positioner"
              >
                <div kuiPopoverPopup class="popup pointed" data-testid="pm1-popup">
                  <div kuiPopoverArrow class="arrow" data-testid="pm1-arrow"></div>
                  <h2 kuiPopoverTitle>Modal</h2>
                  <button type="button" data-testid="pm1-first">First</button>
                  <button kuiPopoverClose data-testid="pm1-close">Close</button>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiPopover [kuiId]="'pm2'" [modal]="'trap-focus'">
            <button kuiPopoverTrigger [openOnHover]="true" [delay]="50" data-testid="pm2-trigger">
              Hover popover
            </button>
            <ng-template kuiPopoverPortal>
              <div kuiPopoverPositioner [sideOffset]="8" data-testid="pm2-positioner">
                <div kuiPopoverPopup class="popup" data-testid="pm2-popup">
                  <h2 kuiPopoverTitle>Hovered</h2>
                  <button type="button" data-testid="pm2-first">First</button>
                  <button kuiPopoverClose data-testid="pm2-close">Close</button>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kuiPopover [kuiId]="'pm3'">
            <button kuiPopoverTrigger data-testid="pm3-trigger">Placed popover</button>
            <ng-template kuiPopoverPortal>
              <div
                kuiPopoverPositioner
                [side]="'top'"
                [align]="'start'"
                [positionMethod]="'fixed'"
                [sideOffset]="anchorHigh"
                [collisionPadding]="{ left: 12, right: 12 }"
                [collisionAvoidance]="{ side: 'none' }"
                data-testid="pm3-positioner"
              >
                <div kuiPopoverPopup class="popup" aria-label="Placed" data-testid="pm3-popup">
                  Placed
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </section>
      <section data-fixture="combobox-data">
        <div class="bar">
          <ng-container
            kuiCombobox
            [kuiId]="'cd1'"
            [items]="pantry"
            [autoHighlight]="true"
            (inputValueChanged)="looked.set($event.value)"
          >
            <button kuiComboboxTrigger data-testid="cd1-trigger">
              <span kuiComboboxValue [placeholder]="'Pick one'" data-testid="cd1-value"></span>
            </button>
            <div kuiComboboxStatus data-testid="cd1-status">{{ pantryLeft(looked()) }}</div>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner [sideOffset]="4" data-testid="cd1-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Pantry" data-testid="cd1-popup">
                  <input
                    kuiComboboxInput
                    class="search"
                    aria-label="Search the pantry"
                    data-testid="cd1-input"
                  />
                  <div kuiComboboxList aria-label="Pantry" data-testid="cd1-list">
                    <ng-container *kuiComboboxCollection="let group">
                      <div
                        kuiComboboxGroup
                        [kuiId]="'cd1-g-' + group.label"
                        [attr.data-testid]="'cd1-g-' + group.label"
                      >
                        <div kuiComboboxGroupLabel>{{ group.label }}</div>
                        <ng-container *kuiComboboxCollection="let item of group">
                          <div
                            kuiComboboxItem
                            [value]="item.value"
                            [kuiId]="'cd1-' + item.key"
                            [disabled]="item.disabled"
                            class="item"
                            [attr.data-testid]="'cd1-' + item.key"
                          >
                            {{ item.label }}
                          </div>
                        </ng-container>
                      </div>
                    </ng-container>
                  </div>
                  <div *kuiComboboxEmpty data-testid="cd1-empty">Nothing in the pantry</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container
            kuiCombobox
            [kuiId]="'cd2'"
            [name]="'berry'"
            [items]="berries"
            [defaultValue]="'cherry'"
            [readOnly]="sealed()"
            [autoHighlight]="true"
          >
            <input kuiComboboxInput aria-label="Berry" data-testid="cd2-input" />
            <button *kuiComboboxClear aria-label="Clear the berry" data-testid="cd2-clear">
              ×
            </button>
            <ng-template kuiComboboxPortal>
              <div kuiComboboxPositioner [sideOffset]="4" data-testid="cd2-positioner">
                <div kuiComboboxPopup class="popup" aria-label="Berries" data-testid="cd2-popup">
                  <ng-container *kuiComboboxCollection="let item">
                    <div
                      kuiComboboxItem
                      [value]="item.value"
                      [kuiId]="'cd2-' + item.key"
                      class="item"
                      [attr.data-testid]="'cd2-' + item.key"
                    >
                      {{ item.label }}
                    </div>
                  </ng-container>
                  <div *kuiComboboxEmpty data-testid="cd2-empty">No berry</div>
                </div>
              </div>
            </ng-template>
            <input kuiComboboxHiddenInput />
          </ng-container>
          <button type="button" data-testid="cd2-unlock" (click)="sealed.set(false)">Unlock</button>
        </div>
      </section>
    </main>
  `,
})
export class App {
  protected readonly fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape"]
  protected readonly controlled = signal<boolean | undefined>(false)
  protected readonly fruit = signal<string | null>("Banana")
  // Labels by value: what a select names its values with before its list has been opened.
  protected readonly sizes = { s: "Small", m: "Medium", l: "Large" }
  protected readonly sizeKeys = ["s", "m", "l"] as const
  protected readonly basket = signal(["Banana"])
  protected readonly action = signal("none")
  protected readonly picked = signal("none")
  protected readonly code = signal("none")
  protected readonly shares = signal("25,75")
  protected readonly slide = signal("0")
  protected readonly toastAction = signal("")
  protected readonly drawn = signal("closed")
  protected readonly born = signal("none")
  protected readonly due = signal("2026-03-14")
  protected readonly paged = signal("1")
  protected readonly qty = signal("5")
  protected readonly place = signal("")
  protected readonly named = signal("")
  protected readonly did = signal("none")
  protected readonly dated = signal("none")
  protected readonly stay = signal("none")
  protected readonly chosenDays = signal("none")
  protected readonly shownMonth = signal<string | undefined>("2026-03-01")
  protected readonly rests = signal("0.5")
  protected readonly said = signal(8)
  protected readonly lines = computed(() => Array.from({ length: this.said() }, (_, at) => at + 1))
  // A page's toasts are made once: a long time, so a test reads them.
  protected readonly toaster = createToaster({ duration: 600_000 })

  protected addToastWithAction(): void {
    this.toaster.add({
      title: "Deleted",
      action: { label: "Undo", onAction: () => this.toastAction.set("undone") },
    })
  }
  protected readonly rounded = (sizes: number[]) => sizes.map(Math.round).join(",")
  protected readonly align = signal(["left"])
  protected readonly tall = signal(false)
  protected readonly rowLoaded = signal(false)
  // A picture 160 wide: a row of three is wider than its scroll area once they have loaded.
  protected readonly wide =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40'%3E%3C/svg%3E"
  protected readonly chosen = signal(["Banana"])
  protected readonly pick = signal<string | null>(null)
  protected readonly sought = signal<string | null>(null)
  // A combobox's items as data, in groups: the combobox filters them, and a collection draws them.
  protected readonly pantry = [
    {
      value: "Fruits",
      items: [
        { value: "apple", label: "Apple" },
        { value: "apricot", label: "Apricot" },
        { value: "banana", label: "Banana", disabled: true },
      ],
    },
    {
      value: "Roots",
      items: [
        { value: "beet", label: "Beet" },
        { value: "carrot", label: "Carrot" },
      ],
    },
  ]
  protected readonly berries = [
    { value: "blackberry", label: "Blackberry" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
  ]
  protected readonly looked = signal("")
  protected readonly sealed = signal(true)
  /** What a status says of the pantry for what was typed: how many of its items hold the text. */
  protected pantryLeft(text: string): string {
    if (text === "") return ""
    const all = this.pantry.flatMap((each) => each.items)
    return `${all.filter((each) => each.label.toLowerCase().includes(text.toLowerCase())).length} left`
  }
  protected readonly moved = signal(false)
  // A gap as tall as the anchor: what a positioner asks a function for.
  protected readonly anchorHigh: OffsetFunction = ({ anchor }) => anchor.height
  protected readonly outside = signal(0)
  protected readonly view = signal("list")
  protected readonly presses = signal(0)
  protected readonly locked = signal(false)
  protected readonly handed = signal(0)
  protected readonly asked = signal(0)
  protected readonly marks = signal(0)
  protected readonly tipOff = signal(false)
  // The other adapters give the caller the part's state; here the caller holds it.
  protected readonly layered = signal<boolean | undefined>(false)
  protected readonly count = signal(0)
  protected readonly done = signal<number | null>(40)
  protected readonly pictures = signal(false)
  protected readonly heard = signal<string>("none")
  protected readonly sent = signal("")
  protected readonly sent2 = signal("")
  protected readonly reading = signal<"ltr" | "rtl">("rtl")
  protected readonly rejected = signal<Record<string, string> | undefined>(undefined)
  protected readonly json = (values: unknown) => JSON.stringify(values)
  protected readonly word = (valid: boolean | null) =>
    valid === null ? "unchecked" : valid ? "valid" : "invalid"
  protected readonly taken = (value: string) => (value === "admin" ? "Taken" : null)
  protected readonly span = signal<number | readonly number[] | undefined>([20, 80])
  protected readonly low = signal(true)
  protected readonly list = (value: number | readonly number[] | undefined) =>
    typeof value === "number" ? [value] : (value ?? [])
  // A picture of one pixel, and an address that is not a picture.
  protected readonly pixel =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  protected readonly broken = "data:image/png;base64,AAAA"
  protected readonly alerts = signal<boolean | undefined>(false)
  protected readonly plans = ["free", "pro", "team", "max"]
  protected readonly toppingValues = ["cheese", "ham", "olives"]
  protected readonly toppings = signal<readonly string[] | undefined>(["ham"])
  protected readonly extras = ["napkins", "straw"]
  protected readonly lockedFruits = ["Apple", "Banana"]
  protected readonly commands = ["New", "Open", "Print"]
  protected readonly places = ["Oslo", "Osaka", "Paris"]
  protected readonly numbered = Array.from({ length: 20 }, (_each, at) => `Row ${at + 1}`)
  protected readonly load = ["load"]
  protected readonly first = signal(0)
  protected readonly ran = signal<unknown>("none")
  protected readonly tags = signal(["New"])
  // A list of ten thousand rows of which a window is drawn: the fixture's own few lines of
  // virtualizing, so no library's are part of what is compared.
  protected readonly firstRow = (top: number) => Math.max(0, Math.floor(top / 24) - 1)
  protected readonly rowsFrom = (first: number) =>
    Array.from({ length: 13 }, (_, at) => first + at).filter((each) => each < 10_000)
  protected readonly rows = {
    count: 10_000,
    label: (index: number) => `Row ${index}`,
    indexOf: (value: unknown) => value as number,
    scrollToIndex(index: number) {
      const list = document.getElementById("vl1")!
      const top = index * 24
      if (top < list.scrollTop) list.scrollTop = top
      else if (top + 24 > list.scrollTop + list.clientHeight)
        list.scrollTop = top + 24 - list.clientHeight
    },
  }
  protected readonly sections = ["one", "two", "three", "four"]

  protected press(event: Event): void {
    this.presses.update((count) => count + 1)
    if (this.locked()) (event as Event & { preventKiranaHandler(): void }).preventKiranaHandler()
  }

  protected pressLayered(event: Event): void {
    this.handed.update((count) => count + 1)
    this.asked.update((count) => count + 1)
    if (this.locked()) (event as Event & { preventKiranaHandler(): void }).preventKiranaHandler()
  }
}
