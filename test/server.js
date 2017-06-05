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
    , Router = require('koa-router')
    , humps = require('humps');

let app = new App();

// app.use(function*(next){
//     console.log('request from ' + this.request.originalUrl);
//     yield next;
//     console.log('return data: ' + JSON.stringify(this.body));
// })

app.use(bodyParser());

let router = new Router({
    prefix: '/api/v1'
});

router.get('/banks', function *() {
    let type = this.request.query['type'];

    if (type == '1') {
        this.body = {
            data: {
                'ABC': {
                    name: 'ABC'
                }
            }
        };
        return;
    }

    this.body = {
        data: {
            'ABC': 'bank'
        }
    };
})

router.get('/xml', function* (){
    this.body = '<root><data><ABC>bank</ABC></data><code>0</code></root>'
})

router.get('/codeType/snake', function *(){
    var snakeType = this.request.query['snake_type'];
    console.log(snakeType)

    var res = {
        success: true,
        data: {
            user_id: 'fadslkjfldaksjlf',
            user_name: 'userName',
            user_age: 27
        }
    }

    if(snakeType){
        this.body = res;
    }
})

app.use(router.routes());

module.exports = app;