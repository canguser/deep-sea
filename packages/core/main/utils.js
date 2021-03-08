/**
 * @Deep-Sea
 * @Author Cangshi
 * @See @link{https://github.com/canguser/deep-sea}
 * @Licence MIT
 */


export function hasEnumerableProperty(target, p) {
    const descriptor = Object.getOwnPropertyDescriptor(target, p);
    return descriptor && descriptor.enumerable;
}

export function delay(context, apiName, ms = 0) {
    const eqName = `_delay_${apiName}`;
    clearTimeout(context[eqName]);
    return new Promise(resolve => {
        context[eqName] = setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

export function eachInArrays(parentArray = [], array = []) {
    for (const a of array) {
        if (parentArray.includes(a)) {
            return true;
        }
    }
    return false;
}

export function isBasicDateType(o) {
    return typeof o !== 'object' || !o || o instanceof Date
}