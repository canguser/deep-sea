import BasicProxyGenerator from "./BasicProxyGenerator";
import {hasEnumerableProperty, isBasicDateType} from "../utils";

const generator = new BasicProxyGenerator();
generator.setTemplate({});

export default class ProxyInstance {

    constructor(target, handler = generator.generate()) {
        this[this.originField] = target;
        this.proxyHandler = handler;
    }

    get originField() {
        return 'origin'
    }

    get originTarget() {
        return this[this.originField] || {};
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

    get(property) {
        const localProvider = this.localProvider;
        if (hasEnumerableProperty(localProvider, property)) {
            return localProvider[property];
        }
        const returnValue = this.originTarget[property];
        if (!isBasicDateType(returnValue)) {
            return this.buildProxyForChildProperty(property, returnValue);
        }
        return returnValue;
    }

    getChildInstance(childOrigin) {
        return new this.constructor(childOrigin, this.proxyHandler);
    }

    buildProxyForChildProperty(property, childOrigin) {
        return this.getChildInstance(childOrigin).generateProxy(
            {
                instance: this,
                property
            }
        );
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