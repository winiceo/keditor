/* editor/assets/assets-preview-cubemap.js */
editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    var pitch = 0;
    var yaw = 0;

    var skyboxCurrent = null;

    var cubemapPrefiltered = [
        'prefilteredCubeMap128',
        'prefilteredCubeMap64',
        'prefilteredCubeMap32',
        'prefilteredCubeMap16',
        'prefilteredCubeMap8',
        'prefilteredCubeMap4'
    ];


    // camera
    var cameraNode = new pc.GraphNode();
    cameraNode.setLocalPosition(0, 0, 0);

    var camera = new pc.Camera();
    camera._node = cameraNode;
    camera.nearClip = 1;
    camera.farClip = 32;
    camera.clearColor = [ 0, 0, 0, 1 ];
    camera.fov = 75;
    camera.frustumCulling = false;


    editor.method('preview:cubemap:render', function(asset, target, args) {
        args = args || { };

        camera.aspectRatio = target.height / target.width;
        camera.renderTarget = target;

        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : 0;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 0;

        cameraNode.setLocalEulerAngles(pitch, yaw, 0);

        var skyboxCurrent = editor.call('preview:skybox');
        var engineAsset = app.assets.get(asset.get('id'));

        if (engineAsset && engineAsset.resources) {
            scene.setSkybox(engineAsset.resources);

            if (engineAsset.file) {
                scene.skyboxMip = args.hasOwnProperty('mipLevel') ? args.mipLevel : 0;
            } else {
                scene.skyboxMip = 0;
            }
        } else {
            scene.setSkybox(null);
        }

        renderer.render(scene, camera);

        if (skyboxCurrent) {
            scene.setSkybox(skyboxCurrent.resources);
            scene.skybox = null;
            scene.skyboxMip = 0;
        } else {
            scene.setSkybox(null);
        }
    });
});

