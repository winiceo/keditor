/* editor/toolbar/toolbar-editor-settings.js */
editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // settings button
    var button = new ui.Button({
        text: '&#57652;'
    });
    button.class.add('pc-icon', 'editor-settings');
    toolbar.append(button);

    button.on('click', function() {
        editor.call('selector:set', 'editorSettings', [ editor.call('editorSettings') ]);
    });

    editor.on('attributes:clear', function() {
        button.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', function() {
        editor.call('attributes.rootPanel').folded = false;

        button.class.add('active');
    });

    editor.on('viewport:expand', function(state) {
        button.disabled = state;
    });

    Tooltip.attach({
        target: button.element,
        text: 'Settings',
        align: 'left',
        root: editor.call('layout.root')
    });
});

