/* editor/attributes/reference/attributes-asset-text-reference.js */
editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'TEXT',
        subTitle: '{String}',
        description: 'String data to be used in application.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:text:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});

