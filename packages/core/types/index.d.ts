interface ConfigInstanceOptions {
    readonly cacheable?: boolean,
    readonly proxyHandler?: Object
}

interface InstanceProxy {

    $get(property: string | symbol): InstanceProxy | any,

    readonly $root: InstanceProxy,
    readonly $parent: InstanceProxy,
    readonly $property: string | symbol | any

    readonly [property: string]: any
}

interface ConfigProxy extends InstanceProxy {

    $get(property: string | symbol | Array<string> | any, defaultValue?: any): ConfigProxy | any,

    $clearCache(property: string | symbol | any): boolean,

    $clearCache(clearAll: boolean): boolean,

    readonly $root: ConfigProxy,
    readonly $parent: ConfigProxy,

}

interface ParentConfig {
    readonly instance: BasicConfigInstance,
    readonly property: string | symbol | any
}

export const GLOBAL_OPTIONS: ConfigInstanceOptions;

export class ProxyInstance {

    constructor(target: Object, handler?: Object);

    get(property: string | symbol): InstanceProxy | any;

    generateProxy(parent?: ParentConfig): ProxyInstance;

    get originField(): string | symbol | any

    get localProvider(): Object;

    getChildInstance(childOrigin: Object): ProxyInstance;

    buildProxyForChildProperty(property: string, childOrigin: Object): ProxyInstance;

    get originTarget(): Object;
}


export class BasicConfigInstance extends ProxyInstance {

    constructor(origin: Object, provider?: Object, options?: ConfigInstanceOptions);

    get(property: string | symbol | Array<string> | any): ConfigProxy | any

    getByDefault(property: string | symbol | Array<string> | any, defaultValue?: any): ConfigProxy | any

}


export function configure(origin: Object, provider?: Object, options?: ConfigInstanceOptions): ConfigProxy;