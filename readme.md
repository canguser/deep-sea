# *Deep-Sea* JS

> `Javascript` 中配置动态化、所见即所得的轻量级解决方案

## 特征
1. 动态组合配置
2. 支持配置多层级结构复合
3. 支持链式属性名
4. 支持由内到外的参数供给
## 解决的问题
在项目开发过程中，每当你定义一个组件或方法，你需要从外部获取很多参数，一两个还好，如果十个甚至二十个三十个参数，我们大多都会采用对象的形式来定义一个参数，然后用这个对象的子属性作为我们需要的参数

```javascript
// 用对象获取多个参数
function doSomething(options){
    const {name, age} = options;
}

```

当这种方式始终具有几个痛点
1. 常量的复用
    在一些配置中，可能一个变量会引用到另一个变量比如 `Full Name` 会用到 `First Name` 和 `Last Name`, 如果类似的变量有很多并且在同一个配置里就会极尽复杂
    ```javascript
        // normal
        const personConfig = {
            fullName: 'Jason Smith',
            lastName: 'Smith',
            firstName: 'Jason'
        }
    ```
    如果通过使用 `Deep-Sea` 我们就可以将 `fullName` 声明会动态属性，即 `function`，动态将 `firstName` 和 `lastName` 相连
    ```javascript
        // deep-sea
        const personConfig = {
            fullName: ({firstName,lastName}) => `${firstName} ${lastName}`,
            lastName: 'Smith',
            firstName: 'Jason'
        }
    ```
2. 使用动态配置时不能直接获取参数值
    假设你需要显示一段文字，内容是某一个日期的格式化字符串，在传入的参数中，通常情况下可能是这样的
    ```javascript
        // normal
        // 声明参数
        const dateConfig = {
            date: new Date(),
            format: 'yyyy-MM-dd hh:mm:ss'
        }

        // 获取文字内容
        function getContentText(config){
            const {date, format} = config;
            return formatDate(date, format);
        }
    ```
    可以看到，在以上情况下，我们需要在解析配置的地方额外去调用 `formatDate` 方法并且需要从配置中获取 `format` 参数，如果这个结果需要在多个地方使用，就变得极其繁琐。`Deep-Sea` 就很好的解决了这个问题
    ```javascript
        // normal
        // 声明参数
        const dateConfig = {
            date: new Date(),
            shownText: ({date})=>{
                return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
            },
        }

        // 获取文字内容
        function getContentText(config){
            const deepSeaConfig = deepSea.configure(config);
            return deepSeaConfig.shownText;
        }
    ```
    通过使用 `Deep-Sea` 来加载配置，我们可以直接获取需要显示的参数值，所见即所得，不需要通过参数去写额外的代码再次运算，在多次调用的情况下，`Deep-Sea` 自带的缓存机制也可以防止代码的多次运算，在开发效率和运行效率上大大提升。
3. 在配置时，不能动态地获取到一些来自组件或方法内部的变量
    在某些情况下，假设需要配置性别，但是性别是被声明为一个常量并且没有暴露出来，由于无法获取到性别的常量导致无法实现性别相关的配置，但在 `Deep-Sea` 中，我们可以通过一下方式实现
    ```javascript
        function getPersonInfo(config){
            const MALE = 1, FEMALE = 0; // 内部的常量无法被外部所获取
            return = deepSea.configure(config,{MALE, FEMALE}); // 通过 deep-sea 的 provider 提供给配置方法
        }

        getPersonInfo({
            gender: ({MALE}) => MALE    // 声明性别为内部的 MALE
        });
    ```
    在 `Deep-Sea` 中，我们可以提供额外的 `Provider` 用于为配置中的动态属性提供参数，从而更好地达到所见即所得的目的
4. 在读取常规配置时，如果有多级对象，经常会遇到 `null` 异常
    ```javascript
        // 该配置对象没有子对象
        const config = {
            name: 'config'
        }

        // 以上配置传入该方法会报错
        function getChildName(config){
            return config.child.name;
        }

        // 使用 deep-sea
        function getChildNameByDeepSea(config){
            const deepSeaConfig = deepSea.configure(config);
            return deepSeaConfig['child.name'];
        }
    ```
    如上所示，`Deep-Sea` 支持链式属性用以获取子级对象的属性，如果没有自己对象则返回 `undefined`

## 快速开始

> 使用 `npm` 或 `yarn` 引入核心模块依赖：`@deep-sea/core`

### [Live Demo](https://runkit.com/canguser/602f5af66c5fc2001babc02e)

```javascript
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

demo(
    expect => {
        return {
            toBe(actual) {
                console.assert(expect, actual)
            }
        }
    }
)
```
## 文档撰写中...

