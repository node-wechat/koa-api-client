# koa-api-client

## 安装
```
npm install koa-api-client
```

* v1.x for koa 1.x
```
npm install koa-api-client@~1
```

## 支持的功能:

### 基础功能
1. 支持返回数据格式为`json`的请求

### 扩展功能
1. 读取模拟数据;
2. 记录请求的数据;

### update list
1.0.3
1. 修复url上存在参数后，自动补充参数错误的BUG

1.0.4
1. 优化ApiClient的使用场景，允许无baseUri的实例化(`utils.parseUriConfigToString`增加`strictMode`参数)