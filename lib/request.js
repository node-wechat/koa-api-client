/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

var requestImpl = require('co-request')
    , utils = require('./utils')
    , log = require('./log')
    , jsonDataParser = require('./parser/json')
    , compose = require('koa-compose');

function Request(method, url, params, config) {
    this.method = method;
    this.url = url;
    this.params = params;
    this.config = config;
    //this.response = '';
    //this.data = '';

    //set default dataParser
    this.dataParser = jsonDataParser;
    //if custom data parser is valid, replace default
    var dataParser = this.config.dataParser;
    if (dataParser && typeof dataParser === 'function') {
        this.dataParser = dataParser;
    }
}

/**
 * log the request's info
 * @param next
 */
function *logRequestMiddleware(next) {
    var startTime = Date.now()
        , request = this;
    var prefixLog = '(' + request.method + ': ' + request.url + ', param: ' + JSON.stringify(request.params) + ' )';
    //记录请求事件
    log(prefixLog + '--request');

    yield next;

    if (request.error) {
        log(prefixLog + '--error:' + request.error.message + 'response: ' + request.response.body);
    } else {
        //记录返回信息
        log(prefixLog + '--response(' + (Date.now() - startTime) + '):' + JSON.stringify(request.data));
    }
}

/**
 * error handler
 * @param next
 */
function *errorCatcherMiddleware(next) {
    var request = this;
    try {
        yield next;
    } catch (err) {
        request.error = err;
        request.data = request.dataParser(err);
    }
}

function *prepareMiddleware(next) {
    var request = this;

    //if request is get type, merge params to url
    if ('get' === request.method) {
        request.url = utils.mergeJsonToUri(request.url, request.params);
        request.params = undefined;
    }

    //do request
    yield next;

    //parse response content
    request.data = request.dataParser(null, request.data);
}

function *requestMiddleware() {
    var request = this
        , params = mergeConfigToParam(request.params, request.config);

    var response = yield requestImpl[request.method](request.url, params);

    //针对返回结果进行解析
    if (response) {
        request.response = response;

        var code = response.statusCode
            , content = response.body;

        if (code == 200) {
            request.data = content;
        } else {
            throw new Error('REQUEST ERROR(code:' + code + ',content:' + content + ')')
        }
    } else {
        throw new Error('REQUEST ERROR(invalid reponse)');
    }
}

Request.prototype.send = compose([logRequestMiddleware, errorCatcherMiddleware, prepareMiddleware, requestMiddleware]);

/**
 * 合并参数和配置,构建请求参数
 * @param data
 * @param config
 * @returns {Object}
 */
function mergeConfigToParam(data, config) {
    return Object.assign({
            timeout: 15000 //超时时间
            , qsStringifyOptions: {
                arrayFormat: 'repeat' // [indices(default)|brackets|repeat]
            }
            , form: data
        }
        , config
    );
}

module.exports = Request;