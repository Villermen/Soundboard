import store2 from 'store2';
import EventEmitter from 'events';

const STORE_NAMESPACE = 'soundboard';

const DEFAULT_SETTINGS = {
    volume: 1.0,
    theme: 'default',
};

export const settingManifest = {
    volume: {
        label: 'Volume',
        type: 'slider',
        params: { min: 0, max: 100, step: 5, multiplier: 100 },
    },
    theme: {
        label: 'Theme',
        type: 'theme',
    },
};

class SettingsManager extends EventEmitter {

    /** @type SettingsManager */
    static instance;

    store;

    static init() {
        this.instance = new SettingsManager();
    }

    constructor() {
        super();

        // Init store with namespace
        this.store = store2.namespace(STORE_NAMESPACE);
        // Set default settings, without overwrite
        this.store.setAll(DEFAULT_SETTINGS, false);
    }

    set(key, value, overwrite = true) {
        this.store.set(key, value, overwrite);

        this.emit(key, value);
    }

    get(key) {
        return this.store.get(key);
    }

    getAll() {
        return this.store.getAll();
    }

    setAll(settings) {
        this.store.setAll(settings);

        Object.keys(settings).forEach((key) => {
            this.emit(key, settings[key]);
        });
    }

}

export default SettingsManager;
