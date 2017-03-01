/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

var requestImpl = require('co-request');
var utils = require('./utils');
var log = require('./log');

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

function* request(type, url, data, config) {
    let startTime = new Date().getTime();
    var prefixLog = '(' + type + ': ' + url + ', param: ' + JSON.stringify(data) + ' )';
    //记录请求事件
    log(prefixLog + '--request');

    //合并默认参数和请求配置
    var params = mergeConfigToParam(data, config);

    let res, resData;
    try {
        //如果是get请求,讲参数补充到uri上
        if ('get' === type) {
            url = utils.mergeJsonToUri(url, data);
        }

        res = yield requestImpl[type](url, params);

        //针对返回结果进行解析
        if (res) {
            let code = res.statusCode;
            let content = res.body;

            if (code == 200) {
                resData = JSON.parse(content);
            } else {
                let err = 'REQUEST ERROR(code:' + code + ',content:' + content + ')';
                //记录服务器异常信息
                log(prefixLog + '--' + err);
                return {
                    success: false,
                    msg: err
                };
            }
        }
    } catch (err) {
        //记录网路请求异常信息
        //异常返回数据格式
        let content;
        if (res && res.body) {
            content = res.body;
        }

        log(prefixLog + '--error:' + err + (content ? "[" + content + "]" : ""));

        return {
            success: false,
            msg: err.message
        };
    }
    //记录返回信息
    log(prefixLog + '--response(' + (new Date().getTime() - startTime) + '):'
        + JSON.stringify(resData));

    return resData;
}

module.exports = request;