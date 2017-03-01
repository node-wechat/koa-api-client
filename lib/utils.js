/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

/**
 * 根据配置信息生成对应的uri路径
 * @param opt {string | obj}
 * @param strictMode 严格模式  启用严格模式时，参数无效时会抛出异常
 * @returns {*}
 * @private
 */
function parseUriConfigToString(opt, strictMode) {
    if (opt && typeof opt == 'object') {
        let domain = opt.domain;
        let port = opt.port || 80;
        let scheme = opt.scheme || 'http';
        let prefix = opt.prefix || '/';

        if (!domain) {
            throw new Error('缺少必要参数domain');
        }

        return scheme + "://" + domain + (port == 80 ? '' : (':' + port)) + prefix;
    }

    if (opt && typeof opt == 'string') {
        return opt;
    }

    //默认设置为严格模式，避免通用模式下无法使用无baseUri的问题
    strictMode = strictMode === false ? false : true;
    if (strictMode) {
        throw new Error('缺少必须的参数');
    } else {
        return undefined;
    }
}

/**
 * 自动合并url和json对象参数
 * @param json
 * @param uri
 * @returns {*}
 * @private
 */
function mergeJsonToUri(uri, json) {
    if (json) {
        let params = Object.keys(json).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(json[key])
        }).join('&');

        //如果uri为空,则不需要自动填充,返回即可
        if (!uri) return params;

        //自动补齐uri参数前缀?
        if (uri.indexOf('?') < 0) {
            params = '?' + params;
        } else {
            params = '&' + params;
        }

        return uri + params;
    }
    return uri;
}

function noop(){}

module.exports = {
    parseUriConfigToString
    , mergeJsonToUri
    , noop
};