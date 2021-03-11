import ProxyInstance from "../proxy/ProxyInstance";

describe('proxy-instance', () => {
    it('should using proxy instance', function () {
        const config = {
            name: 'test parent',
            count: 100,
            child: {
                name: 'test child'
            }
        };
        const proxy = new ProxyInstance(config).generateProxy();

        expect(proxy.name).toBe('test parent');
        expect(proxy.count).toBe(100);
        expect(proxy.$get('count')).toBe(100);
        expect(proxy.child.name).toBe('test child');
        expect(proxy.child.$get('name')).toBe('test child');
        expect(proxy.child.$property).toBe('child');
        expect(proxy.child.$root.name).toBe('test parent');
        expect(proxy.child.$parent.count).toBe(100);
    });
});