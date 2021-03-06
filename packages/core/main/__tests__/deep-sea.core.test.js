import {configure} from "../index";

describe('config-js tests', () => {

    it('should success running demo', function () {

        function demo(expect) {

            // 模拟表格配置（列）
            const tableConfig = {
                columns: [
                    {
                        label: '名字',
                        cell: {
                            output: ({lastName, firstName}) => lastName + firstName
                        }
                    },
                    {
                        label: '性别',
                        cell: {
                            output({MALE, FEMALE}) {
                                if (this.gender === MALE) {
                                    return '男'
                                }
                                if (this.gender === FEMALE) {
                                    return '女'
                                }
                                return '未知'
                            }
                        }
                    },
                    {
                        label: '籍贯',
                        cell: {
                            output: ({local, $root, $get}) => $get('local.province') + local.$get('city') + $root['local.county']
                        }
                    }
                ]
            };

            function applyTable(config) {
                // 展示个人信息（行）
                const rows = [
                    {
                        firstName: '三',
                        lastName: '张',
                        gender: 0,
                        local: {
                            city: '成都',
                            province: '四川',
                            county: '高新'
                        }
                    },
                    {
                        firstName: '思',
                        lastName: '李',
                        gender: 1,
                        local: {
                            city: '成都',
                            province: '四川',
                            county: '华阳'
                        }
                    }
                ];

                return configure(
                    rows.map(row => config.columns.map(column => configure(column, {...row, MALE: 0, FEMALE: 1})))
                );
            }

            const tableResult = applyTable(tableConfig);

            expect(tableResult.$get('0.0.label')).toBe('名字');
            expect(tableResult.$get('0.1.label')).toBe('性别');
            expect(tableResult.$get('0.2.label')).toBe('籍贯');

            expect(tableResult.$get('1.0.label')).toBe('名字');
            expect(tableResult.$get('1.1.label')).toBe('性别');
            expect(tableResult.$get('1.2.label')).toBe('籍贯');

            expect(tableResult.$get('0.0.cell.output')).toBe('张三');
            expect(tableResult.$get('0.1.cell.output')).toBe('男');
            expect(tableResult.$get('0.2.cell.output')).toBe('四川成都高新');

            expect(tableResult.$get('1.0.cell.output')).toBe('李思');
            expect(tableResult.$get('1.1.cell.output')).toBe('女');
            expect(tableResult.$get('1.2.cell.output')).toBe('四川成都华阳');

        }

        demo(expect);

        demo(
            expect => {
                return {
                    toBe(actual) {
                        console.assert(expect === actual, 'Assertion Failed', expect, actual)
                    }
                }
            }
        )
    });

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

    it('should get value by chain', function () {
        const configs = {
            name: 'a',
            child: {
                name: 'a child',
                child: {
                    name() {
                        expect(1).toBe(1);
                        return this.$parent.name + ' child';
                    },
                    child: {
                        level2Name: ({$root}) => {
                            expect(1).toBe(1);
                            return $root['child.name'];
                        },
                        name() {
                            expect(1).toBe(1);
                            return this.$parent.name + ' child';
                        }
                    }
                }
            }
        };

        const parsedConfig = configure(configs, {}, {cacheable: true});

        expect(parsedConfig['child.name']).toBe('a child');
        expect(parsedConfig['child.child.name']).toBe('a child child');
        expect(parsedConfig['child.child.child.level2Name']).toBe('a child');
        expect(parsedConfig.$get('child.child.child.level2Name')).toBe('a child');
        expect(parsedConfig['child.child.child.name']).toBe('a child child child');

        expect.assertions(3 + 5);
    });

    it('should get $root / $parent value by chain', function () {
        const configs = {
            name: 'a',
            child: {
                name: 'a child',
                child: {
                    name() {
                        expect(1).toBe(1);
                        return this.$parent.name + ' child';
                    },
                    child: {
                        level2Name: ({$root}) => {
                            expect(1).toBe(1);
                            return $root['child.$parent.child.name'];
                        },
                        name() {
                            expect(1).toBe(1);
                            return this.$parent.name + ' child';
                        }
                    }
                }
            }
        };

        const parsedConfig = configure(configs, {}, {cacheable: true});

        expect(parsedConfig['$root.child.name']).toBe('a child');
        expect(parsedConfig['child.child.name']).toBe('a child child');
        expect(parsedConfig['child.child.$parent.child.child.level2Name']).toBe('a child');
        expect(parsedConfig.$get('child.child.$parent.child.child.level2Name')).toBe('a child');
        expect(parsedConfig['child.child.child.name']).toBe('a child child child');

        expect.assertions(3 + 5);
    });

    it('should can\'t set property', function () {
        const configs = {a: 100};
        const parsedConfig = configure(configs, {}, {cacheable: true});

        parsedConfig.a = 101;

        expect(parsedConfig.a).toBe(100);
    });

    it('should using string template', function () {
        const configs = {
            path: '/test',
            URI: 'https://{!host}:{!port}{!path}',
            service: {
                path: '/service',
                rootURI: '{!$root.URI}'
            },
            serviceURI: 'https://{!host}:{!port}{!service.path}'
        };

        const parsedConfig = configure(configs, {
            host: '192.168.0.1',
            port: '8080',
        });

        expect(parsedConfig.URI).toBe('https://192.168.0.1:8080/test');
        expect(parsedConfig.serviceURI).toBe('https://192.168.0.1:8080/service');
        expect(parsedConfig.service.rootURI).toBe('https://192.168.0.1:8080/test');

    });

    it('should using default value', function () {
        const configs = {
            host: '127.0.0.1'
        }

        const deepSeaConfig = configure(configs);

        console.log(deepSeaConfig.port);

        expect(deepSeaConfig.$get('port', 8080)).toBe(8080);

    });
});