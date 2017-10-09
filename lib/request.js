/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

const requestImpl = require('request')
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
function logRequestMiddleware(cxt, next) {
    var startTime = Date.now()
        , request = cxt;
    var prefixLog = '(' + request.method + ': ' + request.url + ', param: ' + JSON.stringify(request.params) + ' )';
    //记录请求事件
    log(prefixLog + '--request');

    return next().then(() => {
        if (request.error) {
            log(prefixLog + '--error:' + request.error.message + 'response: ' + (request.response && request.response.body));
        } else {
            //记录返回信息
            log(prefixLog + '--response(' + (Date.now() - startTime) + '):' + JSON.stringify(request.data));
        }
    })
}

/**
 * error handler
 * @param next
 */
function errorCatcherMiddleware(cxt, next) {
    var request = cxt;

    return next()
        .catch(err => {
            request.error = err;
            request.data = request.dataParser(err);
        });
}

function prepareMiddleware(cxt, next) {
    var request = cxt;

    //if request is get type, merge params to url
    if ('get' === request.method) {
        request.url = utils.mergeJsonToUri(request.url, request.params);
        request.params = undefined;
    }

    //do request
    return next()
        .then(() => {
            try {
                //parse response content
                request.data = request.dataParser(null, request.data);
            }
            catch (e) {
                throw new Error('parse response data error: ' + request.data)
            }
        });
}

function requestMiddleware(cxt) {
    var request = cxt
        , params = mergeConfigToParam(request.params, request.config);

    return new Promise((resolve, reject) => {
        requestImpl(Object.assign({}, params, {
            url: request.url
            , method: request.method
        }), (err, res, body) => {
            request.response = res;

            if (err) {
                reject(err)
            } else {
                let code = res && res.statusCode;

                if (code == 200) {
                    request.data = body;
                    resolve();
                } else {
                    reject(new Error('REQUEST ERROR(code:' + code + ',content:' + body + ')'));
                }
            }
        });
    });
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