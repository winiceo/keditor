/* launch/project-settings-sync.js */
editor.once('load', function() {
    'use strict';

    var settings = new Observer(config.project.settings);

    editor.method('project:settings', function () {
        return settings;
    });

    // handle changes by others
    editor.on('messenger:project.update', function (data) {
        alert(4)
        for (var path in data) {
            if (! path.startsWith('settings.'))
                continue;

            var p = path.substring(9);

            var history = settings.history;
            settings.history = false;
            settings.set(p, data[path]);
            settings.history = history;
        }
    });
});

