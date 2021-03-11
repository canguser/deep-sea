import BasicConfigInstance from "./classes/BasicConfigInstance";

export function configure(config, provider = {}, options = {}) {
    return new BasicConfigInstance(config, provider, options).generateProxy();
}

export * from "./proxy/ProxyInstance";
export * from "./plugins/BasicPlugin";
export * from "./classes/BasicConfigInstance";
