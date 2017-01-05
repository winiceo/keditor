/* editor/assets/assets-create-material.js */
editor.once('load', function() {
    'use strict';

    editor.method('assets:create:material', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var data = editor.call('material:default');

        var asset = {
            name: 'New Material',
            type: 'material',
            source: false,
            preload: true,
            data: data,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});

