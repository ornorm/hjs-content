/** @babel */
import {ArrayMap, SparseArray} from 'hjs-collection/lib/array';
import {MessageHandler, Runnable} from 'hjs-message/lib/handler';
import {AsyncTask} from 'hjs-future/lib/task';
import {ContentObserver} from './dataset';

export class NotificationRunnable extends Runnable {

    constructor({observer, selfChange = true, data} = {}) {
        super();
        if (observer === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mObserver = observer;
        this.mSelfChange = selfChange;
        this.mData = data;
    }

    run() {
        this.mObserver.onChange(this.mSelfChange, this.mData);
    }

}

export class Transport {

    constructor({observer = null} = {}) {
        this.mContentObserver = observer;
    }

    onChange(selfChange = true, data = null) {
        if (this.mContentObserver !== null) {
            this.mContentObserver.dispatchChange(selfChange, data);
        }
    }

    releaseContentObserver() {
        this.mContentObserver = null;
    }

}

export class ForceLoadContentObserver extends ContentObserver {

    constructor({handler = null, onChange = null} = {}) {
        super({handler, onChange});
        if (this.mHandler === null) {
            this.mHandler = MessageHandler.create({});
        }
    }

    deliverSelfNotifications() {
        return true;
    }

    onChange(selfChange = true, data = null) {
        this.mLoader.onContentChanged();
    }

}

export class LoaderListener {

    constructor({onLoadComplete = null, onLoadCanceled = null} = {}) {
        if (onLoadComplete !== null) {
            this.onLoadComplete = onLoadComplete;
        }
        if (onLoadCanceled !== null) {
            this.onLoadCanceled = onLoadCanceled;
        }
    }

    onLoadCanceled(loader) {
    }

    onLoadComplete(loader, data) {
    }

}

export class Loader {

    constructor({
        id,
        context,
        onStartLoading = null,
        onCancelLoad = null,
        onForceLoad = null,
        onStopLoading = null,
        onAbandon = null,
        onReset = null,
        listener = null
    } = {}) {
        this.mStarted = false;
        this.mAbandoned = false;
        this.mReset = true;
        this.mContentChanged = false;
        this.mProcessingChange = false;
        if (context === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mContext = context;
        if (id === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mId = id;
        if (onStartLoading !== null) {
            this.onStartLoading = onStartLoading;
        }
        if (onCancelLoad !== null) {
            this.onCancelLoad = onCancelLoad;
        }
        if (onForceLoad !== null) {
            this.onForceLoad = onForceLoad;
        }
        if (onStopLoading !== null) {
            this.onStopLoading = onStopLoading;
        }
        if (onAbandon !== null) {
            this.onAbandon = onAbandon;
        }
        if (onReset !== null) {
            this.onReset = onReset;
        }
        if (listener !== null) {
            this.registerListener(this.mId, listener);
        }
    }

    abandon() {
        this.mAbandoned = true;
        this.onAbandon();
    }

    cancelLoad() {
        return this.onCancelLoad();
    }

    commitContentChanged() {
        this.mProcessingChange = false;
    }

    dataToString(data) {
        return data !== null ? data.toString() : "";
    }

    deliverCancellation() {
        if (this.mListener !== null) {
            this.mListener.onLoadCanceled(this);
        }
    }

    deliverResult(data) {
        if (this.mListener !== null) {
            this.mListener.onLoadComplete(this, data);
        }
    }

    forceLoad() {
        this.onForceLoad();
    }

    getContext() {
        return this.mContext;
    }

    getId() {
        return this.mId;
    }

    isAbandoned() {
        return this.mAbandoned;
    }

    isReset() {
        return this.mReset;
    }

    isStarted() {
        return this.mStarted;
    }

    onCancelLoad() {
        return false;
    }

    onAbandon() {
    }

    onForceLoad() {
    }

    onContentChanged() {
        if (this.mStarted) {
            this.forceLoad();
        } else {
            this.mContentChanged = true;
        }
    }

    onReset() {
    }

    onStartLoading() {
    }

    onStopLoading() {
    }

    registerListener(id, listener) {
        if (this.mListener !== null) {
            throw new ReferenceError("IllegalStateException There is already a listener registered");
        }
        this.mListener = listener;
        this.mId = id;
    }

    reset() {
        this.onReset();
        this.mReset = true;
        this.mStarted = false;
        this.mAbandoned = false;
        this.mContentChanged = false;
        this.mProcessingChange = false;
    }

    rollbackContentChanged() {
        if (this.mProcessingChange) {
            this.mContentChanged = true;
        }
    }

    startLoading() {
        this.mStarted = true;
        this.mReset = false;
        this.mAbandoned = false;
        this.onStartLoading();
    }

    stopLoading() {
        this.mStarted = false;
        this.onStopLoading();
    }

    takeContentChanged() {
        let res = this.mContentChanged;
        this.mContentChanged = false;
        this.mProcessingChange |= res;
        return res;
    }

    toString() {
        return `Loader(id=${this.mId})`;
    }

    unregisterListener(listener) {
        if (this.mListener) {
            throw new ReferenceError("IllegalStateException No listener register");
        }
        if (this.mListener !== listener) {
            throw new ReferenceError("IllegalArgumentException Attempting to unregister the wrong listener");
        }
        this.mListener = null;
    }

}

export class LoadTask extends AsyncTask {

    constructor({
        loader,
        executor = null,
        handler = null,
        onPreExecute = null,
        onProgressUpdate = null
    } = {}) {
        super({executor, handler, onPreExecute, onProgressUpdate});
        if (loader === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mLoader = loader;
    }

    doInBackground(params) {
        console.log(this + " >>> doInBackground");
        try {
            this.mLoader.onLoadInBackground(this);
        } catch (e) {
            if (!this.isCancelled()) {
                console.log(e);
                console.error(this + "  <<< doInBackground (was canceled) " + e.message);
            }
        }
    }

    isWaiting() {
        return this.mWaiting;
    }

    onCancelled(data) {
        console.log(this + " onCancelled");
        try {
            this.mLoader.dispatchOnCancelled(this, data);
        } catch (e) {
            console.error(this + "  <<< onCancelled (was in error) " + e.message);
        }
    }

    onPostExecute(data) {
        console.log(this + " onPostExecute");
        try {
            this.mLoader.dispatchOnLoadComplete(this, data);
        } catch (e) {
            console.error(this + "  <<< onPostExecute (was in error) " + e.message);
        }
    }

    run() {
        this.mWaiting = false;
        this.mLoader.executePendingTask();
    }

}

export class AsyncTaskLoader extends Loader {

    constructor({
        id,
        context,
        listener = null,
        executor = null,
        cancelLoadInBackground = null,
        loadInBackground = null,
        onCanceled = null
    } = {}) {
        super({id, context, listener});
        if (executor !== null) {
            this.mExecutor = executor;
        }
        if (cancelLoadInBackground !== null) {
            this.cancelLoadInBackground = cancelLoadInBackground;
        }
        if (loadInBackground !== null) {
            this.loadInBackground = loadInBackground;
        }
        if (onCanceled !== null) {
            this.onCanceled = onCanceled;
        }
    }

    cancelLoadInBackground() {
    }

    dispatchOnCancelled(task, data) {
        this.onCanceled(data);
        if (this.mCancellingTask === task) {
            console.log("Cancelled task is now canceled!");
            this.rollbackContentChanged();
            this.mLastLoadCompleteTime = Date.now();
            this.mCancellingTask = null;
            console.log("Delivering cancellation");
            this.deliverCancellation();
            this.executePendingTask();
        }
    }

    dispatchOnLoadComplete(task, data) {
        if (this.mTask !== task) {
            console.log("Load complete of old task, trying to cancel");
            this.dispatchOnCancelled(task, data);
        } else {
            if (this.isAbandoned()) {
                this.onCanceled(data);
            } else {
                this.commitContentChanged();
                this.mLastLoadCompleteTime = Date.now();
                this.mTask = null;
                console.log("Delivering result");
                this.deliverResult(data);
            }
        }
    }

    executePendingTask() {
        if (this.mCancellingTask === null && this.mTask === null) {
            if (this.mTask.waiting) {
                this.mTask.waiting = false;
                this.mHandler.removeCallbacks(this.mTask);
            }
            if (this.mUpdateThrottle > 0) {
                let now = Date.now();
                if (now < (this.mLastLoadCompleteTime + this.mUpdateThrottle)) {
                    console.log("Waiting until " +
                        (this.mLastLoadCompleteTime + this.mUpdateThrottle) +
                        " to execute: " + this.mTask);
                    this.mTask.waiting = true;
                    this.mHandler.postAtTime(
                        this.mTask,
                        null,
                        this.mLastLoadCompleteTime + this.mUpdateThrottle);
                    return;
                }
            }
            console.log("Executing: " + this.mTask);
            this.mTask.execute();
        }
    }

    isLoadInBackgroundCanceled() {
        return this.mCancellingTask !== null;
    }

    loadInBackground(task) {
    }

    onCanceled(data) {
    }

    onCancelLoad() {
        console.log("onCancelLoad: mTask=" + this.mTask);
        if (this.mTask !== null) {
            if (this.mCancellingTask !== null) {
                console.log("cancelLoad: still waiting for cancelled task; dropping next");
                if (this.mTask.waiting) {
                    this.mTask.waiting = false;
                    this.mHandler.removeCallbacks(this.mTask);
                }
                this.mTask = null;
                return false;
            } else if (this.mTask.waiting) {
                console.log("cancelLoad: task is waiting, dropping it");
                this.mTask.waiting = false;
                this.mHandler.removeCallbacks(this.mTask);
                this.mTask = null;
                return false;
            } else {
                let cancelled = this.mTask.cancel(false);
                console.log("cancelLoad: cancelled=" + cancelled);
                if (cancelled) {
                    this.mCancellingTask = this.mTask;
                    this.cancelLoadInBackground();
                }
                this.mTask = null;
                return cancelled;
            }
        }
        return false;
    }

    onForceLoad() {
        this.cancelLoad();
        this.mTask = new LoadTask({executor: this.mExecutor, loader: this});
        console.log("Preparing load: mTask=" + this.mTask);
        this.executePendingTask();
    }

    onLoadInBackground() {
        this.loadInBackground(this.mTask);
    }

    setUpdateThrottle(delayMS = 0) {
        this.mUpdateThrottle = delayMS;
        if (delayMS !== 0) {
            this.mHandler = MessageHandler.create({});
        }
    }

    waitForLoader() {
        let task = this.mTask;
        if (task !== null) {
            this.task.waitForLoader();
        }
    }

}

export class LoaderCallbacks {

    constructor({
        onCreateLoader = null,
        onLoadFinished = null,
        onLoaderReset = null
    } = {}) {
        if (onCreateLoader !== null) {
            this.onCreateLoader = onCreateLoader;
        }
        if (onLoadFinished !== null) {
            this.onLoadFinished = onLoadFinished;
        }
        if (onLoaderReset !== null) {
            this.onLoaderReset = onLoaderReset;
        }
    }

    onCreateLoader(id, args) {
        return null;
    }

    onLoadFinished(loader, data) {
    }

    onLoaderReset(loader) {
    }

}

export class LoaderManager {

    constructor({
        destroyLoader = null,
        getLoader = null,
        initLoader = null,
        restartLoader = null
    }) {
        if (destroyLoader !== null) {
            this.destroyLoader = destroyLoader;
        }
        if (getLoader !== null) {
            this.getLoader = getLoader;
        }
        if (initLoader !== null) {
            this.initLoader = initLoader;
        }
        if (restartLoader !== null) {
            this.restartLoader = restartLoader;
        }
    }

    destroyLoader(id) {
    }

    getLoader(id) {
        return null;
    }

    initLoader(id, args, callback) {
    }

    restartLoader(id, args, callback) {
    }

}

export class LoaderManagerHost {

    constructor({context}) {
        if (context === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mContext = context;
    }

    doLoaderDestroy() {
        if (this.mLoaderManager === null) {
            return;
        }
        this.mLoaderManager.doDestroy();
    }

    doLoaderRetain() {
        if (this.mLoaderManager === null) {
            return;
        }
        this.mLoaderManager.doRetain();
    }

    doLoaderStart() {
        if (this.mLoadersStarted) {
            return;
        }
        this.mLoadersStarted = true;
        if (this.mLoaderManager !== null) {
            this.mLoaderManager.doStart();
        } else if (!this.mCheckedForLoaderManager) {
            this.mLoaderManager = this.getLoaderManager("(root)", this.mLoadersStarted, false);
        }
        this.mCheckedForLoaderManager = true;
    }

    doLoaderStop(retain = false) {
        this.mRetainLoaders = retain;
        if (this.mLoaderManager === null) {
            return;
        }
        if (!this.mLoadersStarted) {
            return;
        }
        this.mLoadersStarted = false;
        if (retain) {
            this.mLoaderManager.doRetain();
        } else {
            this.mLoaderManager.doStop();
        }
    }

    getContext() {
        return this.mContext;
    }

    getLoaderManager(who, started, create) {
        if (this.mLoaderManager === null) {
            this.mAllLoaderManagers = new ArrayMap();
        }
        let lm = this.mAllLoaderManagers.get(who);
        if (lm === null) {
            if (create) {
                lm = new LoaderManagerImpl({who, host: this, started});
                this.mAllLoaderManagers.put(who, lm);
            }
        } else {
            lm.updateHostController(this);
        }
        return lm;
    }

    getLoaderManagerImpl() {
        if (this.mLoaderManager !== null) {
            return this.mLoaderManager;
        }
        this.mCheckedForLoaderManager = true;
        this.mLoaderManager = this.getLoaderManager("(root)", this.mLoadersStarted, true /*create*/);
        return this.mLoaderManager;
    }

    getRetainLoaders() {
        return this.mRetainLoaders;
    }

    inactivateState(who) {
        if (this.mAllLoaderManagers !== null) {
            let lm = this.mAllLoaderManagers.get(who);
            if (lm !== null && !lm.mRetaining) {
                lm.doDestroy();
                this.mAllLoaderManagers.remove(who);
            }
        }
    }

    reportLoaderStart() {
        if (this.mAllLoaderManagers !== null) {
            let N = this.mAllLoaderManagers.size();
            let loaders = new Array(N);
            for (let i = N - 1; i >= 0; i--) {
                loaders[i] = this.mAllLoaderManagers.valueAt(i);
            }
            for (const lm of loaders) {
                lm.finishRetain();
                lm.doReportStart();
            }
        }
    }

    restoreLoaderNonConfig(loaderManagers) {
        if (this.mAllLoaderManagers !== null) {
            for (let i = 0, N = loaderManagers.size(); i < N; i++) {
                loaderManagers.valueAt(i).updateHostController(this);
            }
        }
        this.mAllLoaderManagers = loaderManagers;
    }

    retainLoaderNonConfig() {
        let retainLoaders = false;
        if (this.mAllLoaderManagers !== null) {
            let N = this.mAllLoaderManagers.size();
            let loaders = new Array(N);
            for (let i = N - 1; i >= 0; i--) {
                loaders[i] = this.mAllLoaderManagers.valueAt(i);
            }
            let doRetainLoaders = this.getRetainLoaders();
            for (const lm of loaders) {
                if (!lm.mRetaining && doRetainLoaders) {
                    if (!lm.mStarted) {
                        lm.doStart();
                    }
                    lm.doRetain();
                }
                if (lm.mRetaining) {
                    retainLoaders = true;
                } else {
                    lm.doDestroy();
                    this.mAllLoaderManagers.remove(lm.mWho);
                }
            }
        }
        if (retainLoaders) {
            return this.mAllLoaderManagers;
        }
        return null;
    }

}

export class LoaderInfo extends LoaderListener {

    constructor({
        id,
        args,
        callbacks,
        manager,
        onLoadComplete = null,
        onLoadCanceled = null
    } = {}) {
        super({onLoadComplete, onLoadCanceled});
        if (id === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.id = id;
        if (manager === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mLoaderManager = manager;
        if (callbacks === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mCallbacks = callbacks;
        this.args = args;
    }

    callOnLoadFinished(loader, data) {
        if (this.mCallbacks !== null) {
            console.log("  onLoadFinished in " + loader + ": "
                + loader.dataToString(data));
            this.mCallbacks.onLoadFinished(loader, data);
            this.mDeliveredData = true;
        }
    }

    cancel() {
        console.log("  Canceling: " + this);
        if (this.mStarted &&
            this.mLoader !== null &&
            this.mListenerRegistered) {
            let cancelLoadResult = this.mLoader.cancelLoad();
            if (!cancelLoadResult) {
                this.onLoadCanceled(this.mLoader);
            }
            return cancelLoadResult;
        }
        return false;
    }

    destroy() {
        console.log("  Destroying: " + this);
        this.mDestroyed = true;
        let needReset = this.mDeliveredData;
        this.mDeliveredData = false;
        if (this.mCallbacks !== null &&
            this.mLoader !== null &&
            this.mHaveData &&
            needReset) {
            console.log("  Reseting: " + this);
            this.mCallbacks.onLoaderReset(this.mLoader);
        }
        this.mCallbacks = null;
        this.mData = null;
        this.mHaveData = false;
        if (this.mLoader !== nul) {
            if (this.mListenerRegistered) {
                this.mListenerRegistered = false;
                this.mLoader.unregisterListener(this);
            }
            this.mLoader.reset();
        }
        if (this.mPendingLoader !== null) {
            this.mPendingLoader.destroy();
        }
    }

    finishRetain() {
        if (this.mRetaining) {
            console.log("  Finished Retaining: " + this);
            this.mRetaining = false;
            if (this.mStarted !== this.mRetainingStarted) {
                if (!this.mStarted) {
                    this.stop();
                }
            }
        }
        if (this.mStarted &&
            this.mHaveData && !this.mReportNextStart) {
            this.callOnLoadFinished(this.mLoader, this.mData);
        }
    }

    onLoadCanceled(loader) {
        console.log("onLoadCanceled: " + this);
        if (this.mDestroyed) {
            console.log("  Ignoring load canceled -- destroyed");
            return;
        }
        if (this.mLoaderManager.mLoaders.get(this.mId) !== this) {
            console.log("  Ignoring load canceled -- not active");
            return;
        }
        let pending = this.mPendingLoader;
        if (pending !== null) {
            console.log("  Switching to pending loader: " + pending);
            this.mPendingLoader = null;
            this.mLoaderManager.mLoaders.put(this.mId, null);
            this.destroy();
            this.mLoaderManager.installLoader(pending);
        }
    }

    onLoadComplete(loader, data) {
        console.log("onLoadComplete: " + this);
        if (this.mDestroyed) {
            console.log("  Ignoring load complete -- destroyed");
            return;
        }
        if (this.mLoaderManager.mLoaders.get(this.mId) !== this) {
            console.log("  Ignoring load complete -- not active");
            return;
        }
        let pending = this.mPendingLoader;
        if (pending !== null) {
            console.log("  Switching to pending loader: " + pending);
            this.mPendingLoader = null;
            this.mLoaders.put(this.mId, null);
            this.destroy();
            this.mLoaderManager.installLoader(pending);
            return;
        }
        if (this.mData !== data || !this.mHaveData) {
            this.mData = data;
            this.mHaveData = true;
            if (this.mStarted) {
                this.callOnLoadFinished(loader, data);
            }
        }
        let info = this.mLoaderManager.mInactiveLoaders.get(this.mId);
        if (info !== null &&
            info !== this) {
            info.mDeliveredData = false;
            info.destroy();
            this.mLoaderManager.mInactiveLoaders.remove(this.mId);
        }
        let host = this.mLoaderManager.mHost;
        if (host !== null && !this.mLoaderManager.hasRunningLoaders()) {
            //host.mFragmentManager.startPendingDeferredFragments();
        }
    }

    reportStart() {
        if (this.mStarted) {
            if (this.mReportNextStart) {
                this.mReportNextStart = false;
                if (this.mHaveData && !this.mRetaining) {
                    this.callOnLoadFinished(this.mLoader, this.mData);
                }
            }
        }
    }

    retain() {
        console.log("  Retaining: " + this);
        this.mRetaining = true;
        this.mRetainingStarted = this.mStarted;
        this.mStarted = false;
        this.mCallbacks = null;
    }

    start() {
        if (this.mRetaining &&
            this.mRetainingStarted) {
            this.mStarted = true;
            return;
        }
        if (this.mStarted) {
            return;
        }
        this.mStarted = true;
        console.log("  Starting: " + this);
        if (this.mLoader === null && this.mCallbacks !== null) {
            this.mLoader = this.mCallbacks.onCreateLoader(this.mId, this.mArgs);
        }
        if (this.mLoader !== null) {
            if (!this.mListenerRegistered) {
                this.mLoader.registerListener(this.mId, this);
                this.mListenerRegistered = true;
            }
            this.mLoader.startLoading();
        }
    }

    stop() {
        console.log("  Stopping: " + this);
        this.mStarted = false;
        if (!this.mRetaining) {
            if (this.mLoader !== null && this.mListenerRegistered) {
                // Let the loader know we're done with it
                this.mListenerRegistered = false;
                this.mLoader.unregisterListener(this);
                this.mLoader.stopLoading();
            }
        }
    }

}

export class LoaderManagerImpl extends LoaderManager {

    constructor({who, host, started = false}) {
        super();
        this.mLoaders = new SparseArray({capacity: 0});
        this.mInactiveLoaders = new SparseArray({capacity: 0});
        if (who === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mWho = who;
        if (host === null) {
            throw new ReferenceError('NullPointerException');
        }
        this.mHost = host;
        this.mStarted = started;
    }

    createAndInstallLoader(id, args, callback) {
        try {
            this.mCreatingLoader = true;
            let info = this.createLoader(id, args, callback);
            this.installLoader(info);
            return info;
        } finally {
            this.mCreatingLoader = false;
        }
    }

    createLoader(id, args, callback) {
        return new LoaderInfo({
            id,
            args,
            callbacks,
            loader: callback.onCreateLoader(id, args),
            manager: this
        });
    }

    destroyLoader(id) {
        if (this.mCreatingLoader) {
            throw new Error("IllegalStateException Called while creating a loader");
        }
        console.log("destroyLoader in " + this + " of " + id);
        let idx = this.mLoaders.indexOfKey(id);
        let info = null;
        if (idx >= 0) {
            info = this.mLoaders.valueAt(idx);
            this.mLoaders.removeAt(idx);
            info.destroy();
        }
        idx = this.mInactiveLoaders.indexOfKey(id);
        if (idx >= 0) {
            info = this.mInactiveLoaders.valueAt(idx);
            this.mInactiveLoaders.removeAt(idx);
            info.destroy();
        }
        if (this.mHost !== null && !this.hasRunningLoaders()) {
            //this.mHost.mFragmentManager.startPendingDeferredFragments();
        }
    }

    doDestroy() {
        if (!this.mRetaining) {
            console.log("Destroying Active in " + this);
            for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
                this.mLoaders.valueAt(i).destroy();
            }
            this.mLoaders.clear();
        }
        console.log("Destroying Inactive in " + this);
        for (let i = this.mInactiveLoaders.size() - 1; i >= 0; i--) {
            this.mInactiveLoaders.valueAt(i).destroy();
        }
        this.mInactiveLoaders.clear();
    }

    doStart() {
        console.log("Starting in " + this);
        if (this.mStarted) {
            let e = new Error("RuntimeException here");
            console.error("Called doStart when already started: " + this, e);
            return;
        }
        this.mStarted = true;
        for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
            this.mLoaders.valueAt(i).start();
        }
    }

    doReportNextStart() {
        for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
            this.mLoaders.valueAt(i).mReportNextStart = true;
        }
    }

    doReportStart() {
        for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
            this.mLoaders.valueAt(i).reportStart();
        }
    }

    doRetain() {
        console.log("Retaining in " + this);
        if (!this.mStarted) {
            let e = new Error("RuntimeException here");
            console.error("Called doRetain when not started: " + this, e);
            return;
        }
        this.mRetaining = true;
        this.mStarted = false;
        for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
            this.mLoaders.valueAt(i).retain();
        }
    }

    doStop() {
        console.log("Stopping in " + this);
        if (!this.mStarted) {
            let e = new Error("RuntimeException here");
            console.error("Called doStop when not started: " + this, e);
            return;
        }
        for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
            this.mLoaders.valueAt(i).stop();
        }
        this.mStarted = false;
    }

    finishRetain() {
        if (this.mRetaining) {
            console.log("Finished Retaining in " + this);
            this.mRetaining = false;
            for (let i = this.mLoaders.size() - 1; i >= 0; i--) {
                this.mLoaders.valueAt(i).finishRetain();
            }
        }
    }

    getHost() {
        return this.mHost;
    }

    getLoader(id) {
        if (this.mCreatingLoader) {
            throw new Error("IllegalStateException Called while creating a loader");
        }
        let loaderInfo = this.mLoaders.get(id);
        if (loaderInfo !== null) {
            if (loaderInfo.mPendingLoader !== null) {
                return loaderInfo.mPendingLoader.mLoader;
            }
            return loaderInfo.mLoader;
        }
        return null;
    }

    hasRunningLoaders() {
        let loadersRunning = false;
        let count = this.mLoaders.size();
        for (let i = 0; i < count; i++) {
            let li = this.mLoaders.valueAt(i);
            loadersRunning |= li.mStarted && !li.mDeliveredData;
        }
        return loadersRunning;
    }

    initLoader(id, args, callback) {
        if (this.mCreatingLoader) {
            throw new Error("IllegalStateException Called while creating a loader");
        }
        let info = this.mLoaders.get(id);
        console.log(" initLoader in " + this + ": args=" + args);
        if (info === null) {
            info = this.createAndInstallLoader(id, args, callback);
            console.log(" Created new loader " + info);
        } else {
            console.log(" Re-using existing loader " + info);
            info.mCallbacks = callback;
        }
        if (info.mHaveData && this.mStarted) {
            info.callOnLoadFinished(info.mLoader, info.mData);
        }
        return info.mLoader;
    }

    installLoader(info) {
        this.mLoaders.put(info.mId, info);
        if (this.mStarted) {
            info.start();
        }
    }

    restartLoader(id, args, callback) {
        if (this.mCreatingLoader) {
            throw new Error("IllegalStateException Called while creating a loader");
        }
        let info = this.mLoaders.get(id);
        console.log("restartLoader in " + this + ": args=" + args);
        if (info !== null) {
            let inactive = this.mInactiveLoaders.get(id);
            if (inactive !== null) {
                if (info.mHaveData) {
                    console.log("  Removing last inactive loader: " + info);
                    inactive.mDeliveredData = false;
                    inactive.destroy();
                    info.mLoader.abandon();
                    this.mInactiveLoaders.put(id, info);
                } else {
                    if (!info.cancel()) {
                        console.log("  Current loader is stopped; replacing");
                        this.mLoaders.put(id, null);
                        info.destroy();
                    } else {
                        console.log("  Current loader is running; configuring pending loader");
                        if (info.mPendingLoader !== null) {
                            console.log("  Removing pending loader: " + info.mPendingLoader);
                            info.mPendingLoader.destroy();
                            info.mPendingLoader = null;
                        }
                        console.log("  Enqueuing as new pending loader");
                        info.mPendingLoader = this.createLoader(id, args, callback);
                        return info.mPendingLoader.mLoader;
                    }
                }
            } else {
                console.log("  Making last loader inactive: " + info);
                info.mLoader.abandon();
                this.mInactiveLoaders.put(id, info);
            }
        }
        info = this.createAndInstallLoader(id, args, callback);
        return info.mLoader;
    }

    updateHostController(host) {
        this.mHost = host;
    }

}
