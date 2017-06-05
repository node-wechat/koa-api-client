/**
 * Created by rdshoep on 16/3/27.
 * 支持POST/GET请求，获取相应的数据、并对应生成日志记录
 * 支持访问本地模拟数据，保证前台页面正常访问和显示（是否和参数相关性？待确认）
 * 支持同步拷贝数据，通过请求活动的参数数据保存为对应的数据文件，提供模拟模式访问
 */
"use strict";

var utils = require('./lib/utils')
    , Request = require('./lib/request')
    , mock = require('./lib/mock')
    , log = require('./lib/log');

function ApiClient(baseUri, opts) {
    this.baseUri = utils.parseUriConfigToString(baseUri, false);

    this.option = Object.assign({
        timeout: 15000, //网络请求超时时间
        mock: false, //访问模拟数据 支持 {  sleep: 1000  }  //延时时间
        record: false, //记录请求返回的数据
        beforeEnd: function (data) { //全局数据过滤器，对返回的数据做统一的处理
            return data
        }
    }, opts);

    //initialize the beforeEnd filter for data
    //TODO 1. support async function to deal data
    //TODO 2. support funcitons before request do,or support middleware to handle before and after request
    let beforeEnd = this.option.beforeEnd || [];
    if (!(beforeEnd instanceof Array)) {
        beforeEnd = [beforeEnd]
    }
    this.beforeEnd = beforeEnd
        .filter(function (fn) {
            var accept = fn && typeof fn === 'function';

            if(!accept){
                console.warn('ApiClient: beforeEnd config has invalid value, must be function or function array');
            }

            return accept;
        });
}

ApiClient.prototype.request = function*(method, url, data, config) {
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

    let res
        , mockConfig = opt.mock
        , recordConfig = opt.record;

    //如果mockConfig不为空,则表明需要读取模拟数据。
    //否则进行正常的数据模拟
    if (mockConfig) {
        res = yield mock.load(url, Object.assign({
            sleep: 1000
        }, mockConfig));
    } else {
        var request = new Request(method, url, data, opt);
        yield request.send();
        res = request.data;

        //TODO 1. support async function to deal data
        //TODO 2. support funcitons before request do,or support middleware to handle before and after request
        res = this.beforeEnd
            .reduce(function (data, fn) {
                return fn(data);
            }, res);

        //if record config has valid value, it need to be saved
        //TODO how to deal the sence that the params(primary id) are in the url, like restful mode
        if (recordConfig) {
            yield mock.save(url, res, recordConfig);
        }
    }

    return res;
};

//auto set each method request func
["get", "patch", "post", "put", "head", "del"].forEach(function (method) {
    ApiClient.prototype[method] = function*() {
        return yield ApiClient.prototype.request.apply(this
            , [method].concat(Array.prototype.slice.apply(arguments)));
    }
});

module.exports = ApiClient;

//export inject logger func
module.exports.injectLogger = log.injectLogger;