editor.on('load', function() {
    var hierarchyOverlay = new ui.Panel();
    hierarchyOverlay.class.add('overlay');
    editor.call('layout.left').append(hierarchyOverlay);

    var p = new ui.Progress();
    p.on('progress:100', function() {
        hierarchyOverlay.hidden = true;
    });
    hierarchyOverlay.append(p);
    p.hidden = true;

    var loadedEntities = false;

    editor.method('entities:loaded', function() {
        return loadedEntities;
    });

    editor.on('scene:raw', function(data) {
        editor.call('selector:clear');
        editor.call('entities:clear');
        editor.call('attributes:clear');

        var total = Object.keys(data.entities).length;
        var i = 0;

        // list
        for(var key in data.entities) {
            editor.call('entities:add',  new Observer(data.entities[key]));
            p.progress = (++i / total) * 0.8 + 0.1;
        }

        p.progress = 1;

        loadedEntities = true;
        editor.emit('entities:load');
    });

    editor.on('realtime:disconnected', function() {
        editor.call('selector:clear');
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.call('attributes:clear');

    editor.on('scene:unload', function () {
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.on('scene:beforeload', function () {
        hierarchyOverlay.hidden = false;
        p.hidden = false;
        p.progress = 0.1;
    });
});

