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
            }
        }
    }

    get originField() {
        return TYPE_ORIGIN;
    }

    getOwnPropertyDescriptor(property) {
        const value = this.get(property);
        return {
            configurable: true,
            enumerable: true,
            value: value,
            writable: false
        }
    }

    ownKeys() {
        return Reflect.ownKeys(this.origin).concat(Reflect.ownKeys(this.provider)).concat(
            ['$property', '$root', '$parent', '$get']
        )
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
        const proxy = this.getParameterProxy();
        const realValue = this.getRealValue(property);
        const {enumerable, value} = realValue;
        if (!enumerable) {
            return realValue;
        }
        if (typeof value === 'string') {
            realValue.value = this.parseTemplateValue(value);
            return realValue;
        } else if (typeof value !== 'function') {
            return realValue;
        }
        realValue.value = value.call(proxy, proxy);
        return realValue
    }

    parseTemplateValue(str) {
        str = str + '';
        return str.replace(
            new RegExp('\{\!([^{}!]+)\}', 'g'),
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

    get(property) {

        if (Array.isArray(property)) {
            return this.getByChain(property);
        }

        if (this.cacheable && this.hasCachedValue(property)) {
            return this.getCachedValue(property);
        }

        const computedValue = this.getComputedValue(property);

        let returnValue = computedValue.value;

        if (computedValue.type === TYPE_LOCAL_PROVIDER) {
            return returnValue;
        }

        if (!isBasicDateType(returnValue)) {
            returnValue = this.buildProxyForChildProperty(property, returnValue);
        } else if (returnValue === undefined && typeof property === 'string' && property.indexOf('.') >= 0) {
            return this.getByChain(property);
        }

        this.cacheable && this.putCachedValue(property, returnValue);

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