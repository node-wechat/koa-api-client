/**
 * Created by rdshoep on 16/11/1.
 */
'use strict'

const ApiClient = require('..')
    , expect = require('chai').expect
    , assert = require('chai').assert
    , path = require('path')
    , fs = require('fs')
    , log4js = require('log4js')
    , xmlParser = require('xml2json')
    , humps = require('humps');

// you can change this level, find diffenrece in the mock folder's record mock file
const MOCK_DIR_LEVEL = 0;

let port = 3002
    , app = require('./server');

//log4js log config
log4js.configure({
    appenders: [
        {type: 'console'},
    ]
});

ApiClient.injectLogger(log4js.getLogger('api'))

let baseUri = {
    scheme: 'http',
    domain: '127.0.0.1',
    port: port,
    prefix: '/api/v1'
}, defaultOpt = {};

app.listen(port, function () {
    console.log('mock data server started, start test...');
});

describe('apiClient', function () {
    describe('#get method', function () {
        it('>normal', function (done) {
            this.timeout(20000);

            let apiClient = new ApiClient(baseUri, {});

            apiClient.get('/banks').then(res => {
                //返回内容不为空
                expect(res).to.not.be.empty;

                //数据内容包含某个节点
                expect(res).to.have.property('data');

                done();
            }).catch(err => {
                done(err);
            })
        });

        it('>params not in url', function (done) {
            this.timeout(20000);

            let apiClient = new ApiClient(baseUri, {});

            apiClient.get('/banks', {
                type: 1
            }).then(res => {
                //数据内容包含某个节点
                expect(res.data['ABC']).to.have.property('name');
                done();
            }).catch(err => {
                done(err);
            })
        });

        it('>read from mock data', function (done) {
            this.timeout(20000);

            try {
                let recordFolder = path.join(__dirname, '/mock');
                let apiClient = new ApiClient(baseUri, {
                    mock: {
                        suffix: '.json',
                        dirLevel: MOCK_DIR_LEVEL,
                        base: recordFolder
                    }
                });

                apiClient.get('/banks', {
                    type: 1
                }).then(res => {
                    //数据内容包含某个节点
                    expect(res.data['ABC']).to.have.property('name');

                    done();
                }).catch(err => {
                    done(err);
                })
            }
            catch (err) {
                done(err);
            }
        });

        it('>record data', function (done) {
            this.timeout(20000);

            try {
                let recordFolder = path.join(__dirname, '/mock/gen');
                let apiClient = new ApiClient(baseUri, {
                    record: {
                        suffix: '.json',
                        dirLevel: MOCK_DIR_LEVEL,
                        base: recordFolder
                    }
                });

                let recordFilePath = recordFolder + path.sep + 'api/v1/banks'.split('/').slice(MOCK_DIR_LEVEL).join(path.sep) + '.json';
                if (fs.existsSync(recordFilePath)) {
                    fs.unlinkSync(recordFilePath);
                }

                apiClient.get('/banks', {
                    type: 1
                }).then(res => {
                    fs.readFile(recordFilePath, 'utf8', function (err, data) {
                        assert.deepEqual(JSON.parse(data)
                            , res, 'file content is some with request content');

                        done(err);
                    });
                }).catch(err => {
                    done(err);
                })
            }
            catch (err) {
                done(err);
            }
        });

        it('>custom dataParser, convert from xml response to json', function (done) {
            this.timeout(20000);

            var apiClient = new ApiClient(baseUri, Object.assign({
                dataParser: (err, data) => err ? {
                    success: false,
                    msg: err.message
                } : JSON.parse(xmlParser.toJson(data)).root
            }, defaultOpt));

            apiClient.get('/xml').then(content => {
                //返回内容不为空
                expect(content).to.not.be.empty;

                //数据内容包含某个节点
                expect(content).to.have.property('data');

                done();
            }).catch(function (err) {
                done(err);
            });
        })

        it('>set beforeEnd data handler', function (done) {
            this.timeout(20000);

            var apiClient = new ApiClient(baseUri, Object.assign({
                beforeEnd: [
                    //if has valid data node, set success is true
                    data => {
                        data['success'] = !!data.data
                        return data;
                    },
                    //convert json node key to upper mode
                    data => {
                        Object.keys(data)
                            .forEach(key => {
                                data[key.toUpperCase()] = data[key];
                                delete data[key];
                            })
                        return data;
                    },
                    //log return data
                    data => {
                        console.log(JSON.stringify(data));
                        return data;
                    }
                ]
            }, defaultOpt));

            apiClient.get('/notfound').then(content => {
                //返回内容不为空
                expect(content).to.not.be.empty;

                //数据内容包含某个节点
                expect(content).to.have.property('MSG');

                done();
            }).catch(function (err) {
                done(err);
            });
        })

        it('>request middleware', function (done) {
            this.timeout(20000);

            var apiClient = new ApiClient(baseUri, Object.assign({
                requestMiddleware: [
                    function (cxt, next) {
                        var request = cxt;

                        if (request.params) {
                            request.params = humps.decamelizeKeys(request.params);
                        }

                        return next()
                            .then(() => {
                                if (request.data) {
                                    request.data = humps.camelizeKeys(request.data)
                                }
                            });
                    }
                ]
            }, defaultOpt));

            apiClient.get('/codeType/snake', {
                snakeType: 1
            }).then(content => {
                //返回内容不为空
                expect(content).to.not.be.empty;

                //数据内容包含某个节点
                expect(content.data).to.have.property('userName');

                done();
            }).catch(function (err) {
                done(err);
            });
        })
    });
});