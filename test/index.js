/**
 * Created by rdshoep on 16/11/1.
 */
'use strict'

const co = require('co')
    , ApiClient = require('..')
    , expect = require('chai').expect
    , assert = require('chai').assert
    , sleep = require('co-sleep')
    , path = require('path')
    , fs = require('fs')
    , log4js = require('log4js');

// you can change this level, find diffenrece in the mock folder's record mock file
const MOCK_DIR_LEVEL = 0;

let port = 3002
    , app = require('./server');

//log4js log config
log4js.configure({
    appenders: [
        // { type: 'console' },
    ]
});

let baseUri = {
    scheme: 'http',
    domain: '127.0.0.1',
    port: port,
    prefix: '/api/v1'
};

app.listen(port, function () {
    console.log('mock data server started, start test...');
});

describe('apiClient', function () {
    describe('#get method', function () {
        it('>normal', function (done) {
            this.timeout(20000);

            co(function *() {
                var apiClient = new ApiClient(baseUri, {});

                var content = yield apiClient.get('/banks');

                //返回内容不为空
                expect(content).to.not.be.empty;

                //数据内容包含某个节点
                expect(content).to.have.property('data');

                done();
            }).catch(function (err) {
                done(err);
            });
        });

        it('>params not in url', function (done) {
            this.timeout(20000);

            co(function *() {
                var apiClient = new ApiClient(baseUri, {});

                var content = yield apiClient.get('/banks', {
                    type: 1
                });

                try {
                    //数据内容包含某个节点
                    expect(content.data['ABC']).to.have.property('name');
                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        });

        it('>record data', function (done) {
            this.timeout(20000);

            co(function *() {
                try {
                    var recordFolder = path.join(__dirname, '/mock');
                    var apiClient = new ApiClient(baseUri, {
                        record: {
                            suffix: '.json',
                            dirLevel: MOCK_DIR_LEVEL,
                            base: recordFolder
                        }
                    });

                    var recordFilePath = recordFolder + path.sep + 'api/v1/banks'.split('/').slice(MOCK_DIR_LEVEL).join(path.sep) + '.json';
                    // console.log(recordFilePath);
                    if (fs.existsSync(recordFilePath)) {
                        fs.unlinkSync(recordFilePath);
                    }

                    var content = yield apiClient.get('/banks', {
                        type: 1
                    });

                    fs.readFile(recordFilePath, 'utf8', function (err, data) {
                        assert.deepEqual(JSON.parse(data)
                            , content, 'file content is some with request content');

                        done(err);
                    });
                }
                catch (err) {
                    done(err);
                }
            });
        });

        it('>read from mock data', function (done) {
            this.timeout(20000);

            co(function *() {
                try {
                    var recordFolder = path.join(__dirname, '/mock');
                    var apiClient = new ApiClient(baseUri, {
                        mock: {
                            suffix: '.json',
                            dirLevel: MOCK_DIR_LEVEL,
                            base: recordFolder
                        }
                    });

                    var content = yield apiClient.get('/banks', {
                        type: 1
                    });

                    //数据内容包含某个节点
                    expect(content.data['ABC']).to.have.property('name');

                    done();
                }
                catch (err) {
                    done(err);
                }
            });
        })
    });
});