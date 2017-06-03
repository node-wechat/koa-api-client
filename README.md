# koa-api-client
支持离线的请求客户端，允许前端按照对应的接口规则创建模拟数据，然后离线进行前端流程测试

## 安装
```
npm install koa-api-client
```

* 1.x for koa 1.x
```
npm install koa-api-client@~1
```

## 支持的功能:

### 基础功能
1. 支持返回数据格式为`json`的请求

### 扩展功能
1. 读取模拟数据;
2. 记录请求的数据;

## 用法

### 1.常规请求
```js
let baseUri = {
    scheme: 'http',
    domain: '127.0.0.1',
    port: port,
    prefix: '/api/v1'
};
let api = new ApiClient(baseUri, {
    timeout: 15000, //网络请求超时时间
    mock: process.env.NODE_ENV === 'production', //访问模拟数据
    record: false, //记录请求返回的数据
    beforeEnd: res => res //全局数据过滤器，对返回的数据做统一的处理
})

let res = yield api.get('/banks', {type: 1});
//this will request http://127.0.0.1/api/api/banks?type=1
//params will be cast to query params when request method is GET
```

### 2.多数据端请求
```js
let userApi = new ApiClient({domain: 'user.apiserver.com', prefix: '/v1'});
let activityApi = new ApiClient('http://activity.apiserver.com/v2');

let user = yield userApi.post('/users/add', {name: 'userName', age: 18}
let res = yield activityApi.get('/activities', {startTime: '20170228'}
```

### 3.读取模拟数据
具体用法可以参见/test/index.js中的后两个测试用例
```js
let recordFolder = path.join(__dirname, '/mock');
let apiClient = new ApiClient(baseUri, {
    mock: {
        sleep: 1000, //模拟请求消耗时长
        suffix: '.json', //数据文件后缀
        dirLevel: MOCK_DIR_LEVEL, //相对请求路径的深度,默认为0
        base: recordFolder //模拟数据的跟目录，配合dirLevel使用
    }
});

let content = yield apiClient.get('/banks', {
    type: 1
});

//数据内容包含某个节点
expect(content.data['ABC']).to.have.property('name');
```

### 4.记录数据请求
具体用法可以参见/test/index.js中的后两个测试用例
```js
let recordFolder = path.join(__dirname, '/mock');
let apiClient = new ApiClient(baseUri, {
    record: {
        suffix: '.json',
        dirLevel: MOCK_DIR_LEVEL,
        base: recordFolder
    }
});

let recordFilePath = recordFolder + path.sep + 'api/v1/banks'.split('/').slice(MOCK_DIR_LEVEL).join(path.sep) + '.json';
if (fs.existsSync(recordFilePath)) {
    fs.unlinkSync(recordFilePath);
}

let content = yield apiClient.get('/banks', {
    type: 1
});

fs.readFile(recordFilePath, 'utf8', function (err, data) {
    assert.deepEqual(JSON.parse(data)
        , content, 'file content is some with request content');

    done(err);
});
```

### 5.开启数据日志记录
```js
var log4js = require('log4js');
log4js.configure({
      appenders: [
            { type: 'console' },
            { type: 'file', filename: 'logs/api.log', category: 'koa-api-client' }
      ]
});
```

## TODO
1. 需要考虑如何支持参数在链接上形式下，数据如何模拟读取和保存

### update list

#####1.0.5
use json5 to parse mock file, instead of json default

#####1.0.4
优化ApiClient的使用场景，允许无baseUri的实例化(`utils.parseUriConfigToString`增加`strictMode`参数)

#####1.0.3
修复url上存在参数后，自动补充参数错误的BUG

