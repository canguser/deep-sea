import BasicConfigInstance from "./classes/BasicConfigInstance";

export function configure(config, provider = {}, options = {}) {
    return new BasicConfigInstance(config, provider, options).generateProxy();
}