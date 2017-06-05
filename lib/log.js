/*
 * @description
 *   Please write the log script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(11/2/2016)
 */
let debug = require('debug')('koa-api-client');

//TODO set log level, filter the normal logs and error info in the production env
module.exports = function (msg){
    if (!msg) return;

    if (typeof msg === 'object') {
        msg = JSON.parse(msg);
    }

    //debug log
    debug(msg);

    //log4js record
    if(injectedLogImpl){
        injectedLogImpl(msg);
    }
}

var injectedLogger
    , injectedLogImpl;
/**
 * inject logger
 * accept logger implement from outside to record inside logs
 * @param logger function will be accepted, only detect itself or it's info node
 */
function injectLogger(logger){
    if(logger){
        if(typeof logger === 'function'){
            injectedLogger = logger;
            injectedLogImpl = logger;
        }
        else if(logger.info && typeof logger.info === 'function'){
            injectedLogger = logger;
            injectedLogImpl = logger.info.bind(logger);
        }
    }
}

module.exports.injectLogger = injectLogger;