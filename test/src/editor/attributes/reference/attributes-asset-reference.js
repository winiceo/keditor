/* editor/attributes/reference/attributes-asset-reference.js */
editor.once('load', function() {
    'use strict';

    var fields = [{
        title: 'id',
        subTitle: '{Number}',
        description: 'Unique identifier of an Asset.',
        url: 'http://developer.playcanvas.com/api/pc.Asset.html'
    }, {
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the asset.',
        url: 'http://developer.playcanvas.com/api/pc.Asset.html#name'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of the asset. One of: animation, audio, image, json, material, model, text, texture.',
        url: 'http://developer.playcanvas.com/api/pc.Asset.html#type'
    }, {
        name: 'size',
        description: 'Size of an asset. Keeping this value as tiny as possible will lead to faster application loading and less bandwidth required to launch the app.'
    }, {
        title: 'tags',
        subTitle: '{pc.Tags}',
        description: 'Interface for tagging assets. Allows to find assets by tags using app.assets.findByTag method.',
        url: 'http://developer.playcanvas.com/api/pc.Asset.html#tags'
    }, {
        name: 'runtime',
        description: 'If this asset is runtime-friendly and can be used within the app.'
    }, {
        title: 'preload',
        subTitle: '{Boolean}',
        description: 'If true the asset will be loaded during the preload phase of application set up.',
        url: 'http://developer.playcanvas.com/api/pc.Asset.html#preload'
    }, {
        name: 'source',
        description: 'Reference to another asset where this asset were imported from.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});

