/* editor/selector/selector-sync.js */
editor.once('load', function() {
    'use strict';

    var lastSelectionType = null;
    var lastIds = [ ];
    var selection = { };
    var timeout;
    var lastCheck = 0;


    var checkSelector = function() {
        timeout = null;
        lastCheck = Date.now();

        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        var selectionType = editor.call('selector:type');
        var ids = [ ];

        if (type === 'entity') {
            for(var i = 0; i < items.length; i++)
                ids.push(items[i].get('resource_id'));
        } else if (type === 'asset') {
            for(var i = 0; i < items.length; i++) {
                var id = items[i].get('id');
                if (items[i].get('type') === 'script' && ! id) {
                    ids.push(items[i].get('filename'));
                } else {
                    ids.push(id);
                }
            }
        } else if (type === 'editorSettings') {
            // editor settings always single
        } else {
            selectionType = null;
        }

        var changed = false;
        if (lastSelectionType !== selectionType)
            changed = true;

        if (! changed) {
            if (ids.length !== lastIds.length) {
                changed = true;
            } else {
                for(var i = 0; i < ids.length; i++) {
                    if (ids[i] !== lastIds[i]) {
                        changed = true;
                        break;
                    }
                }
            }
        }

        lastSelectionType = selectionType;
        lastIds = ids;

        if (changed) {
            editor.call('realtime:send', 'selection', {
                t: selectionType,
                ids: ids
            });
        }
    };

    editor.on('selector:change', function(type, items) {
        if (timeout)
            return;

        if ((Date.now() - lastCheck) > 500) {
            checkSelector();
        } else {
            timeout = setTimeout(checkSelector, 500);
        }
    });

    editor.on('selector:sync:raw', function(data) {
        data = JSON.parse(data);
        var id = data.u;

        // select
        selection[id] = {
            type: data.t,
            ids: data.ids
        };

        editor.emit('selector:sync[' + id + ']', selection[id]);
        editor.emit('selector:sync', id, selection[id]);
    });
});

