import { Component, computed, signal } from "@angular/core"
import {
  KpAccordion,
  KpAccordionHeader,
  KpAccordionItem,
  KpAccordionPanel,
  KpAccordionTrigger,
  KpAvatar,
  KpAvatarFallback,
  KpAvatarImage,
  KpButton,
  KpCheckbox,
  KpCheckboxGroup,
  KpCheckboxIndicator,
  KpCollapsible,
  KpCollapsiblePanel,
  KpCollapsibleTrigger,
  KpAlertDialog,
  KpDialog,
  KpDialogBackdrop,
  KpDialogClose,
  KpDialogDescription,
  KpDialogPopup,
  KpDialogPortal,
  KpDialogTitle,
  KpDialogTrigger,
  KpDialogViewport,
  KpHoverCard,
  KpHoverCardPopup,
  KpHoverCardPortal,
  KpHoverCardPositioner,
  KpHoverCardTrigger,
  KpCombobox,
  KpComboboxChip,
  KpComboboxChipRemove,
  KpComboboxChips,
  KpComboboxClear,
  KpComboboxCollection,
  KpComboboxEmpty,
  KpComboboxHiddenInput,
  KpComboboxInput,
  KpComboboxItem,
  KpComboboxItemIndicator,
  KpComboboxList,
  KpComboboxPopup,
  KpComboboxPortal,
  KpComboboxPositioner,
  KpComboboxStatus,
  KpComboboxTrigger,
  KpComboboxValue,
  KpContextMenuTrigger,
  KpListbox,
  KpListboxGroup,
  KpListboxGroupLabel,
  KpListboxItem,
  KpListboxItemIndicator,
  KpMenu,
  KpMenubar,
  KpMenuCheckboxItem,
  KpMenuCheckboxItemIndicator,
  KpMenuGroup,
  KpMenuGroupLabel,
  KpMenuItem,
  KpMenuLinkItem,
  KpMenuPopup,
  KpMenuPortal,
  KpMenuPositioner,
  KpMenuRadioGroup,
  KpMenuRadioItem,
  KpMenuRadioItemIndicator,
  KpMenuSeparator,
  KpMenuSubmenuRoot,
  KpMenuSubmenuTrigger,
  KpMenuTrigger,
  KpMeter,
  KpNavigationMenu,
  KpNavigationMenuContent,
  KpNavigationMenuIcon,
  KpNavigationMenuItem,
  KpNavigationMenuLink,
  KpNavigationMenuList,
  KpNavigationMenuPopup,
  KpNavigationMenuPortal,
  KpNavigationMenuPositioner,
  KpNavigationMenuTrigger,
  KpNavigationMenuViewport,
  KpMeterIndicator,
  KpMeterLabel,
  KpMeterTrack,
  KpMeterValue,
  KpOtp,
  KpCommand,
  KpCommandEmpty,
  KpCommandGroup,
  KpCommandGroupHeading,
  KpCommandInput,
  KpCommandItem,
  KpCommandList,
  KpCommandSeparator,
  KpInput,
  KpLabel,
  KpPortalProvider,
  KpComboboxGroup,
  KpComboboxGroupLabel,
  KpComboboxSeparator,
  KpPagination,
  KpPaginationEllipsis,
  KpPaginationItem,
  KpPaginationItems,
  KpPaginationNext,
  KpPaginationPrevious,
  KpDatePicker,
  KpDatePickerCalendar,
  KpDatePickerField,
  KpSelectGroup,
  KpSelectGroupLabel,
  KpSelectSeparator,
  KpNumberField,
  KpNumberFieldDecrement,
  KpNumberFieldGroup,
  KpNumberFieldIncrement,
  KpNumberFieldInput,
  KpNumberFieldScrubArea,
  KpNumberFieldScrubAreaCursor,
  KpSelectList,
  KpSelectScrollDownArrow,
  KpSelectScrollUpArrow,
  KpDateField,
  KpDateFieldInput,
  KpDateFieldSegment,
  KpDateFieldSegments,
  KpCalendar,
  KpCalendarCell,
  KpCalendarDay,
  KpCalendarGrid,
  KpCalendarHeadCell,
  KpCalendarHeading,
  KpCalendarInput,
  KpCalendarMonths,
  KpCalendarNext,
  KpCalendarPrevious,
  KpCalendarWeekdays,
  KpCalendarWeeks,
  KpMessageScroller,
  KpMessageScrollerButton,
  KpMessageScrollerContent,
  KpMessageScrollerViewport,
  KpQrCode,
  KpQrCodeFrame,
  KpQrCodePattern,
  KpAutosizeTextarea,
  KpCarousel,
  KpCarouselIndicator,
  KpCarouselItem,
  KpCarouselNext,
  KpCarouselPrevious,
  KpCarouselViewport,
  KpToastAction,
  KpToastClose,
  KpToastDescription,
  KpToastList,
  KpToastRoot,
  KpToastContent,
  KpToastTitle,
  KpToastViewport,
  createToaster,
  KpOtpCaret,
  KpOtpGroup,
  KpOtpInput,
  KpOtpSeparator,
  KpOtpSlot,
  KpResizableGroup,
  KpResizableHandle,
  KpResizablePanel,
  KpPopover,
  KpPopoverArrow,
  KpPopoverBackdrop,
  KpPopoverClose,
  KpPopoverDescription,
  KpPopoverPopup,
  KpPopoverPortal,
  KpPopoverPositioner,
  KpPopoverTitle,
  KpPopoverTrigger,
  KpProgress,
  KpProgressIndicator,
  KpProgressLabel,
  KpProgressTrack,
  KpProgressValue,
  KpRadioGroup,
  KpRadioGroupIndicator,
  KpRadioGroupItem,
  KpSelect,
  KpSelectInput,
  KpSelectItem,
  KpSelectItemIndicator,
  KpSelectItemText,
  KpSelectPopup,
  KpSelectPortal,
  KpSelectPositioner,
  KpSelectTrigger,
  KpSelectValue,
  KpField,
  KpFieldControl,
  KpFieldDescription,
  KpFieldError,
  KpFieldLabel,
  KpFieldValidity,
  KpFieldset,
  KpFieldsetLegend,
  KpForm,
  KpDirection,
  KpSeparator,
  KpSlider,
  KpSliderControl,
  KpSliderIndicator,
  KpSliderThumb,
  KpSliderTrack,
  KpSliderValue,
  KpSwitch,
  KpSwitchThumb,
  KpTabs,
  KpTabsIndicator,
  KpTabsList,
  KpTabsPanel,
  KpTabsTab,
  KpScrollArea,
  KpScrollAreaContent,
  KpScrollAreaCorner,
  KpScrollAreaScrollbar,
  KpScrollAreaThumb,
  KpScrollAreaViewport,
  KpToggle,
  KpToggleGroup,
  KpToolbar,
  KpToolbarButton,
  KpToolbarGroup,
  KpToolbarInput,
  KpToolbarLink,
  KpToolbarSeparator,
  KpTooltip,
  KpTooltipArrow,
  KpTooltipPopup,
  KpTooltipPortal,
  KpTooltipPositioner,
  KpTooltipTrigger,
} from "@kirana-ui/angular"
import type { OffsetFunction } from "@kirana-ui/angular"

import {
  KuiCode,
  KuiDialog,
  KuiDialogClose,
  KuiDialogContent,
  KuiDialogTitle,
  KuiDialogTrigger,
  KuiMark,
  KuiTooltip,
  KuiTooltipPositioner,
} from "./design-system"

/**
 * The page every adapter draws, element for element: the conformance run walks it and compares
 * the DOM of each state across adapters. Change it in all three fixtures at once.
 *
 * An input is bound (`[kpId]="'c1'"`), not written as an attribute: Angular leaves a static
 * attribute on the element beside the input that reads it.
 */
@Component({
  selector: "app-root",
  imports: [
    KuiCode,
    KuiDialog,
    KuiDialogClose,
    KuiDialogContent,
    KuiDialogTitle,
    KuiDialogTrigger,
    KuiMark,
    KuiTooltip,
    KuiTooltipPositioner,
    KpAccordion,
    KpAccordionHeader,
    KpAccordionItem,
    KpAccordionPanel,
    KpAccordionTrigger,
    KpAvatar,
    KpAvatarFallback,
    KpAvatarImage,
    KpButton,
    KpCheckbox,
    KpCheckboxGroup,
    KpCheckboxIndicator,
    KpCollapsible,
    KpCollapsiblePanel,
    KpCollapsibleTrigger,
    KpAlertDialog,
    KpDialog,
    KpDialogBackdrop,
    KpDialogClose,
    KpDialogDescription,
    KpDialogPopup,
    KpDialogPortal,
    KpDialogTitle,
    KpDialogTrigger,
    KpDialogViewport,
    KpHoverCard,
    KpHoverCardPopup,
    KpHoverCardPortal,
    KpHoverCardPositioner,
    KpHoverCardTrigger,
    KpCombobox,
    KpComboboxChip,
    KpComboboxChipRemove,
    KpComboboxChips,
    KpComboboxClear,
    KpComboboxCollection,
    KpComboboxEmpty,
    KpComboboxHiddenInput,
    KpComboboxInput,
    KpComboboxItem,
    KpComboboxItemIndicator,
    KpComboboxList,
    KpComboboxPopup,
    KpComboboxPortal,
    KpComboboxPositioner,
    KpComboboxStatus,
    KpComboboxTrigger,
    KpComboboxValue,
    KpContextMenuTrigger,
    KpListbox,
    KpListboxGroup,
    KpListboxGroupLabel,
    KpListboxItem,
    KpListboxItemIndicator,
    KpMenu,
    KpMenubar,
    KpMenuCheckboxItem,
    KpMenuCheckboxItemIndicator,
    KpMenuGroup,
    KpMenuGroupLabel,
    KpMenuItem,
    KpMenuLinkItem,
    KpMenuPopup,
    KpMenuPortal,
    KpMenuPositioner,
    KpMenuRadioGroup,
    KpMenuRadioItem,
    KpMenuRadioItemIndicator,
    KpMenuSeparator,
    KpMenuSubmenuRoot,
    KpMenuSubmenuTrigger,
    KpMenuTrigger,
    KpMeter,
    KpNavigationMenu,
    KpNavigationMenuContent,
    KpNavigationMenuIcon,
    KpNavigationMenuItem,
    KpNavigationMenuLink,
    KpNavigationMenuList,
    KpNavigationMenuPopup,
    KpNavigationMenuPortal,
    KpNavigationMenuPositioner,
    KpNavigationMenuTrigger,
    KpNavigationMenuViewport,
    KpMeterIndicator,
    KpMeterLabel,
    KpMeterTrack,
    KpMeterValue,
    KpOtp,
    KpCommand,
    KpCommandEmpty,
    KpCommandGroup,
    KpCommandGroupHeading,
    KpCommandInput,
    KpCommandItem,
    KpCommandList,
    KpCommandSeparator,
    KpInput,
    KpLabel,
    KpPortalProvider,
    KpComboboxGroup,
    KpComboboxGroupLabel,
    KpComboboxSeparator,
    KpPagination,
    KpPaginationEllipsis,
    KpPaginationItem,
    KpPaginationItems,
    KpPaginationNext,
    KpPaginationPrevious,
    KpDatePicker,
    KpDatePickerCalendar,
    KpDatePickerField,
    KpSelectGroup,
    KpSelectGroupLabel,
    KpSelectSeparator,
    KpNumberField,
    KpNumberFieldDecrement,
    KpNumberFieldGroup,
    KpNumberFieldIncrement,
    KpNumberFieldInput,
    KpNumberFieldScrubArea,
    KpNumberFieldScrubAreaCursor,
    KpSelectList,
    KpSelectScrollDownArrow,
    KpSelectScrollUpArrow,
    KpDateField,
    KpDateFieldInput,
    KpDateFieldSegment,
    KpDateFieldSegments,
    KpCalendar,
    KpCalendarCell,
    KpCalendarDay,
    KpCalendarGrid,
    KpCalendarHeadCell,
    KpCalendarHeading,
    KpCalendarInput,
    KpCalendarMonths,
    KpCalendarNext,
    KpCalendarPrevious,
    KpCalendarWeekdays,
    KpCalendarWeeks,
    KpMessageScroller,
    KpMessageScrollerButton,
    KpMessageScrollerContent,
    KpMessageScrollerViewport,
    KpQrCode,
    KpQrCodeFrame,
    KpQrCodePattern,
    KpAutosizeTextarea,
    KpCarousel,
    KpCarouselIndicator,
    KpCarouselItem,
    KpCarouselNext,
    KpCarouselPrevious,
    KpCarouselViewport,
    KpToastAction,
    KpToastClose,
    KpToastDescription,
    KpToastList,
    KpToastRoot,
    KpToastContent,
    KpToastTitle,
    KpToastViewport,
    KpOtpCaret,
    KpOtpGroup,
    KpOtpInput,
    KpOtpSeparator,
    KpOtpSlot,
    KpResizableGroup,
    KpResizableHandle,
    KpResizablePanel,
    KpPopover,
    KpPopoverArrow,
    KpPopoverBackdrop,
    KpPopoverClose,
    KpPopoverDescription,
    KpPopoverPopup,
    KpPopoverPortal,
    KpPopoverPositioner,
    KpPopoverTitle,
    KpPopoverTrigger,
    KpProgress,
    KpProgressIndicator,
    KpProgressLabel,
    KpProgressTrack,
    KpProgressValue,
    KpRadioGroup,
    KpRadioGroupIndicator,
    KpRadioGroupItem,
    KpSelect,
    KpSelectInput,
    KpSelectItem,
    KpSelectItemIndicator,
    KpSelectItemText,
    KpSelectPopup,
    KpSelectPortal,
    KpSelectPositioner,
    KpSelectTrigger,
    KpSelectValue,
    KpField,
    KpFieldControl,
    KpFieldDescription,
    KpFieldError,
    KpFieldLabel,
    KpFieldValidity,
    KpFieldset,
    KpFieldsetLegend,
    KpForm,
    KpDirection,
    KpSeparator,
    KpSlider,
    KpSliderControl,
    KpSliderIndicator,
    KpSliderThumb,
    KpSliderTrack,
    KpSliderValue,
    KpSwitch,
    KpSwitchThumb,
    KpTabs,
    KpTabsIndicator,
    KpTabsList,
    KpTabsPanel,
    KpTabsTab,
    KpScrollArea,
    KpScrollAreaContent,
    KpScrollAreaCorner,
    KpScrollAreaScrollbar,
    KpScrollAreaThumb,
    KpScrollAreaViewport,
    KpToggle,
    KpToggleGroup,
    KpToolbar,
    KpToolbarButton,
    KpToolbarGroup,
    KpToolbarInput,
    KpToolbarLink,
    KpToolbarSeparator,
    KpTooltip,
    KpTooltipArrow,
    KpTooltipPopup,
    KpTooltipPortal,
    KpTooltipPositioner,
    KpTooltipTrigger,
  ],
  template: `
    <main>
      <section data-fixture="collapsible">
        <div kpCollapsible [kpId]="'c1'">
          <button kpCollapsibleTrigger data-testid="c1-trigger">Details</button>
          <div *kpCollapsiblePanel class="panel" data-testid="c1-panel">
            <p>Panel content</p>
            <div kpCollapsible [kpId]="'c2'">
              <button kpCollapsibleTrigger data-testid="c2-trigger">Nested</button>
              <div *kpCollapsiblePanel class="panel" data-testid="c2-panel">
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
        <div kpCollapsible [kpId]="'c3'" [(open)]="controlled">
          <button kpCollapsibleTrigger data-testid="c3-trigger">Controlled</button>
          <div *kpCollapsiblePanel="{ keepMounted: true }" class="panel" data-testid="c3-panel">
            <p>Kept in the page</p>
          </div>
        </div>
        <div kpCollapsible [kpId]="'c4'" [defaultOpen]="true" [disabled]="true">
          <button kpCollapsibleTrigger data-testid="c4-trigger">Disabled, open</button>
          <div *kpCollapsiblePanel class="panel" data-testid="c4-panel">
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
        <div kpCollapsible [kpId]="'k1'">
          <button
            kpCollapsibleTrigger
            class="mine"
            type="submit"
            aria-expanded="true"
            data-testid="k1-trigger"
            (click)="press($event)"
          >
            Composed {{ presses() }}
          </button>
          <div
            *kpCollapsiblePanel
            class="panel"
            data-testid="k1-panel"
            [style.color]="presses() % 2 ? 'red' : 'blue'"
          >
            <p>Composed content</p>
          </div>
        </div>
        <div kpCollapsible [kpId]="'k2'" [(open)]="layered">
          <button
            kpCollapsibleTrigger
            class="handed asked"
            title="asked"
            lang="en"
            data-testid="k2-trigger"
            (click)="pressLayered($event)"
          >
            Layered {{ handed() }}/{{ asked() }}
          </button>
          <button kpCollapsibleTrigger data-testid="k2-state">
            {{ layered() ? "Open" : "Closed" }}
          </button>
          <div *kpCollapsiblePanel class="panel" data-testid="k2-panel">
            <p>Layered content</p>
          </div>
        </div>
        <div class="item">
          <a class="tag asked" title="handed" href="#k2" data-testid="k3-tag">Tag</a>
          <span class="tag" data-testid="k3-plain">Plain</span>
        </div>
        <div class="item">
          <button
            kuiMark
            #mark="kuiMark"
            class="mine"
            data-testid="k4-mark"
            (click)="marks.set(marks() + 1)"
          >
            {{ mark.active() ? "On" : "Off" }} {{ marks() }}
          </button>
        </div>
      </section>

      <section data-fixture="design">
        <ng-container kuiDialog [kpId]="'ds1'">
          <button kuiDialogTrigger data-testid="ds1-trigger">Wrapped dialog</button>
          <div kuiDialogContent [popupTestid]="'ds1-popup'">
            <h2 kuiDialogTitle data-testid="ds1-title">Wrapped title</h2>
            <button kuiDialogClose data-testid="ds1-close">Close</button>
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
        <ng-container kuiTooltip [kpId]="'ds2'" [off]="tipOff()">
          <button kpTooltipTrigger data-testid="ds2-trigger">Quick</button>
          <ng-template kpTooltipPortal>
            <div kuiTooltipPositioner>
              <div kpTooltipPopup class="tip" data-testid="ds2-popup">At once</div>
            </div>
          </ng-template>
        </ng-container>
        <div class="item">
          <div kuiCode [kpId]="'ds3a'" [length]="2">
            <input kpOtpInput aria-label="Text code" data-testid="ds3a-input" />
          </div>
          <div kuiCode [kpId]="'ds3b'" [length]="2" [mode]="'numeric'">
            <input kpOtpInput aria-label="Number code" data-testid="ds3b-input" />
          </div>
        </div>
      </section>

      <section data-fixture="controls">
        <form data-testid="f1-form">
          <label data-testid="x1-label">
            <span kpCheckbox [kpId]="'x1'" [name]="'terms'" class="box" data-testid="x1">
              <span *kpCheckboxIndicator class="mark">✓</span>
            </span>
            Accept
          </label>
          <span
            kpCheckbox
            [kpId]="'x2'"
            [defaultChecked]="true"
            [disabled]="true"
            class="box"
            data-testid="x2"
          >
            <span *kpCheckboxIndicator class="mark">✓</span>
          </span>
          <span kpCheckbox [kpId]="'x3'" [indeterminate]="true" class="box" data-testid="x3">
            <span *kpCheckboxIndicator class="mark">–</span>
          </span>
          <span
            kpSwitch
            [kpId]="'w1'"
            [name]="'alerts'"
            [(checked)]="alerts"
            class="switch"
            data-testid="w1"
          >
            <span kpSwitchThumb class="thumb"></span>
          </span>
          <label for="w1" data-testid="w1-label">Alerts</label>
          <div kpRadioGroup [kpId]="'r1'" [name]="'plan'" [defaultValue]="'pro'" data-testid="r1">
            @for (each of plans; track each) {
              <label>
                <span
                  kpRadioGroupItem
                  [value]="each"
                  [disabled]="each === 'team'"
                  class="radio"
                  [attr.data-testid]="'r1-' + each"
                  [kpId]="'r1-' + each + '-radio'"
                >
                  <span *kpRadioGroupIndicator class="dot"></span>
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
        <div kpTabs [kpId]="'t1'" [defaultValue]="'account'" data-testid="t1">
          <div kpTabsList class="tabs" data-testid="t1-list">
            <button kpTabsTab [value]="'account'" data-testid="t1-account">Account</button>
            <button kpTabsTab [value]="'password'" data-testid="t1-password">Password</button>
            <button kpTabsTab [value]="'billing'" [disabled]="true" data-testid="t1-billing">
              Billing
            </button>
            <button kpTabsTab [value]="'team'" data-testid="t1-team">Team</button>
            <span kpTabsIndicator class="tab-mark" data-testid="t1-mark"></span>
          </div>
          <div *kpTabsPanel="'account'" data-testid="t1-panel-account">
            <p>Account settings</p>
            <div kpTabs [kpId]="'t2'" [defaultValue]="'one'" data-testid="t2">
              <div kpTabsList class="tabs" data-testid="t2-list">
                <button kpTabsTab [value]="'one'" data-testid="t2-one">One</button>
                <button kpTabsTab [value]="'two'" data-testid="t2-two">Two</button>
              </div>
              <div *kpTabsPanel="'one'" data-testid="t2-panel-one">First</div>
              <div *kpTabsPanel="'two'" data-testid="t2-panel-two">Second</div>
            </div>
          </div>
          <div *kpTabsPanel="'password'" data-testid="t1-panel-password">
            <p>Password settings</p>
          </div>
          <div *kpTabsPanel="'billing'" data-testid="t1-panel-billing">
            <p>Billing settings</p>
          </div>
          <div *kpTabsPanel="'team'" data-testid="t1-panel-team">
            <p>Team settings</p>
          </div>
        </div>
      </section>

      <section data-fixture="accordion">
        <div kpAccordion [kpId]="'a1'" data-testid="a1">
          @for (each of sections; track each) {
            <div
              kpAccordionItem
              [value]="each"
              [disabled]="each === 'three'"
              [attr.data-testid]="'a1-' + each"
            >
              <h3 kpAccordionHeader>
                <button kpAccordionTrigger [attr.data-testid]="'a1-' + each + '-trigger'">
                  Section {{ each }}
                </button>
              </h3>
              <div *kpAccordionPanel class="fold" [attr.data-testid]="'a1-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
        <div kpAccordion [kpId]="'a2'" [multiple]="true" [defaultValue]="['x']" data-testid="a2">
          @for (each of ["x", "y"]; track each) {
            <div kpAccordionItem [value]="each" [attr.data-testid]="'a2-' + each">
              <h3 kpAccordionHeader>
                <button kpAccordionTrigger [attr.data-testid]="'a2-' + each + '-trigger'">
                  Part {{ each }}
                </button>
              </h3>
              <div *kpAccordionPanel class="fold" [attr.data-testid]="'a2-' + each + '-panel'">
                <p>Content {{ each }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <section data-fixture="hover">
        <button data-testid="h0">Before</button>
        <ng-container kpTooltip [kpId]="'h1'" [delay]="100">
          <button kpTooltipTrigger data-testid="h1-trigger">Save</button>
          <ng-template kpTooltipPortal>
            <div kpTooltipPositioner [sideOffset]="8" data-testid="h1-positioner">
              <div kpTooltipPopup class="tip" data-testid="h1-popup">
                Save the file
                <div kpTooltipArrow class="arrow" data-testid="h1-arrow"></div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kpTooltip [kpId]="'h2'" [delay]="100">
          <button kpTooltipTrigger data-testid="h2-trigger">Open</button>
          <ng-template kpTooltipPortal>
            <div kpTooltipPositioner [sideOffset]="8" data-testid="h2-positioner">
              <div kpTooltipPopup class="tip" data-testid="h2-popup">Open a file</div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kpHoverCard [kpId]="'v1'" [delay]="100" [closeDelay]="100">
          <a kpHoverCardTrigger href="#profile" data-testid="v1-trigger">&#64;kirana</a>
          <ng-template kpHoverCardPortal>
            <div
              kpHoverCardPositioner
              [side]="'bottom'"
              [sideOffset]="8"
              data-testid="v1-positioner"
            >
              <div kpHoverCardPopup class="tip" data-testid="v1-popup">
                <p>Styles, compiled.</p>
                <a href="#follow" data-testid="v1-link">Follow</a>
              </div>
            </div>
          </ng-template>
        </ng-container>
        @if (tipKept()) {
          <ng-container kpTooltip [kpId]="'h3'" [delay]="100" [closeDelay]="2000">
            <button kpTooltipTrigger data-testid="h3-trigger">Share</button>
            <ng-template kpTooltipPortal>
              <div kpTooltipPositioner [sideOffset]="8" data-testid="h3-positioner">
                <div kpTooltipPopup class="tip" data-testid="h3-popup">Share the file</div>
              </div>
            </ng-template>
          </ng-container>
        }
        <button data-testid="h3-remove" (click)="tipKept.set(false)">Remove</button>
      </section>

      <section data-fixture="simple">
        <button kpButton data-testid="b1" (click)="count.set(count() + 1)">
          Count {{ count() }}
        </button>
        <button kpButton [disabled]="true" [focusableWhenDisabled]="true" data-testid="b2">
          Disabled, in the tab order
        </button>
        <span kpButton [nativeButton]="false" data-testid="b3" (click)="count.set(count() + 1)">
          Not a button element
        </span>
        <button kpToggle aria-label="Bold" data-testid="g1">B</button>
        <div kpSeparator data-testid="sp1"></div>
        <div kpSeparator [orientation]="'vertical'" data-testid="sp2"></div>
        <button data-testid="pr1-more" (click)="done.set(100)">Finish</button>
        <div kpProgress [kpId]="'pr1'" [value]="done()" data-testid="pr1">
          <span kpProgressLabel>Upload</span>
          <div kpProgressTrack class="track">
            <div kpProgressIndicator class="fill" data-testid="pr1-fill"></div>
          </div>
          <span kpProgressValue data-testid="pr1-value"></span>
        </div>
        <div kpProgress [kpId]="'pr2'" [value]="null" data-testid="pr2">
          <div kpProgressTrack class="track">
            <div kpProgressIndicator class="fill" data-testid="pr2-fill"></div>
          </div>
        </div>
        <div kpMeter [kpId]="'m1'" [value]="30" [max]="60" data-testid="m1">
          <span kpMeterLabel>Disk</span>
          <div kpMeterTrack class="track">
            <div kpMeterIndicator class="fill" data-testid="m1-fill"></div>
          </div>
          <span kpMeterValue data-testid="m1-value"></span>
        </div>
        <button data-testid="av-load" (click)="pictures.set(true)">Load pictures</button>
        <span kpAvatar class="avatar" data-testid="av1" (loadingStatusChanged)="heard.set($event)">
          <img
            *kpAvatarImage="pictures() ? pixel : undefined"
            alt="Kirana"
            data-testid="av1-image"
          />
          <span *kpAvatarFallback data-testid="av1-fallback">K</span>
        </span>
        <span data-testid="av1-status">{{ heard() }}</span>
        <span kpAvatar class="avatar" data-testid="av2">
          <img
            *kpAvatarImage="pictures() ? broken : undefined"
            alt="Nobody"
            data-testid="av2-image"
          />
          <span *kpAvatarFallback data-testid="av2-fallback">N</span>
        </span>
        <span kpAvatar class="avatar" data-testid="av3">
          <img
            kpAvatarImage
            [attr.src]="pictures() ? pixel : null"
            alt="Kept"
            data-testid="av3-image"
          />
          <span *kpAvatarFallback="{ delay: 60000 }" data-testid="av3-fallback">L</span>
        </span>
        <ng-container kpAlertDialog [kpId]="'ad1'">
          <button kpDialogTrigger data-testid="ad1-trigger">Delete</button>
          <ng-template kpDialogPortal>
            <div kpDialogBackdrop class="backdrop" data-testid="ad1-backdrop"></div>
            <div kpDialogPopup class="dialog" data-testid="ad1-popup">
              <h2 kpDialogTitle>Delete the file?</h2>
              <p kpDialogDescription>This cannot be undone.</p>
              <button kpDialogClose data-testid="ad1-cancel">Cancel</button>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="dialog">
        <ng-container kpDialog [kpId]="'d1'">
          <button kpDialogTrigger data-testid="d1-trigger">Open dialog</button>
          <ng-template kpDialogPortal>
            <div kpDialogBackdrop class="backdrop" data-testid="d1-backdrop"></div>
            <div kpDialogPopup class="dialog" data-testid="d1-popup">
              <h2 kpDialogTitle>Edit profile</h2>
              <p kpDialogDescription>Change your name.</p>
              <input data-testid="d1-input" aria-label="Name" />
              <ng-container kpDialog [kpId]="'d2'">
                <button kpDialogTrigger data-testid="d2-trigger">Open nested</button>
                <ng-template kpDialogPortal>
                  <div kpDialogBackdrop class="backdrop" data-testid="d2-backdrop"></div>
                  <div kpDialogPopup class="dialog" data-testid="d2-popup">
                    <h2 kpDialogTitle>Are you sure?</h2>
                    <button kpDialogClose data-testid="d2-close">Back</button>
                  </div>
                </ng-template>
              </ng-container>
              <button kpDialogClose data-testid="d1-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <ng-container kpDialog [kpId]="'d3'">
          <button kpDialogTrigger data-testid="d3-trigger">Open long dialog</button>
          <ng-template kpDialogPortal>
            <div kpDialogBackdrop class="backdrop" data-testid="d3-backdrop"></div>
            <div kpDialogViewport class="viewport" data-testid="d3-viewport">
              <div kpDialogPopup class="dialog long" data-testid="d3-popup">
                <h2 kpDialogTitle>Terms</h2>
                <p kpDialogDescription>Longer than the page: its viewport scrolls.</p>
                <button kpDialogClose data-testid="d3-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="popover">
        <ng-container kpPopover [kpId]="'p1'">
          <button kpPopoverTrigger data-testid="p1-trigger">Open popover</button>
          <ng-template kpPopoverPortal>
            <div kpPopoverPositioner [sideOffset]="8" [align]="'start'" data-testid="p1-positioner">
              <div kpPopoverPopup class="popup" data-testid="p1-popup">
                <h2 kpPopoverTitle>Notifications</h2>
                <p kpPopoverDescription>You are all caught up.</p>
                <button kpPopoverClose data-testid="p1-close">Close</button>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section data-fixture="select">
        <form data-testid="s1-form">
          <ng-container kpSelect [kpId]="'s1'" [name]="'fruit'" [(value)]="fruit">
            <button kpSelectTrigger data-testid="s1-trigger">
              <span kpSelectValue [placeholder]="'Pick a fruit'" data-testid="s1-value"></span>
            </button>
            <ng-template kpSelectPortal>
              <div kpSelectPositioner [sideOffset]="4" data-testid="s1-positioner">
                <div kpSelectPopup class="popup" data-testid="s1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kpSelectItem
                      [value]="each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'s1-' + each"
                    >
                      <span kpSelectItemText>{{ each }}</span>
                      <span *kpSelectItemIndicator>✓</span>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kpSelectInput />
          </ng-container>
        </form>
        <output data-testid="s1-output">{{ fruit() ?? "none" }}</output>
      </section>
      <section data-fixture="select-multiple">
        <form class="bar" data-testid="sm1-form">
          <ng-container
            kpSelect
            [kpId]="'sm1'"
            [name]="'basket'"
            [multiple]="true"
            [(values)]="basket"
          >
            <button kpSelectTrigger data-testid="sm1-trigger">
              <span kpSelectValue [placeholder]="'Pick fruits'" data-testid="sm1-value"></span>
            </button>
            <ng-template kpSelectPortal>
              <div kpSelectPositioner [sideOffset]="4" data-testid="sm1-positioner">
                <div kpSelectPopup class="popup" data-testid="sm1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kpSelectItem
                      [value]="each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'sm1-' + each"
                    >
                      <span kpSelectItemText>{{ each }}</span>
                      <span *kpSelectItemIndicator>✓</span>
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kpSelectInput />
          </ng-container>
          <button type="reset" data-testid="sm1-reset">Reset</button>
        </form>
        <output data-testid="sm1-output">{{ basket().join(",") || "none" }}</output>
        <ng-container kpSelect [kpId]="'sm2'" [items]="sizes" [defaultValue]="'m'">
          <button kpSelectTrigger data-testid="sm2-trigger">
            <span *kpSelectValue="let shown" data-testid="sm2-value"
              >{{ shown.label }} ({{ shown.value }})</span
            >
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [sideOffset]="4" data-testid="sm2-positioner">
              <div kpSelectPopup class="popup" data-testid="sm2-popup">
                @for (each of sizeKeys; track each) {
                  <div kpSelectItem [value]="each" class="item" [attr.data-testid]="'sm2-' + each">
                    <span kpSelectItemText>{{ sizes[each] }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
        <ng-container
          kpSelect
          [kpId]="'sm3'"
          [items]="sizes"
          [multiple]="true"
          [defaultValues]="['l', 's']"
        >
          <button kpSelectTrigger data-testid="sm3-trigger">
            <span *kpSelectValue="let shown" class="bar" data-testid="sm3-value">
              @for (label of shown.labels; track label) {
                <b>{{ label }}</b>
              }
            </span>
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [sideOffset]="4" data-testid="sm3-positioner">
              <div kpSelectPopup class="popup" data-testid="sm3-popup">
                @for (each of sizeKeys; track each) {
                  <div kpSelectItem [value]="each" class="item" [attr.data-testid]="'sm3-' + each">
                    <span kpSelectItemText>{{ sizes[each] }}</span>
                  </div>
                }
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="menu">
        <ng-container kpMenu [kpId]="'mn1'">
          <button kpMenuTrigger data-testid="mn1-trigger">File</button>
          <ng-template kpMenuPortal>
            <div kpMenuPositioner [sideOffset]="4" data-testid="mn1-positioner">
              <div kpMenuPopup class="popup" data-testid="mn1-popup">
                <div kpMenuGroupLabel data-testid="mn1-lone">Document</div>
                <div kpMenuItem class="item" data-testid="mn1-new" (click)="action.set('new')">
                  <span>New</span><kbd aria-hidden="true">⌘N</kbd>
                </div>
                <div kpMenuItem class="item" [disabled]="true" data-testid="mn1-open">Open</div>
                <div kpMenuItem class="item" data-testid="mn1-print" (click)="action.set('print')">
                  Print
                </div>
                <div kpMenuSeparator data-testid="mn1-separator"></div>
                <div kpMenuCheckboxItem class="item" [defaultChecked]="true" data-testid="mn1-wrap">
                  <span *kpMenuCheckboxItemIndicator>✓</span>
                  <span>Word wrap</span>
                </div>
                <div kpMenuGroup [kpId]="'mn1-g'" data-testid="mn1-group">
                  <div kpMenuGroupLabel data-testid="mn1-label">View</div>
                  <div kpMenuRadioGroup [(value)]="view" data-testid="mn1-views">
                    <div kpMenuRadioItem [value]="'list'" class="item" data-testid="mn1-list">
                      <span *kpMenuRadioItemIndicator>•</span>
                      <span>List</span>
                    </div>
                    <div kpMenuRadioItem [value]="'grid'" class="item" data-testid="mn1-grid">
                      <span *kpMenuRadioItemIndicator>•</span>
                      <span>Grid</span>
                    </div>
                  </div>
                </div>
                <ng-container kpMenuSubmenuRoot [kpId]="'mn1s'">
                  <div kpMenuSubmenuTrigger class="item" data-testid="mn1-share">Share</div>
                  <ng-template kpMenuPortal>
                    <div kpMenuPositioner data-testid="mn1s-positioner">
                      <div kpMenuPopup class="popup" data-testid="mn1s-popup">
                        <div
                          kpMenuItem
                          class="item"
                          data-testid="mn1s-mail"
                          (click)="action.set('mail')"
                        >
                          Mail
                        </div>
                        <div
                          kpMenuItem
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
        <ng-container kpContextMenu [kpId]="'cm1'">
          <div kpContextMenuTrigger class="area" data-testid="cm1-area">Press here</div>
          <ng-template kpMenuPortal>
            <div kpMenuPositioner data-testid="cm1-positioner">
              <div kpMenuPopup class="popup" aria-label="Actions" data-testid="cm1-popup">
                <div
                  kpMenuItem
                  class="item"
                  data-testid="cm1-copy"
                  (click)="picked.set('cm1-copy')"
                >
                  Copy
                </div>
                <div
                  kpMenuItem
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
        <div kpMenubar [kpId]="'mb1'" class="bar" data-testid="mb1">
          <ng-container kpMenu [kpId]="'mb1f'">
            <button kpMenuTrigger data-testid="mb1-file">File</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="mb1f-positioner">
                <div kpMenuPopup class="popup" data-testid="mb1f-popup">
                  <div
                    kpMenuItem
                    class="item"
                    data-testid="mb1f-new"
                    (click)="picked.set('mb1f-new')"
                  >
                    New
                  </div>
                  <div
                    kpMenuItem
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
          <ng-container kpMenu [kpId]="'mb1e'">
            <button kpMenuTrigger data-testid="mb1-edit">Edit</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="mb1e-positioner">
                <div kpMenuPopup class="popup" data-testid="mb1e-popup">
                  <div
                    kpMenuItem
                    class="item"
                    data-testid="mb1e-undo"
                    (click)="picked.set('mb1e-undo')"
                  >
                    Undo
                  </div>
                  <ng-container kpMenuSubmenuRoot [kpId]="'mb1em'">
                    <div kpMenuSubmenuTrigger class="item" data-testid="mb1e-find">Find</div>
                    <ng-template kpMenuPortal>
                      <div kpMenuPositioner data-testid="mb1em-positioner">
                        <div kpMenuPopup class="popup" data-testid="mb1em-popup">
                          <div
                            kpMenuItem
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
          <ng-container kpMenu [kpId]="'mb1v'" [disabled]="true">
            <button kpMenuTrigger data-testid="mb1-view">View</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="mb1v-positioner">
                <div kpMenuPopup class="popup" data-testid="mb1v-popup">
                  <div
                    kpMenuItem
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
          <ng-container kpMenu [kpId]="'mb1h'">
            <button kpMenuTrigger data-testid="mb1-help">Help</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="mb1h-positioner">
                <div kpMenuPopup class="popup" data-testid="mb1h-popup">
                  <div
                    kpMenuItem
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
        <div kpListbox [kpId]="'lb1'" aria-label="Fruit" [(value)]="chosen" data-testid="lb1">
          @for (each of fruits; track each) {
            <div
              kpListboxItem
              [value]="each"
              [disabled]="each === 'Blueberry'"
              class="item"
              [attr.data-testid]="'lb1-' + each"
            >
              <span>{{ each }}</span>
              <span *kpListboxItemIndicator>✓</span>
            </div>
          }
        </div>
        <div kpListbox [kpId]="'lb2'" aria-label="Plans" [multiple]="true" data-testid="lb2">
          <div kpListboxGroup [kpId]="'lb2-g'" data-testid="lb2-group">
            <div kpListboxGroupLabel data-testid="lb2-label">Plans</div>
            @for (each of plans; track each) {
              <div kpListboxItem [value]="each" class="item" [attr.data-testid]="'lb2-' + each">
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
            kpCombobox
            [kpId]="'cb1'"
            [name]="'pick'"
            [autoHighlight]="true"
            [(value)]="pick"
          >
            <input kpComboboxInput aria-label="Fruit" data-testid="cb1-input" />
            <button kpComboboxTrigger aria-label="Show fruits" data-testid="cb1-trigger">▾</button>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner [sideOffset]="4" data-testid="cb1-positioner">
                <div kpComboboxPopup class="popup" aria-label="Fruits" data-testid="cb1-popup">
                  @for (each of fruits; track each) {
                    <div
                      kpComboboxItem
                      [value]="each"
                      [kpId]="'cb1-' + each"
                      [disabled]="each === 'Blueberry'"
                      class="item"
                      [attr.data-testid]="'cb1-' + each"
                    >
                      <span>{{ each }}</span>
                      <span *kpComboboxItemIndicator>✓</span>
                    </div>
                  }
                  <div *kpComboboxEmpty data-testid="cb1-empty">No fruit</div>
                </div>
              </div>
            </ng-template>
            <input kpComboboxHiddenInput />
          </ng-container>
        </form>
        <output data-testid="cb1-output">{{ pick() ?? "none" }}</output>
      </section>
      <section data-fixture="menu-more">
        <div class="bar">
          <button type="button" data-testid="mm1-outside" (click)="outside.set(outside() + 1)">
            Outside
          </button>
          <ng-container kpMenu [kpId]="'mm1'" [modal]="true">
            <button kpMenuTrigger data-testid="mm1-trigger">Modal</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="mm1-positioner">
                <div kpMenuPopup class="popup" data-testid="mm1-popup">
                  <div kpMenuItem class="item" data-testid="mm1-plain">Plain</div>
                  <a kpMenuLinkItem class="item" href="#mm1-linked" data-testid="mm1-link">Link</a>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div kpMenubar [kpId]="'vb1'" [orientation]="'vertical'" class="column" data-testid="vb1">
          <ng-container kpMenu [kpId]="'vb1a'">
            <button kpMenuTrigger data-testid="vb1-one">One</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="vb1a-positioner">
                <div kpMenuPopup class="popup" data-testid="vb1a-popup">
                  <div kpMenuItem class="item" data-testid="vb1a-x">Alpha</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kpMenu [kpId]="'vb1b'">
            <button kpMenuTrigger data-testid="vb1-two">Two</button>
            <ng-template kpMenuPortal>
              <div kpMenuPositioner data-testid="vb1b-positioner">
                <div kpMenuPopup class="popup" data-testid="vb1b-popup">
                  <div kpMenuItem class="item" data-testid="vb1b-x">Beta</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <output data-testid="mm1-output">{{ outside() }}</output>
      </section>
      <section data-fixture="toolbar">
        <div kpToggleGroup aria-label="Alignment" [(value)]="align" class="bar" data-testid="tg1">
          <button kpToggle [value]="'left'" data-testid="tg1-left">Left</button>
          <button kpToggle [value]="'centre'" data-testid="tg1-centre">Centre</button>
          <button kpToggle [value]="'justify'" [disabled]="true" data-testid="tg1-justify">
            Justify
          </button>
          <button kpToggle [value]="'right'" data-testid="tg1-right">Right</button>
        </div>
        <output data-testid="tg1-output">{{ align().join(",") }}</output>
        <div kpToolbar aria-label="Editing" class="bar" data-testid="tb1">
          <button kpToolbarButton data-testid="tb1-save">Save</button>
          <button kpToolbarButton [disabled]="true" data-testid="tb1-gone">Gone</button>
          <a kpToolbarLink href="#tb1-help" data-testid="tb1-link">Help</a>
          <div kpToolbarSeparator data-testid="tb1-line"></div>
          <input kpToolbarInput aria-label="Zoom" value="100" data-testid="tb1-zoom" />
          <div kpToolbarGroup data-testid="tb1-group">
            <div
              kpToggleGroup
              [multiple]="true"
              aria-label="Marks"
              class="bar"
              data-testid="tb1-marks"
            >
              <button kpToggle [value]="'bold'" data-testid="tb1-bold">Bold</button>
              <button kpToggle [value]="'italic'" data-testid="tb1-italic">Italic</button>
            </div>
          </div>
          <button kpToggle data-testid="tb1-pin">Pin</button>
        </div>
      </section>
      <section data-fixture="scroll-area">
        <div kpScrollArea class="scroll" data-testid="sa1">
          <div kpScrollAreaViewport class="scroll-view" data-testid="sa1-view">
            <div kpScrollAreaContent data-testid="sa1-content">
              <div [class]="tall() ? 'scroll-tall' : 'scroll-short'" data-testid="sa1-box">
                Content
              </div>
            </div>
          </div>
          <div *kpScrollAreaScrollbar class="scroll-bar" data-testid="sa1-y">
            <div kpScrollAreaThumb class="scroll-thumb" data-testid="sa1-y-thumb"></div>
          </div>
          <div *kpScrollAreaScrollbar="'horizontal'" class="scroll-bar" data-testid="sa1-x">
            <div kpScrollAreaThumb class="scroll-thumb" data-testid="sa1-x-thumb"></div>
          </div>
          <div *kpScrollAreaCorner class="scroll-corner" data-testid="sa1-corner"></div>
        </div>
        <button type="button" data-testid="sa1-grow" (click)="tall.set(!tall())">Grow</button>
        <div kpScrollArea class="scroll-wide" data-testid="sa2">
          <div kpScrollAreaViewport class="scroll-view" data-testid="sa2-view">
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
            <div *kpScrollAreaScrollbar="'horizontal'" class="scroll-bar" data-testid="sa2-x">
              <div kpScrollAreaThumb class="scroll-thumb" data-testid="sa2-x-thumb"></div>
            </div>
          </div>
          <div *kpScrollAreaScrollbar class="scroll-bar" data-testid="sa2-y">
            <div kpScrollAreaThumb class="scroll-thumb" data-testid="sa2-y-thumb"></div>
          </div>
          <div *kpScrollAreaCorner class="scroll-corner" data-testid="sa2-corner"></div>
        </div>
        <button type="button" data-testid="sa2-load" (click)="rowLoaded.set(true)">
          Load pictures
        </button>
      </section>
      <section data-fixture="navigation-menu">
        <nav kpNavigationMenu [kpId]="'nm1'" aria-label="Site" data-testid="nm1">
          <ul kpNavigationMenuList class="nav-list" data-testid="nm1-list">
            <li kpNavigationMenuItem [value]="'products'">
              <button kpNavigationMenuTrigger class="nav-trigger" data-testid="nm1-products">
                <span>Products</span>
                <span kpNavigationMenuIcon>▾</span>
              </button>
              <div *kpNavigationMenuContent class="nav-content" data-testid="nm1-products-content">
                <a kpNavigationMenuLink href="#apps" data-testid="nm1-apps">apps</a>
                <a kpNavigationMenuLink href="#tools" data-testid="nm1-tools">tools</a>
              </div>
            </li>
            <li kpNavigationMenuItem>
              <button kpNavigationMenuTrigger class="nav-trigger" data-testid="nm1-docs">
                <span>Docs</span>
                <span kpNavigationMenuIcon>▾</span>
              </button>
              <div
                *kpNavigationMenuContent
                class="nav-content nav-narrow"
                data-testid="nm1-docs-content"
              >
                <a kpNavigationMenuLink href="#guide" data-testid="nm1-guide">guide</a>
              </div>
            </li>
            <li kpNavigationMenuItem>
              <a kpNavigationMenuLink href="#pricing" [active]="true" data-testid="nm1-pricing">
                Pricing
              </a>
            </li>
          </ul>
          <ng-template kpNavigationMenuPortal>
            <div kpNavigationMenuPositioner [sideOffset]="4" data-testid="nm1-positioner">
              <div kpNavigationMenuPopup class="popup" data-testid="nm1-popup">
                <div kpNavigationMenuViewport data-testid="nm1-viewport"></div>
              </div>
            </div>
          </ng-template>
        </nav>
      </section>
      <section data-fixture="virtual">
        <div
          kpListbox
          [kpId]="'vl1'"
          aria-label="Rows"
          [virtualized]="rows"
          class="virtual"
          data-testid="vl1"
          (scroll)="first.set(firstRow($any($event.currentTarget).scrollTop))"
        >
          <div class="virtual-space">
            @for (each of rowsFrom(first()); track each) {
              <div
                kpListboxItem
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
          kpCombobox
          [kpId]="'cp1'"
          [inline]="true"
          [autoHighlight]="true"
          (valueChanged)="ran.set($event.value)"
        >
          <input kpComboboxInput aria-label="Command" data-testid="cp1-input" />
          <div kpComboboxPopup class="palette" aria-label="Commands" data-testid="cp1-list">
            @for (each of commands; track each) {
              <div
                kpComboboxItem
                [value]="each"
                [kpId]="'cp1-' + each"
                class="item"
                [attr.data-testid]="'cp1-' + each"
              >
                {{ each }}
              </div>
            }
            <div *kpComboboxEmpty data-testid="cp1-empty">Nothing found</div>
          </div>
        </ng-container>
        <output data-testid="cp1-output">{{ ran() }}</output>
        <div kpField [kpId]="'fcb'" [name]="'city'" data-testid="fcb">
          <label kpFieldLabel data-testid="fcb-label">City</label>
          <ng-container kpCombobox [kpId]="'fcbc'" [required]="true" [autoHighlight]="true">
            <input kpComboboxInput data-testid="fcb-input" />
            <button *kpComboboxClear aria-label="Clear" data-testid="fcb-clear">×</button>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner data-testid="fcb-positioner">
                <div kpComboboxPopup class="popup" aria-label="Cities" data-testid="fcb-popup">
                  <div
                    kpComboboxItem
                    [value]="'Oslo'"
                    [kpId]="'fcb-Oslo'"
                    class="item"
                    data-testid="fcb-Oslo"
                  >
                    Oslo
                  </div>
                  <div
                    kpComboboxItem
                    [value]="'Rome'"
                    [kpId]="'fcb-Rome'"
                    class="item"
                    data-testid="fcb-Rome"
                  >
                    Rome
                  </div>
                </div>
              </div>
            </ng-template>
            <input kpComboboxHiddenInput />
          </ng-container>
        </div>
        <form data-testid="cbm-form">
          <ng-container
            kpCombobox
            [kpId]="'cbm'"
            [name]="'tags'"
            [multiple]="true"
            [autoHighlight]="true"
            [(values)]="tags"
          >
            <div kpComboboxChips class="bar" data-testid="cbm-chips">
              @for (each of tags(); track each) {
                <span
                  kpComboboxChip
                  [value]="each"
                  class="chip"
                  [attr.data-testid]="'cbm-chip-' + each"
                >
                  <span>{{ each }}</span>
                  <button
                    kpComboboxChipRemove
                    [attr.aria-label]="'Remove ' + each"
                    [attr.data-testid]="'cbm-remove-' + each"
                  >
                    ×
                  </button>
                </span>
              }
              <input kpComboboxInput aria-label="Tags" data-testid="cbm-input" />
            </div>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner data-testid="cbm-positioner">
                <div kpComboboxPopup class="popup" aria-label="Tags" data-testid="cbm-popup">
                  @for (each of commands; track each) {
                    <div
                      kpComboboxItem
                      [value]="each"
                      [kpId]="'cbm-' + each"
                      class="item"
                      [attr.data-testid]="'cbm-' + each"
                    >
                      {{ each }}
                    </div>
                  }
                </div>
              </div>
            </ng-template>
            <input kpComboboxHiddenInput />
          </ng-container>
        </form>
      </section>
      <section data-fixture="widgets">
        <form data-testid="otp1-form">
          <div
            kpOtp
            [kpId]="'otp1'"
            [length]="4"
            [name]="'code'"
            class="otp"
            data-testid="otp1"
            (completed)="code.set($event)"
          >
            <input kpOtpInput aria-label="Code" class="otp-input" data-testid="otp1-input" />
            <div kpOtpGroup class="otp-group">
              <div kpOtpSlot [index]="0" class="otp-slot" data-testid="otp1-0">
                <div *kpOtpCaret class="otp-caret"></div>
              </div>
              <div kpOtpSlot [index]="1" class="otp-slot" data-testid="otp1-1">
                <div *kpOtpCaret class="otp-caret"></div>
              </div>
            </div>
            <div kpOtpSeparator class="otp-mark"></div>
            <div kpOtpGroup class="otp-group">
              <div kpOtpSlot [index]="2" class="otp-slot" data-testid="otp1-2">
                <div *kpOtpCaret class="otp-caret"></div>
              </div>
              <div kpOtpSlot [index]="3" class="otp-slot" data-testid="otp1-3">
                <div *kpOtpCaret class="otp-caret"></div>
              </div>
            </div>
          </div>
        </form>
        <output data-testid="otp1-output">{{ code() }}</output>
        <div class="otp-row">
          <div
            kpOtp
            [kpId]="'otp2'"
            [length]="2"
            [mode]="'alphabetic'"
            class="otp"
            data-testid="otp2"
          >
            <input kpOtpInput aria-label="Letters" class="otp-input" data-testid="otp2-input" />
            <div kpOtpGroup class="otp-group">
              <div kpOtpSlot [index]="0" class="otp-slot" data-testid="otp2-0"></div>
              <div kpOtpSlot [index]="1" class="otp-slot" data-testid="otp2-1"></div>
            </div>
          </div>
          <div
            kpOtp
            [kpId]="'otp3'"
            [length]="3"
            [pattern]="'[A-F0-9]'"
            class="otp"
            data-testid="otp3"
          >
            <input kpOtpInput aria-label="Hex" class="otp-input" data-testid="otp3-input" />
            <div kpOtpGroup class="otp-group">
              <div kpOtpSlot [index]="0" class="otp-slot" data-testid="otp3-0"></div>
              <div kpOtpSlot [index]="1" class="otp-slot" data-testid="otp3-1"></div>
              <div kpOtpSlot [index]="2" class="otp-slot" data-testid="otp3-2"></div>
            </div>
          </div>
        </div>
        <div
          kpResizableGroup
          [kpId]="'rs1'"
          class="split"
          data-testid="rs1"
          (sizesChanged)="shares.set(rounded($event.sizes))"
        >
          <div
            kpResizablePanel
            [defaultSize]="25"
            [minSize]="10"
            class="split-panel"
            data-testid="rs1-a"
          >
            A
          </div>
          <div kpResizableHandle aria-label="Resize" class="split-bar" data-testid="rs1-bar"></div>
          <div kpResizablePanel [defaultSize]="75" class="split-panel" data-testid="rs1-b">B</div>
        </div>
        <output data-testid="rs1-output">{{ shares() }}</output>
      </section>
      <section data-fixture="pieces">
        <div kpQrCode [kpId]="'qr1'" [value]="'https://kirana.style'" class="qr" data-testid="qr1">
          <svg kpQrCodeFrame aria-label="A link" class="qr-frame" data-testid="qr1-frame">
            <path kpQrCodePattern data-testid="qr1-pattern" />
          </svg>
        </div>
        <textarea
          kpAutosizeTextarea
          aria-label="Note"
          rows="1"
          class="note"
          data-testid="au1"
        ></textarea>
        <div
          kpCarousel
          [kpId]="'cr1'"
          aria-label="Pictures"
          class="carousel"
          data-testid="cr1"
          (indexChanged)="slide.set('' + $event.index)"
        >
          <div kpCarouselViewport class="carousel-view" data-testid="cr1-view">
            <div kpCarouselItem [index]="0" class="carousel-item" data-testid="cr1-0">One</div>
            <div kpCarouselItem [index]="1" class="carousel-item" data-testid="cr1-1">Two</div>
            <div kpCarouselItem [index]="2" class="carousel-item" data-testid="cr1-2">Three</div>
          </div>
          <button kpCarouselPrevious data-testid="cr1-previous">Previous</button>
          <button kpCarouselNext data-testid="cr1-next">Next</button>
          <button
            kpCarouselIndicator
            [index]="0"
            aria-label="Slide 1"
            data-testid="cr1-dot-0"
          ></button>
          <button
            kpCarouselIndicator
            [index]="1"
            aria-label="Slide 2"
            data-testid="cr1-dot-1"
          ></button>
          <button
            kpCarouselIndicator
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
        <div kpToastViewport [kpId]="'ts1'" [toaster]="toaster" class="toasts" data-testid="ts1">
          <div
            *kpToastList="let toast"
            kpToastRoot
            [toast]="toast"
            class="toast"
            [attr.data-testid]="'ts1-' + toast.id"
          >
            <div
              kpToastContent
              class="toast-content"
              [attr.data-testid]="'ts1-' + toast.id + '-content'"
            >
              <div kpToastTitle class="toast-title">{{ toast.title }}</div>
              @if (toast.description) {
                <div kpToastDescription></div>
              }
            </div>
            @if (toast.action) {
              <button kpToastAction [attr.data-testid]="'ts1-' + toast.id + '-action'"></button>
            }
            <button
              kpToastClose
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
          kpDrawer
          [kpId]="'dw1'"
          (openChanged)="drawn.set($event.open ? 'open' : $event.details.reason)"
        >
          <button kpDialogTrigger data-testid="dw1-trigger">Open drawer</button>
          <ng-template kpDialogPortal>
            <div kpDialogBackdrop class="backdrop" data-testid="dw1-backdrop"></div>
            <div kpDialogPopup class="drawer" data-testid="dw1-popup">
              <h2 kpDialogTitle>Filters</h2>
              <button type="button" data-testid="dw1-apply">Apply</button>
              <button kpDialogClose data-testid="dw1-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="dw1-output">{{ drawn() }}</output>
        <ng-container
          kpDrawer
          [kpId]="'dw2'"
          [snapPoints]="[0.5, 1]"
          (snapPointChanged)="rests.set('' + $event.snapPoint)"
        >
          <button kpDialogTrigger data-testid="dw2-trigger">Open a drawer that rests</button>
          <ng-template kpDialogPortal>
            <div kpDialogBackdrop class="backdrop" data-testid="dw2-backdrop"></div>
            <div kpDialogPopup class="drawer" data-testid="dw2-popup">
              <h2 kpDialogTitle>Details</h2>
              <button kpDialogClose data-testid="dw2-close">Close</button>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="dw2-output">{{ rests() }}</output>
        <div kpMessageScroller [kpId]="'ms1'" class="chat" data-testid="ms1">
          <div kpMessageScrollerViewport class="chat-view" data-testid="ms1-view">
            <div kpMessageScrollerContent class="chat-lines" data-testid="ms1-content">
              @for (line of lines(); track line) {
                <p class="chat-line">Message {{ line }}</p>
              }
            </div>
          </div>
          <button kpMessageScrollerButton data-testid="ms1-button">Newest</button>
        </div>
        <button type="button" data-testid="ms1-add" (click)="said.set(said() + 1)">
          Add a message
        </button>
      </section>
      <section data-fixture="dates">
        <div
          kpCalendar
          [kpId]="'cal1'"
          [locale]="'en-US'"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar"
          data-testid="cal1"
          (valueChanged)="dated.set('' + $event.value)"
        >
          <button kpCalendarPrevious aria-label="Previous month" data-testid="cal1-previous">
            Previous
          </button>
          <div kpCalendarHeading data-testid="cal1-heading"></div>
          <button kpCalendarNext aria-label="Next month" data-testid="cal1-next">Next</button>
          <table kpCalendarGrid data-testid="cal1-grid">
            <thead>
              <tr>
                <th *kpCalendarWeekdays="let weekday" kpCalendarHeadCell [weekday]="weekday">
                  {{ weekday.short }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *kpCalendarWeeks="let week">
                @for (day of week; track day.date) {
                  <td kpCalendarCell [date]="day.date">
                    <button kpCalendarDay [date]="day.date" [attr.data-testid]="'cal1-' + day.date">
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
            kpDateField
            [kpId]="'df1'"
            [locale]="'en-US'"
            [name]="'born'"
            aria-label="Date of birth"
            class="date-field"
            data-testid="df1"
            (valueChanged)="born.set('' + $event.value)"
          >
            <span
              *kpDateFieldSegments="let segment"
              kpDateFieldSegment
              [segment]="segment"
              [attr.data-testid]="'df1-' + segment.type + '-' + segment.index"
            ></span>
            <input kpDateFieldInput />
          </div>
        </form>
        <output data-testid="df1-output">{{ born() }}</output>
      </section>
      <section data-fixture="calendars">
        <div
          kpCalendar
          [kpId]="'cal2'"
          [locale]="'en-US'"
          [mode]="'range'"
          [months]="2"
          [defaultMonth]="'2026-03-01'"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar calendar-months"
          data-testid="cal2"
          (valueChanged)="stay.set(json($event.value))"
        >
          <button kpCalendarPrevious aria-label="Previous month" data-testid="cal2-previous">
            Previous
          </button>
          <button kpCalendarNext aria-label="Next month" data-testid="cal2-next">Next</button>
          <div class="months">
            <div *kpCalendarMonths="let month" [attr.data-testid]="'cal2-month-' + month.index">
              <div kpCalendarHeading [attr.data-testid]="'cal2-heading-' + month.index"></div>
              <table kpCalendarGrid [attr.data-testid]="'cal2-grid-' + month.index">
                <thead>
                  <tr>
                    <th *kpCalendarWeekdays="let weekday" kpCalendarHeadCell [weekday]="weekday">
                      {{ weekday.short }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *kpCalendarWeeks="let week">
                    @for (day of week; track day.date) {
                      <td kpCalendarCell [date]="day.date">
                        <button
                          kpCalendarDay
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
            kpCalendar
            [kpId]="'cal3'"
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
            <div kpCalendarHeading data-testid="cal3-heading"></div>
            <table kpCalendarGrid data-testid="cal3-grid">
              <tbody>
                <tr *kpCalendarWeeks="let week">
                  @for (day of week; track day.date) {
                    <td kpCalendarCell [date]="day.date">
                      <button
                        kpCalendarDay
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
            <input kpCalendarInput data-testid="cal3-input" />
          </div>
          <button type="reset" data-testid="cal3-reset">Reset</button>
        </form>
        <output data-testid="cal3-output">{{ chosenDays() }}</output>
        <div
          kpCalendar
          [kpId]="'cal4'"
          [locale]="'en-US'"
          [(month)]="shownMonth"
          [defaultFocusedValue]="'2026-03-15'"
          class="calendar"
          data-testid="cal4"
        >
          <button kpCalendarPrevious aria-label="Previous month" data-testid="cal4-previous">
            Previous
          </button>
          <div kpCalendarHeading data-testid="cal4-heading"></div>
          <button kpCalendarNext aria-label="Next month" data-testid="cal4-next">Next</button>
          <table kpCalendarGrid data-testid="cal4-grid">
            <tbody>
              <tr *kpCalendarWeeks="let week">
                @for (day of week; track day.date) {
                  <td kpCalendarCell [date]="day.date">
                    <button kpCalendarDay [date]="day.date" [attr.data-testid]="'cal4-' + day.date">
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
        <label kpLabel for="in1" data-testid="in1-label">Name</label>
        <input kpInput id="in1" data-testid="in1" (valueChanged)="named.set($event.value)" />
        <output data-testid="in1-output">{{ named() }}</output>
        <div kpField [kpId]="'in2'" [name]="'email'" data-testid="in2">
          <label kpLabel data-testid="in2-label">Email</label>
          <input kpInput type="email" required data-testid="in2-input" />
        </div>
        <div
          kpCommand
          [kpId]="'cm1'"
          [loop]="true"
          class="command"
          data-testid="cm1"
          (itemSelected)="did.set($event.value)"
        >
          <input kpCommandInput aria-label="Command" data-testid="cm1-input" />
          <div kpCommandList class="palette" aria-label="Commands" data-testid="cm1-list">
            <div kpCommandGroup [kpId]="'cm1-file'" data-testid="cm1-file">
              <div kpCommandGroupHeading data-testid="cm1-file-heading">File</div>
              <div
                kpCommandItem
                [value]="'new'"
                [kpId]="'cm1-new'"
                class="item"
                data-testid="cm1-new"
              >
                New
              </div>
              <div
                kpCommandItem
                [value]="'open'"
                [kpId]="'cm1-open'"
                [keywords]="load"
                class="item"
                data-testid="cm1-open"
              >
                Open
              </div>
            </div>
            <div kpCommandSeparator class="separator" data-testid="cm1-separator"></div>
            <div kpCommandGroup [kpId]="'cm1-edit'" data-testid="cm1-edit">
              <div kpCommandGroupHeading data-testid="cm1-edit-heading">Edit</div>
              <div
                kpCommandItem
                [value]="'copy'"
                [kpId]="'cm1-copy'"
                class="item"
                data-testid="cm1-copy"
              >
                Copy
              </div>
              <div
                kpCommandItem
                [value]="'paste'"
                [kpId]="'cm1-paste'"
                [disabled]="true"
                class="item"
                data-testid="cm1-paste"
              >
                Paste
              </div>
            </div>
            <div *kpCommandEmpty data-testid="cm1-empty">Nothing found</div>
          </div>
        </div>
        <output data-testid="cm1-output">{{ did() }}</output>
      </section>
      <section data-fixture="slider">
        <div kpSlider [kpId]="'sl1'" [defaultValue]="40" [name]="'volume'" data-testid="sl1">
          <output kpSliderValue data-testid="sl1-value"></output>
          <div kpSliderControl class="slider" data-testid="sl1-control">
            <div kpSliderTrack class="slider-track">
              <div kpSliderIndicator class="fill" data-testid="sl1-fill"></div>
              <div kpSliderThumb class="thumb" aria-label="Volume" data-testid="sl1-thumb"></div>
            </div>
          </div>
        </div>
        <div kpSlider [kpId]="'sl2'" [(value)]="span" [step]="5" data-testid="sl2">
          <output kpSliderValue data-testid="sl2-value"></output>
          <div kpSliderControl class="slider" data-testid="sl2-control">
            <div kpSliderTrack class="slider-track">
              <div kpSliderIndicator class="fill" data-testid="sl2-fill"></div>
              <div
                kpSliderThumb
                [index]="0"
                class="thumb"
                aria-label="From"
                data-testid="sl2-from"
              ></div>
              <div
                kpSliderThumb
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
          kpSlider
          [kpId]="'sl3'"
          [defaultValue]="30"
          [orientation]="'vertical'"
          [disabled]="true"
          data-testid="sl3"
        >
          <div kpSliderControl class="slider" data-testid="sl3-control">
            <div kpSliderTrack class="slider-track">
              <div kpSliderIndicator class="fill" data-testid="sl3-fill"></div>
              <div kpSliderThumb class="thumb" aria-label="Level" data-testid="sl3-thumb"></div>
            </div>
          </div>
        </div>
        <div kpSlider [kpId]="'sl5'" [defaultValue]="[20, 50, 80]" data-testid="sl5">
          <div kpSliderControl class="slider" data-testid="sl5-control">
            <div kpSliderTrack class="slider-track">
              @if (low()) {
                <div kpSliderThumb class="thumb" aria-label="Low" data-testid="sl5-low"></div>
              }
              <div kpSliderThumb class="thumb" aria-label="Middle" data-testid="sl5-middle"></div>
              <div kpSliderThumb class="thumb" aria-label="High" data-testid="sl5-high"></div>
            </div>
          </div>
        </div>
        <button data-testid="sl5-toggle" (click)="low.set(!low())">Low</button>
      </section>
      <section data-fixture="measures">
        <div kpSlider [kpId]="'sl4'" [defaultValue]="0" [thumbAlignment]="'edge'" data-testid="sl4">
          <div kpSliderControl class="slider" data-testid="sl4-control">
            <div kpSliderTrack class="slider-track">
              <div kpSliderIndicator class="fill" data-testid="sl4-fill"></div>
              <div
                kpSliderThumb
                class="thumb thumb-inside"
                aria-label="Inside"
                data-testid="sl4-thumb"
              ></div>
            </div>
          </div>
        </div>
        <ng-container kpSelect [kpId]="'s3'" [defaultValue]="'Cherry'">
          <button kpSelectTrigger class="select-trigger" data-testid="s3-trigger">
            <span kpSelectValue data-testid="s3-value"></span>
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [alignItemWithTrigger]="true" data-testid="s3-positioner">
              <div kpSelectPopup class="popup" data-testid="s3-popup">
                @for (each of fruits; track each) {
                  <div kpSelectItem [value]="each" class="item" [attr.data-testid]="'s3-' + each">
                    <span kpSelectItemText [attr.data-testid]="'s3-' + each + '-text'">{{
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
          kpNumberField
          [kpId]="'nf1'"
          [name]="'qty'"
          [defaultValue]="5"
          [min]="0"
          [max]="10"
          class="number-field"
          data-testid="nf1"
          (valueChanged)="qty.set('' + $event.value)"
        >
          <span kpNumberFieldScrubArea class="scrub" data-testid="nf1-scrub">
            <span>Quantity</span>
            <span *kpNumberFieldScrubAreaCursor class="scrub-cursor"></span>
          </span>
          <div kpNumberFieldGroup class="number-group" data-testid="nf1-group">
            <button kpNumberFieldDecrement data-testid="nf1-down">-</button>
            <input kpNumberFieldInput aria-label="Quantity" data-testid="nf1-input" />
            <button kpNumberFieldIncrement data-testid="nf1-up">+</button>
          </div>
        </div>
        <output data-testid="nf1-output">{{ qty() }}</output>
        <ng-container
          kpAutocomplete
          [kpId]="'ac1'"
          [name]="'place'"
          (valueChanged)="place.set('' + $event.value)"
        >
          <input kpComboboxInput aria-label="Place" data-testid="ac1-input" />
          <ng-template kpComboboxPortal>
            <div kpComboboxPositioner [sideOffset]="4" data-testid="ac1-positioner">
              <div kpComboboxPopup class="popup" aria-label="Places" data-testid="ac1-popup">
                @for (each of places; track each) {
                  <div
                    kpComboboxItem
                    [value]="each"
                    [kpId]="'ac1-' + each"
                    class="item"
                    [attr.data-testid]="'ac1-' + each"
                  >
                    {{ each }}
                  </div>
                }
                <div *kpComboboxEmpty data-testid="ac1-empty">No place</div>
              </div>
            </div>
          </ng-template>
        </ng-container>
        <output data-testid="ac1-output">{{ place() }}</output>
        <ng-container kpSelect [kpId]="'s4'" [defaultValue]="'Row 1'">
          <button kpSelectTrigger data-testid="s4-trigger">
            <span kpSelectValue data-testid="s4-value"></span>
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [sideOffset]="4" data-testid="s4-positioner">
              <div kpSelectPopup class="popup arrowed" data-testid="s4-popup">
                <div *kpSelectScrollUpArrow class="scroll-arrow" data-testid="s4-up"></div>
                <div kpSelectList class="arrowed-list" data-testid="s4-list">
                  @for (each of numbered; track each) {
                    <div kpSelectItem [value]="each" class="item" [attr.data-testid]="'s4-' + each">
                      <span kpSelectItemText>{{ each }}</span>
                    </div>
                  }
                </div>
                <div *kpSelectScrollDownArrow class="scroll-arrow" data-testid="s4-down"></div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="picking">
        <ng-container
          kpDatePicker
          [kpId]="'dk1'"
          [locale]="'en-US'"
          [name]="'due'"
          [defaultValue]="'2026-03-14'"
          (valueChanged)="due.set('' + $event.value)"
        >
          <div kpDatePickerField aria-label="Due" class="date-field" data-testid="dk1-field">
            <span
              *kpDateFieldSegments="let segment"
              kpDateFieldSegment
              [segment]="segment"
              [attr.data-testid]="'dk1-' + segment.type + '-' + segment.index"
            ></span>
            <input kpDateFieldInput />
          </div>
          <button kpPopoverTrigger aria-label="Pick a day" data-testid="dk1-trigger">Pick</button>
          <ng-template kpPopoverPortal>
            <div kpPopoverPositioner [sideOffset]="4" data-testid="dk1-positioner">
              <div kpPopoverPopup class="popup" aria-label="Calendar" data-testid="dk1-popup">
                <div kpDatePickerCalendar class="calendar" data-testid="dk1-calendar">
                  <button kpCalendarPrevious aria-label="Previous month" data-testid="dk1-previous">
                    Previous
                  </button>
                  <div kpCalendarHeading data-testid="dk1-heading"></div>
                  <button kpCalendarNext aria-label="Next month" data-testid="dk1-next">
                    Next
                  </button>
                  <table kpCalendarGrid data-testid="dk1-grid">
                    <thead>
                      <tr>
                        <th
                          *kpCalendarWeekdays="let weekday"
                          kpCalendarHeadCell
                          [weekday]="weekday"
                        >
                          {{ weekday.short }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *kpCalendarWeeks="let week">
                        @for (day of week; track day.date) {
                          <td kpCalendarCell [date]="day.date">
                            <button
                              kpCalendarDay
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
          kpPagination
          [kpId]="'pg1'"
          [count]="200"
          class="pagination"
          data-testid="pg1"
          (pageChanged)="paged.set('' + $event.page)"
        >
          <button kpPaginationPrevious data-testid="pg1-previous">Previous</button>
          <ng-container *kpPaginationItems="let entry">
            @if (entry.type === "page") {
              <button kpPaginationItem [page]="entry.page" [attr.data-testid]="'pg1-' + entry.page">
                {{ entry.page }}
              </button>
            } @else {
              <span kpPaginationEllipsis [attr.data-testid]="'pg1-' + entry.key">…</span>
            }
          </ng-container>
          <button kpPaginationNext data-testid="pg1-next">Next</button>
        </nav>
        <output data-testid="pg1-output">{{ paged() }}</output>
        <ng-container kpSelect [kpId]="'s5'" [defaultValue]="'Apple'">
          <button kpSelectTrigger data-testid="s5-trigger">
            <span kpSelectValue data-testid="s5-value"></span>
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [sideOffset]="4" data-testid="s5-positioner">
              <div kpSelectPopup class="popup" data-testid="s5-popup">
                <div kpSelectGroupLabel data-testid="s5-lone">Produce</div>
                <div kpSelectGroup [kpId]="'s5-fruit'" data-testid="s5-fruit">
                  <div kpSelectGroupLabel data-testid="s5-fruit-label">Fruit</div>
                  <div kpSelectItem [value]="'Apple'" class="item" data-testid="s5-Apple">
                    <span kpSelectItemText>Apple</span>
                  </div>
                  <div kpSelectItem [value]="'Pear'" class="item" data-testid="s5-Pear">
                    <span kpSelectItemText>Pear</span>
                  </div>
                </div>
                <div kpSelectSeparator data-testid="s5-separator"></div>
                <div kpSelectGroup [kpId]="'s5-roots'" data-testid="s5-roots">
                  <div kpSelectGroupLabel data-testid="s5-roots-label">Roots</div>
                  <div kpSelectItem [value]="'Carrot'" class="item" data-testid="s5-Carrot">
                    <span kpSelectItemText>Carrot</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </ng-container>
      </section>
      <section data-fixture="groups">
        <ng-container kpAutocomplete [kpId]="'ac2'" [defaultValue]="'Par'">
          <input kpComboboxInput aria-label="City" data-testid="ac2-input" />
          <ng-template kpComboboxPortal>
            <div kpComboboxPositioner [sideOffset]="4" data-testid="ac2-positioner">
              <div kpComboboxPopup class="popup" aria-label="Cities" data-testid="ac2-popup">
                <div kpComboboxGroupLabel data-testid="ac2-lone">Cities</div>
                <div kpComboboxGroup [kpId]="'ac2-north'" data-testid="ac2-north">
                  <div kpComboboxGroupLabel data-testid="ac2-north-label">North</div>
                  <div
                    kpComboboxItem
                    [value]="'Oslo'"
                    [kpId]="'ac2-Oslo'"
                    class="item"
                    data-testid="ac2-Oslo"
                  >
                    Oslo
                  </div>
                </div>
                <div kpComboboxSeparator data-testid="ac2-separator"></div>
                <div kpComboboxGroup [kpId]="'ac2-west'" data-testid="ac2-west">
                  <div kpComboboxGroupLabel data-testid="ac2-west-label">West</div>
                  <div
                    kpComboboxItem
                    [value]="'Paris'"
                    [kpId]="'ac2-Paris'"
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
        <ng-container kpPortalProvider [container]="pcbox">
          <ng-container kpPopover [kpId]="'pc1'">
            <button kpPopoverTrigger data-testid="pc1-trigger">Open in the box</button>
            <ng-template kpPopoverPortal>
              <div kpPopoverPositioner [sideOffset]="4" data-testid="pc1-positioner">
                <div kpPopoverPopup class="popup" aria-label="In the box" data-testid="pc1-popup">
                  Inside
                </div>
              </div>
            </ng-template>
          </ng-container>
        </ng-container>
      </section>
      <section data-fixture="field">
        <form
          kpForm
          [errors]="rejected()"
          (formSubmit)="sent.set(json($event.values))"
          data-testid="f1"
        >
          <fieldset kpFieldset [kpId]="'fs1'" data-testid="fs1">
            <div kpFieldsetLegend data-testid="fs1-legend">Account</div>
            <div kpField [kpId]="'fd1'" [name]="'email'" data-testid="fd1">
              <label kpFieldLabel data-testid="fd1-label">Email</label>
              <input kpFieldControl type="email" required data-testid="fd1-control" />
              <p kpFieldDescription data-testid="fd1-description">Your work address</p>
              <div *kpFieldError data-testid="fd1-error"></div>
              <ng-container *kpFieldValidity="let validity">
                <span data-testid="fd1-validity">{{ word(validity.valid) }}</span>
              </ng-container>
            </div>
            <div
              kpField
              [kpId]="'fd2'"
              [name]="'user'"
              [validationMode]="'onBlur'"
              [validate]="taken"
              data-testid="fd2"
            >
              <label kpFieldLabel>User</label>
              <input kpFieldControl data-testid="fd2-control" />
              <div *kpFieldError data-testid="fd2-error"></div>
            </div>
          </fieldset>
          <button type="submit" data-testid="f1-submit">Send</button>
        </form>
        <button data-testid="f1-reject" (click)="rejected.set({ user: 'Reserved' })">Reject</button>
        <span data-testid="f1-sent">{{ sent() }}</span>
      </section>
      <section data-fixture="field-controls">
        <form kpForm (formSubmit)="sent2.set(json($event.values))" data-testid="f2">
          <div kpField [kpId]="'fc1'" [name]="'terms'" data-testid="fc1">
            <span kpCheckbox [required]="true" class="box" data-testid="fc1-box">
              <span *kpCheckboxIndicator class="mark">✓</span>
            </span>
            <label kpFieldLabel data-testid="fc1-label">Accept</label>
            <div *kpFieldError data-testid="fc1-error"></div>
          </div>
          <div kpField [kpId]="'fc2'" [name]="'plan'" data-testid="fc2">
            <label kpFieldLabel data-testid="fc2-label">Plan</label>
            <div kpRadioGroup [required]="true" data-testid="fc2-group">
              <span kpRadioGroupItem [value]="'free'" class="radio" data-testid="fc2-free"></span>
              <span kpRadioGroupItem [value]="'pro'" class="radio" data-testid="fc2-pro"></span>
            </div>
            <div *kpFieldError data-testid="fc2-error"></div>
          </div>
          <div kpField [kpId]="'fc3'" [name]="'level'" [disabled]="true" data-testid="fc3">
            <label kpFieldLabel>Level</label>
            <div kpSlider [defaultValue]="10" data-testid="fc3-slider">
              <div kpSliderControl class="slider">
                <div kpSliderTrack class="slider-track">
                  <div kpSliderThumb class="thumb" data-testid="fc3-thumb"></div>
                </div>
              </div>
            </div>
          </div>
          <div kpField [kpId]="'fc4'" [name]="'alerts'" data-testid="fc4">
            <label kpFieldLabel data-testid="fc4-label">Alerts</label>
            <span kpSwitch class="switch" data-testid="fc4-switch">
              <span kpSwitchThumb class="thumb"></span>
            </span>
          </div>
          <div kpField [kpId]="'fc5'" [name]="'fruit'" data-testid="fc5">
            <label kpFieldLabel data-testid="fc5-label">Fruit</label>
            <ng-container kpSelect [kpId]="'fc5s'" [required]="true">
              <button kpSelectTrigger data-testid="fc5-trigger">
                <span kpSelectValue [placeholder]="'Pick a fruit'"></span>
              </button>
              <ng-template kpSelectPortal>
                <div kpSelectPositioner [sideOffset]="4">
                  <div kpSelectPopup class="popup" data-testid="fc5-popup">
                    <div kpSelectItem [value]="'Apple'" class="item" data-testid="fc5-Apple">
                      <span kpSelectItemText>Apple</span>
                    </div>
                  </div>
                </div>
              </ng-template>
              <input kpSelectInput />
            </ng-container>
            <div *kpFieldError data-testid="fc5-error"></div>
          </div>
          <button type="submit" data-testid="f2-submit">Send</button>
        </form>
        <span data-testid="f2-sent">{{ sent2() }}</span>
      </section>
      <section data-fixture="checkbox-group">
        <form data-testid="cg1-form">
          <div
            kpCheckboxGroup
            [kpId]="'cg1'"
            [(value)]="toppings"
            [allValues]="toppingValues"
            class="bar"
            data-testid="cg1"
          >
            <span
              kpCheckbox
              [parent]="true"
              [kpId]="'cg1-all-input'"
              class="box"
              aria-label="All"
              data-testid="cg1-all"
            >
              <span *kpCheckboxIndicator class="mark">✓</span>
            </span>
            @for (each of toppingValues; track each) {
              <span
                kpCheckbox
                [kpId]="'cg1-' + each + '-input'"
                [name]="'topping'"
                [value]="each"
                class="box"
                [attr.aria-label]="each"
                [attr.data-testid]="'cg1-' + each"
              >
                <span *kpCheckboxIndicator class="mark">✓</span>
              </span>
            }
          </div>
          <button type="reset" data-testid="cg1-reset">Reset</button>
        </form>
        <output data-testid="cg1-output">{{ toppings()?.join(",") }}</output>
        <div kpField [kpId]="'cg2'" [name]="'extras'" data-testid="cg2">
          <label kpFieldLabel data-testid="cg2-label">Extras</label>
          <div kpCheckboxGroup [defaultValue]="['napkins']" class="bar" data-testid="cg2-group">
            @for (each of extras; track each) {
              <span
                kpCheckbox
                [kpId]="'cg2-' + each + '-input'"
                [value]="each"
                class="box"
                [attr.aria-label]="each"
                [attr.data-testid]="'cg2-' + each"
              >
                <span *kpCheckboxIndicator class="mark">✓</span>
              </span>
            }
          </div>
        </div>
      </section>
      <section data-fixture="read-only">
        <div kpSlider [kpId]="'ro1'" [defaultValue]="40" [readOnly]="true" data-testid="ro1">
          <div kpSliderControl class="slider" data-testid="ro1-control">
            <div kpSliderTrack class="slider-track">
              <div kpSliderIndicator class="fill"></div>
              <div kpSliderThumb class="thumb" aria-label="Level" data-testid="ro1-thumb"></div>
            </div>
          </div>
        </div>
        <ng-container kpSelect [kpId]="'ro2'" [defaultValue]="'Banana'" [readOnly]="true">
          <button kpSelectTrigger data-testid="ro2-trigger">
            <span kpSelectValue data-testid="ro2-value"></span>
          </button>
          <ng-template kpSelectPortal>
            <div kpSelectPositioner [sideOffset]="4">
              <div kpSelectPopup class="popup" data-testid="ro2-popup">
                @for (each of lockedFruits; track each) {
                  <div kpSelectItem [value]="each" class="item" [attr.data-testid]="'ro2-' + each">
                    <span kpSelectItemText>{{ each }}</span>
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
        <div [kpDirection]="reading()" [attr.dir]="reading()" data-testid="dir-box">
          <div kpTabs [kpId]="'dt1'" [defaultValue]="'one'" data-testid="dt1">
            <div kpTabsList class="tabs" data-testid="dt1-list">
              <button kpTabsTab [value]="'one'" data-testid="dt1-one">One</button>
              <button kpTabsTab [value]="'two'" data-testid="dt1-two">Two</button>
            </div>
            <div *kpTabsPanel="'one'">First</div>
            <div *kpTabsPanel="'two'">Second</div>
          </div>
          <div kpSlider [kpId]="'ds1'" [defaultValue]="40" data-testid="ds1">
            <div kpSliderControl class="slider" data-testid="ds1-control">
              <div kpSliderTrack class="slider-track">
                <div kpSliderIndicator class="fill"></div>
                <div kpSliderThumb class="thumb" aria-label="Volume" data-testid="ds1-thumb"></div>
              </div>
            </div>
          </div>
          <ng-container kpPopover [kpId]="'dp1'">
            <button kpPopoverTrigger data-testid="dp1-trigger">Open popover</button>
            <ng-template kpPopoverPortal>
              <div
                kpPopoverPositioner
                [sideOffset]="8"
                [align]="'start'"
                data-testid="dp1-positioner"
              >
                <div kpPopoverPopup class="popup" data-testid="dp1-popup">
                  <h2 kpPopoverTitle>Notifications</h2>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </section>

      <section data-fixture="placing">
        <div dir="rtl" data-testid="pl1-box">
          <ng-container kpPopover [kpId]="'pl1'">
            <button kpPopoverTrigger data-testid="pl1-trigger">Beside</button>
            <ng-template kpPopoverPortal>
              <div
                kpPopoverPositioner
                [side]="'inline-end'"
                [sideOffset]="8"
                data-testid="pl1-positioner"
              >
                <div kpPopoverPopup class="popup" data-testid="pl1-popup">
                  <h2 kpPopoverTitle>Beside</h2>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container kpPopover [kpId]="'pl2'">
            <button kpPopoverTrigger data-testid="pl2-trigger">Anchored</button>
            <span #firstAnchor id="pl2-first" class="anchor" data-testid="pl2-first">First</span>
            <span #secondAnchor id="pl2-second" class="anchor" data-testid="pl2-second"
              >Second</span
            >
            <ng-template kpPopoverPortal>
              <div
                kpPopoverPositioner
                [anchor]="moved() ? secondAnchor : firstAnchor"
                [align]="'start'"
                [sideOffset]="4"
                data-testid="pl2-positioner"
              >
                <div kpPopoverPopup class="popup" data-testid="pl2-popup">
                  <h2 kpPopoverTitle>Anchored</h2>
                  <button type="button" data-testid="pl2-move" (click)="moved.set(!moved())">
                    Move
                  </button>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container kpCombobox [kpId]="'pl3'" [(value)]="sought">
            <button kpComboboxTrigger data-testid="pl3-trigger">Pick a fruit</button>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner [sideOffset]="4" data-testid="pl3-positioner">
                <div
                  kpComboboxPopup
                  class="popup"
                  aria-label="Pick a fruit"
                  data-testid="pl3-popup"
                >
                  <input
                    kpComboboxInput
                    class="search"
                    aria-label="Search fruits"
                    data-testid="pl3-input"
                  />
                  <div kpComboboxList aria-label="Fruits" data-testid="pl3-list">
                    @for (each of fruits; track each) {
                      <div
                        kpComboboxItem
                        [value]="each"
                        [kpId]="'pl3-' + each"
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
          <ng-container kpPopover [kpId]="'pm1'" [modal]="true">
            <button kpPopoverTrigger data-testid="pm1-trigger">Modal popover</button>
            <ng-template kpPopoverPortal>
              <div kpPopoverBackdrop class="backdrop" data-testid="pm1-backdrop"></div>
              <div
                kpPopoverPositioner
                [sideOffset]="8"
                [arrowPadding]="8"
                [sticky]="true"
                data-testid="pm1-positioner"
              >
                <div kpPopoverPopup class="popup pointed" data-testid="pm1-popup">
                  <div kpPopoverArrow class="arrow" data-testid="pm1-arrow"></div>
                  <h2 kpPopoverTitle>Modal</h2>
                  <button type="button" data-testid="pm1-first">First</button>
                  <button kpPopoverClose data-testid="pm1-close">Close</button>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kpPopover [kpId]="'pm2'" [modal]="'trap-focus'">
            <button kpPopoverTrigger [openOnHover]="true" [delay]="50" data-testid="pm2-trigger">
              Hover popover
            </button>
            <ng-template kpPopoverPortal>
              <div kpPopoverPositioner [sideOffset]="8" data-testid="pm2-positioner">
                <div kpPopoverPopup class="popup" data-testid="pm2-popup">
                  <h2 kpPopoverTitle>Hovered</h2>
                  <button type="button" data-testid="pm2-first">First</button>
                  <button kpPopoverClose data-testid="pm2-close">Close</button>
                </div>
              </div>
            </ng-template>
          </ng-container>
          <ng-container kpPopover [kpId]="'pm3'">
            <button kpPopoverTrigger data-testid="pm3-trigger">Placed popover</button>
            <ng-template kpPopoverPortal>
              <div
                kpPopoverPositioner
                [side]="'top'"
                [align]="'start'"
                [positionMethod]="'fixed'"
                [sideOffset]="anchorHigh"
                [collisionPadding]="{ left: 12, right: 12 }"
                [collisionAvoidance]="{ side: 'none' }"
                data-testid="pm3-positioner"
              >
                <div kpPopoverPopup class="popup" aria-label="Placed" data-testid="pm3-popup">
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
            kpCombobox
            [kpId]="'cd1'"
            [items]="pantry"
            [autoHighlight]="true"
            (inputValueChanged)="looked.set($event.value)"
          >
            <button kpComboboxTrigger data-testid="cd1-trigger">
              <span kpComboboxValue [placeholder]="'Pick one'" data-testid="cd1-value"></span>
            </button>
            <div kpComboboxStatus data-testid="cd1-status">{{ pantryLeft(looked()) }}</div>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner [sideOffset]="4" data-testid="cd1-positioner">
                <div kpComboboxPopup class="popup" aria-label="Pantry" data-testid="cd1-popup">
                  <input
                    kpComboboxInput
                    class="search"
                    aria-label="Search the pantry"
                    data-testid="cd1-input"
                  />
                  <div kpComboboxList aria-label="Pantry" data-testid="cd1-list">
                    <ng-container *kpComboboxCollection="let group">
                      <div
                        kpComboboxGroup
                        [kpId]="'cd1-g-' + group.label"
                        [attr.data-testid]="'cd1-g-' + group.label"
                      >
                        <div kpComboboxGroupLabel>{{ group.label }}</div>
                        <ng-container *kpComboboxCollection="let item of group">
                          <div
                            kpComboboxItem
                            [value]="item.value"
                            [kpId]="'cd1-' + item.key"
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
                  <div *kpComboboxEmpty data-testid="cd1-empty">Nothing in the pantry</div>
                </div>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div class="bar">
          <ng-container
            kpCombobox
            [kpId]="'cd2'"
            [name]="'berry'"
            [items]="berries"
            [defaultValue]="'cherry'"
            [readOnly]="sealed()"
            [autoHighlight]="true"
          >
            <input kpComboboxInput aria-label="Berry" data-testid="cd2-input" />
            <button *kpComboboxClear aria-label="Clear the berry" data-testid="cd2-clear">×</button>
            <ng-template kpComboboxPortal>
              <div kpComboboxPositioner [sideOffset]="4" data-testid="cd2-positioner">
                <div kpComboboxPopup class="popup" aria-label="Berries" data-testid="cd2-popup">
                  <ng-container *kpComboboxCollection="let item">
                    <div
                      kpComboboxItem
                      [value]="item.value"
                      [kpId]="'cd2-' + item.key"
                      class="item"
                      [attr.data-testid]="'cd2-' + item.key"
                    >
                      {{ item.label }}
                    </div>
                  </ng-container>
                  <div *kpComboboxEmpty data-testid="cd2-empty">No berry</div>
                </div>
              </div>
            </ng-template>
            <input kpComboboxHiddenInput />
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
  protected readonly tipKept = signal(true)
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
