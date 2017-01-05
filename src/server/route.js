/**
 * Created by leven on 17/1/4.
 */
var multer = require('multer')
var path=require("path")
var upload = multer({ dest: path.join(__dirname, 'public/uploads/') })
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
        let scene_id=req.params.d
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
            "scene": {"id": scene_id},
            "url": {
                "api": "http://localhost:4444/api",
                "home": "http://localhost:4444",
                "realtime": {"http": "ws://localhost:4444/channel"},
                "messenger": {"http": "https://msg.playcanvas.com/", "ws": "https://msg.playcanvas.com/messages"},
                "engine": "http://localhost:4444/playcanvas-stable.js",
                "howdoi": "https://s3-eu-west-1.amazonaws.com/code.playcanvas.com/editor_howdoi.json",
                "static": "https://s3-eu-west-1.amazonaws.com/static.playcanvas.com",
                "images": "https://s3-eu-west-1.amazonaws.com/images.playcanvas.com"
            }
        };

        res.render("index.html",{config:(config)})



    })


    //演示
    app.all("/editor/scene/:d/launch", function (req, res) {
        let scene_id=req.params.d
        let config =
        {
            "self": {
                "id": 10695,
                "username": "leven"
            },
            "accessToken": "to52zxqwejzdbc67hdxahc5ja62royhe",
            "project": {
                "id": 449204,
                "repositoryUrl": "/api/projects/449204/repositories/directory/sourcefiles",
                "scriptPrefix": "/api/files/code/449204/directory",
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
                }
            },
            "scene": {
                "id": scene_id
            },
            "url": {
                "api": "http://localhost:4444/api",
                "home": "http://localhost:4444",
                "realtime": {"http": "ws://localhost:4444/channel"},
                "messenger": {"http": "https://msg.playcanvas.com/", "ws": "https://msg.playcanvas.com/messages"},
                "engine": "https://code.playcanvas.com/playcanvas-stable.js",

                "physics": "https://code.playcanvas.com/ammo.dcab07b.js",
                "webvr": "https://code.playcanvas.com/webvr-polyfill.91fbc44.js"
            }
        }



        res.render("launch.html",{config:(config)})

        // fs.readFile(__dirname + '/public/index.html', function (err, page) {
        //     res.writeHead(200, {'Content-Type': 'text/html'});
        //     res.write(page);
        //     res.end();
        // });

    })

     //代码编辑
    app.all("/editor/asset/:d", function (req, res) {
        let assets_id=req.params.d
        let config ={
            "self": {
                "id": 10695,
                "username": "leven"
            },
            "accessToken": "to52zxqwejzdbc67hdxahc5ja62royhe",
            "asset": {
                "id": assets_id,
                "name": "New Css",
                "type": "css",
                "scope": {
                    "type": "project",
                    "id": 449204
                }
            },
            "project": {
                "id": 449204,
                "name": "levengame",
                "permissions": {
                    "admin": [
                        10695
                    ],
                    "write": [],
                    "read": []
                },
                "libraries": [
                    "physics-engine-3d"
                ],

                "private": false,
                "repositories": {
                    "current": "directory"
                }
            },
            "file": {
                "error": false
            },
            "title": "New Css | Code Editor",
            "url": {
                "api": "https://localhost:4444/api",
                "home": "https://localhost:4444",
                "realtime": {
                    "http": "ws://localhost:4444/channel"
                },
                "messenger": {
                    "http": "https://msg.playcanvas.com/",
                    "ws": "https://msg.playcanvas.com/messages"
                },
                "autocomplete": "https://s3-eu-west-1.amazonaws.com/code.playcanvas.com/tern-playcanvas.json"
            }
        }




        res.render("code-editor.html",{config:(config)})

        

    })


    app.all('/api/projects/:d/scenes', function (req, res, params) {

        let project_id=parseInt(req.params.d)
        let model=backend.createModel()
        console.log(project_id)
        let query = model.query("scenes", {"project_id":project_id})
        query.subscribe(function(){
            "use strict";

            var tmp = []

            _.each(query.get(), function (b) {
               
                delete(b.settings)
                delete(b.entities)
                delete(b.scene)
                tmp.push(b)
            })
            res.json({"result": tmp})
            
        })
 
        

    })
    app.all('/api/scenes/:d/designer_settings/:e', function (req, res, params) {
        var data = {
            "camera_far_clip": 1000.0,
            "icons_size": 0.2,
            "help": true,
            "local_server": "http://localhost:4444",
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


        var connection = backend.connect();
        connection.createFetchQuery('assets', {"project": {$eq: req.params.d}}, {}, function (err, results) {
            if (err) {
                throw err;
            }

            // Populate with a set of starting documents, but this is currently
            // empty. See below for some sample data.
            //
            if (results.length === 0) {
                var shapes = [];

                // shapes.forEach(function (shape, index) {
                //     var doc = connection.get('shapes', shape.attrs.id);
                //     // {
                //     //   key: uuid,
                //     //   attrs: props of shape,
                //     //   className: type of shape
                //     // }
                //
                //     var data = {
                //         key: shape.attrs.id,
                //         attrs: shape.attrs,
                //         className: shape.className
                //     };
                //     doc.create(data);
                // });
            }
        });


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

    app.all('/api/assets/:id/file/:name', function (req, res, params) {
        var connection = backend.connect();
        var doc = connection.get('assets', req.param.id);
        let callback=function(){
            "use strict";
            res.send(doc.data)

        }
        doc.fetch(function(err) {
            if (err) throw err;
            if (doc.type === null) {
                doc.create({data:""} , callback);
                return;
            }
            callback();
        });
    })

    
    app.all('/api/assets/files/:asset', function (req, res, params) {
        var connection = backend.connect();
       
        var doc = connection.get('assets', req.query.id);
        let callback=function(){
            "use strict";
            console.error(doc.data.data)
            res.send((doc.data.data))

        }
        doc.fetch(function(err) {
            if (err) throw err;
            if (doc.type === null) {
                doc.create({data:""} , callback);
                return;
            }
            callback();
        });

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
        // let createNull
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

    app.post('/api/scenes',  function (req, res, next) {
        var data = req.body
        let model = backend.createModel()
        // let createNull
        let uid = model.id()

       let obj = {
                "project_id": 449204,
                "name": " asjdfkasj\uff1b\u57ce",
                "settings": {
                    "physics": {
                        "gravity": [
                            0.0,
                            -9.8,
                            0.0
                        ]
                    },
                    "render": {
                        "fog_end": 1000.0,
                        "fog_start": 1.0,
                        "skyboxIntensity": 1,
                        "global_ambient": [
                            0.2,
                            0.2,
                            0.2
                        ],
                        "tonemapping": 0,
                        "fog_color": [
                            0.0,
                            0.0,
                            0.0
                        ],
                        "lightmapMode": 1,
                        "skyboxMip": 0,
                        "fog": "none",
                        "lightmapMaxResolution": 2048,
                        "skybox": null,
                        "fog_density": 0.01,
                        "gamma_correction": 1,
                        "lightmapSizeMultiplier": 16,
                        "exposure": 1.0
                    }
                },
                "scene": 488048,
                "modified": "2017-01-05T12:53:46.528416",
                "entities": {
                    "fef8a994-d345-11e6-89b2-22000ac481df": {
                        "scale": [
                            1,
                            1,
                            1
                        ],
                        "name": "Root",
                        "parent": null,
                        "resource_id": "fef8a994-d345-11e6-89b2-22000ac481df",
                        "enabled": true,
                        "components": {},
                        "position": [
                            0,
                            0,
                            0
                        ],
                        "rotation": [
                            0,
                            0,
                            0
                        ],
                        "children": [
                            "fef8ac50-d345-11e6-89b2-22000ac481df",
                            "fef8ae1c-d345-11e6-89b2-22000ac481df",
                            "fef8afd4-d345-11e6-89b2-22000ac481df",
                            "fef8b182-d345-11e6-89b2-22000ac481df"
                        ]
                    },
                    "fef8ae1c-d345-11e6-89b2-22000ac481df": {
                        "scale": [
                            1,
                            1,
                            1
                        ],
                        "name": "Light",
                        "parent": "fef8a994-d345-11e6-89b2-22000ac481df",
                        "resource_id": "fef8ae1c-d345-11e6-89b2-22000ac481df",
                        "enabled": true,
                        "components": {
                            "light": {
                                "bake": false,
                                "vsmBlurSize": 11,
                                "shadowUpdateMode": 2,
                                "normalOffsetBias": 0.04,
                                "color": [
                                    1,
                                    1,
                                    1
                                ],
                                "type": "directional",
                                "shadowResolution": 1024,
                                "outerConeAngle": 45,
                                "enabled": true,
                                "intensity": 1,
                                "castShadows": true,
                                "innerConeAngle": 40,
                                "range": 8,
                                "affectLightmapped": false,
                                "vsmBlurMode": 1,
                                "affectDynamic": true,
                                "shadowBias": 0.04,
                                "shadowDistance": 16.0,
                                "falloffMode": 0,
                                "shadowType": 0,
                                "vsmBias": 0.01
                            }
                        },
                        "position": [
                            2,
                            2,
                            -2
                        ],
                        "rotation": [
                            45,
                            135,
                            0
                        ],
                        "children": []
                    },
                    "fef8b182-d345-11e6-89b2-22000ac481df": {
                        "scale": [
                            8,
                            1,
                            8
                        ],
                        "name": "Plane",
                        "parent": "fef8a994-d345-11e6-89b2-22000ac481df",
                        "resource_id": "fef8b182-d345-11e6-89b2-22000ac481df",
                        "enabled": true,
                        "components": {
                            "model": {
                                "materialAsset": null,
                                "lightMapped": false,
                                "receiveShadows": true,
                                "castShadowsLightMap": false,
                                "enabled": true,
                                "castShadows": true,
                                "castShadowsLightmap": true,
                                "lightMapSizeMultiplier": 1,
                                "lightmapSizeMultiplier": 1,
                                "type": "plane",
                                "lightmapped": false,
                                "asset": null
                            }
                        },
                        "position": [
                            0,
                            0,
                            0
                        ],
                        "rotation": [
                            0,
                            0,
                            0
                        ],
                        "children": []
                    },
                    "fef8ac50-d345-11e6-89b2-22000ac481df": {
                        "scale": [
                            1,
                            1,
                            1
                        ],
                        "name": "Camera",
                        "parent": "fef8a994-d345-11e6-89b2-22000ac481df",
                        "resource_id": "fef8ac50-d345-11e6-89b2-22000ac481df",
                        "enabled": true,
                        "components": {
                            "camera": {
                                "orthoHeight": 4,
                                "fov": 45,
                                "clearDepthBuffer": true,
                                "projection": 0,
                                "frustumCulling": true,
                                "clearColor": [
                                    0.118,
                                    0.118,
                                    0.118,
                                    1.0
                                ],
                                "enabled": true,
                                "priority": 0,
                                "farClip": 1000,
                                "nearClip": 0.1,
                                "rect": [
                                    0,
                                    0,
                                    1,
                                    1
                                ],
                                "clearColorBuffer": true
                            }
                        },
                        "position": [
                            4,
                            3.5,
                            4
                        ],
                        "rotation": [
                            -30,
                            45,
                            0
                        ],
                        "children": []
                    },
                    "fef8afd4-d345-11e6-89b2-22000ac481df": {
                        "scale": [
                            1,
                            1,
                            1
                        ],
                        "name": "Box",
                        "parent": "fef8a994-d345-11e6-89b2-22000ac481df",
                        "resource_id": "fef8afd4-d345-11e6-89b2-22000ac481df",
                        "enabled": true,
                        "components": {
                            "model": {
                                "materialAsset": null,
                                "lightMapped": false,
                                "receiveShadows": true,
                                "castShadowsLightMap": false,
                                "enabled": true,
                                "castShadows": true,
                                "castShadowsLightmap": true,
                                "lightMapSizeMultiplier": 1,
                                "lightmapSizeMultiplier": 1,
                                "type": "box",
                                "lightmapped": false,
                                "asset": null
                            }
                        },
                        "position": [
                            0,
                            0.5,
                            0
                        ],
                        "rotation": [
                            0,
                            0,
                            0
                        ],
                        "children": []
                    }
                },

                "id": 488048
            }



        var connection = backend.connect();

          var doc = connection.get('scenes', uid);
          let callback=function(){
                //console.log(doc.data)
                 res.json(doc.data)
          }
          doc.fetch(function(err) {
            if (err) throw err;
            if (doc.type === null) {
              doc.create(_.assign(obj,data), callback);
              return;
            }
            callback();
          }); 

    })

 
}
