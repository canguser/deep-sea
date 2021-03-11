import ProxyHandlerTemplate from "./ProxyHandlerTemplate";

export default class BasicProxyGenerator {

    constructor() {
        this.template = new ProxyHandlerTemplate();
    }

    setTemplate(template) {
        this.template = template || {};
        return this;
    }

    generate() {
        return new Proxy(this.template, {
            get: (t, p, receiver) => {
                // t = template
                const _this = this;
                return function (target, ...args) {
                    // target = instance
                    // get handler from instance
                    if (typeof target[p] === 'function') {
                        return target[p](...args);
                    }
                    // get template handler
                    const templateOrigin = Reflect.get(t, p, receiver);
                    if (typeof templateOrigin === 'function') {
                        return templateOrigin(target, ...args);
                    }
                    // set default handler for instance's origin target
                    const originTarget = target.originTarget || {};
                    return Reflect[p](originTarget, ...args);
                }
            }
        })
    }

}