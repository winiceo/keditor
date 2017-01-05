/**
 * Created by leven on 17/1/4.
 */
var multer = require('multer')
var upload = multer()
var fs = require("fs")
const _ = require("lodash")

const async = require("async")

var K = require("parse/node")
var config = {
    APP_NAME: 'keviocms',
    APP_ID: 'kevioapp',
    MASTER_KEY: 'pmker.com',
    SERVER_URL: 'http://71an.com/k/p/'
}
K.initialize(config.APP_ID, config.MASTER_KEY);
K.serverURL = config.SERVER_URL;
module.exports = (app, backend) => {

    app.all("/editor/scene/:d", function (req, res) {

        let config = {
            "self": {
                "id": 10695,
                "username": "leven",
                "betaTester": false,
                "superUser": false,
                "openedEditor": false,
                "tips": {"store": true},
                "plan": {"id": 1, "type": "free"}
            },
            "owner": {
                "id": 10695,
                "username": "leven",
                "plan": {"id": 1, "type": "free"},
                "size": 20871079,
                "diskAllowance": 200000000
            },
            "accessToken": "to52zxqwejzdbc67hdxahc5ja62royhe",
            "project": {
                "id": 449204,
                "name": "levengame",
                "description": "game once",
                "permissions": {"admin": [10695], "write": [], "read": []},
                "private": false,
                "privateAssets": false,
                "primaryScene": 487784,
                "primaryApp": null,
                "playUrl": "https://playcanv.as/p/Lf5P46O0/",
                "settings": {
                    "loading_screen_script": null,
                    "transparent_canvas": false,
                    "use_device_pixel_ratio": false,
                    "use_legacy_scripts": false,
                    "resolution_mode": "AUTO",
                    "antiAlias": true,
                    "height": 720,
                    "libraries": [],
                    "width": 1280,
                    "vr": false,
                    "scripts": [],
                    "fill_mode": "FILL_WINDOW",
                    "preserve_drawing_buffer": false
                },
                "privateSettings": {},
                "thumbnails": {}
            },
            "scene": {"id": "487784"},
            "url": {
                "api": "http://localhost:4444/api",
                "home": "https://playcanvas.com",
                "realtime": {"http": "ws://localhost:4444/channel"},
                "messenger": {"http": "https://msg.playcanvas.com/", "ws": "https://msg.playcanvas.com/messages"},
                "engine": "https://code.playcanvas.com/playcanvas-stable.js",
                "howdoi": "https://s3-eu-west-1.amazonaws.com/code.playcanvas.com/editor_howdoi.json",
                "static": "https://s3-eu-west-1.amazonaws.com/static.playcanvas.com",
                "images": "https://s3-eu-west-1.amazonaws.com/images.playcanvas.com"
            }
        };

        res.render("index.html",{config:(config)})

        // fs.readFile(__dirname + '/public/index.html', function (err, page) {
        //     res.writeHead(200, {'Content-Type': 'text/html'});
        //     res.write(page);
        //     res.end();
        // });

    })


    app.all('/api/projects/:d/scenes', function (req, res, params) {

        backend.queryFetch('scenes', {"project_id": parseInt(req.params.d)}, function (err, results) {
            var tmp = []
            _.each(results, function (n) {
                var b = n.data;
                delete(b.settings)
                delete(b.entities)
                tmp.push(b)
            })
            res.json({"results": tmp})

        })


    })
    app.all('/api/scenes/:d/designer_settings/:e', function (req, res, params) {
        var data = {
            "camera_far_clip": 1000.0,
            "icons_size": 0.2,
            "help": true,
            "local_server": "http://localhost:51000",
            "pack_id": 487784,
            "camera_near_clip": 0.1,
            "modified_at": "2017-01-04T15:09:29.140000",
            "camera_clear_color": [0.118, 0.118, 0.118, 1.0],
            "grid_divisions": 8,
            "grid_division_size": 1.0,
            "version": 1,
            "snap_increment": 1.0,
            "user_id": 10695,
            "_id": "586d1029fe30c41891959722",
            "created_at": "2017-01-04T15:09:29.140000"
        }
        res.json(data)
    })
//var Assets = K.Object.extend("assets");

    app.all('/api/projects/:d/assets', function (req, res, params) {

        let model = backend.createModel()
        //let results=model.query("assets", {project:req.params.d})


        let query = model.query("assets", {"project": {$eq: req.params.d}}).fetch(function () {
            "use strict";
            let results = []
            _.mapKeys(query.idMap, function (key, value) {
                results.push({id: value})

            })
            res.json(results)


            console.log(query.idMap)
        })


        // console.log(results)
        //   res.json({results:""})
        // var query = new K.Query(Assets);
        // query.equalTo("project", req.params.d );
        // //query.equalTo("project", "448674");
        // console.log(req.params.d)
        //
        // query.find({
        //     success: function (result) {
        //         console.log(result)
        //         var aa=[]
        //         _.each(result,function(n){
        //             aa.push({"id":n.id})
        //         })
        //         //res.json(aa)
        //
        //     },
        //     error: function (error) {
        //
        //         console.log("Error: " + error.code + " " + error.message);
        //     }
        // });

    })


    app.all('/api/assets/:id/file/:filename', function (req, res, params) {
        res.send("")
        // var query = new K.Query(Assets);
        // query.equalTo("objectId", req.params.id );
        // //query.equalTo("project", "448674");
        // console.log(req.params.d)
        //
        // query.find({
        //     success: function (result) {
        //
        //         //res.json(result)
        //
        //     },
        //     error: function (error) {
        //
        //         console.log("Error: " + error.code + " " + error.message);
        //     }
        // });

    })
//  app.all('/api/users/:d', function (req, res, params) {
//     var data={"username":"leven","email_hash":"40352887d9d92e6a981739e6cdbdb90a","hash":"Kxixh8In","organizations":[],"plan_type":"free","tokens":[],"plan":"free","full_name":"Leven Zhao","vat_number":null,"id":10695,"size":{"total":0,"code":0,"apps":0,"assets":0},"public_key":"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDR/X3WP15OZ3CaDV3iCsnRjPCuXxXp/ybCn8n4twnuxrAsk5IWLmCHhivJQfqmB50UQRktLywyEiXbK1Z346YgyTY0k4GdiQ5IeL3iFhebPFFJW+EPiklHQQb+o3rwDJpC2CTxlAc1NCSNIKD2DILN2xOr+3gs234pcYURilF2gBRidEqVDP0i/xUdkijdrmFKneYjkGnZXMfHZRBz8hG1xZfOWGT0asi9ubxnHS/zhoi3WDEyhH//KDN6Gc4e6xl7LOkH0D67XU7NTRmfOAxZeY6kOvYv7u0fEV4To1+CloCwDOtYWfNp7h51Cbza0uYBN6hk9/SSVXa7n75/LWU3 \"leven@playcanvas\"\n","active_promo":null,"preferences":{"email":{"organizations":true,"users":true,"followed_projects":true,"comments":true,"general":true,"store":true,"stars":true,"projects":true}},"limits":{"max_public_projects":-1,"disk_allowance":200,"max_private_projects":0},"skills":["coder","designer","musician","artist"],"created_at":"2014-07-04T07:57:00Z","super_user":false,"flags":{"opened_designer":false},"organization":false,"email":"leven.zsh@gmail.com","last_seen":"2017-01-02T10:59:56Z"}
//     res.json(data)
// })
//     var upload = multer()
//     var bodyParser = require('body-parser');
//     var bytes=require("bytes")
//
//     app.use(bodyParser.json({limit: '1mb'}));
//     app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
//     app.use(require('method-override')());
//
//     var busboy = require('connect-busboy');
//
//     app.use(busboy({
//         limits: {
//             fileSize: bytes(1024000)
//         }
//     }));
// // default options, no immediate parsing
//
//     var ShareDB = require('sharedb');
//     var db1 = require('sharedb-mongo')('mongodb://localhost:27017/playcanvas');
//
//     var bass = ShareDB({db: db1});
//     var cc = bass.connect();
//
//     var uuid = require('node-uuid');
    app.post('/api/assets', upload.single('file'), function (req, res, next) {
        var data = req.body
        // console.log(data)
        // return res.json(data)
        let model = backend.createModel()
        let uid = model.id()

        let $assets = model.at('assets.' + uid)

        $assets.subscribe(function (err) {
            if (err) return next(err);
            var assets = $assets.get();

            let obj = {
                "scope": {
                    "type": "project",
                    "id": data.project
                },
                "user_id": 10695,
                "source_asset_id": null,
                "source": false,
                "tags": [],

                "revision": 1,
                "preload": true,
                "meta": null,
                "data": null,

                "file": {
                    "filename": data.filename,
                    "size": 1,
                    "hash": "68b329da9893e34099c7d8ad5cb9c940"
                },
                "region": "eu-west-1",
                "path": [],
                "task": null
            }


            // If the room doesn't exist yet, we need to create it
            $assets.createNull(_.assign(obj, data));

            res.json({"asset": {"id": uid}})
            // // Reference the current room's content for ease of use
            // model.ref('_page.room', $room.at('content'));
            // var html = renderIndex({
            //     room: $room.get('id'),
            //     text: $room.get('content')
            // });
            // model.bundle(function(err, bundle) {
            //     if (err) return next(err);
            //     var bundleJson = stringifyBundle(bundle);
            //     html += renderScripts({bundle: bundleJson});
            //     res.send(html);
            // });
        });


        // model.fetch(assets, () => {
        //     let cb=function(){
        //         "use strict";
        //         let as=assets.get()
        //
        //         console.log(as)
        //         res.json(as)
        //     }
        //     async.series([ (cb) => {
        //         if (assets.get() == null) {
        //             assets.add(uid,data, cb)
        //         } else {
        //            cb()
        //         }
        //     }])
        //     model.close()
        //
        // })


        console.log(data)
        console.log(data)

        // var project_id=data.project_id;
        // var uid=Date.now().toString();
        // var doc=cc.get("assets",uid)
        //
        // doc.fetch(function(err) {
        //     if (err) throw err;
        //     if (doc.type === null) {
        //
        //         doc.create( data, function(err) {
        //             res.json({"asset":{"id":parseInt(uid)}})
        //         })
        //
        //         return;
        //     }
        //
        // });
        // doc.on("create",function(){
        //     console.log(arguments)
        // })


        //  var connection = backend.connect();
        // var doc = connection.get('assets', "");
        // doc.create(
        // {"data":data} );

        // var GameScore = K.Object.extend("assets");
        //   var kobj = new GameScore();

        //       // 设置名称

        //  kobj.set(data);
        //   kobj.save(null,{
        //       success:function(aa){
        //           console.log(aa)
        //           var data={"asset":{"id":aa.id}}
        //           res.json(data)
        //       }
        //   })


    })

    //app.use('/api',require("./rest")(backend));

    app.all('/editor/asset/:d', function (req, res, params) {
        fs.readFile(__dirname + '/edit.html', function (err, page) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(page);
            res.end();
        });
    })


    app.all('/api/assets/:id/file/:name', function (req, res, params) {
        res.send("adfsdf");
    })


    app.all('/editor/scene/:d/launch', function (req, res, params) {
        fs.readFile(__dirname + '/launch.html', function (err, page) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(page);
            res.end();
        });
    })
}
