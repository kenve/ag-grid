import {
    PopupService,
    DragSourceType,
    Component,
    Autowired,
    ColumnController,
    Events,
    Context,
    EventService,
    TouchListener,
    DragAndDropService,
    GridPanel,
    GridOptionsWrapper,
    DropTarget,
    PostConstruct,
    QuerySelector,
    Column,
    DragSource,
    ColumnAggFuncChangeRequestEvent,
    ColumnApi,
    GridApi,
    AgEvent,
    TapEvent,
    RefSelector,
    _
} from "ag-grid-community";
import { AggFuncService } from "../../../../aggregation/aggFuncService";
import { VirtualList } from "../../../../rendering/virtualList";

export interface ColumnRemoveEvent extends AgEvent {}

export class DropZoneColumnComp extends Component {

    public static EVENT_COLUMN_REMOVE = 'columnRemove';

    private static TEMPLATE =
       `<span class="ag-column-drop-cell">
          <span class="ag-icon ag-icon-grip ag-column-drag" ref="eDragHandle"></span>
          <span class="ag-column-drop-cell-text"></span>
          <span class="ag-column-drop-cell-button ag-icon ag-icon-cancel"></span>
        </span>`;

    @Autowired('dragAndDropService') dragAndDropService: DragAndDropService;
    @Autowired('columnController') columnController: ColumnController;
    @Autowired('popupService') popupService: PopupService;
    @Autowired('aggFuncService') aggFuncService: AggFuncService;
    @Autowired('gridOptionsWrapper') gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('eventService') eventService: EventService;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('gridApi') private gridApi: GridApi;

    @QuerySelector('.ag-column-drop-cell-text') private eText: HTMLElement;
    @QuerySelector('.ag-column-drop-cell-button') private btRemove: HTMLElement;

    @RefSelector('eDragHandle') private eDragHandle: HTMLElement;

    private column: Column;
    private dragSourceDropTarget: DropTarget;
    private ghost: boolean;
    private displayName: string | null;
    private valueColumn: boolean;

    private popupShowing = false;

    constructor(column: Column, dragSourceDropTarget: DropTarget, ghost: boolean, valueColumn: boolean) {
        super();
        this.valueColumn = valueColumn;
        this.column = column;
        this.dragSourceDropTarget = dragSourceDropTarget;
        this.ghost = ghost;
    }

    @PostConstruct
    public init(): void {
        this.setTemplate(DropZoneColumnComp.TEMPLATE);

        this.displayName = this.columnController.getDisplayNameForColumn(this.column, 'columnDrop');
        this.setupComponents();
        if (!this.ghost && !this.gridOptionsWrapper.isFunctionsReadOnly()) {
            this.addDragSource();
        }
    }

    private addDragSource(): void {
        const dragSource: DragSource = {
            type: DragSourceType.ToolPanel,
            eElement: this.eDragHandle,
            dragItemCallback: () => this.createDragItem(),
            dragItemName: this.displayName,
            dragSourceDropTarget: this.dragSourceDropTarget
        };
        this.dragAndDropService.addDragSource(dragSource, true);
        this.addDestroyFunc(() => this.dragAndDropService.removeDragSource(dragSource));
    }

    private createDragItem() {
        const visibleState: { [key: string]: boolean } = {};
        visibleState[this.column.getId()] = this.column.isVisible();
        return {
            columns: [this.column],
            visibleState: visibleState
        };
    }

    private setupComponents(): void {

        this.setTextValue();

        this.setupRemove();

        if (this.ghost) {
            _.addCssClass(this.getGui(), 'ag-column-drop-cell-ghost');
        }

        if (this.valueColumn && !this.gridOptionsWrapper.isFunctionsReadOnly()) {
            this.addGuiEventListener('click', this.onShowAggFuncSelection.bind(this));
        }
    }

    private setupRemove(): void {

        _.setVisible(this.btRemove, !this.gridOptionsWrapper.isFunctionsReadOnly());

        this.addDestroyableEventListener(this.btRemove, 'click', (mouseEvent: MouseEvent) => {
            const agEvent: ColumnRemoveEvent = { type: DropZoneColumnComp.EVENT_COLUMN_REMOVE };
            this.dispatchEvent(agEvent);
            mouseEvent.stopPropagation();
        });

        const touchListener = new TouchListener(this.btRemove);
        this.addDestroyableEventListener(touchListener, TouchListener.EVENT_TAP, (event: TapEvent) => {
            const agEvent: ColumnRemoveEvent = { type: DropZoneColumnComp.EVENT_COLUMN_REMOVE };
            this.dispatchEvent(agEvent);
        });
        this.addDestroyFunc(touchListener.destroy.bind(touchListener));
    }

    private setTextValue(): void {
        let displayValue: string | null;

        if (this.valueColumn) {
            const aggFunc = this.column.getAggFunc();
            // if aggFunc is a string, we can use it, but if it's a function, then we swap with 'func'
            const aggFuncString = (typeof aggFunc === 'string') ? aggFunc as string : 'agg';
            const localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
            const aggFuncStringTranslated = localeTextFunc (aggFuncString, aggFuncString);

            displayValue = `${aggFuncStringTranslated}(${this.displayName})`;
        } else {
            displayValue = this.displayName;
        }

        const displayValueSanitised : any = _.escape(displayValue);
        this.eText.innerHTML = displayValueSanitised;
    }

    private onShowAggFuncSelection(): void {

        if (this.popupShowing) { return; }

        this.popupShowing = true;

        const virtualList = new VirtualList();

        const rows = this.aggFuncService.getFuncNames(this.column);

        virtualList.setModel({
            getRow: function(index: number) { return rows[index]; },
            getRowCount: function() { return rows.length; }
        });

        this.getContext().wireBean(virtualList);

        const ePopup = _.loadTemplate('<div class="ag-select-agg-func-popup"></div>');
        ePopup.style.top = '0px';
        ePopup.style.left = '0px';
        ePopup.appendChild(virtualList.getGui());
        // ePopup.style.height = this.gridOptionsWrapper.getAggFuncPopupHeight() + 'px';
        ePopup.style.width = this.getGui().clientWidth + 'px';

        const popupHiddenFunc = () => {
            virtualList.destroy();
            this.popupShowing = false;
        };

        const hidePopup = this.popupService.addAsModalPopup(
            ePopup,
            true,
            popupHiddenFunc
        );

        virtualList.setComponentCreator(this.createAggSelect.bind(this, hidePopup));

        this.popupService.positionPopupUnderComponent({
            type: 'aggFuncSelect',
            eventSource: this.getGui(),
            ePopup: ePopup,
            keepWithinBounds: true,
            column: this.column
        });

        virtualList.refresh();
    }

    private createAggSelect(hidePopup: () => void, value: any): Component {

        const itemSelected = () => {
            hidePopup();
            if (this.gridOptionsWrapper.isFunctionsPassive()) {
                const event: ColumnAggFuncChangeRequestEvent = {
                    type: Events.EVENT_COLUMN_AGG_FUNC_CHANGE_REQUEST,
                    columns: [this.column],
                    aggFunc: value,
                    api: this.gridApi,
                    columnApi: this.columnApi
                };
                this.eventService.dispatchEvent(event);
            } else {
                this.columnController.setColumnAggFunc(this.column, value, "toolPanelDragAndDrop");
            }
        };

        const localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
        const aggFuncString = value.toString();
        const aggFuncStringTranslated = localeTextFunc (aggFuncString, aggFuncString);
        const comp = new AggItemComp(itemSelected, aggFuncStringTranslated);
        return comp;
    }
}

class AggItemComp extends Component {

    private value: string;

    constructor(itemSelected: () => void, value: string) {
        super('<div class="ag-select-agg-func-item"/>');
        this.getGui().innerText = value;
        this.value = value;
        this.addGuiEventListener('click', itemSelected);
    }

}