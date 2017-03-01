/**
 * Created by rdshoep on 16/3/27.
 * 支持POST/GET请求，获取相应的数据、并对应生成日志记录
 * 支持访问本地模拟数据，保证前台页面正常访问和显示（是否和参数相关性？待确认）
 * 支持同步拷贝数据，通过请求活动的参数数据保存为对应的数据文件，提供模拟模式访问
 */
"use strict";

const utils = require('./lib/utils')
    , request = require('./lib/request')
    , mock = require('./lib/mock');

function ApiClient(baseUri, opts) {
    this.baseUri = utils.parseUriConfigToString(baseUri, false);

    this.option = Object.assign({
        timeout: 15000, //网络请求超时时间
        mock: false, //访问模拟数据 支持 {  sleep: 1000  }  //延时时间
        record: false, //记录请求返回的数据
        beforeEnd: res => res //全局数据过滤器，对返回的数据做统一的处理
    }, opts);
}

ApiClient.prototype.request = function (method, url, data, config) {
    //合并参数
    let opt = Object.assign({}, this.option, config);

    //获取对应的地址前缀  优先使用参数中的跟路径
    let baseUri = this.baseUri;
    //如果存在自定义配置,则使用自定义配置的信息替代公用baseUri配置
    if (opt.baseUri) {
        baseUri = utils.parseUriConfigToString(opt.baseUri);
    } else if (false === opt.baseUri) { //如果自定义的配置为false,则表示要取消baseUri设置
        baseUri = '';
    }
    if (baseUri) {
        url = baseUri + url;
    }

    let mockConfig = opt.mock
        , recordConfig = opt.record
        , promisify;

    //如果mockConfig不为空,则表明需要读取模拟数据。
    //否则进行正常的数据模拟
    if (mockConfig) {
        promisify = mock.load(url, Object.assign({
            sleep: 1000
        }, mockConfig));
    } else {
        promisify = request(method, url, data, opt)
            .then(res => {
                //如果mockConfig需要记录,则将获取后的数据保存
                //TODO 如何优化记录方式，同一个请求的数据可以避免记录或者根据参数记录对应的数据
                if (recordConfig) {
                    return mock.save(url, res, recordConfig);
                }
                return res;
            });
    }

    return promisify.then(opt.beforeEnd);
};

//自动设置相应的方法
["get", "patch", "post", "put", "head", "del"].forEach(function (method) {
    ApiClient.prototype[method] = function () {
        return ApiClient.prototype.request.apply(this
            , [method].concat(Array.prototype.slice.apply(arguments)));
    }
});

module.exports = ApiClient;