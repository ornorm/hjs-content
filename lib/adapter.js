/** @babel */
import {DataSetObservable} from "./dataset";

export const IGNORE_ITEM_VIEW_TYPE = -1;
export const NO_SELECTION = Number.MIN_VALUE;
export const ITEM_VIEW_TYPE_HEADER_OR_FOOTER = -2;
export const INVALID_POSITION = -1;
export const INVALID_ROW_ID = Number.MIN_VALUE;

export class Adapter {

    constructor() {

    }

    getCount() {
        return 0;
    }

    getItem(position) {
        return null;
    }

    getItemId(position) {
        return -1;
    }

    getItemViewType(position) {
        return 0;
    }

    getResources() {
        return null;
    }

    getView(position, convertView, parent) {
        return null;
    }

    getViewTypeCount() {
        return 0;
    }

    hasStableIds() {
        return false;
    }

    isEmpty() {
        return this.getCount() === 0;
    }
}

export class BaseAdapter extends Adapter {

    constructor({
                    getViewTypeCount = null,
                    areAllItemsEnabled = null,
                    getItemViewType = null,
                    getItemId = null,
                    getResources = null,
                    layoutItemViewType = null,
                    isEnabled = null
                } = {}) {
        super();
        this.mDataSetObservable = new DataSetObservable();
        if (getViewTypeCount !== null) {
            this.getViewTypeCount = getViewTypeCount;
        }
        if (areAllItemsEnabled !== null) {
            this.areAllItemsEnabledv = areAllItemsEnabled;
        }
        if (isEnabled !== null) {
            this.isEnabled = isEnabled;
        }
        if (getItemViewType !== null) {
            this.getItemViewType = getItemViewType;
        }
        if (getItemId !== null) {
            this.getItemId = getItemId;
        }
        if (getResources !== null) {
            this.getResources = getResources;
        }
        if (layoutItemViewType !== null) {
            this.layoutItemViewType = layoutItemViewType;
        }
    }

    areAllItemsEnabled() {
        return true;
    }

    getDropDownView(position, convertView, parent) {
        return null;
    }

    getItemResourceType(type) {
        let resources = this.getResources() || [];
        return resources[type];
    }

    getViewTypeCount() {
        return this.getResources().length;
    }

    isEnabled(position) {
        return true;
    }

    layoutItemViewType(position, distance, view, views) {
        return 0;
    }

    notifyDataSetInvalidated() {
        this.mDataSetObservable.notifyInvalidated();
    }

    notifyDataSetChanged(position) {
        this.mDataSetObservable.notifyChanged(position);
    }

    registerDataSetObserver(observer) {
        this.mDataSetObservable.registerObserver(observer);
    }

    unregisterDataSetObserver(observer) {
        this.mDataSetObservable.unregisterObserver(observer);
    }
}

export class ArrayAdapter extends BaseAdapter {

    constructor({

                    context,
                    selected = -1,
                    data = [],
                    dropDownResource = [],
                    getViewTypeCount = null,
                    areAllItemsEnabled = null,
                    getItemViewType = null,
                    getItemId = null,
                    getResources = null,
                    layoutItemViewType = null,
                    isEnabled = null,
                    createViewFromResource = null,
                    getPositionFromId = null
                } = {}) {
        super({
            getViewTypeCount,
            areAllItemsEnabled,
            getItemViewType,
            getItemId,
            getResources,
            layoutItemViewType,
            isEnabled
        });
        if (context === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mContext = context;
        this.mNotifyOnChange = true;
        this.mSelected = selected;
        if (dropDownResource !== null) {
            this.mDropDownResource = dropDownResource;
        }
        if (data !== null) {
            this.mData = data;
        }
        if (createViewFromResource !== null) {
            this.createViewFromResource = createViewFromResource;
        }
        if (getPositionFromId !== null) {
            this.getPositionFromId = getPositionFromId;
        }
        this.mOriginalValues = null;
    }

    add(data, position) {
        if (this.mOriginalValues !== null) {
            this.mOriginalValues.push(data);
        } else {
            this.mData.push(data);
        }
        if (this.mNotifyOnChange) {
            this.notifyDataSetChanged(position);
        }
    }

    addAll(items, position) {
        let values = this.mOriginalValues !== null ? this.mOriginalValues : this.mData;
        items.forEach(data => {
            values.push(data);
        });
        if (this.mNotifyOnChange) {
            this.notifyDataSetChanged(position);
        }
    }

    clear(preventEvent, position) {
        if (this.mOriginalValues !== null) {
            this.mOriginalValues = [];
        } else {
            this.mData = [];
        }
        this.mSelected = IGNORE_ITEM_VIEW_TYPE;
        if (!preventEvent && this.mNotifyOnChange) {
            this.notifyDataSetChanged(position);
        }
    }

    createViewFromResource(position, convertView, parent, resource) {
        return null;
    }

    getContext() {
        return this.mContext;
    }

    getCount() {
        return this.mData.length;
    }

    getDropDownView(position, convertView, parent) {
        return this.createViewFromResource(position, convertView, parent, this.mDropDownResource);
    }

    getItem(position) {
        return this.mData[position];
    }

    getItemId(position) {
        return this.mData[position].id;
    }

    getPosition(item) {
        return this.mData.indexOf(item);
    }

    getPositionFromId(id) {
        return IGNORE_ITEM_VIEW_TYPE;
    }

    getSelected() {
        return this.mSelected;
    }

    getView(position, convertView, parent) {
        return this.createViewFromResource(position, convertView, parent,
            this.getItemResourceType(this.getItemViewType(position)));
    }

    insert(index, data, position) {
        if (this.mOriginalValues !== null) {
            this.mOriginalValues.splice(index, 0, data);
        } else {
            this.mData.splice(index, 0, data);
        }
        if (this.mNotifyOnChange) {
            this.notifyDataSetChanged(position);
        }
    }

    isSelected(position) {
        return this.mSelected === position;
    }

    notifyDataSetChanged(selection) {
        this.mDataSetObservable.notifyChanged(selection);
        this.mNotifyOnChange = true;
    }

    remove(data, position) {
        let index = IGNORE_ITEM_VIEW_TYPE;
        let isOriginal = this.mOriginalValues !== null;
        if (isOriginal) {
            index = this.mOriginalValues.indexOf(data);
        } else {
            index = this.mData.indexOf(data);
        }
        if (index !== IGNORE_ITEM_VIEW_TYPE) {
            if (isOriginal) {
                this.mOriginalValues.splice(index, 1);
            } else {
                this.mData.splice(index, 1);
            }
            if (this.mNotifyOnChange) {
                this.notifyDataSetChanged(position);
            }
        }
    }

    setDropDownViewResource(resource) {
        this.mDropDownResource = resource;
    }

    setNotifyOnChange(notifyOnChange) {
        this.mNotifyOnChange = notifyOnChange;
    }

    setSelected(position) {
        this.mSelected = position;
    }

    sort(comparator, position) {
        if (this.mOriginalValues !== null) {
            this.mOriginalValues.sort(comparator);
        } else {
            this.mData.sort(comparator);
        }
        if (this.mNotifyOnChange) {
            this.notifyDataSetChanged(position);
        }
    }
}

export class FixedViewInfo {

    constructor({view, data, isSelectable = true} = {}) {
        if (view === null || data === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.view = view;
        this.data = data;
        this.isSelectable = isSelectable
    }

}

const EMPTY_INFO_LIST = [];

export class HeaderViewListAdapter extends BaseAdapter {

    constructor({adapter = null, headerViewInfos = null, footerViewInfos = null} = {}) {
        super();
        this.mHeaderViewInfos = EMPTY_INFO_LIST;
        this.mFooterViewInfos = EMPTY_INFO_LIST;
        this.mAdapter = adapter;
        this.mHeaderViewInfos = headerViewInfos;
        this.mFooterViewInfos = footerViewInfos;
        this.mAreAllFixedViewsSelectable = this.areAllListInfosSelectable(this.mHeaderViewInfos) &&
            this.areAllListInfosSelectable(this.mFooterViewInfos);
    }

    areAllItemsEnabled() {
        if (this.mAdapter !== null) {
            return this.mAreAllFixedViewsSelectable && this.mAdapter.areAllItemsEnabled();
        }
        return true;
    }

    areAllListInfosSelectable(infos) {
        if (infos !== null) {
            let item = null, len = infos.length;
            while (len--) {
                item = infos[len];
                if (!item.isSelectable) {
                    return false;
                }
            }
        }
        return true;
    }

    getCount() {
        if (this.mAdapter !== null) {
            return this.getFootersCount() + this.getHeadersCount() + this.mAdapter.getCount();
        }
        return this.getFootersCount() + this.getHeadersCount();
    }

    getFootersCount() {
        return this.mFooterViewInfos.length;
    }

    getHeadersCount() {
        return this.mHeaderViewInfos.length;
    }

    getItem(position) {
        let numHeaders = this.getHeadersCount();
        if (position < numHeaders) {
            return this.mHeaderViewInfos[position].data;
        }
        let adapterCount = 0;
        let adjPosition = position - numHeaders;
        if (this.mAdapter !== null) {
            adapterCount = this.mAdapter.getCount();
            if (adjPosition < adapterCount) {
                return this.mAdapter.getItem(adjPosition);
            }
        }
        return this.mFooterViewInfos[adjPosition - adapterCount].data;
    }

    getItemId(position) {
        let numHeaders = this.getHeadersCount();
        if (this.mAdapter !== null && position >= numHeaders) {
            let adjPosition = position - numHeaders;
            let adapterCount = this.mAdapter.getCount();
            if (adjPosition < adapterCount) {
                return this.mAdapter.getItemId(adjPosition);
            }
        }
        return -1;
    }

    getItemViewType(position) {
        let numHeaders = this.getHeadersCount();
        if (this.mAdapter !== null && position >= numHeaders) {
            let adjPosition = position - numHeaders;
            let adapterCount = this.mAdapter.getCount();
            if (adjPosition < adapterCount) {
                return this.mAdapter.getItemViewType(adjPosition);
            }
        }
        return ITEM_VIEW_TYPE_HEADER_OR_FOOTER;
    }

    getView(position, convertView, parent) {
        let numHeaders = this.getHeadersCount();
        if (position < numHeaders) {
            return this.mHeaderViewInfos[position].view;
        }
        let adapterCount = 0;
        let adjPosition = position - numHeaders;
        if (this.mAdapter !== null) {
            adapterCount = this.mAdapter.getCount();
            if (adjPosition < adapterCount) {
                return this.mAdapter.getView(adjPosition, convertView, parent);
            }
        }
        return this.mFooterViewInfos[adjPosition - adapterCount].view;
    }

    getViewTypeCount() {
        if (this.mAdapter !== null) {
            return this.mAdapter.getViewTypeCount();
        }
        return 1;
    }

    getWrappedAdapter() {
        return this.mAdapter;
    }

    hasStableIds() {
        if (this.mAdapter !== null) {
            return this.mAdapter.hasStableIds();
        }
        return false;
    }

    isEmpty() {
        return this.mAdapter !== null || this.mAdapter.isEmpty();
    }

    isEnabled(position) {
        let numHeaders = this.getHeadersCount();
        if (position < numHeaders) {
            return this.mHeaderViewInfos[position].isSelectable;
        }
        let adjPosition = position - numHeaders;
        let adapterCount = 0;
        if (this.mAdapter !== null) {
            adapterCount = this.mAdapter.getCount();
            if (adjPosition < adapterCount) {
                return this.mAdapter.isEnabled(adjPosition);
            }
        }
        return this.mFooterViewInfos[adjPosition - adapterCount].isSelectable;
    }

    registerDataSetObserver(observer) {
        if (this.mAdapter !== null) {
            this.mAdapter.registerDataSetObserver(observer);
        }
    }

    removeFooter(view) {
        let len = this.mFooterViewInfos.length, footer = null;
        while (len--) {
            footer = this.mFooterViewInfos[len];
            if (view === footer.view) {
                this.mFooterViewInfos.splice(len, 1);
                this.mAreAllFixedViewsSelectable = this.areAllListInfosSelectable(this.mFooterViewInfos) &&
                    this.areAllListInfosSelectable(this.mHeaderViewInfos);
                return true;
            }
        }
        return false;
    }

    removeHeader(view) {
        let len = this.mHeaderViewInfos.length, header = null;
        while (len--) {
            header = this.mHeaderViewInfos[len];
            if (view === header.view) {
                this.mHeaderViewInfos.splice(len, 1);
                this.mAreAllFixedViewsSelectable = this.areAllListInfosSelectable(this.mHeaderViewInfos) &&
                    this.areAllListInfosSelectable(this.mFooterViewInfos);
                return true;
            }
        }
        return false;
    }

    unregisterDataSetObserver(observer) {
        if (this.mAdapter !== null) {
            this.mAdapter.unregisterDataSetObserver(observer);
        }
    }
}
