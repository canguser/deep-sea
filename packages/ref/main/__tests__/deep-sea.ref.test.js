import {ref} from "../index";

const c = ref({name: 100});

const a = ref({a: 100, b: 200, c});

const d = ref({d: 100});

const id = a.$on(
    ['a', 'b', 'c.name'],
    () => {

    }
);

const id2 = a.$on(
    ({a, b, c: {name}}, infect) => {
        const {d} = infect(d);
        return () => {

        }
    }
);

a.$set('a', 200);

a.b += 100;

c.name = '200';

a.$off(id);





