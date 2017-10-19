/** @babel */
export class ContentObservable {

    constructor() {
        this.mObservers = [];
    }

    registerObserver(observer) {
        if (observer === null) {
            throw new ReferenceError("IllegalArgumentException The observer is null.");
        }
        if (this.mObservers.indexOf(observer) !== -1) {
            throw new ReferenceError("IllegalStateException Observer " + observer + " is already registered.");
        }
        this.mObservers.push(observer);
    }

    unregisterAll() {
        this.mObservers = [];
    }

    unregisterObserver(observer) {
        if (observer === null) {
            throw new ReferenceError("IllegalArgumentException The observer is null.");
        }
        let index = this.mObservers.indexOf(observer);
        if (index === -1) {
            throw new ReferenceError("IllegalStateException Observer " + observer + " was not registered.");
        }
        this.mObservers.splice(index, 1);
    }

}

export class ContentObserver {

    constructor({handler = null, onChange = null} = {}) {
        this.mHandler = handler;
        if (onChange !== null) {
            this.onChange = onChange;
        }
    }

    deliverSelfNotifications() {
        return false;
    }

    dispatchChange(selfChange = true, data = null) {
        if (this.mHandler !== null) {
            this.onChange(selfChange, data);
        } else {
            this.mHandler.post(new NotificationRunnable({
                observer: this, selfChange, data
            }));
        }
    }

    getContentObserver() {
        if (this.mTransport === null) {
            this.mTransport = new Transport({observer: this});
        }
        return this.mTransport;
    }

    onChange(selfChange, data) {
    }

    releaseContentObserver() {
        let oldTransport = this.mTransport;
        if (oldTransport !== null) {
            oldTransport.releaseContentObserver();
            this.mTransport = null;
        }
        return oldTransport;
    }

}

export class DataSetObservable extends ContentObservable {

    constructor() {
        super();
    }

    notifyChanged(data) {
        let observer = null;
        let len = this.mObservers.length;
        while (len--) {
            observer = this.mObservers[len];
            observer.onChanged(data);
        }
    }

    notifyInvalidated() {
        let observer = null;
        let len = this.mObservers.length;
        while (len--) {
            observer = this.mObservers[len];
            observer.onInvalidated();
        }
    }
}

export class DataSetObserver {

    constructor({onChanged = null, onInvalidated = null} = {}) {
        if (onChanged !== null) {
            this.onChanged = onChanged;
        }
        if (onInvalidated !== null) {
            this.onInvalidated = onInvalidated;
        }
    }

    onChanged(data) {

    }

    onInvalidated() {

    }
}

