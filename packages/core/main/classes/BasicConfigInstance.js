import {hasEnumerableProperty, isBasicDateType} from "../utils";
import BasicProxyGenerator from "../proxy/BasicProxyGenerator";

const DEFAULT_OPTIONS = {
    cacheable: true,
    proxyHandler: new BasicProxyGenerator().generate()
};

export const defaultOptions = {...DEFAULT_OPTIONS};

export const TYPE_LOCAL_PROVIDER = 'localProvider';
export const TYPE_ORIGIN = 'origin';
export const TYPE_PROVIDER = 'provider';

export default class BasicConfigInstance {

    constructor(origin, provider, options = {}) {
        const {cacheable, proxyHandler} = this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        this.proxyHandler = proxyHandler;
        this.cacheable = cacheable;
        this.provider = provider;
        this.origin = origin;
        this.cache = {};
    }

    get localProvider() {
        const instance = this;
        return {
            get $root() {
                return instance.root;
            },
            get $property() {
                return instance.ownedProperty
            },
            get $parent() {
                return instance.parentInstance ? instance.parentInstance.proxy : undefined
            },
            get $get() {
                return instance.get.bind(instance);
            },
            get $clearCache() {
                return instance.clearCache.bind(instance);
            }
        }
    }

    get originField() {
        return TYPE_ORIGIN;
    }

    getOwnPropertyDescriptor(property) {
        const value = this.get(property);
        let descriptor = Object.getOwnPropertyDescriptor(this.localProvider, property);
        if (descriptor == null) {
            descriptor = Object.getOwnPropertyDescriptor(this.provider, property);
        }
        if (descriptor == null) {
            descriptor = Object.getOwnPropertyDescriptor(this.origin, property);
        } else {
            // local / provider works
            descriptor.enumerable = false;
        }
        if (descriptor == null) {
            return descriptor;
        }
        return {
            value: value,
            writable: false,
            configurable: true,
            enumerable: descriptor.enumerable
        }
    }

    ownKeys() {
        return Reflect.ownKeys(this.origin)
            .concat(Reflect.ownKeys(this.provider))
            .concat(Object.keys(this.localProvider))
    }


    getFrom(type = '', property) {
        if (![TYPE_LOCAL_PROVIDER, TYPE_PROVIDER, TYPE_ORIGIN].includes(type)) {
            type = TYPE_ORIGIN;
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
            return this.getFrom(TYPE_LOCAL_PROVIDER, property);
        }
        if (hasEnumerableProperty(this.provider, property)) {
            return this.getFrom(TYPE_PROVIDER, property);
        }
        return this.getFrom(TYPE_ORIGIN, property);
    }

    getParameterProxy() {
        return this.generateProxy();
    }

    getComputedValue(property) {
        const realValue = this.getRealValue(property);
        const {enumerable, value} = realValue;

        if (!enumerable) {
            // un-enumerable value always means property or method from prototype
            return realValue;
        }

        if (typeof value === 'object') {
            // child object will convert to config instance, need to cache
            realValue.needCache = true;
            return realValue;
        }

        if (typeof value === 'string') {
            // parsed template
            const matchedParts = value.match(new RegExp('{!([^{}!]+)}', 'g'));
            if (matchedParts && matchedParts.length > 0) {
                // realValue.needCache = true;
                realValue.value = this.parseTemplateValue(value);
                return realValue;
            }
            // none-template string just returned
            return realValue;
        }

        if (typeof value !== 'function') {
            // return the value doesn't need computing
            return realValue;
        }

        // parse function
        const proxy = this.getParameterProxy();
        realValue.needCache = true;
        realValue.value = value.call(proxy, proxy);
        return realValue
    }

    parseTemplateValue(str) {
        str = str + '';
        return str.replace(
            new RegExp('{!([^{}!]+)}', 'g'),
            (match, property) => {
                const parsedValue = this.get(property);
                return parsedValue == null ? '' : parsedValue;
            }
        ).replace('\\!', '!').replace('\\}', '}').replace('\\{', '{');
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

    clearCache(key) {
        if (!key) {
            return false;
        }
        if (key === true) {
            this.cache = {};
            return true;
        }
        this.cache[key] = undefined;
        delete this.cache[key];
        return true;
    }

    getByChain(propertyChain) {
        if (typeof propertyChain === 'string') {
            propertyChain = propertyChain.split('.');
        }
        if (!Array.isArray(propertyChain)) {
            return this.get(propertyChain);
        }
        if (propertyChain.length === 0) {
            return undefined;
        }
        propertyChain = [...propertyChain];
        let tempResult = this.generateProxy();
        for (let property of propertyChain) {
            property = property.trim();
            tempResult = tempResult[property];
            if (tempResult == null) {
                return tempResult;
            }
        }
        return tempResult;
    }

    get(property, defaultValue = undefined) {

        if (Array.isArray(property)) {
            return this.getByChain(property);
        }

        if (this.cacheable && this.hasCachedValue(property)) {
            return this.getCachedValue(property);
        }

        const computedValue = this.getComputedValue(property);

        let returnValue = computedValue.value;

        const isChain = returnValue === undefined && typeof property === 'string' && property.indexOf('.') >= 0;

        const isCachedValue = this.cacheable && computedValue.needCache
            && ![TYPE_LOCAL_PROVIDER].includes(computedValue.type)
            && !isChain;

        if (!isBasicDateType(returnValue)) {
            returnValue = this.buildProxyForChildProperty(property, returnValue);
        } else if (isChain) {
            returnValue = this.getByChain(property);
        }

        if (isCachedValue) {
            this.putCachedValue(property, returnValue);
        }

        if (returnValue === undefined) {
            returnValue = defaultValue;
        }

        return returnValue;

    }

    buildProxyForChildProperty(property, childOrigin) {
        return (new this.constructor(childOrigin, this.provider, this.options))
            .generateProxy({
                instance: this,
                property
            });
    }

    generateProxy(parent) {
        if (parent) {
            this.applyParent(parent);
        }
        if (!this.proxy) {
            this.proxy = new Proxy(this, this.proxyHandler);
        }
        this.root = this.root || this.proxy;
        return this.proxy;
    }

}