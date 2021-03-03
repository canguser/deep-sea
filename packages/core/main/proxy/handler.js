export default {
    get(target, property) {
        return target.get(property);
    },
    set(target, p, value) {
        return false;
    },
    getOwnPropertyDescriptor(target, p) {
        return Reflect.getOwnPropertyDescriptor(target.origin, p);
    },
    has(target, p) {
        return Reflect.has(target.origin, p);
    },
    ownKeys(target) {
        return Reflect.ownKeys(target.origin);
    },
    getPrototypeOf(target) {
        return Reflect.getPrototypeOf(target.origin);
    }
}