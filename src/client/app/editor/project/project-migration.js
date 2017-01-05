/* editor/project/project-migration.js */
editor.once('load', function() {
    'use strict';

    var projectSettings = editor.call('project:settings');
    if (! projectSettings.has('vr')) {
        projectSettings.set('vr', false);
    }
});

