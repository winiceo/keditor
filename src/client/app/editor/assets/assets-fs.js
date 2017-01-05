/* editor/assets/assets-fs.js */
editor.once('load', function() {
    'use strict';

    var getIds = function(assets) {
        if (! (assets instanceof Array))
            assets = [ assets ];

        var ids = [ ];
        for(var i = 0; i < assets.length; i++)
            ids.push(parseInt(assets[i].get('id'), 10));

        return ids;
    };

    editor.method('assets:fs:delete', function(assets) {
        editor.call('realtime:send', 'fs', {
            op: 'delete',
            ids: getIds(assets)
        });
    });

    editor.method('assets:fs:move', function(assets, assetTo) {
        editor.call('realtime:send', 'fs', {
            op: 'move',
            ids: getIds(assets),
            to: assetTo ? parseInt(assetTo.get('id'), 10) : null
        });
    });

    editor.method('assets:fs:duplicate', function(assets) {
        editor.call('realtime:send', 'fs', {
            op: 'duplicate',
            ids: getIds(assets)
        });
    });
});

