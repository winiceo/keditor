/* array.js */
Object.defineProperty(Array.prototype, 'equals', {
    enumerable: false,
    value: function(array) {
        if (! array)
            return false;

        if (this.length !== array.length)
            return false;

        for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] instanceof Array && array[i] instanceof Array) {
                if (! this[i].equals(array[i]))
                    return false;
            } else if (this[i] !== array[i]) {
                return false;
            }
        }
        return true;
    }
});

Object.defineProperty(Array.prototype, 'match', {
    enumerable: false,
    value: function(pattern) {
        if (this.length !== pattern.length)
            return;

        for(var i = 0, l = this.length; i < l; i++) {
            if (pattern[i] !== '*' && pattern[i] !== this[i])
                return false;
        }

        return true;
    }
});


Array.prototype.binaryIndexOf = function(b) {
    var min = 0;
    var max = this.length - 1;
    var cur;
    var a;

    while (min <= max) {
        cur = Math.floor((min + max) / 2);
        a = this[cur];

        if (a < b) {
            min = cur + 1;
        } else if (a > b) {
            max = cur - 1;
        } else {
            return cur;
        }
    }

    return -1;
};


/* utils.js */
var utils = { };


// utils.deepCopy
utils.deepCopy = function deepCopy(data) {
    if (data == null || typeof(data) !== 'object')
        return data;

    if (data instanceof Array) {
        var arr = [ ];
        for(var i = 0; i < data.length; i++) {
            arr[i] = deepCopy(data[i]);
        }
        return arr;
    } else {
        var obj = { };
        for(var key in data) {
            if (data.hasOwnProperty(key))
                obj[key] = deepCopy(data[key]);
        }
        return obj;
    }
};


// String.startsWith
if (! String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(str) {
            var that = this;
            var ceil = str.length;
            for(var i = 0; i < ceil; i++)
                if(that[i] !== str[i]) return false;
            return true;
        }
    });
}

// String.endsWith polyfill
if (! String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(str) {
            var that = this;
            for(var i = 0, ceil = str.length; i < ceil; i++)
                if (that[i + that.length - ceil] !== str[i])
                    return false;
            return true;
        }
    });
}

// element.classList.add polyfill
(function () {
    /*global DOMTokenList */
    var dummy  = document.createElement('div'),
        dtp    = DOMTokenList.prototype,
        toggle = dtp.toggle,
        add    = dtp.add,
        rem    = dtp.remove;

    dummy.classList.add('class1', 'class2');

    // Older versions of the HTMLElement.classList spec didn't allow multiple
    // arguments, easy to test for
    if (!dummy.classList.contains('class2')) {
        dtp.add    = function () {
            Array.prototype.forEach.call(arguments, add.bind(this));
        };
        dtp.remove = function () {
            Array.prototype.forEach.call(arguments, rem.bind(this));
        };
    }
})();

var bytesToHuman = function(bytes) {
    if (isNaN(bytes) || bytes === 0) return '0 B';
    var k = 1000;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
};


/* color.js */
var rgb2hsv = function(rgb) {
    var rr, gg, bb,
        r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c) {
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = (1 / 3) + rr - bb;
        } else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return [ h, s, v ];
};


var hsv2rgb = function(hsv) {
    var h = hsv[0];
    var s = hsv[1];
    var v = hsv[2];
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
};


/* ajax.js */
function Ajax(args) {
    if (typeof(args) === 'string')
        args = { url: args };

    return new AjaxRequest(args);
};

Ajax.get = function(url) {
    return new AjaxRequest({
        url: url
    });
};

Ajax.post = function(url, data) {
    return new AjaxRequest({
        method: 'POST',
        url: url,
        data: data
    });
};

Ajax.put = function(url, data) {
    return new AjaxRequest({
        method: 'PUT',
        url: url,
        data: data
    });
};

Ajax.delete = function(url) {
    return new AjaxRequest({
        method: 'DELETE',
        url: url
    });
};

Ajax.params = { };

Ajax.param = function(name, value) {
    Ajax.params[name] = value;
};



function AjaxRequest(args) {
    if (! args)
        throw new Error('no arguments provided');

    Events.call(this);

    // progress
    this._progress = 0.0;
    this.emit('progress', this._progress);

    // xhr
    this._xhr = new XMLHttpRequest();

    // events
    this._xhr.addEventListener('load', this._onLoad.bind(this), false);
    // this._xhr.addEventListener('progress', this._onProgress.bind(this), false);
    this._xhr.upload.addEventListener('progress', this._onProgress.bind(this), false);
    this._xhr.addEventListener('error', this._onError.bind(this), false);
    this._xhr.addEventListener('abort', this._onAbort.bind(this), false);

    // url
    var url = args.url;

    // query
    if (args.query && Object.keys(args.query).length) {
        if (url.indexOf('?') === -1) {
            url += '?';
        }

        var query = [ ];
        for(var key in args.query) {
            query.push(key + '=' + args.query[key]);
        }

        url += query.join('&');
    }

    // templating
    var parts = url.split('{{');
    if (parts.length > 1) {
        for(var i = 1; i < parts.length; i++) {
            var ends = parts[i].indexOf('}}');
            var key = parts[i].slice(0, ends);

            if (Ajax.params[key] === undefined)
                continue;

            // replace
            parts[i] = Ajax.params[key] + parts[i].slice(ends + 2);
        }

        url = parts.join('');
    }

    // open request
    this._xhr.open(args.method || 'GET', url, true);

    this.notJson = args.notJson || false;

    // header for PUT/POST
    if (! args.ignoreContentType && (args.method === 'PUT' || args.method === 'POST' || args.method === 'DELETE'))
        this._xhr.setRequestHeader('Content-Type', 'application/json');

    if (args.auth && config.accessToken) {
        this._xhr.setRequestHeader('Authorization', 'Bearer ' + config.accessToken);
    }

    if (args.headers) {
        for (var key in args.headers)
            this._xhr.setRequestHeader(key, args.headers[key]);
    }

    // stringify data if needed
    if (args.data && typeof(args.data) !== 'string' && ! (args.data instanceof FormData)) {
        args.data = JSON.stringify(args.data);
    }

    // make request
    this._xhr.send(args.data || null);
};
AjaxRequest.prototype = Object.create(Events.prototype);


AjaxRequest.prototype._onLoad = function() {
    this._progress = 1.0;
    this.emit('progress', 1.0);

    if (this._xhr.status === 200 || this._xhr.status === 201) {
        if (this.notJson) {
            this.emit('load', this._xhr.status, this._xhr.responseText);
        } else {
            try {
                var json = JSON.parse(this._xhr.responseText);
            } catch(ex) {
                this.emit('error', this._xhr.status || 0, new Error('invalid json'));
                return;
            }
            this.emit('load', this._xhr.status, json);
        }
    } else {
        try {
            var json = JSON.parse(this._xhr.responseText);
            var msg = json.message;
            if (! msg) {
                msg = json.error || (json.response && json.response.error);
            }

            if (! msg) {
                msg = this._xhr.responseText;
            }

            this.emit('error', this._xhr.status, msg);
        } catch (ex) {
            this.emit('error', this._xhr.status);
        }
    }
};


AjaxRequest.prototype._onError = function(evt) {
    this.emit('error', 0, evt);
};


AjaxRequest.prototype._onAbort = function(evt) {
    this.emit('error', 0, evt);
};


AjaxRequest.prototype._onProgress = function(evt) {
    if (! evt.lengthComputable)
        return;

    var progress = evt.loaded / evt.total;

    if (progress !== this._progress) {
        this._progress = progress;
        this.emit('progress', this._progress);
    }
};


AjaxRequest.prototype.abort = function() {
    this._xhr.abort();
};


/* observer.js */
"use strict";

function Observer(data, options) {
    Events.call(this);
    options = options || { };

    this._destroyed = false;
    this._path = '';
    this._keys = [ ];
    this._data = { };

    this.patch(data);

    this._parent = options.parent || null;
    this._parentPath = options.parentPath || '';
    this._parentField = options.parentField || null;
    this._parentKey = options.parentKey || null;

    this._silent = false;

    var propagate = function(evt) {
        return function(path, arg1, arg2, arg3) {
            if (! this._parent)
                return;

            var key = this._parentKey;
            if (! key && (this._parentField instanceof Array)) {
                key = this._parentField.indexOf(this);

                if (key === -1)
                    return;
            }

            path = this._parentPath + '.' + key + '.' + path;

            var state;
            if (this._silent)
                state = this._parent.silence();

            this._parent.emit(path + ':' + evt, arg1, arg2, arg3);
            this._parent.emit('*:' + evt, path, arg1, arg2, arg3);

            if (this._silent)
                this._parent.silenceRestore(state);
        }
    };

    // propagate set
    this.on('*:set', propagate('set'));
    this.on('*:unset', propagate('unset'));
    this.on('*:insert', propagate('insert'));
    this.on('*:remove', propagate('remove'));
    this.on('*:move', propagate('move'));
}
Observer.prototype = Object.create(Events.prototype);


Observer.prototype.silence = function() {
    this._silent = true;

    // history hook to prevent array values to be recorded
    var historyState = this.history && this.history.enabled;
    if (historyState)
        this.history.enabled = false;

    // sync hook to prevent array values to be recorded as array root already did
    var syncState = this.sync && this.sync.enabled;
    if (syncState)
        this.sync.enabled = false;

    return [ historyState, syncState ];
};


Observer.prototype.silenceRestore = function(state) {
    this._silent = false;

    if (state[0])
        this.history.enabled = true;

    if (state[1])
        this.sync.enabled = true;
};


Observer.prototype._prepare = function(target, key, value, silent) {
    var self = this;
    var state;
    var path = (target._path ? (target._path + '.') : '') + key;
    var type = typeof(value);

    target._keys.push(key);

    if (type === 'object' && (value instanceof Array)) {
        target._data[key] = value.slice(0);

        for(var i = 0; i < target._data[key].length; i++) {
            if (typeof(target._data[key][i]) === 'object' && target._data[key][i] !== null) {
                if (target._data[key][i] instanceof Array) {
                    target._data[key][i].slice(0);
                } else {
                    target._data[key][i] = new Observer(target._data[key][i], {
                        parent: this,
                        parentPath: path,
                        parentField: target._data[key],
                        parentKey: null
                    });
                }
            } else {
                state = this.silence();
                this.emit(path + '.' + i + ':set', target._data[key][i], null);
                this.emit('*:set', path + '.' + i, target._data[key][i], null);
                this.silenceRestore(state);
            }
        }

        if (silent)
            state = this.silence();

        this.emit(path + ':set', target._data[key], null);
        this.emit('*:set', path, target._data[key], null);

        if (silent)
            this.silenceRestore(state);
    } else if (type === 'object' && (value instanceof Object)) {
        if (typeof(target._data[key]) !== 'object') {
            target._data[key] = {
                _path: path,
                _keys: [ ],
                _data: { }
            };
        }

        for(var i in value) {
            if (typeof(value[i]) === 'object') {
                this._prepare(target._data[key], i, value[i], true);
            } else {
                state = this.silence();

                target._data[key]._data[i] = value[i];
                target._data[key]._keys.push(i);

                this.emit(path + '.' + i + ':set', value[i], null);
                this.emit('*:set', path + '.' + i, value[i], null);

                this.silenceRestore(state);
            }
        }

        if (silent)
            state = this.silence();

        this.emit(path + ':set', value);
        this.emit('*:set', path, value);

        if (silent)
            this.silenceRestore(state);
    } else {
        if (silent)
            state = this.silence();

        target._data[key] = value;

        this.emit(path + ':set', value);
        this.emit('*:set', path, value);

        if (silent)
            this.silenceRestore(state);
    }

    return true;
};


Observer.prototype.set = function(path, value, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var nodePath = '';
    var obj = this;
    var state;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[keys[i]];

            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else {
            if (i < keys.length && typeof(node._data[keys[i]]) !== 'object') {
                if (node._data[keys[i]])
                    obj.unset((node.__path ? node.__path + '.' : '') + keys[i]);

                node._data[keys[i]] = {
                    _path: path,
                    _keys: [ ],
                    _data: { }
                };
                node._keys.push(keys[i]);
            }

            if (i === keys.length - 1 && node.__path)
                nodePath = node.__path + '.' + keys[i];

            node = node._data[keys[i]];
        }
    }

    if (node instanceof Array) {
        var ind = parseInt(key, 10);
        if (node[ind] === value)
            return;

        var valueOld = node[ind];
        if (! (valueOld instanceof Observer))
            valueOld = obj.json(valueOld);

        node[ind] = value;

        if (value instanceof Observer) {
            value._parent = obj;
            value._parentPath = nodePath;
            value._parentField = node;
            value._parentKey = null;
        }

        if (silent)
            state = obj.silence();

        obj.emit(path + ':set', value, valueOld);
        obj.emit('*:set', path, value, valueOld);

        if (silent)
            obj.silenceRestore(state);

        return true;
    } else if (node._data && ! node._data.hasOwnProperty(key)) {
        if (typeof(value) === 'object') {
            return obj._prepare(node, key, value);
        } else {
            node._data[key] = value;
            node._keys.push(key);

            if (silent)
                state = obj.silence();

            obj.emit(path + ':set', value, null);
            obj.emit('*:set', path, value, null);

            if (silent)
                obj.silenceRestore(state);

            return true;
        }
    } else {
        if (typeof(value) === 'object' && (value instanceof Array)) {
            if (value.equals(node._data[key]))
                return false;

            var valueOld = node._data[key];
            if (! (valueOld instanceof Observer))
                valueOld = obj.json(valueOld);

            if (node._data[key] && node._data[key].length === value.length) {
                state = obj.silence();

                for(var i = 0; i < node._data[key].length; i++) {
                    if (node._data[key][i] instanceof Observer) {
                        node._data[key][i].patch(value[i]);
                    } else if (node._data[key][i] !== value[i]) {
                        node._data[key][i] = value[i];
                        obj.emit(path + '.' + i + ':set', node._data[key][i], valueOld[i] || null);
                        obj.emit('*:set', path + '.' + i, node._data[key][i], valueOld[i] || null);
                    }
                }

                obj.silenceRestore(state);
            } else {
                node._data[key] = value;

                state = obj.silence();
                for(var i = 0; i < node._data[key].length; i++) {
                    obj.emit(path + '.' + i + ':set', node._data[key][i], valueOld[i] || null);
                    obj.emit('*:set', path + '.' + i, node._data[key][i], valueOld[i] || null);
                }
                obj.silenceRestore(state);
            }

            if (silent)
                state = obj.silence();

            obj.emit(path + ':set', value, valueOld);
            obj.emit('*:set', path, value, valueOld);

            if (silent)
                obj.silenceRestore(state);

            return true;
        } else if (typeof(value) === 'object' && (value instanceof Object)) {
            var changed = false;
            var valueOld = node._data[key];
            if (! (valueOld instanceof Observer))
                valueOld = obj.json(valueOld);

            var keys = Object.keys(value);

            if (! node._data[key] || ! node._data[key]._data) {
                if (node._data[key])
                    obj.unset((node.__path ? node.__path + '.' : '') + key);

                node._data[key] = {
                    _path: path,
                    _keys: [ ],
                    _data: { }
                };
            }

            for(var n in node._data[key]._data) {
                if (! value.hasOwnProperty(n)) {
                    var c = obj.unset(path + '.' + n, true);
                    if (c) changed = true;
                } else if (node._data[key]._data.hasOwnProperty(n)) {
                    if (! obj._equals(node._data[key]._data[n], value[n])) {
                        var c = obj.set(path + '.' + n, value[n], true);
                        if (c) changed = true;
                    }
                } else {
                    var c = obj._prepare(node._data[key], n, value[n], true);
                    if (c) changed = true;
                }
            }

            for(var i = 0; i < keys.length; i++) {
                if (value[keys[i]] === undefined && node._data[key]._data.hasOwnProperty(keys[i])) {
                    var c = obj.unset(path + '.' + keys[i], true);
                    if (c) changed = true;
                } else if (typeof(value[keys[i]]) === 'object') {
                    if (node._data[key]._data.hasOwnProperty(keys[i])) {
                        var c = obj.set(path + '.' + keys[i], value[keys[i]], true);
                        if (c) changed = true;
                    } else {
                        var c = obj._prepare(node._data[key], keys[i], value[keys[i]], true);
                        if (c) changed = true;
                    }
                } else if (! obj._equals(node._data[key]._data[keys[i]], value[keys[i]])) {
                    if (typeof(value[keys[i]]) === 'object') {
                        var c = obj.set(node._data[key]._path + '.' + keys[i], value[keys[i]], true);
                        if (c) changed = true;
                    } else if (node._data[key]._data[keys[i]] !== value[keys[i]]) {
                        changed = true;

                        if (node._data[key]._keys.indexOf(keys[i]) === -1)
                            node._data[key]._keys.push(keys[i]);

                        node._data[key]._data[keys[i]] = value[keys[i]];

                        state = obj.silence();
                        obj.emit(node._data[key]._path + '.' + keys[i] + ':set', node._data[key]._data[keys[i]], null);
                        obj.emit('*:set', node._data[key]._path + '.' + keys[i], node._data[key]._data[keys[i]], null);
                        obj.silenceRestore(state);
                    }
                }
            }

            if (changed) {
                if (silent)
                    state = obj.silence();

                var val = obj.json(node._data[key]);

                obj.emit(node._data[key]._path + ':set', val, valueOld);
                obj.emit('*:set', node._data[key]._path, val, valueOld);

                if (silent)
                    obj.silenceRestore(state);

                return true;
            } else {
                return false;
            }
        } else {
            var data;
            if (! node.hasOwnProperty('_data') && node.hasOwnProperty(key)) {
                data = node;
            } else {
                data = node._data;
            }

            if (data[key] === value)
                return false;

            if (silent)
                state = obj.silence();

            var valueOld = data[key];
            if (! (valueOld instanceof Observer))
                valueOld = obj.json(valueOld);

            data[key] = value;

            obj.emit(path + ':set', value, valueOld);
            obj.emit('*:set', path, value, valueOld);

            if (silent)
                obj.silenceRestore(state);

            return true;
        }
    }

    return false;
};


Observer.prototype.has = function(path) {
    var keys = path.split('.');
    var node = this;
    for (var i = 0; i < keys.length; i++) {
        if (node == undefined)
            return undefined;

        if (node._data) {
            node = node._data[keys[i]];
        } else {
            node = node[keys[i]];
        }
    }

    return node !== undefined;
};


Observer.prototype.get = function(path, raw) {
    var keys = path.split('.');
    var node = this;
    for (var i = 0; i < keys.length; i++) {
        if (node == undefined)
            return undefined;

        if (node._data) {
            node = node._data[keys[i]];
        } else {
            node = node[keys[i]];
        }
    }

    if (raw)
        return node;

    if (node == null) {
        return null;
    } else {
        return this.json(node);
    }
};


Observer.prototype.getRaw = function(path) {
    return this.get(path, true);
};


Observer.prototype._equals = function(a, b) {
    if (a === b) {
        return true;
    } else if (a instanceof Array && b instanceof Array && a.equals(b)) {
        return true;
    } else {
        return false;
    }
};


Observer.prototype.unset = function(path, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[keys[i]];
            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else {
            node = node._data[keys[i]];
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key))
        return false;

    var valueOld = node._data[key];
    if (! (valueOld instanceof Observer))
        valueOld = obj.json(valueOld);

    // recursive
    if (node._data[key] && node._data[key]._data) {
        for(var i = 0; i < node._data[key]._keys.length; i++) {
            obj.unset(path + '.' + node._data[key]._keys[i], true);
        }
    }

    node._keys.splice(node._keys.indexOf(key), 1);
    delete node._data[key];

    var state;
    if (silent)
        state = obj.silence();

    obj.emit(path + ':unset', valueOld);
    obj.emit('*:unset', path, valueOld);

    if (silent)
        obj.silenceRestore(state);

    return true;
};


Observer.prototype.remove = function(path, ind, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[parseInt(keys[i], 10)];
            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];
    if (arr.length < ind)
        return;

    var value = arr[ind];
    if (value instanceof Observer) {
        value._parent = null;
    } else {
        value = obj.json(value);
    }

    arr.splice(ind, 1);

    var state;
    if (silent)
        state = obj.silence();

    obj.emit(path + ':remove', value, ind);
    obj.emit('*:remove', path, value, ind);

    if (silent)
        obj.silenceRestore(state);

    return true;
};


Observer.prototype.removeValue = function(path, value, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[parseInt(keys[i], 10)];
            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    var ind = arr.indexOf(value);
    if (ind === -1)
        return;

    if (arr.length < ind)
        return;

    var value = arr[ind];
    if (value instanceof Observer) {
        value._parent = null;
    } else {
        value = obj.json(value);
    }

    arr.splice(ind, 1);

    var state;
    if (silent)
        state = obj.silence();

    obj.emit(path + ':remove', value, ind);
    obj.emit('*:remove', path, value, ind);

    if (silent)
        obj.silenceRestore(state);

    return true;
};


Observer.prototype.insert = function(path, value, ind, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[parseInt(keys[i], 10)];
            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    if (typeof(value) === 'object' && ! (value instanceof Observer)) {
        if (value instanceof Array) {
            value = value.slice(0);
        } else {
            value = new Observer(value);
        }
    }

    if (arr.indexOf(value) !== -1)
        return;

    if (ind === undefined) {
        arr.push(value);
        ind = arr.length - 1;
    } else {
        arr.splice(ind, 0, value);
    }

    if (value instanceof Observer) {
        value._parent = obj;
        value._parentPath = node._path + '.' + key;
        value._parentField = arr;
        value._parentKey = null;
    } else {
        value = obj.json(value);
    }

    var state;
    if (silent)
        state = obj.silence();

    obj.emit(path + ':insert', value, ind);
    obj.emit('*:insert', path, value, ind);

    if (silent)
        obj.silenceRestore(state);

    return true;
};


Observer.prototype.move = function(path, indOld, indNew, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[parseInt(keys[i], 10)];
            if (node instanceof Observer) {
                path = keys.slice(i + 1).join('.');
                obj = node;
            }
        } else if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    if (arr.length < indOld || arr.length < indNew || indOld === indNew)
        return;

    var value = arr[indOld];

    arr.splice(indOld, 1);

    if (indNew === -1)
        indNew = arr.length;

    arr.splice(indNew, 0, value);

    if (! (value instanceof Observer))
        value = obj.json(value);

    var state;
    if (silent)
        state = obj.silence();

    obj.emit(path + ':move', value, indNew, indOld);
    obj.emit('*:move', path, value, indNew, indOld);

    if (silent)
        obj.silenceRestore(state);

    return true;
};


Observer.prototype.patch = function(data) {
    if (typeof(data) !== 'object')
        return;

    for(var key in data) {
        if (typeof(data[key]) === 'object' && ! this._data.hasOwnProperty(key)) {
            this._prepare(this, key, data[key]);
        } else if (this._data[key] !== data[key]) {
            this.set(key, data[key]);
        }
    }
};


Observer.prototype.json = function(target) {
    var obj = { };
    var node = target === undefined ? this : target;

    if (node instanceof Object && node._keys) {
        for (var i = 0; i < node._keys.length; i++) {
            var key = node._keys[i];
            var value = node._data[key];
            var type = typeof(value);

            if (type === 'object' && (value instanceof Array)) {
                obj[key] = value.slice(0);

                for(var n = 0; n < obj[key].length; n++) {
                    if (typeof(obj[key][n]) === 'object')
                        obj[key][n] = this.json(obj[key][n]);
                }
            } else if (type === 'object' && (value instanceof Object)) {
                obj[key] = this.json(value);
            } else {
                obj[key] = value;
            }
        }
    } else {
        if (node === null) {
            return null;
        } else if (typeof(node) === 'object' && (node instanceof Array)) {
            obj = node.slice(0);

            for(var n = 0; n < obj.length; n++) {
                obj[n] = this.json(obj[n]);
            }
        } else if (typeof(node) === 'object') {
            for(var key in node) {
                if (node.hasOwnProperty(key))
                    obj[key] = node[key];
            }
        } else {
            obj = node;
        }
    }
    return obj;
};


Observer.prototype.forEach = function(fn, target, path) {
    var node = target || this;
    path = path || '';

    for (var i = 0; i < node._keys.length; i++) {
        var key = node._keys[i];
        var value = node._data[key];
        var type = (this.schema && this.schema.has(path + key) && this.schema.get(path + key).type.name.toLowerCase()) || typeof(value);

        if (type === 'object' && (value instanceof Array)) {
            fn(path + key, 'array', value, key);
        } else if (type === 'object' && (value instanceof Object)) {
            fn(path + key, 'object', value, key);
            this.forEach(fn, value, path + key + '.');
        } else {
            fn(path + key, type, value, key);
        }
    }
};


Observer.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.emit('destroy');
    this.unbind();
};


/* observer-list.js */
"use strict";

function ObserverList(options) {
    Events.call(this);
    options = options || { };

    this.data = [ ];
    this._indexed = { };
    this.sorted = options.sorted || null;
    this.index = options.index || null;
}

ObserverList.prototype = Object.create(Events.prototype);


Object.defineProperty(ObserverList.prototype, 'length', {
    get: function() {
        return this.data.length;
    }
});


ObserverList.prototype.get = function(index) {
    if (this.index) {
        return this._indexed[index] || null;
    } else {
        return this.data[index] || null;
    }
};


ObserverList.prototype.set = function(index, value) {
    if (this.index) {
        this._indexed[index] = value;
    } else {
        this.data[index] = value;
    }
};


ObserverList.prototype.indexOf = function(item) {
    if (this.index) {
        var index = (item instanceof Observer && item.get(this.index)) || item[this.index]
        return (this._indexed[index] && index) || null;
    } else {
        var ind = this.data.indexOf(item);
        return ind !== -1 ? ind : null;
    }
};


ObserverList.prototype.position = function(b, fn) {
    var l = this.data;
    var min = 0;
    var max = l.length - 1;
    var cur;
    var a, i;
    fn = fn || this.sorted;

    while (min <= max) {
        cur = Math.floor((min + max) / 2);
        a = l[cur];

        i = fn(a, b);

        if (i === 1) {
            max = cur - 1;
        } else if (i === -1) {
            min = cur + 1;
        } else {
            return cur;
        }
    }

    return -1;
};


ObserverList.prototype.positionNextClosest = function(b, fn) {
    var l = this.data;
    var min = 0;
    var max = l.length - 1;
    var cur;
    var a, i;
    fn = fn || this.sorted;

    if (l.length === 0)
        return -1;

    if (fn(l[0], b) === 0)
        return 0;

    while (min <= max) {
        cur = Math.floor((min + max) / 2);
        a = l[cur];

        i = fn(a, b);

        if (i === 1) {
            max = cur - 1;
        } else if (i === -1) {
            min = cur + 1;
        } else {
            return cur;
        }
    }

    if (fn(a, b) === 1)
        return cur;

    if ((cur + 1) === l.length)
        return -1;

    return cur + 1;
};


ObserverList.prototype.has = function(item) {
    if (this.index) {
        var index = (item instanceof Observer && item.get(this.index)) || item[this.index]
        return !! this._indexed[index];
    } else {
        return this.data.indexOf(item) !== -1;
    }
};


ObserverList.prototype.add = function(item) {
    if (this.has(item))
        return null;

    var index = this.data.length;
    if (this.index) {
        index = (item instanceof Observer && item.get(this.index)) || item[this.index];
        this._indexed[index] = item;
    }

    var pos = 0;

    if (this.sorted) {
        pos = this.positionNextClosest(item);
        if (pos !== -1) {
            this.data.splice(pos, 0, item);
        } else {
            this.data.push(item);
        }
    } else {
        this.data.push(item);
        pos = this.data.length - 1;
    }

    this.emit('add', item, index);

    return pos;
};


ObserverList.prototype.move = function(item, pos) {
    var ind = this.data.indexOf(item);
    this.data.splice(ind, 1);
    if (pos === -1) {
        this.data.push(item);
    } else {
        this.data.splice(pos, 0, item);
    }
};


ObserverList.prototype.remove = function(item) {
    if (! this.has(item))
        return;

    var ind = this.data.indexOf(item);

    var index = ind;
    if (this.index) {
        index = (item instanceof Observer && item.get(this.index)) || item[this.index];
        delete this._indexed[index];
    }

    this.data.splice(ind, 1);

    this.emit('remove', item, index);
};


ObserverList.prototype.removeByKey = function(index) {
    if (this.index) {
        var item = this._indexed[index];

        if (! item)
            return;

        var ind = this.data.indexOf(item);
        this.data.splice(ind, 1);

        delete this._indexed[index];

        this.emit('remove', item, ind);
    } else {
        if (this.data.length < index)
            return;

        var item = this.data[index];

        this.data.splice(index, 1);

        this.emit('remove', item, index);
    }
};


ObserverList.prototype.removeBy = function(fn) {
    var i = this.data.length;
    while(i--) {
        if (! fn(this.data[i]))
            continue;

        if (this.index) {
            delete this._indexed[this.data[i][this.index]];
        }
        this.data.splice(i, 1);

        this.emit('remove', this.data[i], i);
    }
};


ObserverList.prototype.clear = function() {
    var items = this.data.slice(0);

    this.data = [ ];
    this._indexed = { };

    var i = items.length;
    while(i--) {
        this.emit('remove', items[i], i);
    }
};


ObserverList.prototype.forEach = function(fn) {
    for(var i = 0; i < this.data.length; i++) {
        fn(this.data[i], (this.index && this.data[i][this.index]) || i);
    }
};


ObserverList.prototype.find = function(fn) {
    var items = [ ];
    for(var i = 0; i < this.data.length; i++) {
        if (! fn(this.data[i]))
            continue;

        var index = i;
        if (this.index)
            index = this.data[i][this.index];

        items.push([ index, this.data[i] ]);
    }
    return items;
};


ObserverList.prototype.findOne = function(fn) {
    for(var i = 0; i < this.data.length; i++) {
        if (! fn(this.data[i]))
            continue;

        var index = i;
        if (this.index)
            index = this.data[i][this.index];

        return [ index, this.data[i] ];
    }
    return null;
};


ObserverList.prototype.map = function(fn) {
    return this.data.map(fn);
};


ObserverList.prototype.sort = function(fn) {
    this.data.sort(fn);
};


ObserverList.prototype.array = function() {
    return this.data.slice(0);
};


ObserverList.prototype.json = function() {
    var items = this.array();
    for(var i = 0; i < items.length; i++) {
        if (items[i] instanceof Observer) {
            items[i] = items[i].json();
        }
    }
    return items;
};


/* observer-sync.js */
function ObserverSync(args) {
    Events.call(this);
    args = args || { };

    this.item = args.item;
    this._enabled = args.enabled || true;
    this._prefix = args.prefix || [ ];
    this._paths = args.paths || null;
    this._sync = args.sync || true;

    this._initialize();
}
ObserverSync.prototype = Object.create(Events.prototype);


ObserverSync.prototype._initialize = function() {
    var self = this;
    var item = this.item;

    // object/array set
    item.on('*:set', function(path, value, valueOld) {
        if (! self._enabled) return;

        // check if path is allowed
        if (self._paths) {
            var allowedPath = false;
            for(var i = 0; i < self._paths.length; i++) {
                if (path.indexOf(self._paths[i]) !== -1) {
                    allowedPath = true;
                    break;
                }
            }

            // path is not allowed
            if (! allowedPath)
                return;
        }

        // full path
        var p = self._prefix.concat(path.split('.'));

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        // can be array value
        var ind = path.lastIndexOf('.');
        if (ind !== -1 && (this.get(path.slice(0, ind)) instanceof Array)) {
            // array index should be int
            p[p.length - 1] = parseInt(p[p.length - 1], 10);

            // emit operation: list item set
            self.emit('op', {
                p: p,
                li: value,
                ld: valueOld
            });
        } else {
            // emit operation: object item set
            var obj = {
                p: p,
                oi: value
            };

            if (valueOld !== undefined) {
                obj.od = valueOld;
            }

            self.emit('op', obj);
        }
    });

    // unset
    item.on('*:unset', function(path, value) {
        if (! self._enabled) return;

        self.emit('op', {
            p: self._prefix.concat(path.split('.')),
            od: null
        });
    });

    // list move
    item.on('*:move', function(path, value, ind, indOld) {
        if (! self._enabled) return;
        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([ indOld ]),
            lm: ind
        });
    });

    // list remove
    item.on('*:remove', function(path, value, ind) {
        if (! self._enabled) return;

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([ ind ]),
            ld: value
        });
    });

    // list insert
    item.on('*:insert', function(path, value, ind) {
        if (! self._enabled) return;

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([ ind ]),
            li: value
        });
    });
};


ObserverSync.prototype.write = function(op) {
    // disable history if available
    var historyReEnable = false;
    if (this.item.history && this.item.history.enabled) {
        historyReEnable = true;
        this.item.history.enabled = false;
    }

    if (op.hasOwnProperty('oi')) {
        // set key value
        var path = op.p.slice(this._prefix.length).join('.');

        this._enabled = false;
        this.item.set(path, op.oi);
        this._enabled = true;


    } else if (op.hasOwnProperty('ld') && op.hasOwnProperty('li')) {
        // set array value
        var path = op.p.slice(this._prefix.length).join('.');

        this._enabled = false;
        this.item.set(path, op.li);
        this._enabled = true;


    } else if (op.hasOwnProperty('ld')) {
        // delete item
        var path = op.p.slice(this._prefix.length, -1).join('.');

        this._enabled = false;
        this.item.remove(path, op.p[op.p.length - 1]);
        this._enabled = true;


    } else if (op.hasOwnProperty('li')) {
        // add item
        var path = op.p.slice(this._prefix.length, -1).join('.');
        var ind = op.p[op.p.length - 1];

        this._enabled = false;
        this.item.insert(path, op.li, ind);
        this._enabled = true;


    } else if (op.hasOwnProperty('lm')) {
        // item moved
        var path = op.p.slice(this._prefix.length, -1).join('.');
        var indOld = op.p[op.p.length - 1];
        var ind = op.lm;

        this._enabled = false;
        this.item.move(path, indOld, ind);
        this._enabled = true;


    } else if (op.hasOwnProperty('od')) {
        // unset key value
        var path = op.p.slice(this._prefix.length).join('.');
        this._enabled = false;
        this.item.unset(path);
        this._enabled = true;


    } else {
        console.log('unknown operation', op);
    }

    // reenable history
    if (historyReEnable)
        this.item.history.enabled = true;

    this.emit('sync', op);
};

Object.defineProperty(ObserverSync.prototype, 'enabled', {
    get: function() {
        return this._enabled;
    },
    set: function(value) {
        this._enabled = !! value;
    }
});

Object.defineProperty(ObserverSync.prototype, 'prefix', {
    get: function() {
        return this._prefix;
    },
    set: function(value) {
        this._prefix = value || [ ];
    }
});

Object.defineProperty(ObserverSync.prototype, 'paths', {
    get: function() {
        return this._paths;
    },
    set: function(value) {
        this._paths = value || null;
    }
});


/* observer-history.js */
function ObserverHistory(args) {
    Events.call(this);
    args = args || { };

    this.item = args.item;
    this._enabled = args.enabled || true;
    this._combine = args._combine || false;
    this._prefix = args.prefix || '';
    this._getItemFn = args.getItemFn;

    this._events = [];

    this._initialize();
}
ObserverHistory.prototype = Object.create(Events.prototype);


ObserverHistory.prototype._initialize = function() {
    var self = this;

    this._events.push(this.item.on('*:set', function(path, value, valueOld) {
        if (! self._enabled) return;

        // need jsonify
        if (value instanceof Observer)
            value = value.json();

        // action
        var data = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;

                if (valueOld === undefined) {
                    item.unset(path);
                } else {
                    item.set(path, valueOld);
                }

                item.history.enabled = true;
            },
            redo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;

                if (value === undefined) {
                    item.unset(path);
                } else {
                    item.set(path, value);
                }

                item.history.enabled = true;
            }
        };

        if (data.combine && editor.call('history:canUndo') && editor.call('history:list')[editor.call('history:current')].name === data.name) {
            // update
            self.emit('record', 'update', data);
        } else {
            // add
            self.emit('record', 'add', data);
        }
    }));

    this._events.push(this.item.on('*:unset', function(path, valueOld) {
        if (! self._enabled) return;

        // action
        var data = {
            name: self._prefix + path,
            undo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.set(path, valueOld);
                item.history.enabled = true;
            },
            redo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.unset(path);
                item.history.enabled = true;
            }
        };

        self.emit('record', 'add', data);
    }));

    this._events.push(this.item.on('*:insert', function(path, value, ind) {
        if (! self._enabled) return;

        // need jsonify
        // if (value instanceof Observer)
        //     value = value.json();

        // action
        var data = {
            name: self._prefix + path,
            undo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.removeValue(path, value);
                item.history.enabled = true;
            },
            redo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.insert(path, value, ind);
                item.history.enabled = true;
            }
        };

        self.emit('record', 'add', data);
    }));

    this._events.push(this.item.on('*:remove', function(path, value, ind) {
        if (! self._enabled) return;

        // need jsonify
        // if (value instanceof Observer)
        //     value = value.json();

        // action
        var data = {
            name: self._prefix + path,
            undo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.insert(path, value, ind);
                item.history.enabled = true;
            },
            redo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.removeValue(path, value);
                item.history.enabled = true;
            }
        };

        self.emit('record', 'add', data);
    }));

    this._events.push(this.item.on('*:move', function(path, value, ind, indOld) {
        if (! self._enabled) return;

        // action
        var data = {
            name: self._prefix + path,
            undo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.move(path, ind, indOld);
                item.history.enabled = true;
            },
            redo: function() {
                var item = self._getItemFn();
                if (! item) return;

                item.history.enabled = false;
                item.move(path, indOld, ind);
                item.history.enabled = true;
            }
        };

        self.emit('record', 'add', data);
    }));
};

ObserverHistory.prototype.destroy = function () {
    this._events.forEach(function (evt) {
        evt.unbind();
    });

    this._events.length = 0;
    this.item = null;
};

Object.defineProperty(ObserverHistory.prototype, 'enabled', {
    get: function() {
        return this._enabled;
    },
    set: function(value) {
        this._enabled = !! value;
    }
});


Object.defineProperty(ObserverHistory.prototype, 'prefix', {
    get: function() {
        return this._prefix;
    },
    set: function(value) {
        this._prefix = value || '';
    }
});


Object.defineProperty(ObserverHistory.prototype, 'combine', {
    get: function() {
        return this._combine;
    },
    set: function(value) {
        this._combine = !! value;
    }
});


/* ui.js */
"use strict";

window.ui = { };


/* ui/element.js */
"use strict";

function Element() {
    Events.call(this);
    // this.parent = null;

    this._parent = null;
    var self = this;
    this._parentDestroy = function() {
        self.destroy();
    };

    this._destroyed = false;
    this._element = null;
    this._link = null;
    this.path = '';
    this._linkSet = null;
    this._linkUnset = null;
    this.renderChanges = null;
    // render changes only from next ticks
    setTimeout(function() {
        if (self.renderChanges === null)
            self.renderChanges = true;
    }, 0);

    this.disabledClick = false;
    this._disabled = false;
    this._disabledParent = false;

    this._evtClick = null;

    this._parentDisable = function() {
        if (self._disabledParent)
            return;

        self._disabledParent = true;

        if (! self._disabled) {
            self.emit('disable');
            self.class.add('disabled');
        }
    };
    this._parentEnable = function() {
        if (! self._disabledParent)
            return;

        self._disabledParent = false;

        if (! self._disabled) {
            self.emit('enable');
            self.class.remove('disabled');
        }
    };

    this._onFlashDelay = function() {
        self.class.remove('flash');
    };
}
Element.prototype = Object.create(Events.prototype);

Element.prototype.link = function(link, path) {
    var self = this;

    if (this._link) this.unlink();
    this._link = link;
    this.path = path;

    this.emit('link', path);

    // add :set link
    if (this._onLinkChange) {
        var renderChanges = this.renderChanges;
        this.renderChanges = false;
        this._linkOnSet = this._link.on(this.path + ':set', function(value) {
            self._onLinkChange(value);
        });
        this._linkOnUnset = this._link.on(this.path + ':unset', function(value) {
            self._onLinkChange(value);
        });
        this._onLinkChange(this._link.get(this.path));
        this.renderChanges = renderChanges;
    }
};

Element.prototype.unlink = function() {
    if (! this._link) return;

    this.emit('unlink', this.path);

    // remove :set link
    if (this._linkOnSet) {
        this._linkOnSet.unbind();
        this._linkOnSet = null;

        this._linkOnUnset.unbind();
        this._linkOnUnset = null;
    }

    this._link = null;
    this.path = '';
};

Element.prototype.destroy = function() {
    if (this._destroyed)
        return;

    this._destroyed = true;

    if (this._parent) {
        this._evtParentDestroy.unbind();
        this._evtParentDisable.unbind();
        this._evtParentEnable.unbind();
        this._parent = null;
    }

    if (this._element.parentNode)
        this._element.parentNode.removeChild(this._element);

    this.unlink();

    this.emit('destroy');

    this.unbind();
};

Object.defineProperty(Element.prototype, 'element', {
    get: function() {
        return this._element;
    },
    set: function(value) {
        if (this._element)
            return;

        this._element = value;
        this._element.ui = this;

        var self = this;
        this._evtClick = function(evt) {
            if (self.disabled && ! self.disabledClick) return;
            self.emit('click', evt);
        };
        this._element.addEventListener('click', this._evtClick, false);

        this._evtHover = function(evt) {
            self.emit('hover', evt);
        };
        this._element.addEventListener('mouseover', this._evtHover, false);

        this._evtBlur = function(evt) {
            self.emit('blur', evt);
        };
        this._element.addEventListener('mouseout', this._evtBlur, false);

        if (! this.innerElement)
            this.innerElement = this._element;
    }
});

Object.defineProperty(Element.prototype, 'parent', {
    get: function() {
        return this._parent;
    },
    set: function(value) {
        if (this._parent) {
            this._parent = null;
            this._evtParentDestroy.unbind();
            this._evtParentDisable.unbind();
            this._evtParentEnable.unbind();
        }

        if (value) {
            this._parent = value;
            this._evtParentDestroy = this._parent.once('destroy', this._parentDestroy);
            this._evtParentDisable = this._parent.on('disable', this._parentDisable);
            this._evtParentEnable = this._parent.on('enable', this._parentEnable);

            if (this._disabledParent !== this._parent.disabled) {
                this._disabledParent = this._parent.disabled;

                if (this._disabledParent) {
                    this.class.add('disabled');
                    this.emit('disable');
                } else {
                    this.class.remove('disabled');
                    this.emit('enable');
                }
            }
        }

        this.emit('parent');
    }
});

Object.defineProperty(Element.prototype, 'disabled', {
    get: function() {
        return this._disabled || this._disabledParent;
    },
    set: function(value) {
        if (this._disabled == value)
            return;

        this._disabled = !! value;
        this.emit((this._disabled || this._disabledParent) ? 'disable' : 'enable');

        if ((this._disabled || this._disabledParent)) {
            this.class.add('disabled');
        } else {
            this.class.remove('disabled');
        }
    }
});

Object.defineProperty(Element.prototype, 'disabledSelf', {
    get: function() {
        return this._disabled;
    }
});

Object.defineProperty(Element.prototype, 'enabled', {
    get: function() {
        return ! this._disabled;
    },
    set: function(value) {
        this.disabled = ! value;
    }
});

Object.defineProperty(Element.prototype, 'value', {
    get: function() {
        if (! this._link) return null;
        return this._link.get(this.path);
    },
    set: function(value) {
        if (! this._link) return;
        this._link.set(this.path, value);
    }
});


Object.defineProperty(Element.prototype, 'hidden', {
    get: function() {
        return this._element.classList.contains('hidden');
    },
    set: function(value) {
        if (this._element.classList.contains('hidden') === !! value)
            return;

        if (value) {
            this._element.classList.add('hidden');
            this.emit('hide');
        } else {
            this._element.classList.remove('hidden');
            this.emit('show');
        }
    }
});


Object.defineProperty(Element.prototype, 'style', {
    get: function() {
        return this._element.style;
    }
});


Object.defineProperty(Element.prototype, 'class', {
    get: function() {
        return this._element.classList;
    }
});


Object.defineProperty(Element.prototype, 'flexGrow', {
    get: function() {
        return this._element.style.flexGrow;
    },
    set: function(value) {
        this._element.style.flexGrow = value;
        this._element.style.WebkitFlexGrow = value;
    }
});


Object.defineProperty(Element.prototype, 'flexShrink', {
    get: function() {
        return this._element.style.flexShrink;
    },
    set: function(value) {
        this._element.style.flexShrink = value;
        this._element.style.WebkitFlexShrink = value;
    }
});


Element.prototype.flash = function() {
    this.class.add('flash');
    setTimeout(this._onFlashDelay, 200);
};


window.ui.Element = Element;


/* ui/container-element.js */
"use strict";

function ContainerElement() {
    var self = this;

    ui.Element.call(this);
    this._innerElement = null;

    this._observerChanged = false;

    var observerTimeout = function() {
        self._observerChanged = false;
        self.emit('nodesChanged');
    };

    this._observer = new MutationObserver(function() {
        if (self._observerChanged)
            return;

        self._observerChanged = true;

        setTimeout(observerTimeout, 0);
    });
}
ContainerElement.prototype = Object.create(ui.Element.prototype);


ContainerElement.prototype._observerOptions = {
    childList: true,
    attributes: true,
    characterData: false,
    subtree: true,
    attributeOldValue: false,
    characterDataOldValue: false
};


ContainerElement.prototype.append = function(element) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    this._innerElement.appendChild(node);

    if (! html) {
        element.parent = this;
        this.emit('append', element);
    }
};


ContainerElement.prototype.appendBefore = function(element, reference) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (reference instanceof ui.Element)
        reference = reference.element;

    this._innerElement.insertBefore(node, reference);

    if (! html) {
        element.parent = this;
        this.emit('append', element);
    }
};

ContainerElement.prototype.appendAfter = function(element, reference) {
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (reference instanceof ui.Element)
        reference = reference.element;

    reference = reference.nextSibling;

    if (reference) {
        this._innerElement.insertBefore(node, reference);
    } else {
        this._innerElement.appendChild(node);
    }

    if (! html) {
        element.parent = this;
        this.emit('append', element);
    }
};


ContainerElement.prototype.prepend = function(element) {
    var first = this._innerElement.firstChild;
    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    if (first) {
        this._innerElement.insertBefore(node, first);
    } else {
        this._innerElement.appendChild(node);
    }

    if (! html) {
        element.parent = this;
        this.emit('append', element);
    }
};


Object.defineProperty(ContainerElement.prototype, 'innerElement', {
    get: function() {
        return this._innerElement;
    },
    set: function(value) {
        if (this._innerElement) {
            this._observer.disconnect();
        }

        this._innerElement = value;

        this._observer.observe(this._innerElement, this._observerOptions);
    }
});


ContainerElement.prototype.clear = function() {
    var i, node;

    this._observer.disconnect();

    i = this._innerElement.childNodes.length;
    while(i--) {
        node = this._innerElement.childNodes[i];

        if (! node.ui)
            continue;

        node.ui.destroy();
    }
    this._innerElement.innerHTML = '';

    this._observer.observe(this._innerElement, this._observerOptions);
};


Object.defineProperty(ContainerElement.prototype, 'flexible', {
    get: function() {
        return this._element.classList.contains('flexible');
    },
    set: function(value) {
        if (this._element.classList.contains('flexible') === !! value)
            return;

        if (value) {
            this._element.classList.add('flexible');
        } else {
            this._element.classList.remove('flexible');
        }
    }
});


Object.defineProperty(ContainerElement.prototype, 'flex', {
    get: function() {
        return this._element.classList.contains('flex');
    },
    set: function(value) {
        if (this._element.classList.contains('flex') === !! value)
            return;

        if (value) {
            this._element.classList.add('flex');
        } else {
            this._element.classList.remove('flex');
        }
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexDirection', {
    get: function() {
        return this._innerElement.style.flexDirection;
    },
    set: function(value) {
        this._innerElement.style.flexDirection = value;
        this._innerElement.style.WebkitFlexDirection = value;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexWrap', {
    get: function() {
        return this._innerElement.style.flexWrap;
    },
    set: function(value) {
        this.flex = true;
        this._innerElement.style.flexWrap = value;
        this._innerElement.style.WebkitFlexWrap = value;
    }
});

Object.defineProperty(ContainerElement.prototype, 'flexGrow', {
    get: function() {
        return this._element.style.flexGrow === 1;
    },
    set: function(value) {
        if (value)
            this.flex = true;

        this._element.style.flexGrow = !! value ? 1 : 0;
        this._element.style.WebkitFlexGrow = !! value ? 1 : 0;
        this._innerElement.style.flexGrow = this._element.style.flexGrow;
        this._innerElement.style.WebkitFlexGrow = this._element.style.flexGrow;
    }
});


Object.defineProperty(ContainerElement.prototype, 'flexShrink', {
    get: function() {
        return this._element.style.flexShrink === 1;
    },
    set: function(value) {
        if (value)
            this.flex = true;

        this._element.style.flexShrink = !! value ? 1 : 0;
        this._element.style.WebkitFlexShrink = !! value ? 1 : 0;
        this._innerElement.style.flexShrink = this._element.style.flexShrink;
        this._innerElement.style.WebkitFlexShrink = this._element.style.flexShrink;
    }
});


Object.defineProperty(ContainerElement.prototype, 'scroll', {
    get: function() {
        return this.class.contains('scrollable');
    },
    set: function() {
        this.class.add('scrollable');
    }
});


window.ui.ContainerElement = ContainerElement;


/* ui/button.js */
"use strict";

function Button(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-button');
    this.element.innerHTML = this._text;

    this.element.ui = this;
    this.element.tabIndex = 0;

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            return self.element.blur();

        if (evt.keyCode !== 32 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self.emit('click');
    }, false);

    this.on('click', function() {
        this.element.blur();
    });
}
Button.prototype = Object.create(ui.Element.prototype);

Button.prototype._onLinkChange = function(value) {
    this.element.value = value;
};

Object.defineProperty(Button.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


window.ui.Button = Button;


/* ui/checkbox.js */
"use strict";

function Checkbox(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-checkbox', 'noSelect');
    this.element.tabIndex = 0;
    this.element.ui = this;

    this.element.addEventListener('keydown', this._onKeyDown, false);

    this.on('click', this._onClick);
    this.on('change', this._onChange);
}
Checkbox.prototype = Object.create(ui.Element.prototype);


Checkbox.prototype._onClick = function() {
    this.value = ! this.value;
    this.element.blur();
};

Checkbox.prototype._onChange = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};

Checkbox.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (evt.keyCode !== 32 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.value = ! this.ui.value;
};

Checkbox.prototype._onLinkChange = function(value) {
    if (value === null) {
        this.element.classList.remove('checked');
        this.element.classList.add('null');
    } else if (value) {
        this.element.classList.add('checked');
        this.element.classList.remove('null');
    } else {
        this.element.classList.remove('checked', 'null');
    }
    this.emit('change', value);
};


Object.defineProperty(Checkbox.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.element.classList.contains('checked');
        }
    },
    set: function(value) {
        if (this._link) {
            this._link.set(this.path, value);
        } else {
            if (this.element.classList.contains('checked') !== value)
                this._onLinkChange(value);
        }
    }
});


window.ui.Checkbox = Checkbox;


/* ui/code.js */
"use strict";

function Code() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('pre');
    this.element.classList.add('ui-code');
}
Code.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Code.prototype, 'text', {
    get: function() {
        return this._element.textContent;
    },
    set: function(value) {
        this._element.textContent = value;
    }
});


window.ui.Code = Code;


/* ui/label.js */
"use strict";

function Label(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('span');
    this.element.classList.add('ui-label');
    this.element.innerHTML = this._text;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
Label.prototype = Object.create(ui.Element.prototype);


Label.prototype._onLinkChange = function(value) {
    this.text = value;
    this.emit('change', value);
};


Object.defineProperty(Label.prototype, 'text', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._text;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                value = this._link.get(this.path);
                this.element.innerHTML = value;
            }
        } else {
            if (this._text === value) return;

            this._text = value;
            if (value === undefined || value === null)
                this._text = '';

            this.element.innerHTML = this._text;
            this.emit('change', value);
        }
    }
});

Object.defineProperty(Label.prototype, 'value', {
    get: function () {
        return this.text;
    },

    set: function (value) {
        this.text = value;
    }
});

Object.defineProperty(Label.prototype, 'placeholder', {
    get: function() {
        return this.element.getAttribute('placeholder');
    },
    set: function(value) {
        this.element.setAttribute('placeholder', value);
    }
});


window.ui.Label = Label;


/* ui/number-field.js */
"use strict";

function NumberField(args) {
    ui.Element.call(this);
    args = args || { };

    this.precision = (args.precision != null) ? args.precision : null;
    this.step = (args.step != null) ? args.step : ((args.precision != null) ? 1 / Math.pow(10, args.precision) : 1);

    this.max = (args.max !== null) ? args.max : null;
    this.min = (args.min !== null) ? args.min : null;

    this.element = document.createElement('div');
    this.element.classList.add('ui-number-field');

    this.elementInput = document.createElement('input');
    this.elementInput.ui = this;
    this.elementInput.tabIndex = 0;
    this.elementInput.classList.add('field');
    this.elementInput.type = 'text';
    this.elementInput.addEventListener('focus', this._onInputFocus, false);
    this.elementInput.addEventListener('blur', this._onInputBlur, false);
    this.elementInput.addEventListener('keydown', this._onKeyDown, false);
    this.elementInput.addEventListener('dblclick', this._onFullSelect, false);
    this.elementInput.addEventListener('contextmenu', this._onFullSelect, false);
    this.element.appendChild(this.elementInput);

    if (args.default !== undefined)
        this.value = args.default;

    this.elementInput.addEventListener('change', this._onChange, false);
    // this.element.addEventListener('mousedown', this._onMouseDown.bind(this), false);
    // this.element.addEventListener('mousewheel', this._onMouseDown.bind(this), false);

    this.blurOnEnter = true;
    this.refocusable = true;

    this._lastValue = this.value;
    this._mouseMove = null;
    this._dragging = false;
    this._dragDiff = 0;
    this._dragStart = 0;

    this.on('disable', this._onDisable);
    this.on('enable', this._onEnable);
    this.on('change', this._onChangeField);

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
NumberField.prototype = Object.create(ui.Element.prototype);


NumberField.prototype._onLinkChange = function(value) {
    this.elementInput.value = value || 0;
    this.emit('change', value || 0);
};

NumberField.prototype._onChange = function() {
    var value = parseFloat(this.ui.elementInput.value, 10) || 0;
    this.ui.elementInput.value = value;
    this.ui.value = value;
};

NumberField.prototype.focus = function(select) {
    this.elementInput.focus();
    if (select) this.elementInput.select();
};

NumberField.prototype._onInputFocus = function() {
    this.ui.class.add('focus');
};

NumberField.prototype._onInputBlur = function() {
    this.ui.class.remove('focus');
};

NumberField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (this.ui.blurOnEnter && evt.keyCode === 13) {
        var focused = false;

        var parent = this.ui.parent;
        while(parent) {
            if (parent.focus) {
                parent.focus();
                focused = true;
                break;
            }

            parent = parent.parent;
        }

        if (! focused)
            this.blur();

        return;
    }

    if (this.ui.disabled || [ 38, 40 ].indexOf(evt.keyCode) === -1)
        return;

    var inc = evt.keyCode === 40 ? -1 : 1;

    if (evt.shiftKey)
        inc *= 10;

    var value = this.ui.value + (this.ui.step || 1) * inc;

    if (this.ui.max != null)
        value = Math.min(this.ui.max, value);

    if (this.ui.min != null)
        value = Math.max(this.ui.min, value);

    if (this.ui.precision != null)
        value = parseFloat(value.toFixed(this.ui.precision), 10);

    this.value = value;
    this.ui.value = value;
};

NumberField.prototype._onFullSelect = function() {
    this.select();
};

NumberField.prototype._onDisable = function() {
    this.elementInput.readOnly = true;
};

NumberField.prototype._onEnable = function() {
    this.elementInput.readOnly = false;
};

NumberField.prototype._onChangeField = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};


// NumberField.prototype._onMouseDown = function(evt) {
//     if (evt.button !== 0) return;

//     this._mouseY = evt.clientY;
//     this._dragStart = this.value;

//     this._mouseMove = this._onMouseMove.bind(this);
//     this._mouseUp = this._onMouseUp.bind(this);
//     window.addEventListener('mousemove', this._mouseMove, false);
//     window.addEventListener('mouseup', this._mouseUp, false);

//     evt.preventDefault();
//     evt.stopPropagation();
// };


// NumberField.prototype._onMouseUp = function(evt) {
//     this._dragging = false;
//     this.element.disabled = false;
//     this.element.focus();
//     this.element.classList.remove('noSelect', 'active');
//     document.body.classList.remove('noSelect');

//     if (this._mouseMove) {
//         window.removeEventListener('mousemove', this._mouseMove);
//         this._mouseMove = null;
//     }
//     if (this._mouseUp) {
//         window.removeEventListener('mouseup', this._mouseUp);
//         this._mouseUp = null;
//     }

//     evt.preventDefault();
//     evt.stopPropagation();
// };

// NumberField.prototype._onMouseMove = function(evt) {
//     if (this._mouseMove === null) return;
//     if (! this._dragging) {
//         if (Math.abs(evt.clientY - this._mouseY) > 16) {
//             this._dragging = true;
//         } else {
//             return;
//         }
//         this._mouseY = evt.clientY;
//         this.element.disabled = true;
//         this.element.blur();
//         this.element.classList.add('noSelect', 'active');
//         document.body.classList.add('noSelect');
//     }

//     this._dragDiff = this._mouseY - evt.clientY;

//     if (this.step !== 1)
//         this._dragDiff *= this.step;

//     if (this.precision !== null)
//         this._dragDiff = parseFloat(this._dragDiff.toFixed(this.precision));

//     this.value = this._dragStart + this._dragDiff;

//     evt.preventDefault();
//     evt.stopPropagation();
// };

Object.defineProperty(NumberField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.elementInput.value !== '' ? parseFloat(this.elementInput.value, 10) : null;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                this.elementInput.value = this._link.get(this.path);
            }
        } else {
            if (this.max !== null && this.max < value)
                value = this.max;

            if (this.min !== null && this.min > value)
                value = this.min;

            value = (value !== null && value !== undefined && (this.precision !== null) ? parseFloat(value.toFixed(this.precision), 10) : value);
            if (value === undefined)
                value = null;

            var different = this._lastValue !== value;

            this._lastValue = value;
            this.elementInput.value = value;

            if (different) {
                this.emit('change', value);
            }
        }
    }
});


Object.defineProperty(NumberField.prototype, 'placeholder', {
    get: function() {
        return this.element.getAttribute('placeholder');
    },
    set: function(value) {
        if (! value) {
            this.element.removeAttribute('placeholder');
        } else {
            this.element.setAttribute('placeholder', value);
        }
    }
});


Object.defineProperty(NumberField.prototype, 'proxy', {
    get: function() {
        return this.element.getAttribute('proxy');
    },
    set: function(value) {
        if (! value) {
            this.element.removeAttribute('proxy');
        } else {
            this.element.setAttribute('proxy', value);
        }
    }
});


window.ui.NumberField = NumberField;


/* ui/overlay.js */
"use strict"

function Overlay(args) {
    ui.ContainerElement.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-overlay', 'center');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.classList.add('overlay', 'clickable');
    this.element.appendChild(this.elementOverlay);

    this.elementOverlay.addEventListener('mousedown', function(evt) {
        if (! this.clickable)
            return false;

        // some field might be in focus
        document.body.blur();

        // wait till blur takes in account
        setTimeout(function() {
            // hide overlay
            this.hidden = true;
        }.bind(this), 0);

        evt.preventDefault();
    }.bind(this), false);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);
}
Overlay.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Overlay.prototype, 'center', {
    get: function() {
        return this._element.classList.contains('center');
    },
    set: function(value) {
        if (value) {
            this._element.classList.add('center');
            this.innerElement.style.left = '';
            this.innerElement.style.top = '';
        } else {
            this._element.classList.remove('center');
        }
    }
});


Object.defineProperty(Overlay.prototype, 'transparent', {
    get: function() {
        return this._element.classList.contains('transparent');
    },
    set: function(value) {
        if (value) {
            this._element.classList.add('transparent');
        } else {
            this._element.classList.remove('transparent');
        }
    }
});

Object.defineProperty(Overlay.prototype, 'clickable', {
    get: function() {
        return this.elementOverlay.classList.contains('clickable');
    },
    set: function(value) {
        if (value) {
            this.elementOverlay.classList.add('clickable');
        } else {
            this.elementOverlay.classList.remove('clickable');
        }
    }
});


Object.defineProperty(Overlay.prototype, 'rect', {
    get: function() {
        return this.innerElement.getBoundingClientRect();
    }
});


Overlay.prototype.position = function(x, y) {

    var area = this.elementOverlay.getBoundingClientRect();
    var rect = this.innerElement.getBoundingClientRect();

    x = Math.max(0, Math.min(area.width - rect.width, x));
    y = Math.max(0, Math.min(area.height - rect.height, y));

    this.innerElement.style.left = x + 'px';
    this.innerElement.style.top = y + 'px';
};


window.ui.Overlay = Overlay;


/* ui/panel.js */
"use strict";

function Panel(header) {
    var self = this;

    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-panel', 'noHeader', 'noAnimation');

    this.headerElement = null;
    this.headerElementTitle = null;

    if (header)
        this.header = header;

    this.on('nodesChanged', function() {
        if (! this.foldable || this.folded || this.horizontal || this.hidden)
            return;

        this.style.height = ((this.headerSize || 32) + this.innerElement.clientHeight) + 'px';
    });

    // content
    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);

    this.innerElement.addEventListener('scroll', this._onScroll.bind(this), false);

    // HACK
    // skip 2 frames before enabling transitions
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            this.class.remove('noAnimation');
        }.bind(this));
    }.bind(this));

    // on parent change
    this.on('parent', function() {
        // HACK
        // wait till DOM parses, then reflow
        requestAnimationFrame(this._reflow.bind(this));
    });

    this._handleElement = null;
    this._handle = null;
    this._resizeData = null;
    this._resizeLimits = {
        min: 0,
        max: Infinity
    };

    this.headerSize = 0;
}
Panel.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Panel.prototype, 'header', {
    get: function() {
        return (this.headerElement && this.headerElementTitle.textContent) || '';
    },
    set: function(value) {
        if (! this.headerElement && value) {
            this.headerElement = document.createElement('header');
            this.headerElement.classList.add('ui-header');

            this.headerElementTitle = document.createElement('span');
            this.headerElementTitle.classList.add('title');
            this.headerElementTitle.textContent = value;
            this.headerElement.appendChild(this.headerElementTitle);

            var first = this.element.firstChild;
            if (first) {
                this.element.insertBefore(this.headerElement, first);
            } else {
                this.element.appendChild(this.headerElement);
            }

            this.class.remove('noHeader');

            var self = this;

            // folding
            this.headerElement.addEventListener('click', function(evt) {
                if (! self.foldable || (evt.target !== self.headerElement && evt.target !== self.headerElementTitle))
                    return;

                self.folded = ! self.folded;
            }, false);
        } else if (! value && this.headerElement) {
            this.headerElement.parentNode.removeChild(this.headerElement);
            this.headerElement = null;
            this.headerElementTitle = null;
            this.class.add('noHeader');
        } else {
            this.headerElementTitle.textContent = value || '';
            this.class.remove('noHeader');
        }
    }
});


Panel.prototype.headerAppend = function(element) {
    if (! this.headerElement)
        return;

    var html = (element instanceof HTMLElement);
    var node = html ? element : element.element;

    this.headerElement.insertBefore(node, this.headerElementTitle);

    if (! html)
        element.parent = this;
};


Panel.prototype._reflow = function() {
    if (this.hidden)
        return;

    if (this.folded) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = (this.headerSize || 32) + 'px';
        } else {
            this.style.height = (this.headerSize || 32) + 'px';
        }
    } else if (this.foldable) {
        if (this.horizontal) {
            this.style.height = '';
            this.style.width = this._innerElement.clientWidth + 'px';
        } else {
            this.style.height = ((this.headerSize || 32) + this._innerElement.clientHeight) + 'px';
        }
    }
};


Panel.prototype._onScroll = function(evt) {
    this.emit('scroll', evt);
};


Object.defineProperty(Panel.prototype, 'foldable', {
    get: function() {
        return this.class.contains('foldable');
    },
    set: function(value) {
        if (value) {
            this.class.add('foldable');

            if(this.class.contains('folded'))
                this.emit('fold');
        } else {
            this.class.remove('foldable');

            if (this.class.contains('folded'))
                this.emit('unfold');
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'folded', {
    get: function() {
        return this.class.contains('foldable') && this.class.contains('folded');
    },
    set: function(value) {
        if (this.hidden)
            return;

        if (this.headerElement && this.headerSize === 0)
            this.headerSize = this.headerElement.clientHeight;

        if (value) {
            this.class.add('folded');

            if (this.class.contains('foldable'))
                this.emit('fold');
        } else {
            this.class.remove('folded');

            if (this.class.contains('foldable'))
                this.emit('unfold');
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'horizontal', {
    get: function() {
        return this.class.contains('horizontal');
    },
    set: function(value) {
        if (value) {
            this.class.add('horizontal');
        } else {
            this.class.remove('horizontal');
        }
        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'resizable', {
    get: function() {
        return this._handle;
    },
    set: function(value) {
        if (this._handle === value)
            return;

        var oldHandle = this._handle;
        this._handle = value;

        if (this._handle) {
            if (! this._handleElement) {
                this._handleElement = document.createElement('div');
                this._handleElement.classList.add('handle');
                this._handleElement.addEventListener('mousedown', this._resizeStart.bind(this), false);
                // this._handleElement.on('mouseup', this._resizeStart.bind(this));
            }

            if (this._handleElement.parentNode)
                this._element.removeChild(this._handleElement);
            // TODO
            // append in right place
            this._element.appendChild(this._handleElement);
            this.class.add('resizable', 'resizable-' + this._handle);
        } else {
            this._element.removeChild(this._handleElement);
            this.class.remove('resizable', 'resizable-' + oldHandle);
        }

        this._reflow();
    }
});


Object.defineProperty(Panel.prototype, 'resizeMin', {
    get: function() {
        return this._resizeLimits.min;
    },
    set: function(value) {
        this._resizeLimits.min = Math.max(0, Math.min(this._resizeLimits.max, value));
    }
});


Object.defineProperty(Panel.prototype, 'resizeMax', {
    get: function() {
        return this._resizeLimits.max;
    },
    set: function(value) {
        this._resizeLimits.max = Math.max(this._resizeLimits.min, value);
    }
});


Panel.prototype._resizeStart = function(evt) {
    if (! this._handle)
        return;

    this.class.add('noAnimation', 'resizing');
    this._resizeData = null;

    this._resizeEvtMove = this._resizeMove.bind(this);
    this._resizeEvtEnd = this._resizeEnd.bind(this);

    window.addEventListener('mousemove', this._resizeEvtMove, false);
    window.addEventListener('mouseup', this._resizeEvtEnd, false);

    evt.preventDefault();
    evt.stopPropagation();
};


Panel.prototype._resizeMove = function(evt) {
    if (! this._resizeData) {
        this._resizeData = {
            x: evt.clientX,
            y: evt.clientY,
            width: this._innerElement.clientWidth,
            height: this._innerElement.clientHeight
        };
    } else {
        if (this._handle === 'left' || this._handle === 'right') {
            // horizontal
            var offsetX = this._resizeData.x - evt.clientX;

            if (this._handle === 'right')
                offsetX = -offsetX;

            var width = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.width + offsetX)));

            this.style.width = (width + 4) + 'px';
            this._innerElement.style.width = (width + 4) + 'px';
        } else {
            // vertical
            var offsetY = this._resizeData.y - evt.clientY;

            if (this._handle === 'bottom')
                offsetY = -offsetY;

            var height = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.height + offsetY)));

            this.style.height = (height + (this.headerSize === -1 ? 0 : this.headerSize || 32)) + 'px';
            this._innerElement.style.height = height + 'px';
        }
    }

    evt.preventDefault();
    evt.stopPropagation();

    this.emit('resize');
};

Panel.prototype._resizeEnd = function(evt) {
    window.removeEventListener('mousemove', this._resizeEvtMove, false);
    window.removeEventListener('mouseup', this._resizeEvtEnd, false);

    this.class.remove('noAnimation', 'resizing');
    this._resizeData = null;

    evt.preventDefault();
    evt.stopPropagation();
};


window.ui.Panel = Panel;


/* ui/select-field.js */
"use strict";

function SelectField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.options = args.options || { };
    this.optionsKeys = [ ];
    if (this.options instanceof Array) {
        var options = { };
        for(var i = 0; i < this.options.length; i++) {
            this.optionsKeys.push(this.options[i].v);
            options[this.options[i].v] = this.options[i].t;
        }
        this.options = options;
    } else {
        this.optionsKeys = Object.keys(this.options);
    }

    this.element = document.createElement('div');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-select-field', 'noSelect');

    this.elementValue = document.createElement('div');
    this.elementValue.classList.add('value');
    this.element.appendChild(this.elementValue);

    this._oldValue = null;
    this._value = null;
    this._type = args.type || 'string';

    this.timerClickAway = null;
    this.evtMouseDist = [ 0, 0 ];
    this.evtMouseUp = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (evt.target && evt.target.uiElement && evt.target.classList.contains('selected'))
            return;

        if ((Math.abs(evt.clientX - self.evtMouseDist[0]) + Math.abs(evt.clientY - self.evtMouseDist[1])) < 8)
            return;

        if (evt.target && evt.target.uiElement)
            self._onOptionSelect.call(evt.target);

        self.close();
    };

    this.elementValue.addEventListener('mousedown', function(evt) {
        if (self.disabled && ! self.disabledClick)
            return;

        if (self.element.classList.contains('active')) {
            self.close();
        } else {
            evt.preventDefault();
            evt.stopPropagation();
            self.evtMouseDist[0] = evt.clientX;
            self.evtMouseDist[1] = evt.clientY;
            self.element.focus();
            self.open();
            window.addEventListener('mouseup', self.evtMouseUp);
        }
    });

    this.elementOptions = document.createElement('ul');
    this.element.appendChild(this.elementOptions);

    this.optionElements = { };

    if (args.default !== undefined && this.options[args.default] !== undefined) {
        this._value = this.valueToType(args.default);
        this._oldValue = this._value;
    }

    this._optionSelectHandler = null;

    this.on('link', function(path) {
        if (this._link.schema && this._link.schema.has(path)) {
            var field = this._link.schema.get(path);
            var options = field.options || { };
            this._updateOptions(options);
        }
    });

    this._updateOptions();

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // arrows - change
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27) {
            self.close();
            self.element.blur();
            return;
        }

        if ((self.disabled && ! self.disabledClick) || [ 38, 40 ].indexOf(evt.keyCode) === -1)
            return;

        evt.stopPropagation();
        evt.preventDefault();

        var keys = Object.keys(self.options);
        var ind = keys.indexOf(self.value !== undefined ? self.value.toString() : null);

        var y = evt.keyCode === 38 ? -1 : 1;

        // already first item
        if (y === -1 && ind <= 0)
            return;

        // already last item
        if (y === 1 && ind === (keys.length - 1))
            return

        // set new item
        self.value = keys[ind + y];
    }, false);
}
SelectField.prototype = Object.create(ui.Element.prototype);


SelectField.prototype.valueToType = function(value) {
    switch(this._type) {
        case 'boolean':
            return !! value;
            break;
        case 'number':
            return parseInt(value, 10);
            break;
        case 'string':
            return '' + value;
            break;
    }
};


SelectField.prototype.open = function() {
    if ((this.disabled && ! this.disabledClick) || this.element.classList.contains('active'))
        return;

    this.element.classList.add('active');

    var rect = this.element.getBoundingClientRect();

    // left
    var left = Math.round(rect.left) + ((Math.round(rect.width) - this.element.clientWidth) / 2);

    // top
    var top = rect.top;
    if (this.optionElements[this._value]) {
        top -= this.optionElements[this._value].offsetTop;
        top += (Math.round(rect.height) - this.optionElements[this._value].clientHeight) / 2;
    }

    // limit to bottom / top of screen
    if (top + this.elementOptions.clientHeight > window.innerHeight) {
        top = window.innerHeight - this.elementOptions.clientHeight + 1;
    } else if (top < 0) {
        top = 0;
    }

    // top
    this.elementOptions.style.top = Math.max(0, top) + 'px';
    // left
    this.elementOptions.style.left = left + 'px';
    // right
    this.elementOptions.style.width = Math.round(this.element.clientWidth) + 'px';
    // bottom
    if (top <= 0 && this.elementOptions.offsetHeight >= window.innerHeight) {
        this.elementOptions.style.bottom = '0';
        this.elementOptions.style.height = 'auto';

        // scroll to item
        if (this.optionElements[this._value]) {
            var off = this.optionElements[this._value].offsetTop - rect.top;
            this.elementOptions.scrollTop = off;
        }
    } else {
        this.elementOptions.style.bottom = '';
        this.elementOptions.style.height = '';
    }

    var self = this;
    this.timerClickAway = setTimeout(function() {
        var looseActive = function() {
            self.element.classList.remove('active');
            self.element.blur();
            window.removeEventListener('click', looseActive);
        };

        window.addEventListener('click', looseActive);
    }, 300);

    this.emit('open');
};


SelectField.prototype.close = function() {
    if ((this.disabled && ! this.disabledClick) || ! this.element.classList.contains('active'))
        return;

    window.removeEventListener('mouseup', this.evtMouseUp);
    if (this.timerClickAway) {
        clearTimeout(this.timerClickAway);
        this.timerClickAway = null;
    }

    this.element.classList.remove('active');

    this.elementOptions.style.top = '';
    this.elementOptions.style.right = '';
    this.elementOptions.style.bottom = '';
    this.elementOptions.style.left = '';
    this.elementOptions.style.width = '';
    this.elementOptions.style.height = '';

    this.emit('close');
};


SelectField.prototype.toggle = function() {
    if (this.element.classList.contains('active')) {
        this.close();
    } else {
        this.open();
    }
};


SelectField.prototype._updateOptions = function(options) {
    if (options !== undefined) {
        if (options instanceof Array) {
            this.options = { };
            this.optionsKeys = [ ];
            for(var i = 0; i < options.length; i++) {
                this.optionsKeys.push(options[i].v);
                this.options[options[i].v] = options[i].t;
            }
        } else {
            this.options = options;
            this.optionsKeys = Object.keys(options);
        }
    }

    if (! this._optionSelectHandler)
        this._optionSelectHandler = this._onOptionSelect.bind(this);

    for(var value in this.optionElements) {
        this.optionElements[value].removeEventListener('click', this._onOptionSelect);
    }

    this.optionElements = { };
    this.elementOptions.innerHTML = '';

    for(var i = 0; i < this.optionsKeys.length; i++) {
        if (! this.options.hasOwnProperty(this.optionsKeys[i]))
            continue;

        var element = document.createElement('li');
        element.textContent = this.options[this.optionsKeys[i]];
        element.uiElement = this;
        element.uiValue = this.optionsKeys[i];
        element.addEventListener('click', this._onOptionSelect);
        element.addEventListener('mouseover', this._onOptionHover);
        element.addEventListener('mouseout', this._onOptionOut);
        this.elementOptions.appendChild(element);
        this.optionElements[this.optionsKeys[i]] = element;
    }
};

SelectField.prototype._onOptionSelect = function() {
    this.uiElement.value = this.uiValue;
};

SelectField.prototype._onOptionHover = function() {
    this.classList.add('hover');
};

SelectField.prototype._onOptionOut = function() {
    this.classList.remove('hover');
};

SelectField.prototype._onLinkChange = function(value) {
    if (this.optionElements[value] === undefined)
        return;

    if (this.optionElements[this._oldValue]) {
        this.optionElements[this._oldValue].classList.remove('selected');
    }

    this._value = this.valueToType(value);
    this.elementValue.textContent = this.options[value];
    this.optionElements[value].classList.add('selected');
    this.emit('change', value);
};


Object.defineProperty(SelectField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(raw) {
        var value = this.valueToType(raw);

        if (this._link) {
            this._oldValue = this._value;
            this.emit('change:before', value);
            this._link.set(this.path, value);
        } else {
            if ((value === null || value === undefined || raw === '') && this.optionElements[''])
                value = '';

            if (this._oldValue === value) return;
            if (value !== null && this.options[value] === undefined) return;

            // deselect old one
            if (this.optionElements[this._oldValue])
                this.optionElements[this._oldValue].classList.remove('selected');

            this._value = value;
            if (value !== '')
                this._value = this.valueToType(this._value);

            this.emit('change:before', this._value);
            this._oldValue = this._value;
            if (this.options[this._value]) {
                this.elementValue.textContent = this.options[this._value];
                this.optionElements[this._value].classList.add('selected');
            } else {
                this.elementValue.textContent = '';
            }
            this.emit('change', this._value);
        }
    }
});


window.ui.SelectField = SelectField;





/* ui/text-field.js */
"use strict";

function TextField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-text-field');

    this.elementInput = document.createElement('input');
    this.elementInput.ui = this;
    this.elementInput.classList.add('field');
    this.elementInput.type = 'text';
    this.elementInput.tabIndex = 0;
    this.elementInput.addEventListener('focus', this._onInputFocus, false);
    this.elementInput.addEventListener('blur', this._onInputBlur, false);
    this.element.appendChild(this.elementInput);

    if (args.default !== undefined)
        this.value = args.default;

    this.elementInput.addEventListener('change', this._onChange, false);
    this.elementInput.addEventListener('keydown', this._onKeyDown, false);
    this.elementInput.addEventListener('contextmenu', this._onFullSelect, false);
    this.evtKeyChange = false;
    this.ignoreChange = false;

    this.blurOnEnter = true;
    this.refocusable = true;

    this.on('disable', this._onDisable);
    this.on('enable', this._onEnable);
    this.on('change', this._onChangeField);

    if (args.placeholder)
        this.placeholder = args.placeholder;
}
TextField.prototype = Object.create(ui.Element.prototype);


TextField.prototype._onLinkChange = function(value) {
    this.elementInput.value = value;
    this.emit('change', value);
};


TextField.prototype._onChange = function() {
    if (this.ui.ignoreChange) return;

    this.ui.value = this.ui.value || '';

    if (! this.ui._link)
        this.ui.emit('change', this.ui.value);
};


TextField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27) {
        this.blur();
    } else if (this.ui.blurOnEnter && evt.keyCode === 13) {
        var focused = false;

        var parent = this.ui.parent;
        while(parent) {
            if (parent.focus) {
                parent.focus();
                focused = true;
                break;
            }

            parent = parent.parent;
        }

        if (! focused)
            this.blur();
    }
};


TextField.prototype._onFullSelect = function() {
    this.select();
};


TextField.prototype.focus = function(select) {
    this.elementInput.focus();
    if (select) this.elementInput.select();
};


TextField.prototype._onInputFocus = function() {
    this.ui.class.add('focus');
    this.ui.emit('input:focus');
};


TextField.prototype._onInputBlur = function() {
    this.ui.class.remove('focus');
    this.ui.emit('input:blur');
};

TextField.prototype._onDisable = function() {
    this.elementInput.readOnly = true;
};

TextField.prototype._onEnable = function() {
    this.elementInput.readOnly = false;
};

TextField.prototype._onChangeField = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};


Object.defineProperty(TextField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.elementInput.value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                this.elementInput.value = this._link.get(this.path);
            }
        } else {
            if (this.elementInput.value === value)
                return;

            this.elementInput.value = value || '';
            this.emit('change', value);
        }
    }
});


Object.defineProperty(TextField.prototype, 'placeholder', {
    get: function() {
        return this.element.getAttribute('placeholder');
    },
    set: function(value) {
        if (! value) {
            this.element.removeAttribute('placeholder');
        } else {
            this.element.setAttribute('placeholder', value);
        }
    }
});


Object.defineProperty(TextField.prototype, 'proxy', {
    get: function() {
        return this.element.getAttribute('proxy');
    },
    set: function(value) {
        if (! value) {
            this.element.removeAttribute('proxy');
        } else {
            this.element.setAttribute('proxy', value);
        }
    }
});


Object.defineProperty(TextField.prototype, 'keyChange', {
    get: function() {
        return !! this.evtKeyChange;
    },
    set: function(value) {
        if (!! this.evtKeyChange === !! value)
            return;

        if (value) {
            this.elementInput.addEventListener('keyup', this._onChange, false);
        } else {
            this.elementInput.removeEventListener('keyup', this._onChange);
        }
    }
});


window.ui.TextField = TextField;


/* ui/color-field.js */
"use strict"

function ColorField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-color-field', 'rgb');

    this.elementColor = document.createElement('span');
    this.elementColor.classList.add('color');
    this.element.appendChild(this.elementColor);

    this._channels = args.channels || 3;
    this._values = [ 0, 0, 0, 0 ];

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            return self.element.blur();

        if (evt.keyCode !== 13 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self.emit('click');
    }, false);

    // render color back
    this.on('change', function(color) {
        if (this._channels === 1) {
            this.elementColor.style.backgroundColor = 'rgb(' + [ this.r, this.r, this.r ].join(',') + ')';
        } else if (this._channels === 3) {
            this.elementColor.style.backgroundColor = 'rgb(' + this._values.slice(0, 3).join(',') + ')';
        } else if (this._channels === 4) {
            var rgba = this._values.slice(0, 4);
            rgba[3] /= 255;
            this.elementColor.style.backgroundColor = 'rgba(' + rgba.join(',') + ')';
        } else {
            console.log('unknown channels', color);
        }
    });

    // link to channels
    var evtLinkChannels = [ ];
    this.on('link', function() {
        for(var i = 0; i < 4; i++) {
            evtLinkChannels[i] = this._link.on(this.path + '.' + i + ':set', function(value) {
                this._setValue(this._link.get(this.path));
            }.bind(this));
        }
    });
    this.on('unlink', function() {
        for(var i = 0; i < evtLinkChannels.length; i++)
            evtLinkChannels[i].unbind();

        evtLinkChannels = [ ];
    });
}
ColorField.prototype = Object.create(ui.Element.prototype);


ColorField.prototype._onLinkChange = function(value) {
    if (! value)
        return;

    this._setValue(value);
};

Object.defineProperty(ColorField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path).map(function(channel) {
                return Math.floor(channel * 255);
            });
        } else {
            return this._values.slice(0, this._channels);
        }
    },
    set: function(value) {
        if (! value) {
            this.class.add('null');
            return;
        } else {
            this.class.remove('null');
        }

        if (this._link) {
            this._link.set(this.path, value.map(function(channel) {
                return channel / 255;
            }));
        } else {
            this._setValue(value);
        }
    }
});

ColorField.prototype._setValue = function(value) {
    var changed = false;

    if (! value)
        return;

    if (value.length !== this._channels) {
        changed = true;
        this.channels = value.length;
    }

    for(var i = 0; i < this._channels; i++) {
        if (this._values[i] === Math.floor(value[i]))
            continue;

        changed = true;
        this._values[i] = Math.floor(value[i]);
    }

    if (changed)
        this.emit('change', this._values.slice(0, this._channels));
};


Object.defineProperty(ColorField.prototype, 'channels', {
    get: function() {
        return this._channels;
    },
    set: function(value) {
        if (this._channels === value)
            return;

        this._channels = value;
        this.emit('channels', this._channels);
    }
});


Object.defineProperty(ColorField.prototype, 'r', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.0') * 255);
        } else {
            return this._values[0];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[0] === value)
            return;

        this._values[0] = value;
        this.emit('r', this._values[0]);
        this.emit('change', this._values.slice(0, this._channels));
    }
});


Object.defineProperty(ColorField.prototype, 'g', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.1') * 255);
        } else {
            return this._values[1];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[1] === value)
            return;

        this._values[1] = value;

        if (this._channels >= 2) {
            this.emit('g', this._values[1]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'b', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.2') * 255);
        } else {
            return this._values[2];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[2] === value)
            return;

        this._values[2] = value;

        if (this._channels >= 3) {
            this.emit('b', this._values[2]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'a', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.3') * 255);
        } else {
            return this._values[3];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[3] === value)
            return;

        this._values[3] = value;

        if (this._channels >= 4) {
            this.emit('a', this._values[3]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'hex', {
    get: function() {
        var values = this._values;

        if (this._link) {
            values = this._link.get(this.path).map(function(channel) {
                return Math.floor(channel * 255);
            });
        }

        var hex = '';
        for(var i = 0; i < this._channels; i++) {
            hex += ('00' + values[i].toString(16)).slice(-2);
        }
        return hex;
    },
    set: function(value) {
        console.log('todo');
    }
});


window.ui.ColorField = ColorField;


/* ui/image-field.js */
"use strict";

function ImageField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-image-field', 'empty');

    if (args.canvas) {
        this.elementImage = document.createElement('canvas');
        this.elementImage.width = 64;
        this.elementImage.height = 64;
    } else {
        this.elementImage = new Image();
    }

    this.elementImage.classList.add('preview');
    this.element.appendChild(this.elementImage);

    this._value = null;

    this.element.removeEventListener('click', this._evtClick);
    this.element.addEventListener('click', function(evt) {
        self.emit('click', evt);
    });

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            return self.element.blur();

        if (evt.keyCode !== 32 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self.emit('pick');
    }, false);
}
ImageField.prototype = Object.create(ui.Element.prototype);


ImageField.prototype._onLinkChange = function(value) {
    this._value = value;
    this.emit('change', value);
};


Object.defineProperty(ImageField.prototype, 'image', {
    get: function() {
        return this.elementImage.src;
    },
    set: function(value) {
        if (this.elementImage.src === value)
            return;

        this.elementImage.src = value;
    }
});


Object.defineProperty(ImageField.prototype, 'empty', {
    get: function() {
        return this.class.contains('empty');
    },
    set: function(value) {
        if (this.class.contains('empty') === !! value)
            return;

        if (value) {
            this.class.add('empty');
            this.image = '';
        } else {
            this.class.remove('empty');
        }
    }
});


Object.defineProperty(ImageField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(value) {
        value = value && parseInt(value, 10) || null;

        if (this._link) {
            if (! this._link.set(this.path, value))
                this._value = this._link.get(this.path);
        } else {
            if (this._value === value && ! this.class.contains('null'))
                return;

            this._value = value;
            this.emit('change', value);
        }
    }
});


window.ui.ImageField = ImageField;


/* ui/slider.js */
"use strict";

function Slider(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._value = 0;
    this._lastValue = 0;

    this.precision = isNaN(args.precision) ? 2 : args.precision;
    this._min = isNaN(args.min) ? 0 : args.min;
    this._max = isNaN(args.max) ? 1 : args.max;

    this.element = document.createElement('div');
    this.element.classList.add('ui-slider');

    this.elementBar = document.createElement('div');
    this.elementBar.classList.add('bar');
    this.element.appendChild(this.elementBar);

    this.elementHandle = document.createElement('div');
    this.elementHandle.ui = this;
    this.elementHandle.tabIndex = 0;
    this.elementHandle.classList.add('handle');
    this.elementBar.appendChild(this.elementHandle);

    this.element.addEventListener('mousedown', this._onMouseDown.bind(this), false);
    this.evtMouseMove = null;
    this.evtMouseUp = null;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // arrows - change
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            return self.elementHandle.blur();

        if (self.disabled || [ 37, 39 ].indexOf(evt.keyCode) === -1)
            return;

        evt.stopPropagation();
        evt.preventDefault();

        var x = evt.keyCode === 37 ? -1 : 1;

        if (evt.shiftKey)
            x *= 10;

        var rect = self.element.getBoundingClientRect();
        var step = (self._max - self._min) / rect.width;
        var value = Math.max(self._min, Math.min(self._max, self.value + x * step));
        value = parseFloat(value.toFixed(self.precision), 10);

        self.renderChanges = false;
        self._updateHandle(value);
        self.value = value;
        self.renderChanges = true;
    }, false);
}
Slider.prototype = Object.create(ui.Element.prototype);


Slider.prototype._onLinkChange = function(value) {
    this._updateHandle(value);
    this._value = value;
    this.emit('change', value || 0);
};


Slider.prototype._updateHandle = function(value) {
    this.elementHandle.style.left = (Math.max(0, Math.min(1, ((value || 0) - this._min) / (this._max - this._min))) * 100) + '%';
};


Slider.prototype._handleEvt = function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var rect = this.element.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));

    var range = this._max - this._min;
    var value = (x * range) + this._min;
    value = parseFloat(value.toFixed(this.precision), 10);

    this._updateHandle(value);
    this.value = value;
};


Slider.prototype._onMouseDown = function(evt) {
    if (evt.button !== 0 || this.disabled)
        return;

    this.elementHandle.focus();

    this.renderChanges = false;

    this.evtMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this.evtMouseMove, false);

    this.evtMouseUp = this._onMouseUp.bind(this);
    window.addEventListener('mouseup', this.evtMouseUp, false);

    this.class.add('active');

    this.emit('start', this.value);

    this._handleEvt(evt);

    if (this._link && this._link.history)
        this._link.history.combine = true;
};


Slider.prototype._onMouseMove = function(evt) {
    this._handleEvt(evt);
};


Slider.prototype._onMouseUp = function(evt) {
    this._handleEvt(evt);

    this.renderChanges = true;

    this.class.remove('active');

    window.removeEventListener('mousemove', this.evtMouseMove);
    window.removeEventListener('mouseup', this.evtMouseUp);

    if (this._link && this._link.history)
        this._link.history.combine = false;

    this.emit('end', this.value);
};


Object.defineProperty(Slider.prototype, 'min', {
    get: function() {
        return this._min;
    },
    set: function(value) {
        if (this._min === value)
            return;

        this._min = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'max', {
    get: function() {
        return this._max;
    },
    set: function(value) {
        if (this._max === value)
            return;

        this._max = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value))
                this._updateHandle(this._link.get(this.path));
        } else {
            if (this._max !== null && this._max < value)
                value = this._max;

            if (this._min !== null && this._min > value)
                value = this._min;

            if (value === null) {
                this.class.add('null');
            } else {
                if (typeof value !== 'number')
                    value = undefined;

                value = (value !== undefined && this.precision !== null) ? parseFloat(value.toFixed(this.precision), 10) : value;
                this.class.remove('null');
            }

            this._updateHandle(value);
            this._value = value;

            if (this._lastValue !== value) {
                this._lastValue = value;
                this.emit('change', value);
            }
        }
    }
});


window.ui.Slider = Slider;


/* ui/progress.js */
"use strict";

function Progress(args) {
    ui.Element.call(this);
    args = args || { };

    this._progress = 0;

    if (args.progress)
        this._progress = Math.max(0, Math.min(1, args.progress));

    this._targetProgress = this._progress;

    this._lastProgress = Math.floor(this._progress * 100);

    this.element = document.createElement('div');
    this.element.classList.add('ui-progress');

    this._inner = document.createElement('div');
    this._inner.classList.add('inner');
    this._inner.style.width = (this._progress * 100) + '%';
    this.element.appendChild(this._inner);

    this._speed = args.speed || 1;

    this._now = Date.now();
    this._animating = false;

    this._failed = false;

    var self = this;
    this._animateHandler = function() {
        self._animate();
    };
}
Progress.prototype = Object.create(ui.Element.prototype);


Object.defineProperty(Progress.prototype, 'progress', {
    get: function() {
        return this._progress;
    },
    set: function(value) {
        value = Math.max(0, Math.min(1, value));

        if (this._targetProgress === value)
            return;

        this._targetProgress = value;

        if (this._speed === 0 || this._speed === 1) {
            this._progress = this._targetProgress;
            this._inner.style.width = (this._progress * 100) + '%';

            var progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
            if (progress !== this._lastProgress) {
                this._lastProgress = progress;
                this.emit('progress:' + progress);
                this.emit('progress', progress);
            }
        } else if (! this._animating) {
            requestAnimationFrame(this._animateHandler);
        }
    }
});


Object.defineProperty(Progress.prototype, 'speed', {
    get: function() {
        return this._speed;
    },
    set: function(value) {
        this._speed = Math.max(0, Math.min(1, value));
    }
});


Object.defineProperty(Progress.prototype, 'failed', {
    get: function() {
        return this._failed;
    },
    set: function(value) {
        this._failed = !! value;

        if (this._failed) {
            this.class.add('failed');
        } else {
            this.class.remove('failed');
        }
    }
});


Progress.prototype._animate = function() {
    if (Math.abs(this._targetProgress - this._progress) < 0.01) {
        this._progress = this._targetProgress;
        this._animating = false;
    } else {
        if (! this._animating) {
            this._now = Date.now() - (1000 / 60);
            this._animating = true;
        }
        requestAnimationFrame(this._animateHandler);

        var dt = Math.max(0.1, Math.min(3, (Date.now() - this._now) / (1000 / 60)));
        this._now = Date.now();
        this._progress = this._progress + ((this._targetProgress - this._progress) * (this._speed * dt));
    }

    var progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
    if (progress !== this._lastProgress) {
        this._lastProgress = progress;
        this.emit('progress:' + progress);
        this.emit('progress', progress);
    }

    this._inner.style.width = (this._progress * 100) + '%';
};


window.ui.Progress = Progress;


/* ui/list.js */
"use strict";

function List(args) {
    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.classList.add('ui-list');
    this.selectable = args.selectable !== undefined ? args.selectable : true;

    this.on('select', this._onSelect);
}
List.prototype = Object.create(ui.ContainerElement.prototype);


List.prototype._onSelect = function(item) {
    var items = this.element.querySelectorAll('.ui-list-item.selected');

    if (items.length > 1) {
        for(var i = 0; i < items.length; i++) {
            if (items[i].ui === item)
                continue;

            items[i].ui.selected = false;
        }
    }
};


Object.defineProperty(List.prototype, 'selectable', {
    get: function() {
        return this._selectable;
    },
    set: function(value) {
        if (this._selectable === !! value)
            return;

        this._selectable = value;

        if (this._selectable) {
            this.class.add('selectable');
        } else {
            this.class.remove('selectable');
        }
    }
});


Object.defineProperty(List.prototype, 'selected', {
    get: function() {
        var items = [ ];
        var elements = this.element.querySelectorAll('.ui-list-item.selected');

        for(var i = 0; i < elements.length; i++) {
            items.push(elements[i].ui);
        }

        return items;
    },
    set: function(value) {
        // deselecting
        var items = this.selected;
        for(var i = 0; i < items.length; i++) {
            if (value.indexOf(items[i]) !== -1)
                continue;
            items[i].selected = false;
        }

        // selecting
        for(var i = 0; i < value.length; i++) {
            value[i].selected = true;
        }
    }
});


window.ui.List = List;


/* ui/list-item.js */
"use strict";

function ListItem(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selected = args.selected || false;

    this.element = document.createElement('li');
    this.element.classList.add('ui-list-item');

    this.elementText = document.createElement('span');
    this.elementText.textContent = this._text;
    this.element.appendChild(this.elementText);

    this.on('click', this._onClick);
}
ListItem.prototype = Object.create(ui.Element.prototype);


ListItem.prototype._onClick = function() {
    this.selected = ! this.selected;
};


Object.defineProperty(ListItem.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.elementText.textContent = this._text;
    }
});


Object.defineProperty(ListItem.prototype, 'selected', {
    get: function() {
        return this._selected;
    },
    set: function(value) {
        if (this._selected === value)
            return;

        this._selected = value;

        if (this._selected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');
        this.emit('change', this.selected);

        if (this.parent) {
            this.parent.emit(this.selected ? 'select' : 'deselect', this);
        }
    }
});


window.ui.ListItem = ListItem;


/* ui/grid.js */
"use strict";

function Grid() {
    var self = this;
    ui.ContainerElement.call(this);

    this.element = document.createElement('ul');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid');

    this._lastSelect = null;
    this._selecting = false;

    this.on('select', this._onSelect);
    this.on('beforeDeselect', this._onBeforeDeselect);

    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);
}
Grid.prototype = Object.create(ui.ContainerElement.prototype);


Grid.prototype._onSelect = function(item) {
    if (this._selecting)
        return;

    if (Grid._shift && Grid._shift()) {
        var children = Array.prototype.slice.call(this.element.childNodes, 0);

        // multi select from-to
        if (this._lastSelect) {
            this._selecting = true;

            var startInd = children.indexOf(this._lastSelect.element);
            var endInd = children.indexOf(item.element);

            // swap if backwards
            if (startInd > endInd) {
                var t = startInd;
                startInd = endInd;
                endInd = t;
            }

            for(var i = startInd; i < endInd; i++) {
                if (! children[i] || ! children[i].ui || children[i].ui.hidden)
                    continue;

                children[i].ui.selected = true;
            }

            this._selecting = false;
        } else {
            this._lastSelect = item;
        }
    } else if (Grid._ctrl && Grid._ctrl()) {
        // multi select
        this._lastSelect = item;
    } else {
        // single select
        var items = this.element.querySelectorAll('.ui-grid-item.selected');

        if (items.length > 1) {
            for(var i = 0; i < items.length; i++) {
                if (items[i].ui === item)
                    continue;

                items[i].ui.selected = false;
            }
        }

        this._lastSelect = item;
    }
};


Grid.prototype._onBeforeDeselect = function(item) {
    if (this._selecting)
        return;

    this._selecting = true;

    if (Grid._shift && Grid._shift()) {
        this._lastSelect = null;
    } else if (Grid._ctrl && Grid._ctrl()) {
        this._lastSelect = null;
    } else {
        var items = this.element.querySelectorAll('.ui-grid-item.selected');
        if (items.length > 1) {
            for(var i = 0; i < items.length; i++) {
                if (items[i].ui === item)
                    continue;
                items[i].ui.selected = false;
            }
            item._selectPending = true;
            this._lastSelect = item;
        }
    }

    this._selecting = false;
};


Grid.prototype.filter = function(fn) {
    this.forEach(function(item) {
        item.hidden = ! fn(item);
    });
};


Grid.prototype.forEach = function(fn) {
    var child = this.element.firstChild;
    while(child) {
        if (child.ui)
            fn(child.ui);

        child = child.nextSibling;
    };
};

Object.defineProperty(Grid.prototype, 'selected', {
    get: function() {
        var items = [ ];
        var elements = this.element.querySelectorAll('.ui-grid-item.selected');

        for(var i = 0; i < elements.length; i++)
            items.push(elements[i].ui);

        return items;
    },
    set: function(value) {
        if (this._selecting)
            return;

        this._selecting = true;

        // deselecting
        var items = this.selected;
        for(var i = 0; i < items.length; i++) {
            if (value && value.indexOf(items[i]) !== -1)
                continue;
            items[i].selected = false;
        }

        if (! value)
            return;

        // selecting
        for(var i = 0; i < value.length; i++) {
            if (! value[i])
                continue;

            value[i].selected = true;
        }

        this._selecting = false;
    }
});


window.ui.Grid = Grid;


/* ui/grid-item.js */
"use strict";

function GridItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';
    this._selectPending = false;
    this._selected = args.selected || false;
    this._clicked = false;

    this.element = document.createElement('li');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.classList.add('ui-grid-item');
    this.element.innerHTML = this._text;

    this.element.removeEventListener('click', this._evtClick);
    this.element.addEventListener('click', this._onClick, false);

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
}
GridItem.prototype = Object.create(ui.Element.prototype);


GridItem.prototype._onClick = function() {
    this.ui.emit('click');
    this.ui._clicked = true;
    this.ui.selected = ! this.ui.selected;
    this.ui._clicked = false;
};

GridItem.prototype._onSelect = function() {
    this.element.focus();
};

GridItem.prototype._onDeselect = function() {
    this.element.blur();
};


Object.defineProperty(GridItem.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


Object.defineProperty(GridItem.prototype, 'selected', {
    get: function() {
        return this._selected;
    },
    set: function(value) {
        if (this._selected === value)
            return;

        this._selectPending = value;

        if (this.parent && this._clicked)
            this.parent.emit('before' + (value ? 'Select' : 'Deselect'), this, this._clicked);

        if (this._selected === this._selectPending)
            return;

        this._selected = this._selectPending;

        if (this._selected) {
            this.element.classList.add('selected');
        } else {
            this.element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');
        this.emit('change', this.selected);

        if (this.parent)
            this.parent.emit(this.selected ? 'select' : 'deselect', this, this._clicked);
    }
});


window.ui.GridItem = GridItem;


/* ui/tree.js */
"use strict";

function Tree() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree');

    this.elementDrag = document.createElement('div');
    this.elementDrag.classList.add('drag-handle');
    this.element.appendChild(this.elementDrag);

    var self = this;
    this.elementDrag.addEventListener('mousemove', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        self._onDragMove(evt);
    });
    this.element.addEventListener('mouseleave', function(evt) {
        self._onDragOut();
    });

    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);

    this.draggable = true;
    this._dragging = false;
    this._dragItems = [ ];
    this._dragOver = null;
    this._dragArea = 'inside';
    this._evtDragMove = null;
    this.reordering = true;
    this.dragInstant = true;

    this._selected = [ ];
}
Tree.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Tree.prototype, 'selected', {
    get: function() {
        return this._selected.slice(0);
    },
    set: function(value) {

    }
});


Tree.prototype._onItemClick = function(item) {
    if (Tree._ctrl && Tree._ctrl()) {
        item.selected = ! item.selected;
    } else if (Tree._shift && Tree._shift() && this._selected.length) {
        var from = this._selected[this._selected.length - 1];
        var to = item;

        var up = [ ];
        var down = [ ];

        var prev = function(refItem) {
            var result = null;
            var item = refItem.element.previousSibling;
            if (item)
                item = item.ui;

            if (item) {
                if (refItem.parent && refItem.parent === item && refItem.parent instanceof TreeItem) {
                    result = refItem.parent;
                } else if (item.open && item._children) {
                    // element above is open, find last available element
                    var last = item.element.lastChild;
                    if (last.ui)
                        last = last.ui;

                    if (last) {
                        var findLast = function(inside) {
                            if (inside.open && inside._children) {
                                return inside.element.lastChild.ui || null;
                            } else {
                                return null;
                            }
                        }

                        var found = false;
                        while(! found) {
                            var deeper = findLast(last);
                            if (deeper) {
                                last = deeper;
                            } else {
                                found = true;
                            }
                        }

                        result = last;
                    } else {
                        result = item;
                    }
                } else {
                    result = item;
                }
            }

            return result;
        };

        var next = function(refItem) {
            var result = null;
            var item = refItem.element.nextSibling;
            if (item)
                item = item.ui;

            if (refItem.open && refItem._children) {
                // select a child
                var first = refItem.element.firstChild.nextSibling;
                if (first && first.ui) {
                    result = first.ui;
                } else if (item) {
                    result = item;
                }
            } else if (item) {
                // select next item
                result = item;
            } else if (refItem.parent && refItem.parent instanceof TreeItem) {
                // no next element, go to parent
                var parent = refItem.parent;

                var findNext = function(from) {
                    var next = from.next;
                    if (next) {
                        result = next;
                    } else if (from.parent instanceof TreeItem) {
                        return from.parent;
                    }
                    return false;
                }

                while(parent = findNext(parent)) { }
            }

            return result;
        };

        var done = false;
        var path = null;
        var lookUp = true;
        var lookDown = true;
        var lookingUp = true;
        while(! done && ! path) {
            lookingUp = ! lookingUp;

            var item = null;
            var lookFrom = from;
            if ((! lookDown || lookingUp) && lookUp) {
                // up
                if (up.length)
                    lookFrom = up[up.length - 1];

                item = prev(lookFrom);
                if (item) {
                    up.push(item);

                    if (item === to) {
                        done = true;
                        path = up;
                        break;
                    }
                } else {
                    lookUp = false;
                }
            } else if (lookDown) {
                // down
                if (down.length)
                    lookFrom = down[down.length - 1];

                item = next(lookFrom);
                if (item) {
                    down.push(item);

                    if (item === to) {
                        done = true;
                        path = down;
                        break;
                    }
                } else {
                    lookDown = false;
                }
            } else {
                done = true;
            }
        }

        if (path) {
            for(var i = 0; i < path.length; i++) {
                path[i].selected = true;
            }
        }


    } else {
        var selected = item.selected && ((this._selected.indexOf(item) === -1) || (this._selected.length === 1 && this._selected[0] === item));
        this.clear();

        if (! selected)
            item.selected = true;
    }
};


Tree.prototype._onSelect = function(item) {
    this._selected.push(item);
};


Tree.prototype._onDeselect = function(item) {
    var ind = this._selected.indexOf(item);
    if (ind === -1)
        return;

    this._selected.splice(ind, 1);
};


Tree.prototype.clear = function() {
    if (! this._selected.length)
        return;

    var i = this._selected.length;
    while(i--) {
        this._selected[i].selected = false;
    }
    this._selected = [ ];
}


Tree.prototype._onDragStart = function(item) {
    if (! this.draggable || this._dragging)
        return;

    this._dragItems =  [ ];

    if (this._selected && this._selected.length > 1 && this._selected.indexOf(item) !== -1) {
        var items = [ ];
        var index = { };
        var defaultLevel = -1;

        // build index
        for(var i = 0; i < this._selected.length; i++) {
            // cant drag parent
            if (this._selected[i].parent === this)
                return;

            this._selected[i]._dragId = i + 1;
            index[this._selected[i]._dragId] = this._selected[i];
        }

        for(var i = 0; i < this._selected.length; i++) {
            var s = this._selected[i];
            var level = 0;
            var child = false;
            var parent = this._selected[i].parent;
            if (! (parent instanceof ui.TreeItem))
                parent = null;

            while(parent) {
                if (parent._dragId && index[parent._dragId]) {
                    // child, to be ignored
                    child = true;
                    break;
                }

                parent = parent.parent;
                if (! (parent instanceof ui.TreeItem)) {
                    parent = null;
                    break;
                }

                level++;
            }

            if (! child) {
                if (defaultLevel === -1) {
                    defaultLevel = level;
                } else if (defaultLevel !== level) {
                    // multi-level drag no allowed
                    return;
                }

                items.push(this._selected[i]);
            }
        }

        // clean ids
        for(var i = 0; i < this._selected.length; i++)
            this._selected[i]._dragId = null;

        this._dragItems = items;

        // sort items by their number of apperance in hierarchy
        if (items.length > 1) {
            var commonParent = null;

            // find common parent
            var findCommonParent = function(items) {
                var parents = [ ];
                for(var i = 0; i < items.length; i++) {
                    if (parents.indexOf(items[i].parent) === -1)
                        parents.push(items[i].parent);
                }
                if (parents.length === 1) {
                    commonParent = parents[0];
                } else {
                    return parents;
                }
            };
            var parents = items;
            while(! commonParent && parents)
                parents = findCommonParent(parents);

            // calculate ind number
            for(var i = 0; i < items.length; i++) {
                var ind = 0;

                var countChildren = function(item) {
                    if (! item._children) {
                        return 0;
                    } else {
                        var count = 0;
                        var children = item.innerElement.childNodes;
                        for(var i = 0; i < children.length; i++) {
                            if (children[i].ui)
                                count += countChildren(children[i]) + 1;
                        }
                        return count;
                    }
                };

                var scanUpForIndex = function(item) {
                    ind++;

                    var sibling = item.element.previousSibling;
                    sibling = (sibling && sibling.ui) || null;

                    if (sibling) {
                        ind += countChildren(sibling);
                        return sibling;
                    } else if (item.parent === commonParent) {
                        return null;
                    } else {
                        return item.parent;
                    }
                };

                var prev = scanUpForIndex(items[i]);
                while(prev)
                    prev = scanUpForIndex(prev);

                items[i]._dragInd = ind;
            }

            items.sort(function(a, b) {
                return a._dragInd - b._dragInd;
            });
        }
    } else {
        // single drag
        this._dragItems = [ item ];
    }

    if (this._dragItems.length) {
        this._dragging = true;

        this.class.add('dragging');
        for(var i = 0; i < this._dragItems.length; i++) {
            this._dragItems[i].open = false;
            this._dragItems[i].class.add('dragged');
        }

        this._updateDragHandle();
        this.emit('dragstart');
    }
};


Tree.prototype._onDragOver = function(item, evt) {
    if (! this.draggable || ! this._dragging || (this._dragItems.indexOf(item) !== -1 && ! this._dragOver) || this._dragOver === item)
        return;

    var dragOver = null;

    if (this._dragItems.indexOf(item) === -1)
        dragOver = item;

    if (this._dragOver === null && dragOver)
        this.emit('dragin');

    this._dragOver = dragOver;

    this._updateDragHandle();
    this._onDragMove(evt);
};


Tree.prototype._hoverCalculate = function(evt) {
    if (! this.draggable || ! this._dragOver)
        return;

    var rect = this.elementDrag.getBoundingClientRect();
    var area = Math.floor((evt.clientY - rect.top) / rect.height * 5);

    var oldArea = this._dragArea;
    var oldDragOver = this._dragOver;

    if (this._dragOver.parent === this) {
        var parent = false;
        for(var i = 0; i < this._dragItems.length; i++) {
            if (this._dragItems[i].parent === this._dragOver) {
                parent = true;
                this._dragOver = null;
                break;
            }
        }
        if (! parent)
            this._dragArea = 'inside';
    } else if (this.reordering && area <= 1 && this._dragItems.indexOf(this._dragOver.prev) === -1) {
        this._dragArea = 'before';
    } else if (this.reordering && area >= 4 && this._dragItems.indexOf(this._dragOver.next) === -1 && (this._dragOver._children === 0 || ! this._dragOver.open)) {
        this._dragArea = 'after';
    } else {
        var parent = false;
        if (this.reordering && this._dragOver.open) {
            for(var i = 0; i < this._dragItems.length; i++) {
                if (this._dragItems[i].parent === this._dragOver) {
                    parent = true;
                    this._dragArea = 'before';
                    break;
                }
            }
        }
        if (! parent)
            this._dragArea = 'inside';
    }

    if (oldArea !== this._dragArea || oldDragOver !== this._dragOver)
        this._updateDragHandle();
};


Tree.prototype._onDragMove = function(evt) {
    if (! this.draggable)
        return;

    this._hoverCalculate(evt);
    this.emit('dragmove', evt);
};


Tree.prototype._onDragOut = function() {
    if (! this.draggable || ! this._dragging || ! this._dragOver)
        return;

    this._dragOver = null;
    this._updateDragHandle();
    this.emit('dragout');
};


Tree.prototype._onDragEnd = function() {
    if (! this.draggable || ! this._dragging)
        return;

    var reparentedItems = [ ];
    this._dragging = false;
    this.class.remove('dragging');

    var lastDraggedItem = this._dragOver;

    for(var i = 0; i < this._dragItems.length; i++) {
        this._dragItems[i].class.remove('dragged');

        if (this._dragOver && this._dragOver !== this._dragItems[i]) {

            var oldParent = this._dragItems[i].parent;

            if (oldParent !== this._dragOver || this._dragArea !== 'inside') {
                var newParent = null;

                if (this.dragInstant) {
                    if (this._dragItems[i].parent)
                        this._dragItems[i].parent.remove(this._dragItems[i]);
                }

                if (this._dragArea === 'before') {
                    newParent = this._dragOver.parent;
                    if (this.dragInstant)
                        this._dragOver.parent.appendBefore(this._dragItems[i], this._dragOver);
                } else if (this._dragArea === 'inside') {
                    newParent = this._dragOver;
                    if (this.dragInstant) {
                        this._dragOver.open = true;
                        this._dragOver.append(this._dragItems[i]);
                    }
                } else if (this._dragArea === 'after') {
                    newParent = this._dragOver.parent;
                    if (this.dragInstant) {
                        this._dragOver.parent.appendAfter(this._dragItems[i], lastDraggedItem);
                        lastDraggedItem = this._dragItems[i];
                    }
                }

                reparentedItems.push({
                    item: this._dragItems[i],
                    old: oldParent,
                    new: newParent
                });
            }
        }
    }

    this.emit('reparent', reparentedItems);

    this._dragItems = [ ];

    if (this._dragOver)
        this._dragOver = null;

    this.emit('dragend');
};


Tree.prototype._updateDragHandle = function() {
    if (! this.draggable || ! this._dragging)
        return;

    if (! this._dragOver) {
        this.elementDrag.classList.add('hidden');
    } else {
        var rect = this._dragOver.elementTitle.getBoundingClientRect();

        this.elementDrag.classList.remove('before', 'inside', 'after', 'hidden')
        this.elementDrag.classList.add(this._dragArea);

        this.elementDrag.style.top = rect.top  + 'px';
        this.elementDrag.style.left = rect.left + 'px';
        this.elementDrag.style.width = (rect.width - 4) + 'px';
    }
};


Tree.prototype._onAppend = function(item) {
    item.tree = this;

    var self = this;

    item.on('dragstart', function() {
        // can't drag root
        if (this.parent === self)
            return;

        self._onDragStart(this);
    });

    item.on('mouseover', function(evt) {
        self._onDragOver(this, evt);
    });

    item.on('dragend', function() {
        self._onDragEnd();
    });
};


Tree.prototype._onRemove = function(item) {
    item.tree = null;

    item.unbind('dragstart');
    item.unbind('mouseover');
    item.unbind('dragend');
};

window.ui.Tree = Tree;


/* ui/tree-item.js */
"use strict";

function TreeItem(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.tree = null;

    this.element = document.createElement('div');
    this.element.classList.add('ui-tree-item');
    this.element.ui = this;

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.elementTitle.draggable = true;
    this.elementTitle.tabIndex = 0;
    this.elementTitle.ui = this;
    this.element.appendChild(this.elementTitle);

    this.elementIcon = document.createElement('span');
    this.elementIcon.classList.add('icon');
    this.elementTitle.appendChild(this.elementIcon);

    this.elementText = document.createElement('span');
    this.elementText.textContent = args.text || '';
    this.elementText.classList.add('text');
    this.elementTitle.appendChild(this.elementText);

    this._children = 0;
    this.selectable = true;

    this._onMouseUp = function(evt) {
        window.removeEventListener('mouseup', self._dragRelease);
        self._dragRelease = null;

        evt.preventDefault();
        evt.stopPropagation();

        self._dragging = false;
        self.emit('dragend');
    };

    this.elementTitle.addEventListener('click', this._onClick, false);
    this.elementTitle.addEventListener('dblclick', this._onDblClick, false);

    this._dragRelease = null;
    this._dragging = false;
    this.elementTitle.addEventListener('mousedown', this._onMouseDown, false);
    this.elementTitle.addEventListener('dragstart', this._onDragStart, false);
    this.elementTitle.addEventListener('mouseover', this._onMouseOver, false);

    this.on('destroy', this._onDestroy);
    this.on('append', this._onAppend);
    this.on('remove', this._onRemove);
    this.on('select', this._onSelect);
    this.on('deselect', this._onDeselect);

    this.elementTitle.addEventListener('keydown', this._onKeyDown, false);
}
TreeItem.prototype = Object.create(ui.Element.prototype);


TreeItem.prototype.append = function(item) {
    if (this._children === 1) {
        this.element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this.element.appendChild(item.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendBefore = function(item, referenceItem) {
    if (this._children === 1) {
        this.element.childNodes[1].classList.remove('single');
    }

    item.parent = this;
    this.element.insertBefore(item.element, referenceItem.element);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children > 1) {
        item.class.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.appendAfter = function(item, referenceItem) {
    item.parent = this;
    referenceItem = referenceItem.element.nextSibling;

    // might be last
    if (! referenceItem)
        this.append(item);

    this.element.insertBefore(item.element, referenceItem);
    this._children++;

    if (this._children === 1) {
        item.class.add('single');
        this.class.add('container');
    } else if (this._children === 2) {
        this.element.childNodes[1].classList.remove('single');
    }

    var appendChildren = function(treeItem) {
        treeItem.emit('append', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                appendChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    appendChildren(item);
};


TreeItem.prototype.remove = function(item) {
    if (! this._children || ! this.element.contains(item.element))
        return;

    this.element.removeChild(item.element);
    this._children--;

    if (this._children === 0) {
        this.class.remove('container');
    } else if (this._children === 1 && this.element.childNodes.length > 2) {
        this.element.childNodes[1].classList.add('single');
    }

    var removeChildren = function(treeItem) {
        treeItem.emit('remove', treeItem);

        if (treeItem._children) {
            for(var i = 1; i < treeItem.element.childNodes.length; i++) {
                removeChildren(treeItem.element.childNodes[i].ui);
            }
        }
    };
    removeChildren(item);
};


TreeItem.prototype._onDestroy = function() {
    this.elementTitle.removeEventListener('click', this._onClick);
    this.elementTitle.removeEventListener('dblclick', this._onDblClick);
    this.elementTitle.removeEventListener('mousedown', this._onMouseDown);
    this.elementTitle.removeEventListener('dragstart', this._onDragStart);
    this.elementTitle.removeEventListener('mouseover', this._onMouseOver);
    this.elementTitle.removeEventListener('keydown', this._onKeyDown);
};


TreeItem.prototype._onAppend = function(item) {
    if (this.parent)
        this.parent.emit('append', item);
};


TreeItem.prototype._onRemove = function(item) {
    if (this.parent)
        this.parent.emit('remove', item);
};


TreeItem.prototype.focus = function() {
    this.elementTitle.focus();
};

TreeItem.prototype._onRename = function() {
    this.tree.clear();
    this.tree._onItemClick(this);

    var self = this;
    this.class.add('rename');

    // add remaning field
    var field = new ui.TextField();
    field.parent = this;
    field.renderChanges = false;
    field.value = this.text;
    field.elementInput.addEventListener('blur', function() {
        field.destroy();
        self.class.remove('rename');
    }, false);
    field.on('click', function(evt) {
        evt.stopPropagation();
    });
    field.element.addEventListener('dblclick', function(evt) {
        evt.stopPropagation();
    });
    field.on('change', function(value) {
        value = value.trim();
        if (value)
            self.entity.set('name', value);

        field.destroy();
        self.class.remove('rename');
    });
    this.elementTitle.appendChild(field.element);
    field.elementInput.focus();
    field.elementInput.select();
};


TreeItem.prototype._onClick = function(evt) {
    if (evt.button !== 0 || ! this.ui.selectable)
        return;

    var rect = this.getBoundingClientRect();

    if (this.ui._children && (evt.clientX - rect.left) < 0) {
        this.ui.open = ! this.ui.open;
    } else {
        this.ui.tree._onItemClick(this.ui);
        evt.stopPropagation();
    }
};

TreeItem.prototype._onDblClick = function(evt) {
    if (! this.ui.tree.allowRenaming || evt.button !== 0 || this.ui.disabled)
        return;

    evt.stopPropagation();
    var rect = this.getBoundingClientRect();

    if (this.ui._children && (evt.clientX - rect.left) < 0) {
        return;
    } else {
        this.ui._onRename();
    }
};

TreeItem.prototype._onMouseDown = function(evt) {
    if (this.ui.tree.disabled || ! this.ui.tree.draggable)
        return;

    evt.stopPropagation();
};

TreeItem.prototype._onDragStart = function(evt) {
    if (this.ui.tree.disabled || ! this.ui.tree.draggable) {
        evt.stopPropagation();
        evt.preventDefault();
        return;
    }

    this.ui._dragging = true;

    if (this.ui._dragRelease)
        window.removeEventListener('mouseup', this.ui._dragRelease);

    this.ui._dragRelease = this.ui._onMouseUp;
    window.addEventListener('mouseup', this.ui._dragRelease, false);

    evt.stopPropagation();
    evt.preventDefault();

    this.ui.emit('dragstart');
};

TreeItem.prototype._onMouseOver = function(evt) {
    evt.stopPropagation();
    this.ui.emit('mouseover', evt);
};

TreeItem.prototype._onKeyDown = function(evt) {
    if ((evt.target && evt.target.tagName.toLowerCase() === 'input'))
        return;

    if ([ 9, 38, 40, 37, 39 ].indexOf(evt.keyCode) === -1)
        return;

    evt.preventDefault();
    evt.stopPropagation();

    var selectedItem = null;

    switch(evt.keyCode) {
        case 9: // tab
            break;
        case 40: // down
            var item = this.ui.element.nextSibling;
            if (item)
                item = item.ui;

            if (this.ui._children && this.ui.open) {
                var first = this.ui.element.firstChild.nextSibling;
                if (first && first.ui) {
                    selectedItem = first.ui;
                    // first.ui.selected = true;
                } else if (item) {
                    selectedItem = item;
                    // item.selected = true;
                }
            } else if (item) {
                selectedItem = item;
                // item.selected = true;
            } else if (this.ui.parent && this.ui.parent instanceof TreeItem) {
                var parent = this.ui.parent;

                var findNext = function(from) {
                    var next = from.next;
                    if (next) {
                        selectedItem = next;
                        // next.selected = true;
                    } else if (from.parent instanceof TreeItem) {
                        return from.parent;
                    }
                    return false;
                };

                while(parent = findNext(parent)) { }
            }
            break;
        case 38: // up
            var item = this.ui.element.previousSibling;
            if (item)
                item = item.ui;

            if (item) {
                if (item._children && item.open && item !== this.ui.parent) {
                    var last = item.element.lastChild;
                    if (last.ui)
                        last = last.ui;

                    if (last) {
                        var findLast = function(inside) {
                            if (inside._children && inside.open) {
                                return inside.element.lastChild.ui || null;
                            } else {
                                return null;
                            }
                        }

                        var found = false;
                        while(! found) {
                            var deeper = findLast(last);
                            if (deeper) {
                                last = deeper
                            } else {
                                found = true;
                            }
                        }

                        selectedItem = last;
                        // last.selected = true;
                    } else {
                        selectedItem = item;
                        // item.selected = true;
                    }
                } else {
                    selectedItem = item;
                    // item.selected = true;
                }
            } else if (this.ui.parent && this.ui.parent instanceof TreeItem) {
                selectedItem = this.ui.parent;
                // this.ui.parent.selected = true;
            }

            break;
        case 37: // left (close)
            if (this.ui.parent !== this.ui.tree && this.ui.open)
                this.ui.open = false;
            break;
        case 39: // right (open)
            if (this.ui._children && ! this.ui.open)
                this.ui.open = true;
            break;
    }

    if (selectedItem) {
        if (! (Tree._ctrl && Tree._ctrl()) && ! (Tree._shift && Tree._shift()))
            this.ui.tree.clear();
        selectedItem.selected = true;
    }
};

TreeItem.prototype._onSelect = function() {
    this.elementTitle.focus();
};

TreeItem.prototype._onDeselect = function() {
    this.elementTitle.blur();
};


Object.defineProperty(TreeItem.prototype, 'selected', {
    get: function() {
        return this.class.contains('selected');
    },
    set: function(value) {
        if (this.class.contains('selected') === !! value)
            return;

        if (value) {
            this.class.add('selected');

            this.emit('select');
            if (this.tree)
                this.tree.emit('select', this);

        } else {
            this.class.remove('selected');

            this.emit('deselect');
            if (this.tree)
                this.tree.emit('deselect', this);
        }
    }
});


Object.defineProperty(TreeItem.prototype, 'text', {
    get: function() {
        return this.elementText.textContent;
    },
    set: function(value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(TreeItem.prototype, 'open', {
    get: function() {
        return this.class.contains('open');
    },
    set: function(value) {
        if (this.class.contains('open') === !! value)
            return;

        if (value) {
            this.class.add('open');
            this.emit('open');
            this.tree.emit('open', this);
        } else {
            this.class.remove('open');
            this.emit('close');
            this.tree.emit('close', this);
        }
    }
});


Object.defineProperty(TreeItem.prototype, 'prev', {
    get: function() {
        return this.element.previousSibling && this.element.previousSibling.ui || null;
    }
});


Object.defineProperty(TreeItem.prototype, 'next', {
    get: function() {
        return this.element.nextSibling && this.element.nextSibling.ui || null;
    }
});


TreeItem.prototype.child = function(ind) {
    return this.element.childNodes[ind + 1];
};



window.ui.TreeItem = TreeItem;


/* ui/tooltip.js */
"use strict";

function Tooltip(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-tooltip', 'align-left');

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('inner');
    this.element.appendChild(this.innerElement);

    this.arrow = document.createElement('div');
    this.arrow.classList.add('arrow');
    this.element.appendChild(this.arrow);

    this.hoverable = args.hoverable || false;

    this.x = args.x || 0;
    this.y = args.y || 0;

    this._align = 'left';
    this.align = args.align || 'left';

    this.on('show', this._reflow);
    this.hidden = args.hidden !== undefined ? args.hidden : true;
    if (args.html) {
        this.html = args.html;
    } else {
        this.text = args.text || '';
    }

    this.element.addEventListener('mouseover', function(evt) {
        if (! self.hoverable)
            return;

        self.hidden = false;
        self.emit('hover', evt);
    }, false);
    this.element.addEventListener('mouseleave', function() {
        if (! self.hoverable)
            return;

        self.hidden = true;
    }, false);
}
Tooltip.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Tooltip.prototype, 'align', {
    get: function() {
        return this._align;
    },
    set: function(value) {
        if (this._align === value)
            return;

        this.class.remove('align-' + this._align);
        this._align = value;
        this.class.add('align-' + this._align);

        this._reflow();
    }
});


Object.defineProperty(Tooltip.prototype, 'flip', {
    get: function() {
        return this.class.contains('flip');
    },
    set: function(value) {
        if (this.class.contains('flip') === value)
            return;

        if (value) {
            this.class.add('flip');
        } else {
            this.class.remove('flip');
        }

        this._reflow();
    }
});


Object.defineProperty(Tooltip.prototype, 'text', {
    get: function() {
        return this.innerElement.textContent;
    },
    set: function(value) {
        if (this.innerElement.textContent === value)
            return;

        this.innerElement.textContent = value;
    }
});


Object.defineProperty(Tooltip.prototype, 'html', {
    get: function() {
        return this.innerElement.innerHTML;
    },
    set: function(value) {
        if (this.innerElement.innerHTML === value)
            return;

        this.innerElement.innerHTML = value;
    }
});


Tooltip.prototype._reflow = function() {
    if (this.hidden)
        return;

    this.element.style.top = '';
    this.element.style.right = '';
    this.element.style.bottom = '';
    this.element.style.left = '';

    this.arrow.style.top = '';
    this.arrow.style.right = '';
    this.arrow.style.bottom = '';
    this.arrow.style.left = '';

    this.element.style.display = 'block';

    // alignment
    switch(this._align) {
        case 'top':
            this.element.style.top = this.y + 'px';
            if (this.flip) {
                this.element.style.right = 'calc(100% - ' + this.x + 'px)';
            } else {
                this.element.style.left = this.x + 'px';
            }
            break;
        case 'right':
            this.element.style.top = this.y + 'px';
            this.element.style.right = 'calc(100% - ' + this.x + 'px)';
            break;
        case 'bottom':
            this.element.style.bottom = 'calc(100% - ' + this.y + 'px)';
            if (this.flip) {
                this.element.style.right = 'calc(100% - ' + this.x + 'px)';
            } else {
                this.element.style.left = this.x + 'px';
            }
            break;
        case 'left':
            this.element.style.top = this.y + 'px';
            this.element.style.left = this.x + 'px';
            break;
    }

    // limit to screen bounds
    var rect = this.element.getBoundingClientRect();

    if (rect.left < 0) {
        this.element.style.left = '0px';
        this.element.style.right = '';
    }
    if (rect.top < 0) {
        this.element.style.top = '0px';
        this.element.style.bottom = '';
    }
    if (rect.right > window.innerWidth) {
        this.element.style.right = '0px';
        this.element.style.left = '';
        this.arrow.style.left = Math.floor(rect.right - window.innerWidth + 8) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        this.element.style.bottom = '0px';
        this.element.style.top = '';
        this.arrow.style.top = Math.floor(rect.bottom - window.innerHeight + 8) + 'px';
    }

    this.element.style.display = '';
};


Tooltip.prototype.position = function(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);

    if (this.x === x && this.y === y)
        return;

    this.x = x;
    this.y = y;

    this._reflow();
};


Tooltip.attach = function(args) {
    var data = {
        align: args.align,
        hoverable: args.hoverable
    };

    if (args.html) {
        data.html = args.html;
    } else {
        data.text = args.text || '';
    }

    var item = new ui.Tooltip(data);

    item.evtHover = function() {
        var rect = args.target.getBoundingClientRect();
        var off = 16;

        switch(item.align) {
            case 'top':
                if (rect.width < 64) off = rect.width / 2;
                item.flip = rect.left + off > window.innerWidth / 2;
                if (item.flip) {
                    item.position(rect.right - off, rect.bottom);
                } else {
                    item.position(rect.left + off, rect.bottom);
                }
                break;
            case 'right':
                if (rect.height < 64) off = rect.height / 2;
                item.flip = false;
                item.position(rect.left, rect.top + off);
                break;
            case 'bottom':
                if (rect.width < 64) off = rect.width / 2;
                item.flip = rect.left + off > window.innerWidth / 2;
                if (item.flip) {
                    item.position(rect.right - off, rect.top);
                } else {
                    item.position(rect.left + off, rect.top);
                }
                break;
            case 'left':
                if (rect.height < 64) off = rect.height / 2;
                item.flip = false;
                item.position(rect.right, rect.top + off);
                break;
        }

        item.hidden = false;
    };

    item.evtBlur = function() {
        item.hidden = true;
    };

    args.target.addEventListener('mouseover', item.evtHover, false);
    args.target.addEventListener('mouseout', item.evtBlur, false);

    item.on('destroy', function() {
        args.target.removeEventListener('mouseover', item.evtHover);
        args.target.removeEventListener('mouseout', item.evtBlur);
    });

    args.root.append(item);

    return item;
};


window.ui.Tooltip = Tooltip;


/* ui/menu.js */
"use strict";

function Menu(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.ui = this;
    this.element.tabIndex = 1;
    this.element.classList.add('ui-menu');

    this.elementOverlay = document.createElement('div');
    this.elementOverlay.classList.add('overlay');
    this.elementOverlay.addEventListener('click', function() {
        self.open = false;
    }, false);
    this.elementOverlay.addEventListener('contextmenu', function() {
        self.open = false;
    }, false);
    this.element.appendChild(this.elementOverlay);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('inner');
    this.element.appendChild(this.innerElement);

    this.element.addEventListener('keydown', function(evt) {
        if (self.open && evt.keyCode === 27)
            self.open = false;
    });

    this.on('select-propagate', function(path) {
        this.open = false;
        this.emit(path.join('.') + ':select', path);
        this.emit('select', path);
    });

    this._index = { };
    this.on('append', function(item) {
        this._index[item._value] = item;

        item.on('value', function(value, valueOld) {
           delete self._index[this.valueOld];
           self._index[value] = item;
        });
        item.once('destroy', function() {
            delete self._index[this._value];
        });
    });

    this._hovered = [ ];
    this.on('over', function(path) {
        this._updatePath(path);
    });
    this.on('open', function(state) {
        if (state) return;
        this._updatePath([ ]);
    });
}
Menu.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Menu.prototype, 'open', {
    get: function() {
        return this.class.contains('open');
    },
    set: function(value) {
        if (this.class.contains('open') === !! value)
            return;

        if (value) {
            this.class.add('open');
            this.element.focus();
        } else {
            this.class.remove('open');
        }

        this.emit('open', !! value);
    }
});


Menu.prototype.findByPath = function(path) {
    if (! (path instanceof Array))
        path = path.split('.');

    var item = this;

    for(var i = 0; i < path.length; i++) {
        item = item._index[path[i]];
        if (! item)
            return null;
    }

    return item;
};


Menu.prototype._updatePath = function(path) {
    var node = this;

    for(var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];
        if (! node) break;
        if (path.length <= i || path[i] !== this._hovered[i]) {
            node.class.remove('hover');
            node.innerElement.style.top = '';
            node.innerElement.style.left = '';
            node.innerElement.style.right = '';
        }
    }

    this._hovered = path;
    node = this;

    for(var i = 0; i < this._hovered.length; i++) {
        node = node._index[this._hovered[i]];

        if (! node)
            break;

        node.class.add('hover');
        node.innerElement.style.top = '';
        node.innerElement.style.left = '';
        node.innerElement.style.right = '';

        var rect = node.innerElement.getBoundingClientRect();

        // limit to bottom / top of screen
        if (rect.bottom > window.innerHeight) {
            node.innerElement.style.top = -(rect.bottom - window.innerHeight) + 'px';
        }
        if (rect.right > window.innerWidth) {
            node.innerElement.style.left = 'auto';
            node.innerElement.style.right = (node.parent.innerElement.clientWidth) + 'px';
        }
    }
};


Menu.prototype.position = function(x, y) {
    this.element.style.display = 'block';

    var rect = this.innerElement.getBoundingClientRect();

    var left = (x || 0);
    var top = (y || 0);

    // limit to bottom / top of screen
    if (top + rect.height > window.innerHeight) {
        top = window.innerHeight - rect.height;
    } else if (top < 0) {
        top = 0;
    }
    if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width;
    } else if (left < 0) {
        left = 0;
    }

    this.innerElement.style.left = left + 'px';
    this.innerElement.style.top = top + 'px';

    this.element.style.display = '';
};


Menu.fromData = function(data) {
    var menu = new ui.Menu();

    var addItem = function(key, data) {
        var item = new ui.MenuItem({
            text: data.title || key,
            value: key,
            icon: data.icon
        });

        if (data.select) {
            item.on('select', data.select);
        }

        if (data.filter) {
            menu.on('open', function() {
                item.enabled = data.filter();
            });
        }

        if (data.hide) {
            menu.on('open', function () {
                item.hidden = data.hide();
            });
        }

        return item;
    };

    var listItems = function(data, parent) {
        for(var key in data) {
            var item = addItem(key, data[key]);
            parent.append(item);

            if (data[key].items)
                listItems(data[key].items, item);
        }
    };

    listItems(data, menu);

    return menu;
};


window.ui.Menu = Menu;


/* ui/menu-item.js */
"use strict";

function MenuItem(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this._value = args.value || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-menu-item');

    this.elementTitle = document.createElement('div');
    this.elementTitle.classList.add('title');
    this.element.appendChild(this.elementTitle);

    this.elementIcon = null;

    this.elementText = document.createElement('span');
    this.elementText.classList.add('text');
    this.elementText.textContent = args.text || 'Untitled';
    this.elementTitle.appendChild(this.elementText);

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);

    this._index = { };

    this._container = false;

    this.elementTitle.addEventListener('mouseenter', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        self.parent.emit('over', [ self._value ]);
    });

    this.on('over', function(path) {
        if (! this.parent)
            return;

        path.splice(0, 0, this._value);

        this.parent.emit('over', path);
    });

    this.elementTitle.addEventListener('click', function(evt) {
        if (! self.parent || self.disabled)
            return;

        self.emit('select', self._value);
        self.parent.emit('select-propagate', [ self._value ]);
        self.class.remove('hover');
    }, false);

    this.on('select-propagate', function(path) {
        if (! this.parent)
            return;

        path.splice(0, 0, this._value);

        this.parent.emit('select-propagate', path);
        this.class.remove('hover');
    });

    this.on('append', function(item) {
        this._container = true;
        this.class.add('container');

        this._index[item._value] = item;

        item.on('value', function(value, valueOld) {
           delete self._index[this.valueOld];
           self._index[value] = item;
        });
        item.once('destroy', function() {
            delete self._index[this._value];
        });
    });

    if (args.icon)
        this.icon = args.icon;
}
MenuItem.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(MenuItem.prototype, 'value', {
    get: function() {
        return this._value;
    },
    set: function(value) {
        if (this._value === value)
            return;

        var valueOld = this._value;
        this._value = value;
        this.emit('value', value, valueOld);
    }
});


Object.defineProperty(MenuItem.prototype, 'text', {
    get: function() {
        return this.elementText.textContent;
    },
    set: function(value) {
        if (this.elementText.textContent === value)
            return;

        this.elementText.textContent = value;
    }
});


Object.defineProperty(MenuItem.prototype, 'icon', {
    get: function() {
        return this.elementIcon.textContent;
    },
    set: function(value) {
        if ((! value && ! this.elementIcon) || (this.elementIcon && this.elementIcon.textContent === value))
            return;

        if (! value) {
            this.elementIcon.parentNode.removeChild(this.elementIcon);
            this.elementIcon = null;
        } else {
            if (! this.elementIcon) {
                this.elementIcon = document.createElement('span');
                this.elementIcon.classList.add('icon');
                this.elementTitle.insertBefore(this.elementIcon, this.elementText);
            }

            this.elementIcon.innerHTML = value;
        }
    }
});


window.ui.MenuItem = MenuItem;


/* ui/canvas.js */
"use strict";

function Canvas(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('canvas');
    this.class.add('ui-canvas');

    this.element.ui = this;

    if (args.id !== undefined)
        this.element.id = args.id;

    if (args.tabindex !== undefined)
        this.element.setAttribute('tabindex', args.tabindex);

    // Disable I-bar cursor on click+drag
    this.element.onselectstart = function () {
        return false;
    };
}

Canvas.prototype = Object.create(ui.Element.prototype);


Object.defineProperty(Canvas.prototype, 'width', {
    get: function() {
        return this.element.width;
    },
    set: function(value) {
        if (this.element.width === value)
            return;

        this.element.width = value;
        this.emit('resize', this.element.width, this.element.height);
    }
});


Object.defineProperty(Canvas.prototype, 'height', {
    get: function() {
        return this.element.height;
    },
    set: function(value) {
        if (this.element.height === value)
            return;

        this.element.height = value;
        this.emit('resize', this.element.width, this.element.height);
    }
});


Canvas.prototype.resize = function(width, height) {
    if (this.element.width === width && this.element.height === height)
        return;

    this.element.width = width;
    this.element.height = height;
    this.emit('resize', this.element.width, this.element.height);
};


window.ui.Canvas = Canvas;


/* ui/curve-field.js */
"use strict"

function CurveField(args) {
    var self = this;

    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-curve-field');
    this.element.ui = this;
    this.element.tabIndex = 0;
    this.element.addEventListener('keydown', this._onKeyDown.bind(this), false);

    // canvas to render mini version of curves
    this.canvas = new ui.Canvas();
    this.element.appendChild(this.canvas.element);
    this.canvas.on('resize', this._render.bind(this));

    // create checkerboard pattern
    this.checkerboardCanvas = new ui.Canvas();
    var size = 17;
    var halfSize = size/2;
    this.checkerboardCanvas.width = size;
    this.checkerboardCanvas.height = size;
    var ctx = this.checkerboardCanvas.element.getContext('2d');
    ctx.fillStyle = '#'
    ctx.fillStyle = "#949a9c";
    ctx.fillRect(0,0,halfSize,halfSize);
    ctx.fillRect(halfSize,halfSize,halfSize,halfSize);
    ctx.fillStyle = "#657375";
    ctx.fillRect(halfSize,0,halfSize,halfSize);
    ctx.fillRect(0,halfSize,halfSize,halfSize);

    this.checkerboard = this.canvas.element.getContext('2d').createPattern(this.checkerboardCanvas.element, 'repeat');

    this._value = null;

    // curve field can contain multiple curves
    this._paths = [];

    this._linkSetHandlers = [];
    this._resizeInterval = null;
    this._suspendEvents = false;

    this._name = args.name;

    this.curveNames = args.curves;

    this.gradient = !!(args.gradient);

    this.min = 0;
    if (args.min !== undefined)
        this.min = args.min;
    else if (args.verticalValue !== undefined)
        this.min = -args.verticalValue;


    this.max = 1;
    if (args.max !== undefined)
        this.max = args.max;
    else if (args.verticalValue !== undefined)
        this.max = args.verticalValue;
}
CurveField.prototype = Object.create(ui.Element.prototype);

CurveField.prototype._onKeyDown = function(evt) {
    // esc
    if (evt.keyCode === 27)
        return this.element.blur();

    // enter
    if (evt.keyCode !== 32 || this.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.emit('click');
};

CurveField.prototype._resize = function(width, height) {
    var changed = false;
    if (this.canvas.width !== width) {
        this.canvas.width = width;
        changed = true;
    }

    if (this.canvas.height !== height) {
        this.canvas.height = height;
        changed = true;
    }

    if (changed)
        this._render();
};

// Override link method to use multiple paths instead of one
CurveField.prototype.link = function(link, paths) {
    if (this._link) this.unlink();
    this._link = link;
    this._paths = paths;

    this.emit('link', paths);

    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    if (this._resizeInterval)
        clearInterval(this._resizeInterval);

    this._resizeInterval = setInterval(function() {
        var rect = this.element.getBoundingClientRect();
        this.canvas.resize(rect.width, rect.height);
    }.bind(this), 1000 / 20);

    if (this._onLinkChange) {
        var renderChanges = this.renderChanges;
        this.renderChanges = false;
        this._linkSetHandlers.push(this._link.on('*:set', function (path) {
            var paths = this._paths;
            var len = paths.length;
            for (var i = 0; i < len; i++) {
                if (path.indexOf(paths[i]) === 0) {
                    this._onLinkChange();
                    break;
                }
            }
        }.bind(this)));

        this._onLinkChange();

        this.renderChanges = renderChanges;
    }
};

// Override unlink method to use multiple paths instead of one
CurveField.prototype.unlink = function() {
    if (! this._link) return;

    this.emit('unlink', this._paths);

    this._linkSetHandlers.forEach(function (handler) {
        handler.unbind();
    });

    this._linkSetHandlers.length = 0;

    clearInterval(this._resizeInterval);

    this._link = null;
    this._value = null;
    this._paths.length = 0;
};


CurveField.prototype._onLinkChange = function () {
    if (this._suspendEvents) return;

    // gather values of all paths and set new value
    var values = [];

    for (var i = 0; i < this._paths.length; i++) {
        var value = this._link.get(this._paths[i]);
        if (value !== undefined) {
            values.push(value);
        } else {
            values.push(null);
        }
    }

    this._setValue(values);
};

Object.defineProperty(CurveField.prototype, 'value', {
    get: function() {
        return this._value;
    },
    set: function(value) {
        this._setValue(value);
    }
});

CurveField.prototype._setValue = function (value) {
    this._value = value;
    this._render();
    this.emit('change', value);
};

CurveField.prototype._render = function () {
    if (this.gradient) {
        this._renderGradient();
    } else {
        this._renderCurves();
    }
};

// clamp val between min and max only if it's less / above them but close to them
// this is mostly to allow splines to go over the limit but if they are too close to
// the edge then they will avoid rendering half-height lines
CurveField.prototype._clampEdge = function (val, min, max) {
    if (val < min && val > min - 2) return min;
    if (val > max && val < max + 2) return max;
    return val;
};

// Renders all curves
CurveField.prototype._renderCurves = function () {
    var canvas = this.canvas.element;
    var context = canvas.ctx = canvas.ctx || canvas.getContext('2d');
    var value = this.value;

    // draw background
    context.clearRect(0, 0, canvas.width, canvas.height);

    var curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)', 'rgb(255, 255, 255)'];
    var fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)', 'rgba(255, 255, 255, 0.5)'];

    var minMax = this._getMinMaxValues(value);

    // draw curves
    if (value && value[0]) {
        var primaryCurves = this._valueToCurves(value[0]);

        if (! primaryCurves)
            return;

        var secondaryCurves = value[0].betweenCurves && value.length > 1 ? this._valueToCurves(value[1]) : null;

        var minValue = minMax[0];
        var maxValue = minMax[1];

        context.lineWidth = 1;

        var height = canvas.height;

        for (var i = 0; i < primaryCurves.length; i++) {
            var val, x;

            context.strokeStyle = curveColors[i];
            context.fillStyle = fillColors[i];

            context.beginPath();
            context.moveTo(0, this._clampEdge(height * (1 - (primaryCurves[i].value(0) - minValue) / (maxValue - minValue)), 1, height - 1));

            var precision = 1;

            for(x = 0; x < Math.floor(canvas.width / precision); x++) {
                val = primaryCurves[i].value(x * precision / canvas.width);
                context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
            }

            if (secondaryCurves) {
                for(x = Math.floor(canvas.width / precision) ; x >= 0; x--) {
                    val = secondaryCurves[i].value(x * precision / canvas.width);
                    context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
                }

                context.closePath();
                context.fill();
            }

            context.stroke();
        }
    }
};

// Renders color-type graph as a gradient
CurveField.prototype._renderGradient = function () {
    var canvas = this.canvas.element;
    var context = canvas.ctx = canvas.cxt || canvas.getContext('2d');
    var value = this.value && this.value.length ? this.value[0] : null;

    context.fillStyle = this.checkerboard;
    context.fillRect(0, 0, canvas.width, canvas.height);

    var swizzle = [0, 1, 2, 3];
    if (this.curveNames && this.curveNames.length === 1) {
        if (this.curveNames[0] === 'g') {
            swizzle = [1, 0, 2, 3];
        } else if (this.curveNames[0] === 'b') {
            swizzle = [2, 1, 0, 3];
        } else if (this.curveNames[0] === 'a') {
            swizzle = [3, 1, 2, 0];
        }
    }


    if (value && value.keys && value.keys.length) {
        var rgb = [];

        var curve = this.curveNames && this.curveNames.length === 1 ? new pc.CurveSet([value.keys]) : new pc.CurveSet(value.keys);
        curve.type = value.type;

        var precision = 2;

        var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);

        for (var t = precision; t < canvas.width; t += precision) {
            curve.value(t / canvas.width, rgb);

            var rgba = Math.round((rgb[swizzle[0]] || 0) * 255) + ',' +
                       Math.round((rgb[swizzle[1]] || 0) * 255) + ',' +
                       Math.round((rgb[swizzle[2]] || 0) * 255) + ',' +
                       (isNaN(rgb[swizzle[3]]) ? 1 : rgb[swizzle[3]]);

            gradient.addColorStop(t / canvas.width, 'rgba(' + rgba + ')');
        }

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

    } else {
        // no keys in the curve so just render black color
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
},

// Returns minimum and maximum values for all curves
CurveField.prototype._getMinMaxValues = function (curves) {
    var minValue = Infinity;
    var maxValue = -Infinity;
    var i, len;

    if (curves) {
        if (curves.length === undefined) {
            curves = [curves];
        }

        curves.forEach(function (value) {
            if (value && value.keys && value.keys.length) {
                if (value.keys[0].length !== undefined) {
                    value.keys.forEach(function (data) {

                        for (i = 1, len = data.length; i < len; i += 2) {
                            if (data[i] > maxValue) {
                                maxValue = data[i];
                            }

                            if (data[i] < minValue) {
                                minValue = data[i];
                            }
                        }
                    });
                } else {
                    for (i = 1, len = value.keys.length; i < len; i += 2) {
                        if (value.keys[i] > maxValue) {
                            maxValue = value.keys[i];
                        }

                        if (value.keys[i] < minValue) {
                            minValue = value.keys[i];
                        }
                    }
                }
            }
        });
    }

    if (minValue === Infinity) {
        minValue = this.min;
    }

    if (maxValue === -Infinity) {
        maxValue = this.max;
    }

    // try to limit minValue and maxValue
    // between the min / max values for the curve field
    if (minValue > this.min) {
        minValue = this.min;
    }

    if (maxValue < this.max) {
        maxValue = this.max;
    }

    return [minValue, maxValue];
};

CurveField.prototype._valueToCurves = function (value) {
    var curves = null;

    if (value && value.keys && value.keys.length) {
        curves = [];
        var curve;
        if (value.keys[0].length !== undefined) {
            value.keys.forEach(function (data, index) {
                curve = new pc.Curve(data);
                curve.type = value.type;
                curves.push(curve);
            });
        } else {
            curve = new pc.Curve(value.keys);
            curve.type = value.type;
            curves.push(curve);
        }
    }

    return curves;
},

window.ui.CurveField = CurveField;


/* ui/autocomplete-element.js */
"use strict";

function AutoCompleteElement() {
    ui.Element.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-autocomplete', 'hidden');

    this._inputField = null;
    this._inputFieldPosition = null;

    this.innerElement = document.createElement('ul');
    this.element.appendChild(this.innerElement);

    // list of strings to show in the dropdown
    this._items = null;

    // child li elements
    this._childElements = null;

    // elements that are currently shown
    this._visibleElements = null;

    this._highlightedElement = null;

    this._filter = '';
}

AutoCompleteElement.prototype = Object.create(ui.Element.prototype);

// Get / Set list of strings to show in the dropdown
Object.defineProperty(AutoCompleteElement.prototype, 'items', {
    get: function () {
        return this._items;
    },

    set: function (value) {
        // delete existing elements
        if (this._childElements) {
            this._childElements.forEach(function (element) {
                element.parentElement.removeChild(element);
            });

            this._childElements = null;
            this._highlight(null);
        }

        this._items = value;

        if (value) {
            // sort items
            this._items.sort();

            // create new li elements for each string
            this._childElements = [];
            this._visibleElements = [];
            value.forEach(function (item) {
                var element = document.createElement('li');
                element.innerHTML = item;
                this._childElements.push(element);
                this._visibleElements.push(element);
                this.innerElement.appendChild(element);

                // click
                element.addEventListener('mousedown', function (e) {
                    e.preventDefault(); // prevent blur
                    this._select(element);
                }.bind(this), true);

                // hover
                element.addEventListener('mouseover', function () {
                    this._highlight(element, true);
                }.bind(this));

            }.bind(this));
        }
    }
});

// True if the autocomplete is visible and has a highlighted element
Object.defineProperty(AutoCompleteElement.prototype, 'isFocused', {
    get: function () {
        return !this.hidden && this._highlightedElement;
    }
});

// Attach the autocomplete element to an input field
AutoCompleteElement.prototype.attach = function (inputField) {
    this._inputField = inputField;

    // set 'relative' position
    this._inputFieldPosition = inputField.style.position;
    inputField.style.position = 'relative';
    inputField.element.appendChild(this.element);

    // fire 'change' on every keystroke
    inputField.keyChange = true;

    // add event handlers
    inputField.element.addEventListener('keydown', this.onInputKey.bind(this));
    inputField.element.addEventListener('blur', this.onInputBlur.bind(this));
    inputField.elementInput.addEventListener('blur', this.onInputBlur.bind(this));
    inputField.on('change', this.onInputChange.bind(this));
};

// Detach event handlers and clear the attached input field
AutoCompleteElement.prototype.detach = function () {
    if (!this._inputField) return;

    this._inputField.style.position = this._inputFieldPosition;
    this._inputField.element.removeChild(this.element);

    this._inputField.off('change', this.onInputChange.bind(this));
    this._inputField.element.removeEventListener('keydown', this.onInputKey.bind(this));
    this._inputField.elementInput.removeEventListener('blur', this.onInputBlur.bind(this));

    this._inputField = null;
};

AutoCompleteElement.prototype.onInputKey = function (e) {
    var index;

    // enter: select highlighted element
    if (e.keyCode === 13) {
        if (!this.hidden && this._highlightedElement) {
            this._select(this._highlightedElement);
        }
    }
    // up: show dropdown or move highlight up
    else if (e.keyCode === 38) {
        if (this.hidden) {
            this.filter(this._inputField.value);
        } else {
            if (this._highlightedElement) {
                index = this._visibleElements.indexOf(this._highlightedElement) - 1;
                if (index < 0) {
                    index = this._visibleElements.length - 1;
                }
            } else {
                index = this._visibleElements.length - 1;
            }

            this._highlight(this._visibleElements[index]);
        }
    }
    // down: show dropdown or move highlight down
    else if (e.keyCode === 40 ) {

        if (this.hidden) {
            this.filter(this._inputField.value);
        } else {
            if (this._highlightedElement) {
            index = this._visibleElements.indexOf(this._highlightedElement) + 1;
                if (index >= this._visibleElements.length) {
                    index = 0;
                }
            } else {
                index = 0;
            }

            this._highlight(this._visibleElements[index]);
        }
    }
};

AutoCompleteElement.prototype.onInputBlur = function () {
    return;
    // hide the dropdown in a timeout
    // to avoid conflicts with key handlers
    setTimeout(function () {
        this.hidden = true;
    }.bind(this), 50);
};

AutoCompleteElement.prototype.onInputChange = function (value) {
    // filter based on new input field value
    if (value !== this._filter) {
        this.filter(value);
    }
};

// Only show elements that start with the specified value
AutoCompleteElement.prototype.filter = function (value) {
    if (!this._childElements) return;

    this.hidden = false;

    this._filter = value;

    this._visibleElements = [];

    value = value.toLowerCase();

    this._childElements.forEach(function (element, i) {
        if (value && element.innerHTML.toLowerCase().indexOf(value) === 0) {
            element.classList.remove('hidden');
            this._visibleElements.push(element);
        } else {
            element.classList.add('hidden');
            if (element === this._highlightedElement)
                this._highlight(null);
        }
    }.bind(this));
};

// Highlight specified element
AutoCompleteElement.prototype._highlight = function (element, silent) {
    // unhighlight previous element
    if (this._highlightedElement === element) return;

    if (this._highlightedElement)
        this._highlightedElement.classList.remove('selected');

    this._highlightedElement = element;

    if (element) {
        element.classList.add('selected');

        if (! silent) {
            this.emit('highlight', element.innerHTML);
        }
    }
};

// Select specified element
AutoCompleteElement.prototype._select = function (element) {
    if (this._inputField) {
        this._inputField.value = element.innerHTML;
        this._inputField.elementInput.focus();
    }

    this.emit('select', element.innerHTML);

    // hide in a timeout to avoid conflicts with key handlers
    setTimeout(function () {
        this.hidden = true;
    }.bind(this));
};

window.ui.AutoCompleteElement = AutoCompleteElement;


/* ui/bubble.js */
"use strict";

function Bubble(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.class.add('ui-bubble');

    var pulseCircle = document.createElement('div');
    pulseCircle.classList.add('pulse');
    this.element.appendChild(pulseCircle);

    var centerCircle = document.createElement('div');
    centerCircle.classList.add('center');
    this.element.appendChild(centerCircle);

    var self = this;
    this.on('click', function () {
        if (self.class.contains('active')) {
            self.deactivate();
        } else {
            self.activate();
        }
    });

    if (args.id !== undefined)
        this.element.id = args.id;

    if (args.tabindex !== undefined)
        this.element.setAttribute('tabindex', args.tabindex);

}

Bubble.prototype = Object.create(ui.Element.prototype);

Bubble.prototype.activate = function () {
    this.class.add('active');
    this.emit('activate');
};

Bubble.prototype.deactivate = function () {
    this.class.remove('active');
    this.emit('deactivate');
};

Bubble.prototype.position = function (x, y) {
    var rect = this.element.getBoundingClientRect();

    var left = (x || 0);
    var top = (y || 0);

    this.element.style.left = (typeof left === 'number') ? left + 'px' : left;
    this.element.style.top = (typeof top === 'number') ? top + 'px' : top;
};

window.ui.Bubble = Bubble;

