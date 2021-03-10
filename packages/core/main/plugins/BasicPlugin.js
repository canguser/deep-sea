export default class BasicPlugin {

    constructor(proxy) {
        this.proxy = proxy;
    }

    get localProvider() {
        return {};
    }

}