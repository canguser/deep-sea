import ProxyHandlerTemplate from "./ProxyHandlerTemplate";

export default class BasicProxyGenerator {

    constructor() {
        this.template = new ProxyHandlerTemplate();
    }

    getOriginField(target) {
        return target.originField || 'origin';
    }

    setTemplate(template) {
        this.template = template || {};
        return this;
    }

    generate() {
        return new Proxy(this.template, {
            get: (t, p, receiver) => {
                const origin = Reflect.get(t, p, receiver);
                if (typeof origin !== 'function') {
                    const _this = this;
                    return function (target, ...args) {
                        const originField = _this.getOriginField(target);
                        if (typeof target[p] === 'function') {
                            return target[p](...args);
                        }
                        const originTarget = target[originField] || {};
                        return Reflect[p](originTarget, ...args);
                    }
                }
                return origin;
            }
        })
    }

}