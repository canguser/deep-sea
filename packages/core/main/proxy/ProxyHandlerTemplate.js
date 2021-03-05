export default class ProxyHandlerTemplate {
    set(target, key) {
        console.warn('Can\'t set property [', key, '] of config-js\'s instance');
        return true;
    }
}