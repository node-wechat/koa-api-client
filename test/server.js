/*
 * @description
 *   Please write the mock script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(3/1/2017)
 */
'use strict';

const App = require('koa')
    , bodyParser = require('koa-bodyparser')
    , Router = require('koa-router');

let app = new App();

// app.use(function (cxt, next){
//     console.log('request from ' + cxt.request.originalUrl);
//     yield next;
//     console.log('return data: ' + JSON.stringify(cxt.body));
// })

app.use(bodyParser());

let router = new Router({
    prefix: '/api/v1'
});

router.get('/banks', function (cxt, next) {
    let type = cxt.request.query['type'];

    if (type == '1') {
        cxt.body = {
            data: {
                'ABC': {
                    name: 'ABC'
                }
            }
        };
        return;
    }

    cxt.body = {
        data: {
            'ABC': 'bank'
        }
    };
})

router.get('/xml', function (cxt){
    cxt.body = '<root><data><ABC>bank</ABC></data><code>0</code></root>'
})

router.get('/codeType/snake', function (cxt){
    var snakeType = cxt.request.query['snake_type'];

    if(snakeType){
        cxt.body = {
            success: true,
            data: {
                user_id: 'fadslkjfldaksjlf',
                user_name: 'userName',
                user_age: 27
            }
        };
    }
})


app.use(router.routes());

module.exports = app;