/* launch/scene-loading.js */
editor.once('load', function() {
    'use strict';

    // cache
    var loaded = {};
    var isLoading = false;
    var loadScene = function(id, callback, settingsOnly) {

        if (loaded[id]) {
            alert(6666)
            if (callback)
                callback(null, loaded[id].getSnapshot());

            return;
        }

        isLoading = true;

        var connection = editor.call('realtime:connection');
        var scene = connection.get('scenes', '' + id);

        // error
        scene.on('error', function(err) {
            if (callback)
                callback(new Error(err));
        });

        // ready to sync
        scene.on('load', function() {
            // cache loaded scene for any subsequent load requests
            loaded[id] = scene;
 
            // notify of operations
            scene.on('op', function(ops, local) {
                if (local)
                    return;

                for (var i = 0; i < ops.length; i++) {
                    var op = ops[i];

                    // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

                    if (op.p[0]) {
                        editor.emit('realtime:op:' + op.p[0], op);
                    }
                }
            });

            // notify of scene load
            var snapshot = scene.data;
             //console.error(snapshot)
            if (settingsOnly !== true) {
               // alert(3)
                editor.emit('scene:raw', snapshot);
            }
            if (callback) {
                callback(null, snapshot);
            }

            isLoading = false;
        });

        // subscribe for realtime events
        scene.subscribe();
    };

    editor.method('loadScene', loadScene);
    editor.method('isLoadingScene', function () {
        return isLoading;
    });

    editor.on('realtime:authenticated', function () {
        var startedLoading = false;

        // if we are reconnecting try to reload
        // all scenes that we've already loaded
        for (var id in loaded) {
            startedLoading = true;
            loaded[id].destroy();
            delete loaded[id];

            editor.call('loadScene', id);
        }

        // if no scenes have been loaded at
        // all then we are initializing
        // for the first time so load the main scene
        if (! startedLoading) {

           
            editor.call('loadScene', config.scene.id);
        }
    });
});
