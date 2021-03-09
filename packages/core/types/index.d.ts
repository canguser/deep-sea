interface ConfigInstanceOptions {
    readonly cacheable?: boolean,
    readonly proxyHandler?: Object
}

interface ConfigProxy {

    $get(property: string | symbol | Array<string> | any): ConfigProxy | any,

    $clearCache(property: string | symbol | any): boolean,

    $clearCache(clearAll: boolean): boolean,

    readonly $root: ConfigProxy,
    readonly $parent: ConfigProxy,
    readonly $property: string | symbol | any

    readonly [key: string]: any

}

interface ParentConfig {
    readonly instance: BasicConfigInstance,
    readonly property: string | symbol | any
}

export const defaultOptions: ConfigInstanceOptions;

export class BasicConfigInstance {

    constructor(origin: Object, provider?: Object, options?: ConfigInstanceOptions);

    get(property: string): ConfigProxy | any

    generateProxy(parent?: ParentConfig): ConfigProxy

    get originField(): string | symbol | any

}


export function configure(origin: Object, provider?: Object, options?: ConfigInstanceOptions): ConfigProxy;