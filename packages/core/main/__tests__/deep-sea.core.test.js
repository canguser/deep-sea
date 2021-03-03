import {configure} from "../index";

describe('config-js tests', () => {

    it('should parse normal config object', function () {
        const config = {
            age: 10,
            gender: 'male',
            name: 'Smith',
            isAlive: true,
            school: {
                name: 'Weals Numom'
            }
        };

        const parsedConfig = configure(config);

        expect(parsedConfig.age).toBe(config.age);
        expect(parsedConfig.gender).toBe(config.gender);
        expect(parsedConfig.name).toBe(config.name);
        expect(parsedConfig.isAlive).toBe(config.isAlive);
        expect(parsedConfig.school.name).toBe(config.school.name);
    });

    it('should parse dynamic function', function () {
        const config = {
            firstName: 'Smith',
            lastName: 'Weels',
            name({firstName, lastName}) {
                return firstName + lastName;
            },
            name1() {
                const {firstName, lastName} = this;
                return firstName + lastName;
            },
        };

        const parsedConfig = configure(config);

        expect(parsedConfig.name).toBe(config.firstName + config.lastName);
        expect(parsedConfig.name1).toBe(config.firstName + config.lastName);
    });

    it('should parse dynamic function with provider', function () {
        const config = {
            firstName: 'Smith',
            lastName: 'Weels',
            name({firstName, lastName, date}) {
                return firstName + lastName + date;
            },
            name1() {
                const {firstName, lastName, date} = this;
                return firstName + lastName + date;
            },
        };

        const now = Date.now();

        const parsedConfig = configure(config, {
            date: now
        });

        expect(parsedConfig.name).toBe(config.firstName + config.lastName + now);
        expect(parsedConfig.name1).toBe(config.firstName + config.lastName + now);
    });

    it('should parse dynamic function with Array', function () {
        const numbers = [100, 101, 102, ({0: a, 1: b, 2: c}) => a + b + c];

        const parsedNumbers = configure(numbers);

        expect(parsedNumbers.map(num => num + 1)[3]).toBe(304);  // 100+101+102+1

        const config = {
            count: 10,
            data: ({count, offset}) => Array.from({length: 5}).map((empty, i) => i + count + offset)
        };

        const parsedConfig = configure(config, {
            offset: -8
        });

        parsedConfig.data.forEach((d, i) => {
            expect(d).toBe(i + 10 - 8);
        });

    });

    it('should parse configuration inner object with $root, $parent', function () {
        const config = {
            name: 'Smith',
            isAlive: true,
            school: {
                schoolName: 'Health None',
                studentCalledName: ({$root, schoolName}) => $root.name + schoolName,
                studentCalledName1: ({$parent, schoolName}) => $parent.name + schoolName,
            },
            calledName() {
                return this.school.studentCalledName;
            }
        };

        const parsedConfig = configure(config);

        expect(parsedConfig.calledName).toBe(config.name + config.school.schoolName);
        expect(parsedConfig.school.studentCalledName).toBe(config.name + config.school.schoolName);
        expect(parsedConfig.school.studentCalledName1).toBe(config.name + config.school.schoolName);
    });

    it('should not cacheable working', function () {
        const config = {
            name: 'Smith',
            isAlive: true,
            school: {
                schoolName: 'Health None',
                studentCalledName: ({$root, schoolName}) => {
                    expect(schoolName).toBe('Health None');
                    return $root.name + schoolName;
                },
            },
            calledName() {
                expect(this.school.studentCalledName).toBe(this.name + this.school.schoolName);
                return this.school.studentCalledName;
            }
        };
        const parsedConfig = configure(config, {}, {cacheable: false});

        expect(parsedConfig.calledName).toBe(config.name + config.school.schoolName);
        expect(parsedConfig.school.studentCalledName).toBe(config.name + config.school.schoolName);
        // school.studentCalledName called:  3 times
        // calledName called:                1 time
        // outer expect:                     2 times
        expect.assertions(3 + 1 + 2);

    });

    it('should cacheable working', function () {
        const config = {
            name: 'Smith',
            isAlive: true,
            school: {
                schoolName: 'Health None',
                studentCalledName: ({$root, schoolName}) => {
                    expect(schoolName).toBe('Health None');
                    return $root.name + schoolName;
                },
            },
            calledName() {
                expect(this.school.studentCalledName).toBe(this.name + this.school.schoolName);
                return this.school.studentCalledName;
            }
        };
        const parsedConfig = configure(config, {}, {cacheable: true});

        expect(parsedConfig.calledName).toBe(config.name + config.school.schoolName);
        expect(parsedConfig.school.studentCalledName).toBe(config.name + config.school.schoolName);
        expect.assertions(4)

    });
});