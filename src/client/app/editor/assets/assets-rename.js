/* editor/assets/assets-rename.js */
editor.once('load', function() {
    'use strict';

    var onRename = function() {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        var items = editor.call('selector:items');
        if (items.length !== 1)
            return;

        var root = editor.call('attributes.rootPanel');
        if (! root)
            return;

        var input = root.element.querySelector('.ui-text-field.asset-name');

        if (! input || ! input.ui)
            return;

        input.ui.flash();
        input.ui.elementInput.select();
    };

    editor.method('assets:rename', onRename);

    editor.call('hotkey:register', 'assets:rename', {
        key: 'n',
        callback: onRename
    });

    editor.call('hotkey:register', 'assets:rename:f2', {
        key: 'f2',
        callback: onRename
    });
});

