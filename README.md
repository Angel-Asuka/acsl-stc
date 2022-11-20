# acsl-stc
ACSL-STC 是一款用于 TypeScript 的智能数据结构描述编译器，只要通过 YAML 文件来定义所需的数据结构，就可以使用 stc 来将其编译成带有数据结构合法性校验代码的 js 和 d.ts 文件。

## Install
ACSL-STC 已经在 npmjs.org 上发布，可以通过 npm 来安装:
```bash
npm i -D @acsl/stc
```

## 运行实例代码
ACSL-STC 提供了可供参考的实例代码，可以通过下面的名来运行它：
```bash
git clone https://github.com/Angel-Asuka/acsl-stc.git
cd acsl-stc
npm install
tsc
stc  # 执行 acsl-stc，默认情况下，它会处理当前目录以及子目录中的所有 yml 文件
```

## 数据结构描述文件
ACSL-STC 可以读取使用 YAML 来编写的数据结构描述文件。基本结构如下：
```yml
数据结构名称:
    字段名: 类型 @ 类型检查代码
    字段名：
        字段名: 类型
        字段名:
            - 类型/值
            - 类型/值
```
几个需要注意的重点：
* 一个 yml 文件中可以编写多个数据结构。stc 会将 yml 中所有顶层的对象当作数据结构来处理。

* `字段名 : 类型|值 @ 类型检查代码` 是标准的字段描述方式。其中，`类型|值` 一项可以是任何合法的 TypeScript 类型描述代码，例如 `string`、`number`、`string|null`、`'A' | 'B'` 等；其后的 `@ 类型检查代码` 是可选项，可以不填。

* 类型检查代码可以填写任何合法的 TypeScript 表达式，表达式返回 `true` 表示检查通过。 在表达式中， 可以使用 `$` 来指代当前字段。

* 与 TypeScript 类似，可以在`字段名`后加 `?` 来表示这个字段是可选的。但需要注意的是， `?` 必须紧跟`字段名`。

一个实例的数据结构描述文件如下：
```yml
# /test/example.yml
TestData:               # 定义一个数据结构 TestData
  m1 : number           # m1 是一个必填的 number 类型成员
                        # m2 是一个可选的 string 类型成员
                        # 如果 m2 存在，那么它的长度必须在5-16之间
  m2? : string @ $.length > 5 && $.length < 16
                        # m3 是一个必填的字段，他可以是 string 类型、
                        # number 类型 或者等于 null
  m3 : string | number | null
                        # m4 可以取值 'foo' 或者 'bar'
                        # 注意这里必须遵循 YAML 语法，所以必须用 " 将
                        # 这一段描述括起来
  m4 : "'foo' | 'bar'"
                        # m5 是一个可选的 object
  m5? :
    m51: number
    m52: string
                        # 一般使用这种比较常见的数组描述方式
  m6 : Array<string>
                        # 同样，这样的表达方式也是可以的
  m7 : string[] @ $.length > 5
                        # 也可以这样描述固定长度并且对内容结构有要求的数组
  m8 : 
    - string
    - stirng
```
通过上面的定义，我们将得到如下输出文件
```ts
// /test/example.d.ts
export function CheckTestData(data:TestData):boolean
export declare type TestData = {
    m1 : number,
    m2? : string,
    m3 : string | number | null,
    m4 : 'foo' | 'bar',
    m5? : {
        m51 : number,
        m52 : string
    },
    m6 : Array<string>,
    m7 : string[],
    m8 : [
        string,
        string
    ]
}
```
```js
// /test/example.js
export function CheckTestData(data){
    if(data == null) return false
    if(!(typeof data['m1'] == "number")) return false
    if(data['m2'] != null){
        if(!(typeof data['m2'] == "string")) return false
        if(!(data['m2'].length > 5 && data['m2'].length < 16)) return false
    }
    if(!((typeof data['m3'] == "string") || (typeof data['m3'] == "number") || (data['m3'] == null))) return false
    if(!((data['m4'] == 'foo') || (data['m4'] == 'bar'))) return false
    if(data['m5'] != null){
        if(!(typeof data['m5']['m51'] == "number")) return false
        if(!(typeof data['m5']['m52'] == "string")) return false
    }
    if(data['m6'] == null) return false
    if(!(data['m7'].length > 5)) return false
    if(!(data['m8'].length != 2)) return false
    if(!(typeof data['m8'][0] == "string")) return false
    if(!(typeof data['m8'][1] == "string")) return false
    return true
}
```
stc 会尽量保持输出文件的可读性，如果需要代码压缩，可以考虑使用其他工具来作为工具链的后级。

在代码中，可以直接使用 `CheckTestData` 来对任何疑似 `TestData` 类型的数据进行校验，如果得到 true，就可以放心大胆地使用这个数据了。

## 使用特别的配置
可以通过配置文件来改变 ACSL-STC 的一些行为。 默认情况下，ACSL-STC 会读取并使用当前目录下的 `stc.json` 文件来配置自己。 当然，您也可以使用 `-c` 选项来指定一个配置文件：
```bash
stc -c myconfig.json
```
正如您所看到的，stc 使用 json 来作为配置文件的格式。下面是一份完整的配置文件，其中的所有字段均是可选的：
```json
{
    "inDir": "./",          // 输入文件的目录，默认为 ./
    "outDir": "./",         // 输出文件的目录，默认为 ./
    "outFile": null,        // 输出文件名，默认为 null
    "indentSize": 4         // 输出文件中使用的缩进长度，默认为 4 个空格
}')
```
需要注意的是：
* 如果指定了 `outFile`， stc 会将所有读取到的数据结构保存到所指定的这一个文件中。此时 `outDir` 选项无效。
* 如果没有指定 `outFile`， stc 则会参照 yml 文件在 `inDir` 中的文件结构，在`outDir` 中输出与 yml 文件同名的 d.ts 和 js 文件。

## ISSUES
目前暂不支持 `[k:string]:any`。如果一定要在描述文件中加入这种描述，可以用 `"` 将 key 描述包裹起来，如：`"[k:string]":any`。

<font style='color:#f00'>注意！ 不要使这样的数据成员包含子元素和类型检查代码，stc 也不会为它们生成数据合法性检查代码，请在上层代码中自行完成对这种情况的检查。 </font>