import {hasEnumerableProperty, isBasicDateType} from "../utils";
import handler from "../proxy/handler";

export const defaultOptions = {
    cacheable: true
};

export default class BasicConfigInstance {

    constructor(origin, provider, options = {}) {
        const {cacheable} = Object.assign({}, defaultOptions, options);
        this.cacheable = cacheable;
        this.provider = provider;
        this.origin = origin;
        this.cache = {};
    }

    get localProvider() {
        const instance = this;
        return {
            get $instance() {
                return instance;
            },
            get $root() {
                return instance.root;
            },
            get $property() {
                return instance.ownedProperty
            },
            get $parent() {
                return instance.parentInstance.proxy
            }
        }
    }

    getFrom(type = '', property) {
        if (!['localProvider', 'provider', 'origin'].includes(type)) {
            type = 'origin';
        }
        const provider = this[type];
        const descriptor = Object.getOwnPropertyDescriptor(provider, property);
        const hasDescriptor = !!descriptor;
        return {
            value: hasDescriptor ? (descriptor.value || descriptor.get) : provider[property], type,
            enumerable: hasDescriptor && descriptor.enumerable,
            descriptor
        }
    }

    getRealValue(property) {
        const localProvider = this.localProvider;
        if (hasEnumerableProperty(localProvider, property)) {
            return this.getFrom('localProvider', property);
        }
        if (hasEnumerableProperty(this.provider, property)) {
            return this.getFrom('provider', property);
        }
        return this.getFrom('origin', property);
    }

    getParameterProxy() {
        return this.generateProxy();
    }

    getComputedValue(property) {
        const proxy = this.getParameterProxy();
        const realValue = this.getRealValue(property);
        const {enumerable, value} = realValue;
        if (!enumerable || typeof value !== 'function') {
            return value;
        }
        return value.call(proxy, proxy);
    }

    applyParent(
        {
            instance, property
        } = {}
    ) {
        if (instance && property) {
            this.parentInstance = instance;
            this.ownedProperty = property;
            this.root = instance.root || this;
        }
        return this;
    }

    getCachedValue(property) {
        return this.cache[property];
    }

    hasCachedValue(property) {
        return hasEnumerableProperty(this.cache, property);
    }

    putCachedValue(property, value) {
        this.cache[property] = value;
    }

    get(property) {

        if (this.cacheable && this.hasCachedValue(property)) {
            return this.getCachedValue(property);
        }

        let returnValue = this.getComputedValue(property);

        if (!isBasicDateType(returnValue)) {
            returnValue = (new this.constructor(returnValue, this.provider))
                .generateProxy({
                    instance: this,
                    property
                });
        }

        this.cacheable && this.putCachedValue(property, returnValue);

        return returnValue;

    }

    generateProxy(parent) {
        if (parent) {
            this.applyParent(parent);
        }
        if (!this.proxy) {
            this.proxy = new Proxy(this, handler);
        }
        this.root = this.root || this.proxy;
        return this.proxy;
    }

}