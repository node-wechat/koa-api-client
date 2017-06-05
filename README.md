# koa-api-client
支持离线的请求客户端，允许前端按照对应的接口规则创建模拟数据，然后离线进行前端流程测试

## 安装
```
npm install koa-api-client
```

* [1.x](https://github.com/node-wechat/koa-api-client/blob/v1.x/README.md) for koa 1.x
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

api.get('/banks', {type: 1}).then(...)
//this will request http://127.0.0.1/api/api/banks?type=1
//params will be cast to query params when request method is GET
```

### 2.多数据端请求
```js
let userApi = new ApiClient({domain: 'user.apiserver.com', prefix: '/v1'});
let activityApi = new ApiClient('http://activity.apiserver.com/v2');

userApi.post('/users/add', {name: 'userName', age: 18}.then(...)
activityApi.get('/activities', {startTime: '20170228'}.then(...)
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

apiClient.get('/banks', {
    type: 1
}).then(res => {
    //数据内容包含某个节点
    expect(res.data['ABC']).to.have.property('name');

    done();
}).catch(err => {
    done(err);
})
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

apiClient.get('/banks', {
    type: 1
}).then(res => {
    fs.readFile(recordFilePath, 'utf8', function (err, data) {
        assert.deepEqual(JSON.parse(data)
            , res, 'file content is some with request content');

        done(err);
    });
}).catch(err => {
    done(err);
})
```

### 5.开启数据日志记录
#### persistent mode log for production environment
```js
var log4js = require('log4js'); //log4js@~1
log4js.configure({
      appenders: [
            { type: 'console' },
            { type: 'file', filename: 'logs/api.log', category: 'koa-api-client' }
      ]
});
//set global logger for ApiClient
ApiClient.injectLogger(log4js.getLogger('koa-api-client'));

let api = new ApiClient('http://api.server.com/v1', {});
```
You can use any logger engine instance, it will detect the log node or log's info node(require type:function).

#### log for debug
we use the `debug` lib to console logs; set DEBUG=koa-api-client to console logs, more [docs](https://github.com/visionmedia/debug#windows-note).

### 6.custom dataParser
support each ApiClient and each request config
```js
var xmlParser = require('xml2json');
var apiClient = new ApiClient(baseUri, Object.assign({
    dataParser: (err, data) => err ? {
        success: false,
        msg: err.message
    } : JSON.parse(xmlParser.toJson(data)).root
}, defaultOpt));

// server side will return '<root><data><ABC>bank</ABC></data><code>0</code></root>'
apiClient.get('/xml').then(res => {});;
//content is {data: {ABC: bank}, code: 0}
```

### 7.set data handler list by config.beforeEnd
> not support in each request's config
```js
var apiClient = new ApiClient(baseUri, Object.assign({
    beforeEnd: [
        //if has valid data node, set success is true
        data => {
            data['success'] = !!data.data
            return data;
        },
        //convert json node key to upper mode
        data => {
            Object.keys(data)
                .forEach(key => {
                    data[key.toUpperCase()] = data[key];
                    delete data[key];
                })
            return data;
        },
        //log return data
        data => {
            console.log(JSON.stringify(data));
            return data;
        }
    ]
}, defaultOpt));

apiClient.get('/notfound').then(res => {});
```

### 8.request middleware support
1.server side use snake mode json data
```js
router.get('/codeType/snake', function (cxt){
    var snakeType = cxt.request.query['snake_type'];

    if(snakeType){
        cxt.body = {
            success: true,
            data: {
                user_id: 'fadslkjfldaksjlf',
                user_name: 'userName',
                user_age: 27
            }
        };
    }
})
```
client side also use snake mode, but now need to use camel mode,
so can set requestMiddleware to convert request params and response data
```js
var apiClient = new ApiClient(baseUri, Object.assign({
    requestMiddleware: [
        function (cxt, next) {
            var request = cxt;

            if (request.params) {
                request.params = humps.decamelizeKeys(request.params);
            }

            return next()
                .then(() => {
                    if (request.data) {
                        request.data = humps.camelizeKeys(request.data)
                    }
                });
        }
    ]
}, defaultOpt));

apiClient.get('/codeType/snake', {snakeType: 1}).then(res => {});
```
now, client use camel mode data without server side changes

## TODO
1. 需要考虑如何支持参数在链接上形式下，数据如何模拟读取和保存
2. 通过mock数据约定格式，校验后台生产环境返回的数据，避免格式变更导致的前端报错
3. ~~增加自定义的数据过滤函数池，统一对后台返回数据做处理。例如，蛇底转换成驼峰~~(config.beforeEnd/config.requestMiddleware)

### update list

##### 1.2.0
1.add advanced options requestMiddleware, you can set make some changes before and after request
2.export injectLogger from ApiClient module directly, not from instance config
3.add dataParser to custom convert data
4.remove log4js module, accept log implement from option params. 

##### 2.0.5
use json5 to parse mock file, instead of json default

##### 2.0.4
优化ApiClient的使用场景，允许无baseUri的实例化(`utils.parseUriConfigToString`增加`strictMode`参数)

##### 2.0.3
修复url上存在参数后，自动补充参数错误的BUG
