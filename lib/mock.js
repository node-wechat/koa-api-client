/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

var sleep = require('co-sleep');
var jsonFormat = require('json-format');
var path = require('path');
var fs = require('co-fs');
var mkdirp = require('mkdirp');
var log = require('./log');

/**
 * 读取模拟数据
 * @param url
 * @param opt config
 * @private
 */
function* load(url, opt) {
    opt = opt || {};
    var path = _resolveUrl(url, opt);
    var content = yield fs.readFile(path, 'utf8');

    //延时
    if (opt.sleep) {
        yield sleep(opt.sleep || 1000);
    }

    var data;
    try {
        data = JSON.parse(content);
    } catch (ex) {
        log('parse file(' + path + ') content error!');
    }
    return data;
}

/**
 * 将内容更新到某些文件中
 * @param url
 * @param data
 * @param opt
 */
function *save(url, data, opt) {
    var pathString = _resolveUrl(url, opt);

    try {
        let dataString = jsonFormat(data, {
            type: 'space',
            size: 4
        });
        var isExist = yield fs.exists(pathString);
        if (!isExist) {
            let pathFolder = path.dirname(pathString);
            isExist = yield fs.exists(pathFolder);
            if (!isExist) {
                mkdirp.sync(pathFolder);
            }
        }
        yield fs.writeFile(pathString, dataString, 'utf8')
    } catch (ex) {
        log('write content to file(' + pathString + ') error!', ex);
    }
}

/**
 * 将API地址转换成模拟数据对应的文件地址
 * http://[prefix]/user/login ---> [project folder]/mock/user/login
 * @param url
 * @private
 */
var uri = require('url');
function _resolveUrl(url, opt) {
    var urlObj = uri.parse(url);
    let suffix = opt.suffix || '.json';
    var baseUrl = (urlObj.protocol || 'http:') + '//' + urlObj.host;
    var arr = url.replace(baseUrl, '').split('/');

    let dirLevel = Number(opt.dirLevel) || 0;
    let start = Math.max(1, dirLevel + 1);

    var folders = [];
    if (arr.length > start) {
        for (var i = start; i < arr.length; i++) {
            if (i == arr.length - 1) {
                folders.push(encodeURIComponent(arr[i]));
            } else {
                folders.push(arr[i]);
            }
        }
    }

    //模拟数据的根目录,默认是当前目录
    let baseFolder = opt.base || __dirname;

    return path.join(baseFolder, folders.join(path.sep)) + suffix;
}

module.exports = {
    load
    , save
};