/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

const requestImpl = require('request')
    , utils = require('./utils')
    , log = require('./log');

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

function request(type, url, params, config) {
    let startTime = Date.now();

    //记录请求事件
    let prefixLog = '(' + type + ': ' + url + ', param: ' + JSON.stringify(params) + ' )';
    log(prefixLog + '--request');

    //合并默认参数和请求配置
    let opts = mergeConfigToParam(params, config);

    return new Promise((resolve, reject) => {
        //如果是get请求,将参数补充到uri上
        if ('get' === type) {
            url = utils.mergeJsonToUri(url, params);
        }

        requestImpl(Object.assign({}, opts, {
            url: url
            , method: type
        }), (err, res, body) => {
            let code = res && res.statusCode;

            if (code == 200) {
                try {
                    resolve(JSON.parse(body))
                } catch (e) {
                    reject(e);
                }
            } else {
                let error = 'REQUEST ERROR(code:' + code + ',content:' + body + '):' + err;
                reject(error);
            }
        })
    }).then(data => {
        //记录返回信息
        log(prefixLog + '--response(' + (Date.now() - startTime) + '):'
            + JSON.stringify(data));
        return data;
    }, err => {
        log(prefixLog + '--error:' + err)
        return {
            success: false
            , msg: err + ''
        }
    });
}

module.exports = request;