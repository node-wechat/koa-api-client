/*
 * @description
 *   Please write the log script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(11/2/2016)
 */
var apiLog = require('log4js').getLogger('koa-api-client');
var debug = require('debug')('koa-api-client');

module.exports = function (msg) {
    if (!msg) return;

    if (typeof msg === 'object') {
        msg = JSON.parse(msg);
    }

    //debug log
    debug(msg);

    //log4js record
    apiLog.info(msg);
}