/**
 * Created by rdshoep on 16/11/1.
 */
'use strict';

const sleep = require('sleep.promise')
    , jsonFormat = require('json-format')
    , path = require('path')
    , fs = require('fs')
    , mkdirp = require('mkdirp');

/**
 * 读取模拟数据
 * @param url
 * @param opt config
 * @private
 */
function load(url, opt) {
    opt = opt || {};
    let path = _resolveUrl(url, opt);

    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, content) => {
            if (err) reject(err);
            else resolve(JSON.parse(content));
        })
    }).then(data => {
        if (opt.sleep) {
            return sleep(opt.sleep || 1000, data)
        }
        return data
    }).catch(err => {
        console.error('parse file(' + path + ') content error!', err);
        throw err;
    });
}

/**
 * 将内容更新到某些文件中
 * @param url
 * @param data
 * @param opt
 */
function save(url, data, opt) {
    let pathString = _resolveUrl(url, opt);

    return new Promise((resolve, reject) => {
        let dataString = jsonFormat(data, {
            type: 'space',
            size: 4
        });

        let isExist = fs.existsSync(pathString);
        if (!isExist) {
            let pathFolder = path.dirname(pathString);
            isExist = fs.existsSync(pathFolder);
            if (!isExist) {
                mkdirp.sync(pathFolder);
            }
        }
        fs.writeFile(pathString, dataString, 'utf8', err => {
            if(err) reject(err);
            else resolve(data);
        });
    }).catch(err => {
        console.error('write content to file(' + pathString + ') error!', err);
        throw err;
    });
}

/**
 * 将API地址转换成模拟数据对应的文件地址
 * http://[prefix]/user/login ---> [project folder]/mock/user/login
 * @param url
 * @private
 */
const uri = require('url');
function _resolveUrl(url, opt) {
    let urlObj = uri.parse(url)
        , suffix = opt.suffix || '.json'
        , baseUrl = (urlObj.protocol || 'http:') + '//' + urlObj.host
        , arr = url.replace(baseUrl, '').split('/');

    let dirLevel = Number(opt.dirLevel) || 0
        , start = Math.max(1, dirLevel + 1);

    let folders = [];
    if (arr.length > start) {
        for (let i = start; i < arr.length; i++) {
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