

/* editor/editor.js */
(function() {
    'use strict';

    function Editor() {
        Events.call(this);

        this._hooks = { };
    }
    Editor.prototype = Object.create(Events.prototype);


    Editor.prototype.method = function(name, fn) {
        if (this._hooks[name] !== undefined) {
            throw new Error('can\'t override hook: ' + name);
        }
        this._hooks[name] = fn;
    };


    Editor.prototype.methodRemove = function(name) {
        delete this._hooks[name];
    };


    Editor.prototype.call = function(name) {
        if (this._hooks[name]) {
            var args = Array.prototype.slice.call(arguments, 1);

            try {
                return this._hooks[name].apply(null, args);
            } catch(ex) {
                console.info('%c%s %c(editor.method error)', 'color: #06f', name, 'color: #f00');
                console.log(ex.stack);
            }
        }
        return null;
    };


    // editor
    window.editor = new Editor();
})();


// config
(function() {
    'use strict';

    var applyConfig = function(path, value) {
        if (typeof(value) === 'object') {
            for(var key in value) {
                applyConfig((path ? path + '.' : '') + key, value[key]);
            }
        } else {
            Ajax.param(path, value);
        }
    };

    applyConfig('', config);
})();


/* editor/first-load.js */
(function() {
    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.call('status:text', 'loading');
        editor.emit('load');
        editor.call('status:text', 'starting');
        editor.emit('start');

        editor.call('status:text', 'ready');
    }, false);
})();


/* editor/hotkeys.js */
editor.once('load', function() {
    'use strict';


    var hotkeys = { };
    var keyIndex = { };
    var keysDown = { };
    var ctrl = false;
    var shift = false;
    var alt = false;

    var keyMap = {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'pause/break': 19,
        'caps lock': 20,
        'esc': 27,
        'space': 32,
        'page up': 33, 'page down': 34,
        'end': 35, 'home': 36,
        'left arrow': 37, 'up arrow': 38, 'right arrow': 39, 'down arrow': 40,
        'insert': 45, 'delete': 46,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57, 'a': 65,
        'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
        'left window key': 91, 'right window key': 92,
        'select key': 93,
        'numpad 0': 96, 'numpad 1': 97, 'numpad 2': 98, 'numpad 3': 99, 'numpad 4': 100, 'numpad 5': 101, 'numpad 6': 102, 'numpad 7': 103, 'numpad 8': 104, 'numpad 9': 105,
        'multiply': 106,
        'add': 107,
        'subtract': 109,
        'decimal point': 110,
        'divide': 111,
        'f1': 112, 'f2': 113, 'f3': 114, 'f4': 115, 'f5': 116, 'f6': 117, 'f7': 118, 'f8': 119, 'f9': 120, 'f10': 121, 'f11': 122, 'f12': 123,
        'num lock': 144,
        'scroll lock': 145,
        'semi-colon': 186,
        'equal sign': 187,
        'comma': 188,
        'dash': 189,
        'period': 190,
        'forward slash': 191,
        'grave accent': 192,
        'open bracket': 219,
        'back slash': 220,
        'close braket': 221,
        'single quote': 222
    };


    editor.method('hotkey:register', function(name, args) {
        hotkeys[name] = args;

        // keys list
        var keys = [ args.ctrl ? 1 : 0, args.alt ? 1 : 0, args.shift ? 1 : 0 ];

        // map string to keyCode
        if (typeof(args.key) === 'string')
            args.key = keyMap[args.key];

        // unknown key
        if (! args.key) {
            console.error('unknown key: ' + name + ', ' + args.key);
            return;
        }

        keys.push(args.key);

        args.index = keys.join('+');

        if (! keyIndex[args.index])
            keyIndex[args.index] = [ ];

        keyIndex[args.index].push(name);
    });


    editor.method('hotkey:unregister', function(name) {
        var hotkey = hotkeys[name];
        if (! hotkey) return;

        if (keyIndex[hotkey.index].length === 1) {
            delete keyIndex[hotkey.index];
        } else {
            keyIndex[hotkey.index].splice(keyIndex[hotkey.index].indexOf(name), 1);
        }

        delete hotkeys[name];
    });


    editor.method('hotkey:shift', function() {
        return shift;
    });

    editor.method('hotkey:ctrl', function() {
        return ctrl;
    });

    editor.method('hotkey:alt', function() {
        return alt;
    });


    var updateModifierKeys = function(evt) {
        if (shift !== evt.shiftKey) {
            shift = evt.shiftKey;
            editor.emit('hotkey:shift', shift);
        }

        if (ctrl !== (evt.ctrlKey || evt.metaKey)) {
            ctrl = evt.ctrlKey || evt.metaKey;
            editor.emit('hotkey:ctrl', ctrl);
        }

        if (alt !== evt.altKey) {
            alt = evt.altKey;
            editor.emit('hotkey:alt', alt);
        }
    };


    window.addEventListener('keydown', function(evt) {
        if (evt.target) {
            var tag = evt.target.tagName;
            if (/(input)|(textarea)/i.test(tag))
                return;
        }

        updateModifierKeys(evt);

        if ([ 92, 93 ].indexOf(evt.keyCode) !== -1)
            return;

        var index = [ ctrl+0, alt+0, shift+0, evt.keyCode ].join('+');

        if (keyIndex[index]) {
            var skipPreventDefault = false;
            for(var i = 0; i < keyIndex[index].length; i++) {
                hotkeys[keyIndex[index][i]].callback();
                if (! skipPreventDefault && hotkeys[keyIndex[index][i]].skipPreventDefault)
                    skipPreventDefault = true;
            }
            if (! skipPreventDefault)
                evt.preventDefault();
        }
    }, false);


    window.addEventListener('keyup', updateModifierKeys, false);
    window.addEventListener('mousedown', updateModifierKeys, false);


    ui.Grid._ctrl = function() {
        return ctrl;
    };
    ui.Grid._shift = function() {
        return shift;
    };

    ui.Tree._ctrl = function() {
        return ctrl;
    };
    ui.Tree._shift = function() {
        return shift;
    };
});


/* editor/layout.js */
editor.on('load', function() {
    'use strict';

    var ignoreClasses = /(ui-list-item)|(ui-button)|(ui-text-field)|(ui-number-field)/i;
    var ignoreElements = /(input)|(textarea)/i;

    // prevent drag'n'select
    window.addEventListener('mousedown', function(evt) {
        // don't prevent for certain cases
        if (evt.target) {
            if (ignoreClasses.test(evt.target.className)) {
                return;
            } else if (ignoreElements.test(evt.target.tagName)) {
                return;
            }
        }

        // blur inputs
        if (window.getSelection) {
            var focusNode = window.getSelection().focusNode;
            if (focusNode) {
                if (focusNode.tagName === 'INPUT') {
                    focusNode.blur();
                } else if (focusNode.firstChild && focusNode.firstChild.tagName === 'INPUT') {
                    focusNode.firstChild.blur();
                }
            }
        }

        // prevent default will prevent blur, dragstart and selection
        evt.preventDefault();
    }, false);


    // main container
    var root = new ui.Panel();
    root.element.id = 'ui-root';
    root.flex = true;
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    root.scroll = true;
    document.body.appendChild(root.element);
    // expose
    editor.method('layout.root', function() { return root; });

    var top = new ui.Panel();
    top.style.backgroundColor = '#5f6f72';
    top.style.cursor = 'pointer';
    top.element.id = 'ui-top';
    top.flexShrink = false;
    top.once('click', function() {
        top.destroy();
        toolbar.style.marginTop = '';
    });
    root.append(top);

    // middle
    var middle = new ui.Panel();
    middle.element.id = 'ui-middle';
    middle.flexible = true;
    middle.flexGrow = true;
    root.append(middle);

    // bottom (status)
    var bottom = new ui.Panel();
    bottom.element.id = 'ui-bottom';
    bottom.flexShrink = false;
    root.append(bottom);
    // expose
    editor.method('layout.bottom', function() { return bottom; });


    // toolbar (left)
    var toolbar = new ui.Panel();
    toolbar.element.id = 'ui-toolbar';
    toolbar.flexShrink = false;
    toolbar.style.width = '45px';
    middle.append(toolbar);
    // expose
    editor.method('layout.toolbar', function() { return toolbar; });


    // hierarchy
    var hierarchyPanel = new ui.Panel('HIERARCHY');
    hierarchyPanel.enabled = false;
    hierarchyPanel.class.add('hierarchy');
    hierarchyPanel.flexShrink = false;
    hierarchyPanel.style.width = '256px';
    hierarchyPanel.innerElement.style.width = '256px';
    hierarchyPanel.foldable = true;
    hierarchyPanel.horizontal = true;
    hierarchyPanel.scroll = true;
    hierarchyPanel.resizable = 'right';
    hierarchyPanel.resizeMin = 196;
    hierarchyPanel.resizeMax = 512;
    middle.append(hierarchyPanel);
    // expose
    editor.method('layout.left', function() { return hierarchyPanel; });
    editor.on('permissions:writeState', function(state) {
        hierarchyPanel.enabled = state;
    });
    if (window.innerWidth <= 480)
        hierarchyPanel.folded = true;


    // center
    var center = new ui.Panel();
    center.flexible = true;
    center.flexGrow = true;
    center.flexDirection = 'column';
    middle.append(center);

    // viewport
    var viewport = new ui.Panel();
    viewport.flexible = true;
    viewport.flexGrow = true;
    viewport.class.add('viewport');
    center.append(viewport);
    // expose
    editor.method('layout.viewport', function() { return viewport; });

    // assets
    var assetsPanel = new ui.Panel('ASSETS');
    assetsPanel.class.add('assets');
    assetsPanel.foldable = true;
    assetsPanel.flexShrink = false;
    assetsPanel.innerElement.style.height = '212px';
    assetsPanel.scroll = true;
    assetsPanel.resizable = 'top';
    assetsPanel.resizeMin = 106;
    assetsPanel.resizeMax = 106 * 6;
    assetsPanel.headerSize = -1;
    center.append(assetsPanel);
    // expose
    editor.method('layout.assets', function() { return assetsPanel; });
    if (window.innerHeight <= 480)
        assetsPanel.folded = true;


    // attributes
    var attributesPanel = new ui.Panel('INSPECTOR');
    attributesPanel.enabled = false;
    attributesPanel.class.add('attributes');
    attributesPanel.flexShrink = false;
    attributesPanel.style.width = '320px';
    attributesPanel.innerElement.style.width = '320px';
    attributesPanel.horizontal = true;
    attributesPanel.foldable = true;
    attributesPanel.scroll = true;
    attributesPanel.resizable = 'left';
    attributesPanel.resizeMin = 256;
    attributesPanel.resizeMax = 512;
    middle.append(attributesPanel);
    // expose
    editor.method('layout.right', function() { return attributesPanel; });
    editor.on('permissions:writeState', function(state) {
        attributesPanel.enabled = state;
    });
    if (window.innerWidth <= 720)
        attributesPanel.folded = true;
});


/* editor/messenger.js */
editor.on('start', function() {
    'use strict';

    if (typeof(Messenger) === 'undefined')
        return;

    var messenger = new Messenger();

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', function() {
        this.authenticate(config.accessToken, 'designer');
    });

    messenger.on('welcome', function() {
        this.projectWatch(config.project.id);
    });

    messenger.on('message', function(evt) {
        editor.emit('messenger:' + evt.name, evt.data);
    });

    window.msg = messenger;
});


/* editor/history.js */
editor.once('load', function() {
    'use strict';

    var actions = [ ];
    var current = -1;
    var canUndo = false;
    var canRedo = false;


    var checkCanUndoRedo = function() {
        if (canUndo && current == -1) {
            canUndo = false;
            editor.emit('history:canUndo', false);
        } else if (! canUndo && current >= 0) {
            canUndo = true;
            editor.emit('history:canUndo', true);
        }

        if (canRedo && current === actions.length - 1) {
            canRedo = false;
            editor.emit('history:canRedo', false);
        } else if (! canRedo && current < actions.length - 1) {
            canRedo = true;
            editor.emit('history:canRedo', true);
        }
    };

    editor.method('history:canUndo', function() {
        return canUndo;
    });
    editor.method('history:canRedo', function() {
        return canRedo;
    });


    // current
    editor.method('history:current', function() {
        if (current === -1)
            return null;

        return current;
    });


    // clear
    editor.method('history:clear', function() {
        if (! actions.length)
            return;

        actions = [ ];
        current = -1;
        checkCanUndoRedo();
    });


    // add action
    editor.method('history:add', function(action) {
        // some history needs erasing
        if (current !== actions.length - 1)
            actions = actions.slice(0, current + 1);

        // add action
        actions.push(action);

        editor.call('status:text', action.name);

        // current action state
        current = actions.length - 1;

        checkCanUndoRedo();
    });


    // update action
    editor.method('history:update', function(action) {
        if (current === -1 || actions[current].name !== action.name)
            return;

        actions[current].redo = action.redo;

        editor.call('status:text', action.name);
    });


    // undo
    editor.method('history:undo', function() {
        // no history
        if (current === -1)
            return;

        actions[current].undo();
        current--;

        if (current >= 0) {
            editor.call('status:text', actions[current].name);
        } else {
            editor.call('status:text', '');
        }

        editor.emit('history:undo', name);
        checkCanUndoRedo();
    });


    // redo
    editor.method('history:redo', function() {
        if (current === actions.length - 1)
            return;

        current++;
        actions[current].redo();
        editor.call('status:text', actions[current].name);

        editor.emit('history:redo', name);
        checkCanUndoRedo();
    });

    // list history
    editor.method('history:list', function() {
        return actions;
    });

    // hotkey undo
    editor.call('hotkey:register', 'history:undo', {
        key: 'z',
        ctrl: true,
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('history:undo');
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo', {
        key: 'z',
        ctrl: true,
        shift: true,
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('history:redo');
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo:y', {
        key: 'y',
        ctrl: true,
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('history:redo');
        }
    });
});





/* editor/status.js */
editor.once('load', function() {
    'use strict';

    var jobs = { };
    var panel = editor.call('layout.bottom');


    // status
    var status = new ui.Label({
        text: 'PlayCanvas'
    });
    status.renderChanges = false;
    status.class.add('status');
    panel.append(status);

    // progress
    var progress = new ui.Progress();
    progress.class.add('jobsProgress');
    panel.append(progress);

    // jobs
    var jobsCount = new ui.Label({
        text: '0'
    });
    jobsCount.renderChanges = false;
    jobsCount.class.add('jobsCount');
    panel.append(jobsCount);


    // status text
    editor.method('status:text', function(text) {
        status.text = text;
        status.class.remove('error');
    });


    // status error
    editor.method('status:error', function(text) {
        status.text = text;
        status.class.add('error');
    });



    // update jobs
    var updateJobs = function() {
        var count = Object.keys(jobs).length;
        jobsCount.text = count;

        if (count > 0) {
            var least = 1;
            for(var key in jobs) {
                if (jobs[key] < least)
                    least = jobs[key];
            }
            progress.progress = least;
            progress.class.add('active');
        } else {
            progress.class.remove('active');
            progress.progress = 1;
        }
    };

    // status job
    editor.method('status:job', function(id, value) {
        if (jobs.hasOwnProperty(id) && value === undefined) {
            delete jobs[id];
        } else {
            jobs[id] = value;
        }

        updateJobs();
    });
});


/* editor/permissions.js */
editor.once('load', function() {
    'use strict';

    var permissions = { };

    // cache permissions in a dictionary
    ['read', 'write', 'admin'].forEach(function (access) {
        config.project.permissions[access].forEach(function (id) {
            permissions[id] = access;
        });
    });

    editor.method('permissions', function () {
        return config.project.permissions;
    });

    editor.method('permissions:read', function (userId) {
        if (! userId) userId = config.self.id;
        return permissions.hasOwnProperty(userId);
    });

    editor.method('permissions:write', function (userId) {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'write' || permissions[userId] === 'admin';
    });

    editor.method('permissions:admin', function (userId) {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'admin';
    });

    // subscribe to messenger
    editor.on('messenger:project.permissions', function (msg) {
        var userId = msg.user.id;

        // remove from read
        var ind = config.project.permissions.read.indexOf(userId);
        if (ind !== -1)
            config.project.permissions.read.splice(ind, 1);

        // remove from write
        ind = config.project.permissions.write.indexOf(userId);
        if (ind !== -1) {
            config.project.permissions.write.splice(ind, 1);
        }

        // remove from admin
        ind = config.project.permissions.admin.indexOf(userId);
        if (ind !== -1) {
            config.project.permissions.admin.splice(ind, 1);
        }

        delete permissions[userId];

        var accessLevel = msg.user.permission;

        // add new permission
        if (accessLevel) {
            config.project.permissions[accessLevel].push(userId);
            permissions[userId] = accessLevel;
        } else {
            // lock out user if private project
            if (config.self.id === userId && config.project.private)
                window.location.reload();
        }

        editor.emit('permissions:set:' + userId, accessLevel);
        if (userId === config.self.id)
            editor.emit('permissions:set', accessLevel);
    });

    // subscribe to project private changes
    editor.on('messenger:project.private', function (msg) {
        var projectId = msg.project.id;
        if (config.project.id !== projectId)
            return;

        config.project.private = msg.project.private;

        if (msg.project.private && ! editor.call('permissions:read', config.self.id)) {
            // refresh page so that user gets locked out
            window.location.reload();
        }
    });

    editor.on('messenger:user.logout', function (msg) {
        if (msg.user.id === config.self.id) {
            window.location.reload();
        }
    });

    editor.on('permissions:set:' + config.self.id, function (accessLevel) {
        var connection = editor.call('realtime:connection');
        editor.emit('permissions:writeState', connection && connection.state === 'connected' && (accessLevel === 'write' || accessLevel === 'admin'));
    });

    // emit initial event
    if (editor.call('permissions:write')) {
        editor.emit('permissions:set:' + config.self.id, 'write');
    }
});


/* editor/error.js */
editor.once('load', function() {
    'use strict';

    window.addEventListener('error', function(evt) {
        // console.log(evt);
        editor.call('status:error', evt.message);
    }, false);
});


/* editor/contextmenu.js */
editor.once('load', function() {
    'use strict';

    window.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
    }, false);
});


/* editor/drop.js */
editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = document.createElement('div');
    overlay.classList.add('drop-overlay');
    editor.call('layout.root').append(overlay);

    var imgDrag = new Image();
    // imgDrag.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACWCAYAAAAfduJyAAAAFUlEQVQoU2NkYGBgYBwlRsNgJKQDAOAfAJflUZweAAAAAElFTkSuQmCC';
    // imgDrag.style.display = 'none';

    var parts = [ 'top', 'right', 'bottom', 'left' ];
    for(var i = 0; i < parts.length; i++) {
        var part = document.createElement('div');
        part.classList.add('drop-overlay-hole-part', parts[i]);
        editor.call('layout.root').append(part);
        parts[i] = part;
    }

    // areas
    var areas = document.createElement('div');
    areas.classList.add('drop-areas');
    editor.call('layout.root').append(areas);


    var active = false;
    var currentType = '';
    var currentData = { };
    var currentElement = null;
    var dragOver = false;
    var items = [ ];
    var itemOver = null;

    var activate = function(state) {
        if (! editor.call('permissions:write'))
            return;

        if (active === state)
            return;

        active = state;

        if (active) {
            overlay.classList.add('active');
            areas.classList.add('active');
            editor.call('cursor:set', 'grabbing');
        } else {
            overlay.classList.remove('active');
            areas.classList.remove('active');
            dragOver = false;
            currentType = '';
            currentData = { };
            editor.emit('drop:set', currentType, currentData);
            editor.call('cursor:clear');
        }

        var onMouseUp = function() {
            window.removeEventListener('mouseup', onMouseUp);
            activate(false);
        };
        window.addEventListener('mouseup', onMouseUp, false);

        editor.emit('drop:active', active);
    };

    editor.method('drop:activate', activate);
    editor.method('drop:active', function() {
        return active;
    });


    // prevent drop file of redirecting
    window.addEventListener('dragenter', function(evt) {
        evt.preventDefault();

        if (! editor.call('permissions:write'))
            return;

        if (dragOver) return;
        dragOver = true;

        if (! currentType) {
            currentType = 'files';
            editor.emit('drop:set', currentType, currentData);
        }

        activate(true);
    }, false);

    window.addEventListener('dragover', function(evt) {
        evt.preventDefault();

        if (! editor.call('permissions:write'))
            return;

        evt.dataTransfer.dropEffect = 'move';

        if (dragOver) return;
        dragOver = true;

        activate(true);
    }, false);

    window.addEventListener('dragleave', function(evt) {
        evt.preventDefault();

        if (evt.clientX !== 0 || evt.clientY !== 0)
            return;

        if (! editor.call('permissions:write'))
            return;

        if (! dragOver) return;
        dragOver = false;

        setTimeout(function() {
            if (dragOver)
                return;

            activate(false);
        }, 0);
    }, false);

    window.addEventListener('drop', function(evt) {
        evt.preventDefault();
        activate(false);
    }, false);


    var evtDragOver = function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('over');

        if (itemOver && itemOver !== this)
            evtDragLeave.call(itemOver);

        itemOver = this;

        if (this._ref && this._ref.over && currentType) {
            var data = currentData;
            if (currentType == 'files' && e.dataTransfer)
                data = e.dataTransfer.files;
            this._ref.over(currentType, data);
        }
    };
    var evtDragLeave = function(e) {
        if (e) e.preventDefault();
        this.classList.remove('over');

        if (this._ref && this._ref.leave && currentType)
            this._ref.leave();

        if (itemOver === this)
            itemOver = null;
    };

    var fixChromeFlexBox = function(item) {
        // workaround for chrome
        // for z-index + flex-grow weird reflow bug
        // need to force reflow in next frames

        if (! window.chrome)
            return;

        // only for those who have flexgrow
        var flex = item.style.flexGrow;
        if (flex) {
            // changing overflow triggers reflow
            var overflow = item.style.overflow;
            item.style.overflow = 'hidden';
            // need to skip 2 frames, 1 is not enough
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    // change back to what it was
                    item.style.overflow = overflow;
                });
            });
        }
    };


    editor.method('drop:target', function(obj) {
        items.push(obj);
        obj.element = document.createElement('div');
        obj.element._ref = obj;
        obj.element.classList.add('drop-area');
        if (obj.hole)
            obj.element.classList.add('hole');

        if (obj.passThrough)
            obj.element.style.pointerEvents = 'none';

        areas.appendChild(obj.element);

        obj.evtDrop = function(e) {
            e.preventDefault();

            if (! currentType)
                return;

            // leave event
            if (obj.element.classList.contains('over')) {
                if (obj.leave && currentType) obj.leave();
                obj.element.classList.remove('over');
            }

            var data = currentData;
            if (currentType == 'files' && e.dataTransfer)
                data = e.dataTransfer.files;

            if (obj.drop)
                obj.drop(currentType, data);
        };

        obj.element.addEventListener('dragenter', evtDragOver, false);
        obj.element.addEventListener('mouseenter', evtDragOver, false);

        obj.element.addEventListener('dragleave', evtDragLeave, false);
        obj.element.addEventListener('mouseleave', evtDragLeave, false);

        var dropOn = obj.element;
        if (obj.passThrough)
            dropOn = obj.ref;

        dropOn.addEventListener('drop', obj.evtDrop, false);
        dropOn.addEventListener('mouseup', obj.evtDrop, false);

        obj.unregister = function() {
            if (! obj.element.classList.contains('drop-area'))
                return;

            obj.element.removeEventListener('dragenter', evtDragOver);
            obj.element.removeEventListener('mouseenter', evtDragOver);

            obj.element.removeEventListener('dragleave', evtDragLeave);
            obj.element.removeEventListener('mouseleave', evtDragLeave);

            dropOn.removeEventListener('drop', obj.evtDrop);
            dropOn.removeEventListener('mouseup', obj.evtDrop);

            var ind = items.indexOf(obj);
            if (ind !== -1)
                items.splice(ind, 1);

            if (obj.ref.classList.contains('drop-ref-highlight')) {
                obj.ref.classList.remove('drop-ref-highlight');
                fixChromeFlexBox(obj.ref);
            }

            obj.element.classList.remove('drop-area');
            areas.removeChild(obj.element);
        };

        return obj;
    });


    editor.method('drop:item', function(args) {
        args.element.draggable = true;

        args.element.addEventListener('mousedown', function(evt) {
            evt.stopPropagation();
        }, false);

        args.element.addEventListener('dragstart', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if (! editor.call('permissions:write'))
                return;

            currentType = args.type;
            currentData = args.data;
            itemOver = null;
            editor.emit('drop:set', currentType, currentData);

            activate(true);
        }, false);
    });


    editor.method('drop:set', function(type, data) {
        currentType = type || '',
        currentData = data || { };

        editor.emit('drop:set', currentType, currentData);
    });


    editor.on('drop:active', function(state) {
        areas.style.pointerEvents = '';

        if (state) {
            var bottom = 0;
            var top = window.innerHeight;
            var left = window.innerWidth;
            var right = 0;

            for(var i = 0; i < items.length; i++) {
                var visible = ! items[i].disabled;

                if (visible) {
                    if (items[i].filter) {
                        visible = items[i].filter(currentType, currentData);
                    } else if (items[i].type !== currentType) {
                        visible = false;
                    }
                }

                if (visible) {
                    var rect = items[i].ref.getBoundingClientRect();
                    var depth = 4;
                    var parent = items[i].ref;
                    while(depth--) {
                        if (! rect.width || ! rect.height || ! parent.offsetHeight || window.getComputedStyle(parent).getPropertyValue('visibility') === 'hidden') {
                            visible = false;
                            break;
                        }
                        parent = parent.parentNode;
                    }
                }

                if (visible) {
                    items[i].element.style.display = 'block';

                    if (items[i].hole) {
                        items[i].element.style.left = (rect.left + 2) + 'px';
                        items[i].element.style.top = (rect.top + 2) + 'px';
                        items[i].element.style.width = (rect.width - 4) + 'px';
                        items[i].element.style.height = (rect.height - 4) + 'px';

                        overlay.classList.remove('active');

                        if (top > rect.top)
                            top = rect.top;

                        if (bottom < rect.bottom)
                            bottom = rect.bottom;

                        if (left > rect.left)
                            left = rect.left;

                        if (right < rect.right)
                            right = rect.right;

                        parts[0].classList.add('active');
                        parts[0].style.height = top + 'px';

                        parts[1].classList.add('active');
                        parts[1].style.top = top + 'px';
                        parts[1].style.bottom = (window.innerHeight - bottom) + 'px';
                        parts[1].style.width = (window.innerWidth - right) + 'px';

                        parts[2].classList.add('active');
                        parts[2].style.height = (window.innerHeight - bottom) + 'px';

                        parts[3].classList.add('active');
                        parts[3].style.top = top + 'px';
                        parts[3].style.bottom = (window.innerHeight - bottom) + 'px';
                        parts[3].style.width = left + 'px';

                        if (items[i].passThrough)
                            areas.style.pointerEvents = 'none';
                    } else {
                        items[i].element.style.left = (rect.left + 1) + 'px';
                        items[i].element.style.top = (rect.top + 1) + 'px';
                        items[i].element.style.width = (rect.width - 2) + 'px';
                        items[i].element.style.height = (rect.height - 2) + 'px';
                        items[i].ref.classList.add('drop-ref-highlight');
                    }
                } else {
                    items[i].element.style.display = 'none';

                    if (items[i].ref.classList.contains('drop-ref-highlight')) {
                        items[i].ref.classList.remove('drop-ref-highlight');
                        fixChromeFlexBox(items[i].ref);
                    }
                }
            }
        } else {
            for(var i = 0; i < parts.length; i++)
                parts[i].classList.remove('active');

            for(var i = 0; i < items.length; i++) {
                if (! items[i].ref.classList.contains('drop-ref-highlight'))
                    continue;

                items[i].ref.classList.remove('drop-ref-highlight');
                fixChromeFlexBox(items[i].ref);
            }
        }
    });
});


/* editor/cursor.js */
editor.once('load', function() {
    'use strict';

    var cursorType = '';

    editor.method('cursor:set', function(type) {
        if (cursorType === type)
            return;

        cursorType = type;
        document.body.style.setProperty('cursor', type, 'important');
        document.body.style.setProperty('cursor', '-moz-' + type, 'important');
        document.body.style.setProperty('cursor', '-webkit-' + type, 'important');
    });

    editor.method('cursor:clear', function() {
        if (! cursorType)
            return;

        cursorType = '';
        document.body.style.cursor = '';
    });

    var hiddenTime = 0;
    var tooltip = new ui.Label();
    tooltip.class.add('cursor-tooltip');
    tooltip.renderChanges = false;
    tooltip.hidden = true;
    editor.call('layout.root').append(tooltip);

    var lastX = 0;
    var lastY = 0;

    // move tooltip
    var onMove = function(evt) {
        lastX = evt.clientX;
        lastY = evt.clientY;

        if (tooltip.hidden && (Date.now() - hiddenTime) > 100)
            return;

        tooltip.style.transform = 'translate(' + evt.clientX + 'px,' + evt.clientY + 'px)';
    };
    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('dragover', onMove, false);

    // set tooltip text
    editor.method('cursor:text', function(text) {
        if (text) tooltip.text = text;
        tooltip.hidden = ! text;

        tooltip.style.transform = 'translate(' + lastX + 'px,' + lastY + 'px)';

        if (! text)
            hiddenTime = Date.now();
    });
});


/* editor/datetime.js */
editor.once('load', function () {
    'use strict';

    // convert passed time to a local time with moment.js
    editor.method('datetime:convert', function (date) {
        return new Date(date).toLocaleString();
    });
});

/* editor/search.js */
editor.once('load', function() {
    'use strict';

    // calculate, how many string `a`
    // requires edits, to become string `b`
    editor.method('search:stringEditDistance', function(a, b) {
        // Levenshtein distance
        // https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;
        if(a === b) return 0;

        var i, j;
        var matrix = [];

        for(i = 0; i <= b.length; i++)
            matrix[i] = [i];

        for(j = 0; j <= a.length; j++)
            matrix[0][j] = j;

        for(i = 1; i <= b.length; i++){
            for(j = 1; j <= a.length; j++){
                if(b.charAt(i-1) === a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
                }
            }
        }

        return matrix[b.length][a.length];
    });


    // calculate, how many characters string `b`
    // contains of a string `a`
    editor.method('search:charsContains', function(a, b) {
        if (a === b)
            return a.length;

        var contains = 0;
        var ind = { };
        var i;

        for(i = 0; i < b.length; i++)
            ind[b.charAt(i)] = true;

        for(i = 0; i < a.length; i++) {
            if(ind[a.charAt(i)])
                contains++;
        }

        return contains;
    });


    // tokenize string into array of tokens
    editor.method('search:stringTokenize', function(name) {
        var tokens = [ ];

        // camelCase
        // upperCASE123
        var string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');

        // space notation
        // dash-notation
        // underscore_notation
        var parts = string.split(/(\s|\-|_)/g);

        // filter valid tokens
        for(var i = 0; i < parts.length; i++) {
            parts[i] = parts[i].toLowerCase().trim();
            if (parts[i] && parts[i] !== '-' && parts[i] !== '_')
                tokens.push(parts[i]);
        }

        return tokens;
    });


    var searchItems = function(items, search, args) {
        var results = [ ];

        for(var i = 0; i < items.length; i++) {
            var item = items[i];

            // direct hit
            if (item.name === search || item.name.indexOf(search) === 0) {
                results.push(item);

                if (item.edits === Infinity)
                    item.edits = 0;

                if (item.sub === Infinity)
                    item.sub = 0;

                continue;
            }

            // check if name contains enough of search characters
            var contains = editor.call('search:charsContains', search, item.name);
            if (contains / search.length < args.containsCharsTolerance)
                continue;

            var editsCandidate = Infinity;
            var subCandidate = Infinity;

            // for each token
            for(var t = 0; t < item.tokens.length; t++) {
                // direct token match
                if (item.tokens[t] === search) {
                    editsCandidate = 0;
                    subCandidate = t;
                    break;
                }

                var edits = editor.call('search:stringEditDistance', search, item.tokens[t]);

                if ((subCandidate === Infinity || edits < editsCandidate) && item.tokens[t].indexOf(search) !== -1) {
                    // search is a substring of a token
                    subCandidate = t;
                    editsCandidate = edits;
                    continue;
                } else if (subCandidate === Infinity && edits < editsCandidate) {
                    // new edits candidate, not a substring of a token
                    if ((edits / Math.max(search.length, item.tokens[t].length)) <= args.editsDistanceTolerance) {
                        // check if edits tolerance is satisfied
                        editsCandidate = edits;
                    }
                }
            }

            // no match candidate
            if (editsCandidate === Infinity)
                continue;

            // add new result
            results.push(item);
            item.edits = item.edits === Infinity ? editsCandidate : item.edits + editsCandidate;
            item.sub = item.sub === Infinity ? subCandidate : item.sub + subCandidate;
        }

        return results;
    };

    // perform search through items
    // items is an array with arrays of two values
    // where first value is a string to be searched by
    // and second value is an object to be found
    /*
    [
        [ 'camera', {object} ],
        [ 'New Entity', {object} ],
        [ 'Sun', {object} ]
    ]
    */
    editor.method('search:items', function(items, search, args) {
        search = (search || '').trim();

        if (! search)
            return [ ];

        var searchTokens = editor.call('search:stringTokenize', search);
        if (! searchTokens.length)
            return [ ];

        args = args || { };
        args.limitResults = args.limitResults || 16;
        args.containsCharsTolerance = args.containsCharsTolerance || 0.5;
        args.editsDistanceTolerance = args.editsDistanceTolerance || 0.5;

        var result = [ ];
        var records = [ ];

        for(var i = 0; i < items.length; i++) {
            records.push({
                name: items[i][0],
                item: items[i][1],
                tokens: editor.call('search:stringTokenize', items[i][0]),
                edits: Infinity,
                sub: Infinity
            });
        }

        // search each token
        for(var i = 0; i < searchTokens.length; i++)
            records = searchItems(records, searchTokens[i], args);

        // sort result first by substring? then by edits number
        records.sort(function(a, b) {
            if (a.sub !== b.sub) {
                return a.sub - b.sub;
            } else if (a.edits !== b.edits) {
                return a.edits - b.edits;
            } else {
                return a.name.length - b.name.length;
            }
        });

        // return only items without match information
        for(var i = 0; i < records.length; i++)
            records[i] = records[i].item;

        // limit number of results
        if (records.length > args.limitResults)
            records = records.slice(0, args.limitResults);

        return records;
    });
});


/* editor/notifications.js */
editor.once('load', function() {
    'use strict';

    var TIMEOUT = 5000;
    var TIMEOUT_OVERLAP = 500;
    var last;
    var logo = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/platform/images/logo/playcanvas-logo-360.jpg';
    var visible = ! document.hidden;

    document.addEventListener('visibilitychange', function() {
        if (visible === ! document.hidden)
            return;

        visible = ! document.hidden;
        if (visible) {
            editor.emit('visible');
        } else {
            editor.emit('hidden');
        }
        editor.emit('visibility', visible);
    }, false);

    editor.method('visibility', function() {
        return visible;
    });

    editor.method('notify:state', function() {
        if (! window.Notification)
            return null;

        return Notification.permission;
    });

    editor.method('notify:permission', function(fn) {
        if (! window.Notification)
            return;

        if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(permission) {
                editor.emit('notify:permission', permission);
                if (fn) fn();
            });
        }
    });

    editor.method('notify', function(args) {
        // no supported
        if (! window.Notification || ! args.title || visible)
            return;

        args = args || { };

        var timeout;
        var queueClose = function(item) {
            setTimeout(function() {
                item.close();
            }, TIMEOUT_OVERLAP);
        };
        var notify = function() {
            if (last) {
                queueClose(last);
                last = null;
            }

            var notification = last = new Notification(args.title, {
                body: args.body,
                icon: args.icon || logo
            });

            timeout = setTimeout(function() {
                notification.close();
            }, args.timeout || TIMEOUT);

            notification.onclick = function(evt) {
                evt.preventDefault();
                notification.close();

                if (args.click)
                    args.click(evt);
            };

            notification.onclose = function(evt) {
                clearTimeout(timeout);
                timeout = null;

                if (last === notification)
                    last = null;
            };
        };

        if (Notification.permission === 'granted') {
            // allowed
            notify();
        } else if (Notification.permission !== 'denied') {
            // ask for permission
            editor.call('notify:permission', function(permission) {
                if (permission === 'granted')
                    notify();
            });
        } else {
            // no permission
        }
    });

    editor.method('notify:title', function(title) {
        document.title = title;
    });
});


/* editor/refocus.js */
editor.once('load', function() {
    'use strict';

    var last = null;
    var timeout = null;

    var onClear = function() {
        last = null;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    window.addEventListener('focus', onClear, true);

    window.addEventListener('blur', function(evt) {
        if (! evt.target || ! evt.target.ui || ! evt.target.ui.focus || ! evt.target.ui.refocusable) {
            onClear();
        } else {
            timeout = setTimeout(function() {
                last = evt.target.ui;
            }, 0);
        }
    }, true);

    window.addEventListener('keydown', function(evt) {
        if (! last)
            return;

        if (evt.keyCode === 13) {
            last.focus(true);
        } else {
            onClear();
        }
    }, false)

    window.addEventListener('mousedown', function() {
        if (last) onClear();
    }, false);
});
