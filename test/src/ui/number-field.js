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

