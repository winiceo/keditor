 /* codemirror/addon/tern/lib/walk.js */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.acorn || (g.acorn = {})).walk = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// AST walker module for Mozilla Parser API compatible trees

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be
//
//     walk.simple(myTree, {
//         Expression: function(node) { ... }
//     });
//
// to do something with all expressions. All Parser API node types
// can be used to identify node types, as well as Expression,
// Statement, and ScopeBody, which denote categories of nodes.
//
// The base argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.

exports.simple = simple;

// An ancestor walk builds up an array of ancestor nodes (including
// the current node) and passes them to the callback as the state parameter.
exports.ancestor = ancestor;

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).
exports.recursive = recursive;

// Find a node with a given start, end, and type (all are optional,
// null can be used as wildcard). Returns a {node, state} object, or
// undefined when it doesn't find a matching node.
exports.findNodeAt = findNodeAt;

// Find the innermost node of a given type that contains the given
// position. Interface similar to findNodeAt.
exports.findNodeAround = findNodeAround;

// Find the outermost matching node after a given position.
exports.findNodeAfter = findNodeAfter;

// Find the outermost matching node before a given position.
exports.findNodeBefore = findNodeBefore;

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.
exports.make = make;
Object.defineProperty(exports, "__esModule", {
  value: true
});

function simple(node, visitors, base, state) {
  if (!base) base = exports.base;(function c(node, st, override) {
    var type = override || node.type,
        found = visitors[type];
    base[type](node, st, c);
    if (found) found(node, st);
  })(node, state);
}

function ancestor(node, visitors, base, state) {
  if (!base) base = exports.base;
  if (!state) state = [];(function c(node, st, override) {
    var type = override || node.type,
        found = visitors[type];
    if (node != st[st.length - 1]) {
      st = st.slice();
      st.push(node);
    }
    base[type](node, st, c);
    if (found) found(node, st);
  })(node, state);
}

function recursive(node, state, funcs, base) {
  var visitor = funcs ? exports.make(funcs, base) : base;(function c(node, st, override) {
    visitor[override || node.type](node, st, c);
  })(node, state);
}

function makeTest(test) {
  if (typeof test == "string") {
    return function (type) {
      return type == test;
    };
  } else if (!test) {
    return function () {
      return true;
    };
  } else {
    return test;
  }
}

var Found = function Found(node, state) {
  _classCallCheck(this, Found);

  this.node = node;this.state = state;
};

function findNodeAt(node, start, end, test, base, state) {
  test = makeTest(test);
  if (!base) base = exports.base;
  try {
    ;(function c(node, st, override) {
      var type = override || node.type;
      if ((start == null || node.start <= start) && (end == null || node.end >= end)) base[type](node, st, c);
      if (test(type, node) && (start == null || node.start == start) && (end == null || node.end == end)) throw new Found(node, st);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) {
      return e;
    }throw e;
  }
}

function findNodeAround(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) base = exports.base;
  try {
    ;(function c(node, st, override) {
      var type = override || node.type;
      if (node.start > pos || node.end < pos) {
        return;
      }base[type](node, st, c);
      if (test(type, node)) throw new Found(node, st);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) {
      return e;
    }throw e;
  }
}

function findNodeAfter(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) base = exports.base;
  try {
    ;(function c(node, st, override) {
      if (node.end < pos) {
        return;
      }var type = override || node.type;
      if (node.start >= pos && test(type, node)) throw new Found(node, st);
      base[type](node, st, c);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) {
      return e;
    }throw e;
  }
}

function findNodeBefore(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) base = exports.base;
  var max = undefined;(function c(node, st, override) {
    if (node.start > pos) {
      return;
    }var type = override || node.type;
    if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node)) max = new Found(node, st);
    base[type](node, st, c);
  })(node, state);
  return max;
}

function make(funcs, base) {
  if (!base) base = exports.base;
  var visitor = {};
  for (var type in base) visitor[type] = base[type];
  for (var type in funcs) visitor[type] = funcs[type];
  return visitor;
}

function skipThrough(node, st, c) {
  c(node, st);
}
function ignore(_node, _st, _c) {}

// Node walkers.

var base = {};

exports.base = base;
base.Program = base.BlockStatement = function (node, st, c) {
  for (var i = 0; i < node.body.length; ++i) {
    c(node.body[i], st, "Statement");
  }
};
base.Statement = skipThrough;
base.EmptyStatement = ignore;
base.ExpressionStatement = base.ParenthesizedExpression = function (node, st, c) {
  return c(node.expression, st, "Expression");
};
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Statement");
  if (node.alternate) c(node.alternate, st, "Statement");
};
base.LabeledStatement = function (node, st, c) {
  return c(node.body, st, "Statement");
};
base.BreakStatement = base.ContinueStatement = ignore;
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression");
  c(node.body, st, "Statement");
};
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression");
  for (var i = 0; i < node.cases.length; ++i) {
    var cs = node.cases[i];
    if (cs.test) c(cs.test, st, "Expression");
    for (var j = 0; j < cs.consequent.length; ++j) {
      c(cs.consequent[j], st, "Statement");
    }
  }
};
base.ReturnStatement = base.YieldExpression = function (node, st, c) {
  if (node.argument) c(node.argument, st, "Expression");
};
base.ThrowStatement = base.SpreadElement = base.RestElement = function (node, st, c) {
  return c(node.argument, st, "Expression");
};
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement");
  if (node.handler) c(node.handler.body, st, "ScopeBody");
  if (node.finalizer) c(node.finalizer, st, "Statement");
};
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForStatement = function (node, st, c) {
  if (node.init) c(node.init, st, "ForInit");
  if (node.test) c(node.test, st, "Expression");
  if (node.update) c(node.update, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit");
  c(node.right, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInit = function (node, st, c) {
  if (node.type == "VariableDeclaration") c(node, st);else c(node, st, "Expression");
};
base.DebuggerStatement = ignore;

base.FunctionDeclaration = function (node, st, c) {
  return c(node, st, "Function");
};
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0; i < node.declarations.length; ++i) {
    var decl = node.declarations[i];
    if (decl.init) c(decl.init, st, "Expression");
  }
};

base.Function = function (node, st, c) {
  return c(node.body, st, "ScopeBody");
};
base.ScopeBody = function (node, st, c) {
  return c(node, st, "Statement");
};

base.Expression = skipThrough;
base.ThisExpression = base.Super = base.MetaProperty = ignore;
base.ArrayExpression = base.ArrayPattern = function (node, st, c) {
  for (var i = 0; i < node.elements.length; ++i) {
    var elt = node.elements[i];
    if (elt) c(elt, st, "Expression");
  }
};
base.ObjectExpression = base.ObjectPattern = function (node, st, c) {
  for (var i = 0; i < node.properties.length; ++i) {
    c(node.properties[i], st);
  }
};
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
base.SequenceExpression = base.TemplateLiteral = function (node, st, c) {
  for (var i = 0; i < node.expressions.length; ++i) {
    c(node.expressions[i], st, "Expression");
  }
};
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression");
};
base.BinaryExpression = base.AssignmentExpression = base.AssignmentPattern = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression");
  c(node.right, st, "Expression");
};
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Expression");
  c(node.alternate, st, "Expression");
};
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression");
  if (node.arguments) for (var i = 0; i < node.arguments.length; ++i) {
    c(node.arguments[i], st, "Expression");
  }
};
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression");
  if (node.computed) c(node.property, st, "Expression");
};
base.ExportDeclaration = function (node, st, c) {
  return c(node.declaration, st);
};
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0; i < node.specifiers.length; i++) {
    c(node.specifiers[i], st);
  }
};
base.ImportSpecifier = base.ImportBatchSpecifier = base.Identifier = base.Literal = ignore;

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression");
  c(node.quasi, st);
};
base.ClassDeclaration = base.ClassExpression = function (node, st, c) {
  if (node.superClass) c(node.superClass, st, "Expression");
  for (var i = 0; i < node.body.body.length; i++) {
    c(node.body.body[i], st);
  }
};
base.MethodDefinition = base.Property = function (node, st, c) {
  if (node.computed) c(node.key, st, "Expression");
  c(node.value, st, "Expression");
};
base.ComprehensionExpression = function (node, st, c) {
  for (var i = 0; i < node.blocks.length; i++) {
    c(node.blocks[i].right, st, "Expression");
  }c(node.body, st, "Expression");
};

},{}]},{},[1])(1)
});

/* codemirror/addon/tern/lib/polyfill.js */
// Shims to fill in enough of ECMAScript 5 to make Tern run. Does not
// supply standard-compliant methods, in that some functionality is
// left out (such as second argument to Object.create, self args in
// array methods, etc). WILL clash with other ECMA5 polyfills in a
// probably disruptive way.

(function() {
  Object.create = Object.create || (function() {
    if (!({__proto__: null} instanceof Object))
      return function(base) { return {__proto__: base}; };
    function ctor() {}
    var frame = document.body.appendChild(document.createElement("iframe"));
    frame.src = "javascript:";
    var empty = frame.contentWindow.Object.prototype;
    delete empty.hasOwnProperty;
    delete empty.isPrototypeOf;
    delete empty.propertyIsEnumerable;
    delete empty.valueOf;
    delete empty.toString;
    delete empty.toLocaleString;
    delete empty.constructor;
    return function(base) { ctor.prototype = base || empty; return new ctor(); };
  })();

  // Array methods

  var AP = Array.prototype;

  AP.some = AP.some || function(pred) {
    for (var i = 0; i < this.length; ++i) if (pred(this[i], i)) return true;
  };

  AP.forEach = AP.forEach || function(f) {
    for (var i = 0; i < this.length; ++i) f(this[i], i);
  };

  AP.indexOf = AP.indexOf || function(x, start) {
    for (var i = start || 0; i < this.length; ++i) if (this[i] === x) return i;
    return -1;
  };

  AP.lastIndexOf = AP.lastIndexOf || function(x, start) {
    for (var i = start == null ? this.length - 1 : start; i >= 0; ++i) if (this[i] === x) return i;
    return -1;
  };

  AP.map = AP.map || function(f) {
    for (var r = [], i = 0; i < this.length; ++i) r.push(f(this[i], i));
    return r;
  };

  Array.isArray = Array.isArray || function(v) {
    return Object.prototype.toString.call(v) == "[object Array]";
  };

  String.prototype.trim = String.prototype.trim || function() {
    var from = 0, to = this.length;
    while (/\s/.test(this.charAt(from))) ++from;
    while (/\s/.test(this.charAt(to - 1))) --to;
    return this.slice(from, to);
  };

/*! JSON v3.2.4 | http://bestiejs.github.com/json3 | Copyright 2012, Kit Cambridge | http://kit.mit-license.org */
if (!window.JSON) (function(){var e=void 0,i=!0,k=null,l={}.toString,m,n,p="function"===typeof define&&define.c,q=!p&&"object"==typeof exports&&exports;q||p?"object"==typeof JSON&&JSON?p?q=JSON:(q.stringify=JSON.stringify,q.parse=JSON.parse):p&&(q=this.JSON={}):q=this.JSON||(this.JSON={});var r,t,u,x,z,B,C,D,E,F,G,H,I,J=new Date(-3509827334573292),K,O,P;try{J=-109252==J.getUTCFullYear()&&0===J.getUTCMonth()&&1==J.getUTCDate()&&10==J.getUTCHours()&&37==J.getUTCMinutes()&&6==J.getUTCSeconds()&&708==J.getUTCMilliseconds()}catch(Q){}
function R(b){var c,a,d,j=b=="json";if(j||b=="json-stringify"||b=="json-parse"){if(b=="json-stringify"||j){if(c=typeof q.stringify=="function"&&J){(d=function(){return 1}).toJSON=d;try{c=q.stringify(0)==="0"&&q.stringify(new Number)==="0"&&q.stringify(new String)=='""'&&q.stringify(l)===e&&q.stringify(e)===e&&q.stringify()===e&&q.stringify(d)==="1"&&q.stringify([d])=="[1]"&&q.stringify([e])=="[null]"&&q.stringify(k)=="null"&&q.stringify([e,l,k])=="[null,null,null]"&&q.stringify({A:[d,i,false,k,"\x00\u0008\n\u000c\r\t"]})==
'{"A":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}'&&q.stringify(k,d)==="1"&&q.stringify([1,2],k,1)=="[\n 1,\n 2\n]"&&q.stringify(new Date(-864E13))=='"-271821-04-20T00:00:00.000Z"'&&q.stringify(new Date(864E13))=='"+275760-09-13T00:00:00.000Z"'&&q.stringify(new Date(-621987552E5))=='"-000001-01-01T00:00:00.000Z"'&&q.stringify(new Date(-1))=='"1969-12-31T23:59:59.999Z"'}catch(f){c=false}}if(!j)return c}if(b=="json-parse"||j){if(typeof q.parse=="function")try{if(q.parse("0")===0&&!q.parse(false)){d=
q.parse('{"A":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}');if(a=d.a.length==5&&d.a[0]==1){try{a=!q.parse('"\t"')}catch(o){}if(a)try{a=q.parse("01")!=1}catch(g){}}}}catch(h){a=false}if(!j)return a}return c&&a}}
if(!R("json")){J||(K=Math.floor,O=[0,31,59,90,120,151,181,212,243,273,304,334],P=function(b,c){return O[c]+365*(b-1970)+K((b-1969+(c=+(c>1)))/4)-K((b-1901+c)/100)+K((b-1601+c)/400)});if(!(m={}.hasOwnProperty))m=function(b){var c={},a;if((c.__proto__=k,c.__proto__={toString:1},c).toString!=l)m=function(a){var b=this.__proto__,a=a in(this.__proto__=k,this);this.__proto__=b;return a};else{a=c.constructor;m=function(b){var c=(this.constructor||a).prototype;return b in this&&!(b in c&&this[b]===c[b])}}c=
k;return m.call(this,b)};n=function(b,c){var a=0,d,j,f;(d=function(){this.valueOf=0}).prototype.valueOf=0;j=new d;for(f in j)m.call(j,f)&&a++;d=j=k;if(a)a=a==2?function(a,b){var c={},d=l.call(a)=="[object Function]",f;for(f in a)!(d&&f=="prototype")&&!m.call(c,f)&&(c[f]=1)&&m.call(a,f)&&b(f)}:function(a,b){var c=l.call(a)=="[object Function]",d,f;for(d in a)!(c&&d=="prototype")&&m.call(a,d)&&!(f=d==="constructor")&&b(d);(f||m.call(a,d="constructor"))&&b(d)};else{j=["valueOf","toString","toLocaleString",
"propertyIsEnumerable","isPrototypeOf","hasOwnProperty","constructor"];a=function(a,b){var c=l.call(a)=="[object Function]",d;for(d in a)!(c&&d=="prototype")&&m.call(a,d)&&b(d);for(c=j.length;d=j[--c];m.call(a,d)&&b(d));}}a(b,c)};R("json-stringify")||(r={"\\":"\\\\",'"':'\\"',"\u0008":"\\b","\u000c":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"},t=function(b,c){return("000000"+(c||0)).slice(-b)},u=function(b){for(var c='"',a=0,d;d=b.charAt(a);a++)c=c+('\\"\u0008\u000c\n\r\t'.indexOf(d)>-1?r[d]:r[d]=d<" "?
"\\u00"+t(2,d.charCodeAt(0).toString(16)):d);return c+'"'},x=function(b,c,a,d,j,f,o){var g=c[b],h,s,v,w,L,M,N,y,A;if(typeof g=="object"&&g){h=l.call(g);if(h=="[object Date]"&&!m.call(g,"toJSON"))if(g>-1/0&&g<1/0){if(P){v=K(g/864E5);for(h=K(v/365.2425)+1970-1;P(h+1,0)<=v;h++);for(s=K((v-P(h,0))/30.42);P(h,s+1)<=v;s++);v=1+v-P(h,s);w=(g%864E5+864E5)%864E5;L=K(w/36E5)%24;M=K(w/6E4)%60;N=K(w/1E3)%60;w=w%1E3}else{h=g.getUTCFullYear();s=g.getUTCMonth();v=g.getUTCDate();L=g.getUTCHours();M=g.getUTCMinutes();
N=g.getUTCSeconds();w=g.getUTCMilliseconds()}g=(h<=0||h>=1E4?(h<0?"-":"+")+t(6,h<0?-h:h):t(4,h))+"-"+t(2,s+1)+"-"+t(2,v)+"T"+t(2,L)+":"+t(2,M)+":"+t(2,N)+"."+t(3,w)+"Z"}else g=k;else if(typeof g.toJSON=="function"&&(h!="[object Number]"&&h!="[object String]"&&h!="[object Array]"||m.call(g,"toJSON")))g=g.toJSON(b)}a&&(g=a.call(c,b,g));if(g===k)return"null";h=l.call(g);if(h=="[object Boolean]")return""+g;if(h=="[object Number]")return g>-1/0&&g<1/0?""+g:"null";if(h=="[object String]")return u(g);if(typeof g==
"object"){for(b=o.length;b--;)if(o[b]===g)throw TypeError();o.push(g);y=[];c=f;f=f+j;if(h=="[object Array]"){s=0;for(b=g.length;s<b;A||(A=i),s++){h=x(s,g,a,d,j,f,o);y.push(h===e?"null":h)}b=A?j?"[\n"+f+y.join(",\n"+f)+"\n"+c+"]":"["+y.join(",")+"]":"[]"}else{n(d||g,function(b){var c=x(b,g,a,d,j,f,o);c!==e&&y.push(u(b)+":"+(j?" ":"")+c);A||(A=i)});b=A?j?"{\n"+f+y.join(",\n"+f)+"\n"+c+"}":"{"+y.join(",")+"}":"{}"}o.pop();return b}},q.stringify=function(b,c,a){var d,j,f,o,g,h;if(typeof c=="function"||
typeof c=="object"&&c)if(l.call(c)=="[object Function]")j=c;else if(l.call(c)=="[object Array]"){f={};o=0;for(g=c.length;o<g;h=c[o++],(l.call(h)=="[object String]"||l.call(h)=="[object Number]")&&(f[h]=1));}if(a)if(l.call(a)=="[object Number]"){if((a=a-a%1)>0){d="";for(a>10&&(a=10);d.length<a;d=d+" ");}}else l.call(a)=="[object String]"&&(d=a.length<=10?a:a.slice(0,10));return x("",(h={},h[""]=b,h),j,f,d,"",[])});R("json-parse")||(z=String.fromCharCode,B={"\\":"\\",'"':'"',"/":"/",b:"\u0008",t:"\t",
n:"\n",f:"\u000c",r:"\r"},C=function(){H=I=k;throw SyntaxError();},D=function(){for(var b=I,c=b.length,a,d,j,f,o;H<c;){a=b.charAt(H);if("\t\r\n ".indexOf(a)>-1)H++;else{if("{}[]:,".indexOf(a)>-1){H++;return a}if(a=='"'){d="@";for(H++;H<c;){a=b.charAt(H);if(a<" ")C();else if(a=="\\"){a=b.charAt(++H);if('\\"/btnfr'.indexOf(a)>-1){d=d+B[a];H++}else if(a=="u"){j=++H;for(f=H+4;H<f;H++){a=b.charAt(H);a>="0"&&a<="9"||a>="a"&&a<="f"||a>="A"&&a<="F"||C()}d=d+z("0x"+b.slice(j,H))}else C()}else{if(a=='"')break;
d=d+a;H++}}if(b.charAt(H)=='"'){H++;return d}}else{j=H;if(a=="-"){o=i;a=b.charAt(++H)}if(a>="0"&&a<="9"){for(a=="0"&&(a=b.charAt(H+1),a>="0"&&a<="9")&&C();H<c&&(a=b.charAt(H),a>="0"&&a<="9");H++);if(b.charAt(H)=="."){for(f=++H;f<c&&(a=b.charAt(f),a>="0"&&a<="9");f++);f==H&&C();H=f}a=b.charAt(H);if(a=="e"||a=="E"){a=b.charAt(++H);(a=="+"||a=="-")&&H++;for(f=H;f<c&&(a=b.charAt(f),a>="0"&&a<="9");f++);f==H&&C();H=f}return+b.slice(j,H)}o&&C();if(b.slice(H,H+4)=="true"){H=H+4;return i}if(b.slice(H,H+5)==
"false"){H=H+5;return false}if(b.slice(H,H+4)=="null"){H=H+4;return k}}C()}}return"$"},E=function(b){var c,a;b=="$"&&C();if(typeof b=="string"){if(b.charAt(0)=="@")return b.slice(1);if(b=="["){for(c=[];;a||(a=i)){b=D();if(b=="]")break;if(a)if(b==","){b=D();b=="]"&&C()}else C();b==","&&C();c.push(E(b))}return c}if(b=="{"){for(c={};;a||(a=i)){b=D();if(b=="}")break;if(a)if(b==","){b=D();b=="}"&&C()}else C();(b==","||typeof b!="string"||b.charAt(0)!="@"||D()!=":")&&C();c[b.slice(1)]=E(D())}return c}C()}return b},
G=function(b,c,a){a=F(b,c,a);a===e?delete b[c]:b[c]=a},F=function(b,c,a){var d=b[c],j;if(typeof d=="object"&&d)if(l.call(d)=="[object Array]")for(j=d.length;j--;)G(d,j,a);else n(d,function(b){G(d,b,a)});return a.call(b,c,d)},q.parse=function(b,c){var a,d;H=0;I=b;a=E(D());D()!="$"&&C();H=I=k;return c&&l.call(c)=="[object Function]"?F((d={},d[""]=a,d),"",c):a})}p&&define(function(){return q});
}());
})();

/* codemirror/addon/tern/lib/signal.js */
(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(exports);
  if (typeof define == "function" && define.amd) // AMD
    return define(["exports"], mod);
  mod((root.tern || (root.tern = {})).signal = {}); // Plain browser env
})(this, function(exports) {
  function on(type, f) {
    var handlers = this._handlers || (this._handlers = Object.create(null));
    (handlers[type] || (handlers[type] = [])).push(f);
  }
  function off(type, f) {
    var arr = this._handlers && this._handlers[type];
    if (arr) for (var i = 0; i < arr.length; ++i)
      if (arr[i] == f) { arr.splice(i, 1); break; }
  }
  function signal(type, a1, a2, a3, a4) {
    var arr = this._handlers && this._handlers[type];
    if (arr) for (var i = 0; i < arr.length; ++i) arr[i].call(this, a1, a2, a3, a4);
  }

  exports.mixin = function(obj) {
    obj.on = on; obj.off = off; obj.signal = signal;
    return obj;
  };
});

/* codemirror/addon/tern/lib/tern.js */
// The Tern server object

// A server is a stateful object that manages the analysis for a
// project, and defines an interface for querying the code in the
// project.

(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(exports, require("./infer"), require("./signal"),
               require("acorn"), require("acorn/dist/walk"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["exports", "./infer", "./signal", "acorn/dist/acorn", "acorn/dist/walk"], mod);
  mod(root.tern || (root.tern = {}), tern, tern.signal, acorn, acorn.walk); // Plain browser env
})(this, function(exports, infer, signal, acorn, walk) {
  "use strict";

  var plugins = Object.create(null);
  exports.registerPlugin = function(name, init) { plugins[name] = init; };

  var defaultOptions = exports.defaultOptions = {
    debug: false,
    async: false,
    getFile: function(_f, c) { if (this.async) c(null, null); },
    defs: [],
    plugins: {},
    fetchTimeout: 1000,
    dependencyBudget: 20000,
    reuseInstances: true,
    stripCRs: false
  };

  var queryTypes = {
    completions: {
      takesFile: true,
      run: findCompletions
    },
    properties: {
      run: findProperties
    },
    type: {
      takesFile: true,
      run: findTypeAt
    },
    documentation: {
      takesFile: true,
      run: findDocs
    },
    definition: {
      takesFile: true,
      run: findDef
    },
    refs: {
      takesFile: true,
      fullFile: true,
      run: findRefs
    },
    rename: {
      takesFile: true,
      fullFile: true,
      run: buildRename
    },
    files: {
      run: listFiles
    }
  };

  exports.defineQueryType = function(name, desc) { queryTypes[name] = desc; };

  function File(name, parent) {
    this.name = name;
    this.parent = parent;
    this.scope = this.text = this.ast = this.lineOffsets = null;
  }
  File.prototype.asLineChar = function(pos) { return asLineChar(this, pos); };

  function updateText(file, text, srv) {
    file.text = srv.options.stripCRs ? text.replace(/\r\n/g, "\n") : text;
    infer.withContext(srv.cx, function() {
      file.ast = infer.parse(file.text, srv.passes, {directSourceFile: file, allowReturnOutsideFunction: true});
    });
    file.lineOffsets = null;
  }

  var Server = exports.Server = function(options) {
    this.cx = null;
    this.options = options || {};
    for (var o in defaultOptions) if (!options.hasOwnProperty(o))
      options[o] = defaultOptions[o];

    this.handlers = Object.create(null);
    this.files = [];
    this.fileMap = Object.create(null);
    this.needsPurge = [];
    this.budgets = Object.create(null);
    this.uses = 0;
    this.pending = 0;
    this.asyncError = null;
    this.passes = Object.create(null);

    this.defs = options.defs.slice(0);
    for (var plugin in options.plugins) if (options.plugins.hasOwnProperty(plugin) && plugin in plugins) {
      var init = plugins[plugin](this, options.plugins[plugin]);
      if (init && init.defs) {
        if (init.loadFirst) this.defs.unshift(init.defs);
        else this.defs.push(init.defs);
      }
      if (init && init.passes) for (var type in init.passes) if (init.passes.hasOwnProperty(type))
        (this.passes[type] || (this.passes[type] = [])).push(init.passes[type]);
    }

    this.reset();
  };
  Server.prototype = signal.mixin({
    addFile: function(name, /*optional*/ text, parent) {
      // Don't crash when sloppy plugins pass non-existent parent ids
      if (parent && !(parent in this.fileMap)) parent = null;
      ensureFile(this, name, parent, text);
    },
    delFile: function(name) {
      var file = this.findFile(name);
      if (file) {
        this.needsPurge.push(file.name);
        this.files.splice(this.files.indexOf(file), 1);
        delete this.fileMap[name];
      }
    },
    reset: function() {
      this.signal("reset");
      this.cx = new infer.Context(this.defs, this);
      this.uses = 0;
      this.budgets = Object.create(null);
      for (var i = 0; i < this.files.length; ++i) {
        var file = this.files[i];
        file.scope = null;
      }
    },

    request: function(doc, c) {
      var inv = invalidDoc(doc);
      if (inv) return c(inv);

      var self = this;
      doRequest(this, doc, function(err, data) {
        c(err, data);
        if (self.uses > 40) {
          self.reset();
          analyzeAll(self, null, function(){});
        }
      });
    },

    findFile: function(name) {
      return this.fileMap[name];
    },

    flush: function(c) {
      var cx = this.cx;
      analyzeAll(this, null, function(err) {
        if (err) return c(err);
        infer.withContext(cx, c);
      });
    },

    startAsyncAction: function() {
      ++this.pending;
    },
    finishAsyncAction: function(err) {
      if (err) this.asyncError = err;
      if (--this.pending === 0) this.signal("everythingFetched");
    }
  });

  function doRequest(srv, doc, c) {
    if (doc.query && !queryTypes.hasOwnProperty(doc.query.type))
      return c("No query type '" + doc.query.type + "' defined");

    var query = doc.query;
    // Respond as soon as possible when this just uploads files
    if (!query) c(null, {});

    var files = doc.files || [];
    if (files.length) ++srv.uses;
    for (var i = 0; i < files.length; ++i) {
      var file = files[i];
      if (file.type == "delete")
        srv.delFile(file.name);
      else
        ensureFile(srv, file.name, null, file.type == "full" ? file.text : null);
    }

    var timeBudget = typeof doc.timeout == "number" ? [doc.timeout] : null;
    if (!query) {
      analyzeAll(srv, timeBudget, function(){});
      return;
    }

    var queryType = queryTypes[query.type];
    if (queryType.takesFile) {
      if (typeof query.file != "string") return c(".query.file must be a string");
      if (!/^#/.test(query.file)) ensureFile(srv, query.file, null);
    }

    analyzeAll(srv, timeBudget, function(err) {
      if (err) return c(err);
      var file = queryType.takesFile && resolveFile(srv, files, query.file);
      if (queryType.fullFile && file.type == "part")
        return c("Can't run a " + query.type + " query on a file fragment");

      function run() {
        var result;
        try {
          result = queryType.run(srv, query, file);
        } catch (e) {
          if (srv.options.debug && e.name != "TernError") console.error(e.stack);
          return c(e);
        }
        c(null, result);
      }
      infer.withContext(srv.cx, timeBudget ? function() { infer.withTimeout(timeBudget[0], run); } : run);
    });
  }

  function analyzeFile(srv, file) {
    infer.withContext(srv.cx, function() {
      file.scope = srv.cx.topScope;
      srv.signal("beforeLoad", file);
      infer.analyze(file.ast, file.name, file.scope, srv.passes);
      srv.signal("afterLoad", file);
    });
    return file;
  }

  function ensureFile(srv, name, parent, text) {
    var known = srv.findFile(name);
    if (known) {
      if (text != null) {
        if (known.scope) {
          srv.needsPurge.push(name);
          known.scope = null;
        }
        updateText(known, text, srv);
      }
      if (parentDepth(srv, known.parent) > parentDepth(srv, parent)) {
        known.parent = parent;
        if (known.excluded) known.excluded = null;
      }
      return;
    }

    var file = new File(name, parent);
    srv.files.push(file);
    srv.fileMap[name] = file;
    if (text != null) {
      updateText(file, text, srv);
    } else if (srv.options.async) {
      srv.startAsyncAction();
      srv.options.getFile(name, function(err, text) {
        updateText(file, text || "", srv);
        srv.finishAsyncAction(err);
      });
    } else {
      updateText(file, srv.options.getFile(name) || "", srv);
    }
  }

  function fetchAll(srv, c) {
    var done = true, returned = false;
    srv.files.forEach(function(file) {
      if (file.text != null) return;
      if (srv.options.async) {
        done = false;
        srv.options.getFile(file.name, function(err, text) {
          if (err && !returned) { returned = true; return c(err); }
          updateText(file, text || "", srv);
          fetchAll(srv, c);
        });
      } else {
        try {
          updateText(file, srv.options.getFile(file.name) || "", srv);
        } catch (e) { return c(e); }
      }
    });
    if (done) c();
  }

  function waitOnFetch(srv, timeBudget, c) {
    var done = function() {
      srv.off("everythingFetched", done);
      clearTimeout(timeout);
      analyzeAll(srv, timeBudget, c);
    };
    srv.on("everythingFetched", done);
    var timeout = setTimeout(done, srv.options.fetchTimeout);
  }

  function analyzeAll(srv, timeBudget, c) {
    if (srv.pending) return waitOnFetch(srv, timeBudget, c);

    var e = srv.fetchError;
    if (e) { srv.fetchError = null; return c(e); }

    if (srv.needsPurge.length > 0) infer.withContext(srv.cx, function() {
      infer.purge(srv.needsPurge);
      srv.needsPurge.length = 0;
    });

    var done = true;
    // The second inner loop might add new files. The outer loop keeps
    // repeating both inner loops until all files have been looked at.
    for (var i = 0; i < srv.files.length;) {
      var toAnalyze = [];
      for (; i < srv.files.length; ++i) {
        var file = srv.files[i];
        if (file.text == null) done = false;
        else if (file.scope == null && !file.excluded) toAnalyze.push(file);
      }
      toAnalyze.sort(function(a, b) {
        return parentDepth(srv, a.parent) - parentDepth(srv, b.parent);
      });
      for (var j = 0; j < toAnalyze.length; j++) {
        var file = toAnalyze[j];
        if (file.parent && !chargeOnBudget(srv, file)) {
          file.excluded = true;
        } else if (timeBudget) {
          var startTime = +new Date;
          infer.withTimeout(timeBudget[0], function() { analyzeFile(srv, file); });
          timeBudget[0] -= +new Date - startTime;
        } else {
          analyzeFile(srv, file);
        }
      }
    }
    if (done) c();
    else waitOnFetch(srv, timeBudget, c);
  }

  function firstLine(str) {
    var end = str.indexOf("\n");
    if (end < 0) return str;
    return str.slice(0, end);
  }

  function findMatchingPosition(line, file, near) {
    var pos = Math.max(0, near - 500), closest = null;
    if (!/^\s*$/.test(line)) for (;;) {
      var found = file.indexOf(line, pos);
      if (found < 0 || found > near + 500) break;
      if (closest == null || Math.abs(closest - near) > Math.abs(found - near))
        closest = found;
      pos = found + line.length;
    }
    return closest;
  }

  function scopeDepth(s) {
    for (var i = 0; s; ++i, s = s.prev) {}
    return i;
  }

  function ternError(msg) {
    var err = new Error(msg);
    err.name = "TernError";
    return err;
  }

  function resolveFile(srv, localFiles, name) {
    var isRef = name.match(/^#(\d+)$/);
    if (!isRef) return srv.findFile(name);

    var file = localFiles[isRef[1]];
    if (!file || file.type == "delete") throw ternError("Reference to unknown file " + name);
    if (file.type == "full") return srv.findFile(file.name);

    // This is a partial file

    var realFile = file.backing = srv.findFile(file.name);
    var offset = file.offset;
    if (file.offsetLines) offset = {line: file.offsetLines, ch: 0};
    file.offset = offset = resolvePos(realFile, file.offsetLines == null ? file.offset : {line: file.offsetLines, ch: 0}, true);
    var line = firstLine(file.text);
    var foundPos = findMatchingPosition(line, realFile.text, offset);
    var pos = foundPos == null ? Math.max(0, realFile.text.lastIndexOf("\n", offset)) : foundPos;
    var inObject, atFunction;

    infer.withContext(srv.cx, function() {
      infer.purge(file.name, pos, pos + file.text.length);

      var text = file.text, m;
      if (m = text.match(/(?:"([^"]*)"|([\w$]+))\s*:\s*function\b/)) {
        var objNode = walk.findNodeAround(file.backing.ast, pos, "ObjectExpression");
        if (objNode && objNode.node.objType)
          inObject = {type: objNode.node.objType, prop: m[2] || m[1]};
      }
      if (foundPos && (m = line.match(/^(.*?)\bfunction\b/))) {
        var cut = m[1].length, white = "";
        for (var i = 0; i < cut; ++i) white += " ";
        text = white + text.slice(cut);
        atFunction = true;
      }

      var scopeStart = infer.scopeAt(realFile.ast, pos, realFile.scope);
      var scopeEnd = infer.scopeAt(realFile.ast, pos + text.length, realFile.scope);
      var scope = file.scope = scopeDepth(scopeStart) < scopeDepth(scopeEnd) ? scopeEnd : scopeStart;
      file.ast = infer.parse(text, srv.passes, {directSourceFile: file, allowReturnOutsideFunction: true});
      infer.analyze(file.ast, file.name, scope, srv.passes);

      // This is a kludge to tie together the function types (if any)
      // outside and inside of the fragment, so that arguments and
      // return values have some information known about them.
      tieTogether: if (inObject || atFunction) {
        var newInner = infer.scopeAt(file.ast, line.length, scopeStart);
        if (!newInner.fnType) break tieTogether;
        if (inObject) {
          var prop = inObject.type.getProp(inObject.prop);
          prop.addType(newInner.fnType);
        } else if (atFunction) {
          var inner = infer.scopeAt(realFile.ast, pos + line.length, realFile.scope);
          if (inner == scopeStart || !inner.fnType) break tieTogether;
          var fOld = inner.fnType, fNew = newInner.fnType;
          if (!fNew || (fNew.name != fOld.name && fOld.name)) break tieTogether;
          for (var i = 0, e = Math.min(fOld.args.length, fNew.args.length); i < e; ++i)
            fOld.args[i].propagate(fNew.args[i]);
          fOld.self.propagate(fNew.self);
          fNew.retval.propagate(fOld.retval);
        }
      }
    });
    return file;
  }

  // Budget management

  function astSize(node) {
    var size = 0;
    walk.simple(node, {Expression: function() { ++size; }});
    return size;
  }

  function parentDepth(srv, parent) {
    var depth = 0;
    while (parent) {
      parent = srv.findFile(parent).parent;
      ++depth;
    }
    return depth;
  }

  function budgetName(srv, file) {
    for (;;) {
      var parent = srv.findFile(file.parent);
      if (!parent.parent) break;
      file = parent;
    }
    return file.name;
  }

  function chargeOnBudget(srv, file) {
    var bName = budgetName(srv, file);
    var size = astSize(file.ast);
    var known = srv.budgets[bName];
    if (known == null)
      known = srv.budgets[bName] = srv.options.dependencyBudget;
    if (known < size) return false;
    srv.budgets[bName] = known - size;
    return true;
  }

  // Query helpers

  function isPosition(val) {
    return typeof val == "number" || typeof val == "object" &&
      typeof val.line == "number" && typeof val.ch == "number";
  }

  // Baseline query document validation
  function invalidDoc(doc) {
    if (doc.query) {
      if (typeof doc.query.type != "string") return ".query.type must be a string";
      if (doc.query.start && !isPosition(doc.query.start)) return ".query.start must be a position";
      if (doc.query.end && !isPosition(doc.query.end)) return ".query.end must be a position";
    }
    if (doc.files) {
      if (!Array.isArray(doc.files)) return "Files property must be an array";
      for (var i = 0; i < doc.files.length; ++i) {
        var file = doc.files[i];
        if (typeof file != "object") return ".files[n] must be objects";
        else if (typeof file.name != "string") return ".files[n].name must be a string";
        else if (file.type == "delete") continue;
        else if (typeof file.text != "string") return ".files[n].text must be a string";
        else if (file.type == "part") {
          if (!isPosition(file.offset) && typeof file.offsetLines != "number")
            return ".files[n].offset must be a position";
        } else if (file.type != "full") return ".files[n].type must be \"full\" or \"part\"";
      }
    }
  }

  var offsetSkipLines = 25;

  function findLineStart(file, line) {
    var text = file.text, offsets = file.lineOffsets || (file.lineOffsets = [0]);
    var pos = 0, curLine = 0;
    var storePos = Math.min(Math.floor(line / offsetSkipLines), offsets.length - 1);
    var pos = offsets[storePos], curLine = storePos * offsetSkipLines;

    while (curLine < line) {
      ++curLine;
      pos = text.indexOf("\n", pos) + 1;
      if (pos === 0) return null;
      if (curLine % offsetSkipLines === 0) offsets.push(pos);
    }
    return pos;
  }

  var resolvePos = exports.resolvePos = function(file, pos, tolerant) {
    if (typeof pos != "number") {
      var lineStart = findLineStart(file, pos.line);
      if (lineStart == null) {
        if (tolerant) pos = file.text.length;
        else throw ternError("File doesn't contain a line " + pos.line);
      } else {
        pos = lineStart + pos.ch;
      }
    }
    if (pos > file.text.length) {
      if (tolerant) pos = file.text.length;
      else throw ternError("Position " + pos + " is outside of file.");
    }
    return pos;
  };

  function asLineChar(file, pos) {
    if (!file) return {line: 0, ch: 0};
    var offsets = file.lineOffsets || (file.lineOffsets = [0]);
    var text = file.text, line, lineStart;
    for (var i = offsets.length - 1; i >= 0; --i) if (offsets[i] <= pos) {
      line = i * offsetSkipLines;
      lineStart = offsets[i];
    }
    for (;;) {
      var eol = text.indexOf("\n", lineStart);
      if (eol >= pos || eol < 0) break;
      lineStart = eol + 1;
      ++line;
    }
    return {line: line, ch: pos - lineStart};
  }

  var outputPos = exports.outputPos = function(query, file, pos) {
    if (query.lineCharPositions) {
      var out = asLineChar(file, pos);
      if (file.type == "part")
        out.line += file.offsetLines != null ? file.offsetLines : asLineChar(file.backing, file.offset).line;
      return out;
    } else {
      return pos + (file.type == "part" ? file.offset : 0);
    }
  };

  // Delete empty fields from result objects
  function clean(obj) {
    for (var prop in obj) if (obj[prop] == null) delete obj[prop];
    return obj;
  }
  function maybeSet(obj, prop, val) {
    if (val != null) obj[prop] = val;
  }

  // Built-in query types

  function compareCompletions(a, b) {
    if (typeof a != "string") { a = a.name; b = b.name; }
    var aUp = /^[A-Z]/.test(a), bUp = /^[A-Z]/.test(b);
    if (aUp == bUp) return a < b ? -1 : a == b ? 0 : 1;
    else return aUp ? 1 : -1;
  }

  function isStringAround(node, start, end) {
    return node.type == "Literal" && typeof node.value == "string" &&
      node.start == start - 1 && node.end <= end + 1;
  }

  function pointInProp(objNode, point) {
    for (var i = 0; i < objNode.properties.length; i++) {
      var curProp = objNode.properties[i];
      if (curProp.key.start <= point && curProp.key.end >= point)
        return curProp;
    }
  }

  var jsKeywords = ("break do instanceof typeof case else new var " +
    "catch finally return void continue for switch while debugger " +
    "function this with default if throw delete in try").split(" ");

  function findCompletions(srv, query, file) {
    if (query.end == null) throw ternError("missing .query.end field");
    if (srv.passes.completion) for (var i = 0; i < srv.passes.completion.length; i++) {
      var result = srv.passes.completion[i](file, query);
      if (result) return result;
    }

    var wordStart = resolvePos(file, query.end), wordEnd = wordStart, text = file.text;
    while (wordStart && acorn.isIdentifierChar(text.charCodeAt(wordStart - 1))) --wordStart;
    if (query.expandWordForward !== false)
      while (wordEnd < text.length && acorn.isIdentifierChar(text.charCodeAt(wordEnd))) ++wordEnd;
    var word = text.slice(wordStart, wordEnd), completions = [], ignoreObj;
    if (query.caseInsensitive) word = word.toLowerCase();
    var wrapAsObjs = query.types || query.depths || query.docs || query.urls || query.origins;

    function gather(prop, obj, depth, addInfo) {
      // 'hasOwnProperty' and such are usually just noise, leave them
      // out when no prefix is provided.
      if ((objLit || query.omitObjectPrototype !== false) && obj == srv.cx.protos.Object && !word) return;
      if (query.filter !== false && word &&
          (query.caseInsensitive ? prop.toLowerCase() : prop).indexOf(word) !== 0) return;
      if (ignoreObj && ignoreObj.props[prop]) return;
      for (var i = 0; i < completions.length; ++i) {
        var c = completions[i];
        if ((wrapAsObjs ? c.name : c) == prop) return;
      }
      var rec = wrapAsObjs ? {name: prop} : prop;
      completions.push(rec);

      if (obj && (query.types || query.docs || query.urls || query.origins)) {
        var val = obj.props[prop];
        infer.resetGuessing();
        var type = val.getType();
        rec.guess = infer.didGuess();
        if (query.types)
          rec.type = infer.toString(val);
        if (query.docs)
          maybeSet(rec, "doc", parseDoc(query, val.doc || type && type.doc));
        if (query.urls)
          maybeSet(rec, "url", val.url || type && type.url);
        if (query.origins)
          maybeSet(rec, "origin", val.origin || type && type.origin);
      }
      if (query.depths) rec.depth = depth;
      if (wrapAsObjs && addInfo) addInfo(rec);
    }

    var hookname, prop, objType, isKey;

    var exprAt = infer.findExpressionAround(file.ast, null, wordStart, file.scope);
    var memberExpr, objLit;
    // Decide whether this is an object property, either in a member
    // expression or an object literal.
    if (exprAt) {
      if (exprAt.node.type == "MemberExpression" && exprAt.node.object.end < wordStart) {
        memberExpr = exprAt;
      } else if (isStringAround(exprAt.node, wordStart, wordEnd)) {
        var parent = infer.parentNode(exprAt.node, file.ast);
        if (parent.type == "MemberExpression" && parent.property == exprAt.node)
          memberExpr = {node: parent, state: exprAt.state};
      } else if (exprAt.node.type == "ObjectExpression") {
        var objProp = pointInProp(exprAt.node, wordEnd);
        if (objProp) {
          objLit = exprAt;
          prop = isKey = objProp.key.name;
        } else if (!word && !/:\s*$/.test(file.text.slice(0, wordStart))) {
          objLit = exprAt;
          prop = isKey = true;
        }
      }
    }

    if (objLit) {
      // Since we can't use the type of the literal itself to complete
      // its properties (it doesn't contain the information we need),
      // we have to try asking the surrounding expression for type info.
      objType = infer.typeFromContext(file.ast, objLit);
      ignoreObj = objLit.node.objType;
    } else if (memberExpr) {
      prop = memberExpr.node.property;
      prop = prop.type == "Literal" ? prop.value.slice(1) : prop.name;
      memberExpr.node = memberExpr.node.object;
      objType = infer.expressionType(memberExpr);
    } else if (text.charAt(wordStart - 1) == ".") {
      var pathStart = wordStart - 1;
      while (pathStart && (text.charAt(pathStart - 1) == "." || acorn.isIdentifierChar(text.charCodeAt(pathStart - 1)))) pathStart--;
      var path = text.slice(pathStart, wordStart - 1);
      if (path) {
        objType = infer.def.parsePath(path, file.scope).getObjType();
        prop = word;
      }
    }

    if (prop != null) {
      srv.cx.completingProperty = prop;

      if (objType) infer.forAllPropertiesOf(objType, gather);

      if (!completions.length && query.guess !== false && objType && objType.guessProperties)
        objType.guessProperties(function(p, o, d) {if (p != prop && p != "✖") gather(p, o, d);});
      if (!completions.length && word.length >= 2 && query.guess !== false)
        for (var prop in srv.cx.props) gather(prop, srv.cx.props[prop][0], 0);
      hookname = "memberCompletion";
    } else {
      infer.forAllLocalsAt(file.ast, wordStart, file.scope, gather);
      if (query.includeKeywords) jsKeywords.forEach(function(kw) {
        gather(kw, null, 0, function(rec) { rec.isKeyword = true; });
      });
      hookname = "variableCompletion";
    }
    if (srv.passes[hookname])
      srv.passes[hookname].forEach(function(hook) {hook(file, wordStart, wordEnd, gather);});

    if (query.sort !== false) completions.sort(compareCompletions);
    srv.cx.completingProperty = null;

    return {start: outputPos(query, file, wordStart),
            end: outputPos(query, file, wordEnd),
            isProperty: !!prop,
            isObjectKey: !!isKey,
            completions: completions};
  }

  function findProperties(srv, query) {
    var prefix = query.prefix, found = [];
    for (var prop in srv.cx.props)
      if (prop != "<i>" && (!prefix || prop.indexOf(prefix) === 0)) found.push(prop);
    if (query.sort !== false) found.sort(compareCompletions);
    return {completions: found};
  }

  var findExpr = exports.findQueryExpr = function(file, query, wide) {
    if (query.end == null) throw ternError("missing .query.end field");

    if (query.variable) {
      var scope = infer.scopeAt(file.ast, resolvePos(file, query.end), file.scope);
      return {node: {type: "Identifier", name: query.variable, start: query.end, end: query.end + 1},
              state: scope};
    } else {
      var start = query.start && resolvePos(file, query.start), end = resolvePos(file, query.end);
      var expr = infer.findExpressionAt(file.ast, start, end, file.scope);
      if (expr) return expr;
      expr = infer.findExpressionAround(file.ast, start, end, file.scope);
      if (expr && (expr.node.type == "ObjectExpression" || wide ||
                   (start == null ? end : start) - expr.node.start < 20 || expr.node.end - end < 20))
        return expr;
      return null;
    }
  };

  function findExprOrThrow(file, query, wide) {
    var expr = findExpr(file, query, wide);
    if (expr) return expr;
    throw ternError("No expression at the given position.");
  }

  function ensureObj(tp) {
    if (!tp || !(tp = tp.getType()) || !(tp instanceof infer.Obj)) return null;
    return tp;
  }

  function findExprType(srv, query, file, expr) {
    var type;
    if (expr) {
      infer.resetGuessing();
      type = infer.expressionType(expr);
    }
    if (srv.passes["typeAt"]) {
      var pos = resolvePos(file, query.end);
      srv.passes["typeAt"].forEach(function(hook) {
        type = hook(file, pos, expr, type);
      });
    }
    if (!type) throw ternError("No type found at the given position.");

    var objProp;
    if (expr.node.type == "ObjectExpression" && query.end != null &&
        (objProp = pointInProp(expr.node, resolvePos(file, query.end)))) {
      var name = objProp.key.name;
      var fromCx = ensureObj(infer.typeFromContext(file.ast, expr));
      if (fromCx && fromCx.hasProp(name)) {
        type = fromCx.hasProp(name);
      } else {
        var fromLocal = ensureObj(type);
        if (fromLocal && fromLocal.hasProp(name))
          type = fromLocal.hasProp(name);
      }
    }
    return type;
  };

  function findTypeAt(srv, query, file) {
    var expr = findExpr(file, query), exprName;
    var type = findExprType(srv, query, file, expr), exprType = type;
    if (query.preferFunction)
      type = type.getFunctionType() || type.getType();
    else
      type = type.getType();

    if (expr) {
      if (expr.node.type == "Identifier")
        exprName = expr.node.name;
      else if (expr.node.type == "MemberExpression" && !expr.node.computed)
        exprName = expr.node.property.name;
    }

    if (query.depth != null && typeof query.depth != "number")
      throw ternError(".query.depth must be a number");

    var result = {guess: infer.didGuess(),
                  type: infer.toString(exprType, query.depth),
                  name: type && type.name,
                  exprName: exprName};
    if (type) storeTypeDocs(query, type, result);
    if (!result.doc && exprType.doc) result.doc = parseDoc(query, exprType.doc);

    return clean(result);
  }

  function parseDoc(query, doc) {
    if (!doc) return null;
    if (query.docFormat == "full") return doc;
    var parabreak = /.\n[\s@\n]/.exec(doc);
    if (parabreak) doc = doc.slice(0, parabreak.index + 1);
    doc = doc.replace(/\n\s*/g, " ");
    if (doc.length < 100) return doc;
    var sentenceEnd = /[\.!?] [A-Z]/g;
    sentenceEnd.lastIndex = 80;
    var found = sentenceEnd.exec(doc);
    if (found) doc = doc.slice(0, found.index + 1);
    return doc;
  }

  function findDocs(srv, query, file) {
    var expr = findExpr(file, query);
    var type = findExprType(srv, query, file, expr);
    var result = {url: type.url, doc: parseDoc(query, type.doc), type: infer.toString(type)};
    var inner = type.getType();
    if (inner) storeTypeDocs(query, inner, result);
    return clean(result);
  }

  function storeTypeDocs(query, type, out) {
    if (!out.url) out.url = type.url;
    if (!out.doc) out.doc = parseDoc(query, type.doc);
    if (!out.origin) out.origin = type.origin;
    var ctor, boring = infer.cx().protos;
    if (!out.url && !out.doc && type.proto && (ctor = type.proto.hasCtor) &&
        type.proto != boring.Object && type.proto != boring.Function && type.proto != boring.Array) {
      out.url = ctor.url;
      out.doc = parseDoc(query, ctor.doc);
    }
  }

  var getSpan = exports.getSpan = function(obj) {
    if (!obj.origin) return;
    if (obj.originNode) {
      var node = obj.originNode;
      if (/^Function/.test(node.type) && node.id) node = node.id;
      return {origin: obj.origin, node: node};
    }
    if (obj.span) return {origin: obj.origin, span: obj.span};
  };

  var storeSpan = exports.storeSpan = function(srv, query, span, target) {
    target.origin = span.origin;
    if (span.span) {
      var m = /^(\d+)\[(\d+):(\d+)\]-(\d+)\[(\d+):(\d+)\]$/.exec(span.span);
      target.start = query.lineCharPositions ? {line: Number(m[2]), ch: Number(m[3])} : Number(m[1]);
      target.end = query.lineCharPositions ? {line: Number(m[5]), ch: Number(m[6])} : Number(m[4]);
    } else {
      var file = srv.findFile(span.origin);
      target.start = outputPos(query, file, span.node.start);
      target.end = outputPos(query, file, span.node.end);
    }
  };

  function findDef(srv, query, file) {
    var expr = findExpr(file, query);
    var type = findExprType(srv, query, file, expr);
    if (infer.didGuess()) return {};

    var span = getSpan(type);
    var result = {url: type.url, doc: parseDoc(query, type.doc), origin: type.origin};

    if (type.types) for (var i = type.types.length - 1; i >= 0; --i) {
      var tp = type.types[i];
      storeTypeDocs(query, tp, result);
      if (!span) span = getSpan(tp);
    }

    if (span && span.node) { // refers to a loaded file
      var spanFile = span.node.sourceFile || srv.findFile(span.origin);
      var start = outputPos(query, spanFile, span.node.start), end = outputPos(query, spanFile, span.node.end);
      result.start = start; result.end = end;
      result.file = span.origin;
      var cxStart = Math.max(0, span.node.start - 50);
      result.contextOffset = span.node.start - cxStart;
      result.context = spanFile.text.slice(cxStart, cxStart + 50);
    } else if (span) { // external
      result.file = span.origin;
      storeSpan(srv, query, span, result);
    }
    return clean(result);
  }

  function findRefsToVariable(srv, query, file, expr, checkShadowing) {
    var name = expr.node.name;

    for (var scope = expr.state; scope && !(name in scope.props); scope = scope.prev) {}
    if (!scope) throw ternError("Could not find a definition for " + name + " " + !!srv.cx.topScope.props.x);

    var type, refs = [];
    function storeRef(file) {
      return function(node, scopeHere) {
        if (checkShadowing) for (var s = scopeHere; s != scope; s = s.prev) {
          var exists = s.hasProp(checkShadowing);
          if (exists)
            throw ternError("Renaming `" + name + "` to `" + checkShadowing + "` would make a variable at line " +
                            (asLineChar(file, node.start).line + 1) + " point to the definition at line " +
                            (asLineChar(file, exists.name.start).line + 1));
        }
        refs.push({file: file.name,
                   start: outputPos(query, file, node.start),
                   end: outputPos(query, file, node.end)});
      };
    }

    if (scope.originNode) {
      type = "local";
      if (checkShadowing) {
        for (var prev = scope.prev; prev; prev = prev.prev)
          if (checkShadowing in prev.props) break;
        if (prev) infer.findRefs(scope.originNode, scope, checkShadowing, prev, function(node) {
          throw ternError("Renaming `" + name + "` to `" + checkShadowing + "` would shadow the definition used at line " +
                          (asLineChar(file, node.start).line + 1));
        });
      }
      infer.findRefs(scope.originNode, scope, name, scope, storeRef(file));
    } else {
      type = "global";
      for (var i = 0; i < srv.files.length; ++i) {
        var cur = srv.files[i];
        infer.findRefs(cur.ast, cur.scope, name, scope, storeRef(cur));
      }
    }

    return {refs: refs, type: type, name: name};
  }

  function findRefsToProperty(srv, query, expr, prop) {
    var objType = infer.expressionType(expr).getObjType();
    if (!objType) throw ternError("Couldn't determine type of base object.");

    var refs = [];
    function storeRef(file) {
      return function(node) {
        refs.push({file: file.name,
                   start: outputPos(query, file, node.start),
                   end: outputPos(query, file, node.end)});
      };
    }
    for (var i = 0; i < srv.files.length; ++i) {
      var cur = srv.files[i];
      infer.findPropRefs(cur.ast, cur.scope, objType, prop.name, storeRef(cur));
    }

    return {refs: refs, name: prop.name};
  }

  function findRefs(srv, query, file) {
    var expr = findExprOrThrow(file, query, true);
    if (expr && expr.node.type == "Identifier") {
      return findRefsToVariable(srv, query, file, expr);
    } else if (expr && expr.node.type == "MemberExpression" && !expr.node.computed) {
      var p = expr.node.property;
      expr.node = expr.node.object;
      return findRefsToProperty(srv, query, expr, p);
    } else if (expr && expr.node.type == "ObjectExpression") {
      var pos = resolvePos(file, query.end);
      for (var i = 0; i < expr.node.properties.length; ++i) {
        var k = expr.node.properties[i].key;
        if (k.start <= pos && k.end >= pos)
          return findRefsToProperty(srv, query, expr, k);
      }
    }
    throw ternError("Not at a variable or property name.");
  }

  function buildRename(srv, query, file) {
    if (typeof query.newName != "string") throw ternError(".query.newName should be a string");
    var expr = findExprOrThrow(file, query);
    if (!expr || expr.node.type != "Identifier") throw ternError("Not at a variable.");

    var data = findRefsToVariable(srv, query, file, expr, query.newName), refs = data.refs;
    delete data.refs;
    data.files = srv.files.map(function(f){return f.name;});

    var changes = data.changes = [];
    for (var i = 0; i < refs.length; ++i) {
      var use = refs[i];
      use.text = query.newName;
      changes.push(use);
    }

    return data;
  }

  function listFiles(srv) {
    return {files: srv.files.map(function(f){return f.name;})};
  }

  exports.version = "0.12.1";
});

/* codemirror/addon/tern/lib/def.js */
// Type description parser
//
// Type description JSON files (such as ecma5.json and browser.json)
// are used to
//
// A) describe types that come from native code
//
// B) to cheaply load the types for big libraries, or libraries that
//    can't be inferred well

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return exports.init = mod;
  if (typeof define == "function" && define.amd) // AMD
    return define({init: mod});
  tern.def = {init: mod};
})(function(exports, infer) {
  "use strict";

  function hop(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  var TypeParser = exports.TypeParser = function(spec, start, base, forceNew) {
    this.pos = start || 0;
    this.spec = spec;
    this.base = base;
    this.forceNew = forceNew;
  };

  function unwrapType(type, self, args) {
    return type.call ? type(self, args) : type;
  }

  function extractProp(type, prop) {
    if (prop == "!ret") {
      if (type.retval) return type.retval;
      var rv = new infer.AVal;
      type.propagate(new infer.IsCallee(infer.ANull, [], null, rv));
      return rv;
    } else {
      return type.getProp(prop);
    }
  }

  function computedFunc(args, retType) {
    return function(self, cArgs) {
      var realArgs = [];
      for (var i = 0; i < args.length; i++) realArgs.push(unwrapType(args[i], self, cArgs));
      return new infer.Fn(name, infer.ANull, realArgs, unwrapType(retType, self, cArgs));
    };
  }
  function computedUnion(types) {
    return function(self, args) {
      var union = new infer.AVal;
      for (var i = 0; i < types.length; i++) unwrapType(types[i], self, args).propagate(union);
      union.maxWeight = 1e5;
      return union;
    };
  }
  function computedArray(inner) {
    return function(self, args) {
      return new infer.Arr(inner(self, args));
    };
  }

  TypeParser.prototype = {
    eat: function(str) {
      if (str.length == 1 ? this.spec.charAt(this.pos) == str : this.spec.indexOf(str, this.pos) == this.pos) {
        this.pos += str.length;
        return true;
      }
    },
    word: function(re) {
      var word = "", ch, re = re || /[\w$]/;
      while ((ch = this.spec.charAt(this.pos)) && re.test(ch)) { word += ch; ++this.pos; }
      return word;
    },
    error: function() {
      throw new Error("Unrecognized type spec: " + this.spec + " (at " + this.pos + ")");
    },
    parseFnType: function(comp, name, top) {
      var args = [], names = [], computed = false;
      if (!this.eat(")")) for (var i = 0; ; ++i) {
        var colon = this.spec.indexOf(": ", this.pos), argname;
        if (colon != -1) {
          argname = this.spec.slice(this.pos, colon);
          if (/^[$\w?]+$/.test(argname))
            this.pos = colon + 2;
          else
            argname = null;
        }
        names.push(argname);
        var argType = this.parseType(comp);
        if (argType.call) computed = true;
        args.push(argType);
        if (!this.eat(", ")) {
          this.eat(")") || this.error();
          break;
        }
      }
      var retType, computeRet, computeRetStart, fn;
      if (this.eat(" -> ")) {
        var retStart = this.pos;
        retType = this.parseType(true);
        if (retType.call) {
          if (top) {
            computeRet = retType;
            retType = infer.ANull;
            computeRetStart = retStart;
          } else {
            computed = true;
          }
        }
      } else {
        retType = infer.ANull;
      }
      if (computed) return computedFunc(args, retType);

      if (top && (fn = this.base))
        infer.Fn.call(this.base, name, infer.ANull, args, names, retType);
      else
        fn = new infer.Fn(name, infer.ANull, args, names, retType);
      if (computeRet) fn.computeRet = computeRet;
      if (computeRetStart != null) fn.computeRetSource = this.spec.slice(computeRetStart, this.pos);
      return fn;
    },
    parseType: function(comp, name, top) {
      var main = this.parseTypeMaybeProp(comp, name, top);
      if (!this.eat("|")) return main;
      var types = [main], computed = main.call;
      for (;;) {
        var next = this.parseTypeMaybeProp(comp, name, top);
        types.push(next);
        if (next.call) computed = true;
        if (!this.eat("|")) break;
      }
      if (computed) return computedUnion(types);
      var union = new infer.AVal;
      for (var i = 0; i < types.length; i++) types[i].propagate(union);
      union.maxWeight = 1e5;
      return union;
    },
    parseTypeMaybeProp: function(comp, name, top) {
      var result = this.parseTypeInner(comp, name, top);
      while (comp && this.eat(".")) result = this.extendWithProp(result);
      return result;
    },
    extendWithProp: function(base) {
      var propName = this.word(/[\w<>$!]/) || this.error();
      if (base.apply) return function(self, args) {
        return extractProp(base(self, args), propName);
      };
      return extractProp(base, propName);
    },
    parseTypeInner: function(comp, name, top) {
      if (this.eat("fn(")) {
        return this.parseFnType(comp, name, top);
      } else if (this.eat("[")) {
        var inner = this.parseType(comp);
        this.eat("]") || this.error();
        if (inner.call) return computedArray(inner);
        if (top && this.base) {
          infer.Arr.call(this.base, inner);
          return this.base;
        }
        return new infer.Arr(inner);
      } else if (this.eat("+")) {
        var path = this.word(/[\w$<>\.!]/);
        var base = parsePath(path + ".prototype");
        var type;
        if (!(base instanceof infer.Obj)) base = parsePath(path);
        if (!(base instanceof infer.Obj)) return base;
        if (comp && this.eat("[")) return this.parsePoly(base);
        if (top && this.forceNew) return new infer.Obj(base);
        return infer.getInstance(base);
      } else if (comp && this.eat("!")) {
        var arg = this.word(/\d/);
        if (arg) {
          arg = Number(arg);
          return function(_self, args) {return args[arg] || infer.ANull;};
        } else if (this.eat("this")) {
          return function(self) {return self;};
        } else if (this.eat("custom:")) {
          var fname = this.word(/[\w$]/);
          return customFunctions[fname] || function() { return infer.ANull; };
        } else {
          return this.fromWord("!" + this.word(/[\w$<>\.!]/));
        }
      } else if (this.eat("?")) {
        return infer.ANull;
      } else {
        return this.fromWord(this.word(/[\w$<>\.!`]/));
      }
    },
    fromWord: function(spec) {
      var cx = infer.cx();
      switch (spec) {
      case "number": return cx.num;
      case "string": return cx.str;
      case "bool": return cx.bool;
      case "<top>": return cx.topScope;
      }
      if (cx.localDefs && spec in cx.localDefs) return cx.localDefs[spec];
      return parsePath(spec);
    },
    parsePoly: function(base) {
      var propName = "<i>", match;
      if (match = this.spec.slice(this.pos).match(/^\s*(\w+)\s*=\s*/)) {
        propName = match[1];
        this.pos += match[0].length;
      }
      var value = this.parseType(true);
      if (!this.eat("]")) this.error();
      if (value.call) return function(self, args) {
        var instance = infer.getInstance(base);
        value(self, args).propagate(instance.defProp(propName));
        return instance;
      };
      var instance = infer.getInstance(base);
      value.propagate(instance.defProp(propName));
      return instance;
    }
  };

  function parseType(spec, name, base, forceNew) {
    var type = new TypeParser(spec, null, base, forceNew).parseType(false, name, true);
    if (/^fn\(/.test(spec)) for (var i = 0; i < type.args.length; ++i) (function(i) {
      var arg = type.args[i];
      if (arg instanceof infer.Fn && arg.args && arg.args.length) addEffect(type, function(_self, fArgs) {
        var fArg = fArgs[i];
        if (fArg) fArg.propagate(new infer.IsCallee(infer.cx().topScope, arg.args, null, infer.ANull));
      });
    })(i);
    return type;
  }

  function addEffect(fn, handler, replaceRet) {
    var oldCmp = fn.computeRet, rv = fn.retval;
    fn.computeRet = function(self, args, argNodes) {
      var handled = handler(self, args, argNodes);
      var old = oldCmp ? oldCmp(self, args, argNodes) : rv;
      return replaceRet ? handled : old;
    };
  }

  var parseEffect = exports.parseEffect = function(effect, fn) {
    var m;
    if (effect.indexOf("propagate ") == 0) {
      var p = new TypeParser(effect, 10);
      var origin = p.parseType(true);
      if (!p.eat(" ")) p.error();
      var target = p.parseType(true);
      addEffect(fn, function(self, args) {
        unwrapType(origin, self, args).propagate(unwrapType(target, self, args));
      });
    } else if (effect.indexOf("call ") == 0) {
      var andRet = effect.indexOf("and return ", 5) == 5;
      var p = new TypeParser(effect, andRet ? 16 : 5);
      var getCallee = p.parseType(true), getSelf = null, getArgs = [];
      if (p.eat(" this=")) getSelf = p.parseType(true);
      while (p.eat(" ")) getArgs.push(p.parseType(true));
      addEffect(fn, function(self, args) {
        var callee = unwrapType(getCallee, self, args);
        var slf = getSelf ? unwrapType(getSelf, self, args) : infer.ANull, as = [];
        for (var i = 0; i < getArgs.length; ++i) as.push(unwrapType(getArgs[i], self, args));
        var result = andRet ? new infer.AVal : infer.ANull;
        callee.propagate(new infer.IsCallee(slf, as, null, result));
        return result;
      }, andRet);
    } else if (m = effect.match(/^custom (\S+)\s*(.*)/)) {
      var customFunc = customFunctions[m[1]];
      if (customFunc) addEffect(fn, m[2] ? customFunc(m[2]) : customFunc);
    } else if (effect.indexOf("copy ") == 0) {
      var p = new TypeParser(effect, 5);
      var getFrom = p.parseType(true);
      p.eat(" ");
      var getTo = p.parseType(true);
      addEffect(fn, function(self, args) {
        var from = unwrapType(getFrom, self, args), to = unwrapType(getTo, self, args);
        from.forAllProps(function(prop, val, local) {
          if (local && prop != "<i>")
            to.propagate(new infer.PropHasSubset(prop, val));
        });
      });
    } else {
      throw new Error("Unknown effect type: " + effect);
    }
  };

  var currentTopScope;

  var parsePath = exports.parsePath = function(path, scope) {
    var cx = infer.cx(), cached = cx.paths[path], origPath = path;
    if (cached != null) return cached;
    cx.paths[path] = infer.ANull;

    var base = scope || currentTopScope || cx.topScope;

    if (cx.localDefs) for (var name in cx.localDefs) {
      if (path.indexOf(name) == 0) {
        if (path == name) return cx.paths[path] = cx.localDefs[path];
        if (path.charAt(name.length) == ".") {
          base = cx.localDefs[name];
          path = path.slice(name.length + 1);
          break;
        }
      }
    }

    var parts = path.split(".");
    for (var i = 0; i < parts.length && base != infer.ANull; ++i) {
      var prop = parts[i];
      if (prop.charAt(0) == "!") {
        if (prop == "!proto") {
          base = (base instanceof infer.Obj && base.proto) || infer.ANull;
        } else {
          var fn = base.getFunctionType();
          if (!fn) {
            base = infer.ANull;
          } else if (prop == "!ret") {
            base = fn.retval && fn.retval.getType(false) || infer.ANull;
          } else {
            var arg = fn.args && fn.args[Number(prop.slice(1))];
            base = (arg && arg.getType(false)) || infer.ANull;
          }
        }
      } else if (base instanceof infer.Obj) {
        var propVal = (prop == "prototype" && base instanceof infer.Fn) ? base.getProp(prop) : base.props[prop];
        if (!propVal || propVal.isEmpty())
          base = infer.ANull;
        else
          base = propVal.types[0];
      }
    }
    // Uncomment this to get feedback on your poorly written .json files
    // if (base == infer.ANull) console.error("bad path: " + origPath + " (" + cx.curOrigin + ")");
    cx.paths[origPath] = base == infer.ANull ? null : base;
    return base;
  };

  function emptyObj(ctor) {
    var empty = Object.create(ctor.prototype);
    empty.props = Object.create(null);
    empty.isShell = true;
    return empty;
  }

  function isSimpleAnnotation(spec) {
    if (!spec["!type"] || /^(fn\(|\[)/.test(spec["!type"])) return false;
    for (var prop in spec)
      if (prop != "!type" && prop != "!doc" && prop != "!url" && prop != "!span" && prop != "!data")
        return false;
    return true;
  }

  function passOne(base, spec, path) {
    if (!base) {
      var tp = spec["!type"];
      if (tp) {
        if (/^fn\(/.test(tp)) base = emptyObj(infer.Fn);
        else if (tp.charAt(0) == "[") base = emptyObj(infer.Arr);
        else throw new Error("Invalid !type spec: " + tp);
      } else if (spec["!stdProto"]) {
        base = infer.cx().protos[spec["!stdProto"]];
      } else {
        base = emptyObj(infer.Obj);
      }
      base.name = path;
    }

    for (var name in spec) if (hop(spec, name) && name.charCodeAt(0) != 33) {
      var inner = spec[name];
      if (typeof inner == "string" || isSimpleAnnotation(inner)) continue;
      var prop = base.defProp(name);
      passOne(prop.getObjType(), inner, path ? path + "." + name : name).propagate(prop);
    }
    return base;
  }

  function passTwo(base, spec, path) {
    if (base.isShell) {
      delete base.isShell;
      var tp = spec["!type"];
      if (tp) {
        parseType(tp, path, base);
      } else {
        var proto = spec["!proto"] && parseType(spec["!proto"]);
        infer.Obj.call(base, proto instanceof infer.Obj ? proto : true, path);
      }
    }

    var effects = spec["!effects"];
    if (effects && base instanceof infer.Fn) for (var i = 0; i < effects.length; ++i)
      parseEffect(effects[i], base);
    copyInfo(spec, base);

    for (var name in spec) if (hop(spec, name) && name.charCodeAt(0) != 33) {
      var inner = spec[name], known = base.defProp(name), innerPath = path ? path + "." + name : name;
      if (typeof inner == "string") {
        if (known.isEmpty()) parseType(inner, innerPath).propagate(known);
      } else {
        if (!isSimpleAnnotation(inner))
          passTwo(known.getObjType(), inner, innerPath);
        else if (known.isEmpty())
          parseType(inner["!type"], innerPath, null, true).propagate(known);
        else
          continue;
        if (inner["!doc"]) known.doc = inner["!doc"];
        if (inner["!url"]) known.url = inner["!url"];
        if (inner["!span"]) known.span = inner["!span"];
      }
    }
    return base;
  }

  function copyInfo(spec, type) {
    if (spec["!doc"]) type.doc = spec["!doc"];
    if (spec["!url"]) type.url = spec["!url"];
    if (spec["!span"]) type.span = spec["!span"];
    if (spec["!data"]) type.metaData = spec["!data"];
  }

  function runPasses(type, arg) {
    var parent = infer.cx().parent, pass = parent && parent.passes && parent.passes[type];
    if (pass) for (var i = 0; i < pass.length; i++) pass[i](arg);
  }

  function doLoadEnvironment(data, scope) {
    var cx = infer.cx();

    infer.addOrigin(cx.curOrigin = data["!name"] || "env#" + cx.origins.length);
    cx.localDefs = cx.definitions[cx.curOrigin] = Object.create(null);

    runPasses("preLoadDef", data);

    passOne(scope, data);

    var def = data["!define"];
    if (def) {
      for (var name in def) {
        var spec = def[name];
        cx.localDefs[name] = typeof spec == "string" ? parsePath(spec) : passOne(null, spec, name);
      }
      for (var name in def) {
        var spec = def[name];
        if (typeof spec != "string") passTwo(cx.localDefs[name], def[name], name);
      }
    }

    passTwo(scope, data);

    runPasses("postLoadDef", data);

    cx.curOrigin = cx.localDefs = null;
  }

  exports.load = function(data, scope) {
    if (!scope) scope = infer.cx().topScope;
    var oldScope = currentTopScope;
    currentTopScope = scope;
    try {
      doLoadEnvironment(data, scope);
    } finally {
      currentTopScope = oldScope;
    }
  };

  exports.parse = function(data, origin, path) {
    var cx = infer.cx();
    if (origin) {
      cx.origin = origin;
      cx.localDefs = cx.definitions[origin];
    }

    try {
      if (typeof data == "string")
        return parseType(data, path);
      else
        return passTwo(passOne(null, data, path), data, path);
    } finally {
      if (origin) cx.origin = cx.localDefs = null;
    }
  };

  // Used to register custom logic for more involved effect or type
  // computation.
  var customFunctions = Object.create(null);
  infer.registerFunction = function(name, f) { customFunctions[name] = f; };

  var IsCreated = infer.constraint({
    construct: function(created, target, spec) {
      this.created = created;
      this.target = target;
      this.spec = spec;
    },
    addType: function(tp) {
      if (tp instanceof infer.Obj && this.created++ < 5) {
        var derived = new infer.Obj(tp), spec = this.spec;
        if (spec instanceof infer.AVal) spec = spec.getObjType(false);
        if (spec instanceof infer.Obj) for (var prop in spec.props) {
          var cur = spec.props[prop].types[0];
          var p = derived.defProp(prop);
          if (cur && cur instanceof infer.Obj && cur.props.value) {
            var vtp = cur.props.value.getType(false);
            if (vtp) p.addType(vtp);
          }
        }
        this.target.addType(derived);
      }
    }
  });

  infer.registerFunction("Object_create", function(_self, args, argNodes) {
    if (argNodes && argNodes.length && argNodes[0].type == "Literal" && argNodes[0].value == null)
      return new infer.Obj();

    var result = new infer.AVal;
    if (args[0]) args[0].propagate(new IsCreated(0, result, args[1]));
    return result;
  });

  var PropSpec = infer.constraint({
    construct: function(target) { this.target = target; },
    addType: function(tp) {
      if (!(tp instanceof infer.Obj)) return;
      if (tp.hasProp("value"))
        tp.getProp("value").propagate(this.target);
      else if (tp.hasProp("get"))
        tp.getProp("get").propagate(new infer.IsCallee(infer.ANull, [], null, this.target));
    }
  });

  infer.registerFunction("Object_defineProperty", function(_self, args, argNodes) {
    if (argNodes && argNodes.length >= 3 && argNodes[1].type == "Literal" &&
        typeof argNodes[1].value == "string") {
      var obj = args[0], connect = new infer.AVal;
      obj.propagate(new infer.PropHasSubset(argNodes[1].value, connect, argNodes[1]));
      args[2].propagate(new PropSpec(connect));
    }
    return infer.ANull;
  });

  infer.registerFunction("Object_defineProperties", function(_self, args, argNodes) {
    if (args.length >= 2) {
      var obj = args[0];
      args[1].forAllProps(function(prop, val, local) {
        if (!local) return;
        var connect = new infer.AVal;
        obj.propagate(new infer.PropHasSubset(prop, connect, argNodes && argNodes[1]));
        val.propagate(new PropSpec(connect));
      });
    }
    return infer.ANull;
  });

  var IsBound = infer.constraint({
    construct: function(self, args, target) {
      this.self = self; this.args = args; this.target = target;
    },
    addType: function(tp) {
      if (!(tp instanceof infer.Fn)) return;
      this.target.addType(new infer.Fn(tp.name, infer.ANull, tp.args.slice(this.args.length),
                                       tp.argNames.slice(this.args.length), tp.retval));
      this.self.propagate(tp.self);
      for (var i = 0; i < Math.min(tp.args.length, this.args.length); ++i)
        this.args[i].propagate(tp.args[i]);
    }
  });

  infer.registerFunction("Function_bind", function(self, args) {
    if (!args.length) return infer.ANull;
    var result = new infer.AVal;
    self.propagate(new IsBound(args[0], args.slice(1), result));
    return result;
  });

  infer.registerFunction("Array_ctor", function(_self, args) {
    var arr = new infer.Arr;
    if (args.length != 1 || !args[0].hasType(infer.cx().num)) {
      var content = arr.getProp("<i>");
      for (var i = 0; i < args.length; ++i) args[i].propagate(content);
    }
    return arr;
  });

  infer.registerFunction("Promise_ctor", function(_self, args, argNodes) {
    if (args.length < 1) return infer.ANull;
    var self = new infer.Obj(infer.cx().definitions.ecma6["Promise.prototype"]);
    var valProp = self.defProp("value", argNodes && argNodes[0]);
    var valArg = new infer.AVal;
    valArg.propagate(valProp);
    var exec = new infer.Fn("execute", infer.ANull, [valArg], ["value"], infer.ANull);
    var reject = infer.cx().definitions.ecma6.promiseReject;
    args[0].propagate(new infer.IsCallee(infer.ANull, [exec, reject], null, infer.ANull));
    return self;
  });

  return exports;
});

/* codemirror/addon/tern/lib/comment.js */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(exports);
  if (typeof define == "function" && define.amd) // AMD
    return define(["exports"], mod);
  mod(tern.comment || (tern.comment = {}));
})(function(exports) {
  function isSpace(ch) {
    return (ch < 14 && ch > 8) || ch === 32 || ch === 160;
  }

  function onOwnLine(text, pos) {
    for (; pos > 0; --pos) {
      var ch = text.charCodeAt(pos - 1);
      if (ch == 10) break;
      if (!isSpace(ch)) return false;
    }
    return true;
  }

  // Gather comments directly before a function
  exports.commentsBefore = function(text, pos) {
    var found = null, emptyLines = 0, topIsLineComment;
    out: while (pos > 0) {
      var prev = text.charCodeAt(pos - 1);
      if (prev == 10) {
        for (var scan = --pos, sawNonWS = false; scan > 0; --scan) {
          prev = text.charCodeAt(scan - 1);
          if (prev == 47 && text.charCodeAt(scan - 2) == 47) {
            if (!onOwnLine(text, scan - 2)) break out;
            var content = text.slice(scan, pos);
            if (!emptyLines && topIsLineComment) found[0] = content + "\n" + found[0];
            else (found || (found = [])).unshift(content);
            topIsLineComment = true;
            emptyLines = 0;
            pos = scan - 2;
            break;
          } else if (prev == 10) {
            if (!sawNonWS && ++emptyLines > 1) break out;
            break;
          } else if (!sawNonWS && !isSpace(prev)) {
            sawNonWS = true;
          }
        }
      } else if (prev == 47 && text.charCodeAt(pos - 2) == 42) {
        for (var scan = pos - 2; scan > 1; --scan) {
          if (text.charCodeAt(scan - 1) == 42 && text.charCodeAt(scan - 2) == 47) {
            if (!onOwnLine(text, scan - 2)) break out;
            (found || (found = [])).unshift(text.slice(scan, pos - 2));
            topIsLineComment = false;
            emptyLines = 0;
            break;
          }
        }
        pos = scan - 2;
      } else if (isSpace(prev)) {
        --pos;
      } else {
        break;
      }
    }
    return found;
  };

  exports.commentAfter = function(text, pos) {
    while (pos < text.length) {
      var next = text.charCodeAt(pos);
      if (next == 47) {
        var after = text.charCodeAt(pos + 1), end;
        if (after == 47) // line comment
          end = text.indexOf("\n", pos + 2);
        else if (after == 42) // block comment
          end = text.indexOf("*/", pos + 2);
        else
          return;
        return text.slice(pos + 2, end < 0 ? text.length : end);
      } else if (isSpace(next)) {
        ++pos;
      }
    }
  };

  exports.ensureCommentsBefore = function(text, node) {
    if (node.hasOwnProperty("commentsBefore")) return node.commentsBefore;
    return node.commentsBefore = exports.commentsBefore(text, node.start);
  };
});

/* codemirror/addon/tern/lib/infer.js */
// Main type inference engine

// Walks an AST, building up a graph of abstract values and constraints
// that cause types to flow from one node to another. Also defines a
// number of utilities for accessing ASTs and scopes.

// Analysis is done in a context, which is tracked by the dynamically
// bound cx variable. Use withContext to set the current context.

// For memory-saving reasons, individual types export an interface
// similar to abstract values (which can hold multiple types), and can
// thus be used in place abstract values that only ever contain a
// single type.

(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(exports, require("acorn"), require("acorn/dist/acorn_loose"), require("acorn/dist/walk"),
               require("./def"), require("./signal"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["exports", "acorn/dist/acorn", "acorn/dist/acorn_loose", "acorn/dist/walk", "./def", "./signal"], mod);
  mod(root.tern || (root.tern = {}), acorn, acorn, acorn.walk, tern.def, tern.signal); // Plain browser env
})(this, function(exports, acorn, acorn_loose, walk, def, signal) {
  "use strict";

  var toString = exports.toString = function(type, maxDepth, parent) {
    if (!type || type == parent || maxDepth && maxDepth < -3) return "?";
    return type.toString(maxDepth, parent);
  };

  // A variant of AVal used for unknown, dead-end values. Also serves
  // as prototype for AVals, Types, and Constraints because it
  // implements 'empty' versions of all the methods that the code
  // expects.
  var ANull = exports.ANull = signal.mixin({
    addType: function() {},
    propagate: function() {},
    getProp: function() { return ANull; },
    forAllProps: function() {},
    hasType: function() { return false; },
    isEmpty: function() { return true; },
    getFunctionType: function() {},
    getObjType: function() {},
    getType: function() {},
    gatherProperties: function() {},
    propagatesTo: function() {},
    typeHint: function() {},
    propHint: function() {},
    toString: function() { return "?"; }
  });

  function extend(proto, props) {
    var obj = Object.create(proto);
    if (props) for (var prop in props) obj[prop] = props[prop];
    return obj;
  }

  // ABSTRACT VALUES

  var WG_DEFAULT = 100, WG_NEW_INSTANCE = 90, WG_MADEUP_PROTO = 10,
      WG_MULTI_MEMBER = 6, WG_CATCH_ERROR = 6,
      WG_GLOBAL_THIS = 90, WG_SPECULATIVE_THIS = 2, WG_SPECULATIVE_PROTO_THIS = 4;

  var AVal = exports.AVal = function() {
    this.types = [];
    this.forward = null;
    this.maxWeight = 0;
  };
  AVal.prototype = extend(ANull, {
    addType: function(type, weight) {
      weight = weight || WG_DEFAULT;
      if (this.maxWeight < weight) {
        this.maxWeight = weight;
        if (this.types.length == 1 && this.types[0] == type) return;
        this.types.length = 0;
      } else if (this.maxWeight > weight || this.types.indexOf(type) > -1) {
        return;
      }

      this.signal("addType", type);
      this.types.push(type);
      var forward = this.forward;
      if (forward) withWorklist(function(add) {
        for (var i = 0; i < forward.length; ++i) add(type, forward[i], weight);
      });
    },

    propagate: function(target, weight) {
      if (target == ANull || (target instanceof Type && this.forward && this.forward.length > 2)) return;
      if (weight && weight != WG_DEFAULT) target = new Muffle(target, weight);
      (this.forward || (this.forward = [])).push(target);
      var types = this.types;
      if (types.length) withWorklist(function(add) {
        for (var i = 0; i < types.length; ++i) add(types[i], target, weight);
      });
    },

    getProp: function(prop) {
      if (prop == "__proto__" || prop == "✖") return ANull;
      var found = (this.props || (this.props = Object.create(null)))[prop];
      if (!found) {
        found = this.props[prop] = new AVal;
        this.propagate(new PropIsSubset(prop, found));
      }
      return found;
    },

    forAllProps: function(c) {
      this.propagate(new ForAllProps(c));
    },

    hasType: function(type) {
      return this.types.indexOf(type) > -1;
    },
    isEmpty: function() { return this.types.length === 0; },
    getFunctionType: function() {
      for (var i = this.types.length - 1; i >= 0; --i)
        if (this.types[i] instanceof Fn) return this.types[i];
    },
    getObjType: function() {
      var seen = null;
      for (var i = this.types.length - 1; i >= 0; --i) {
        var type = this.types[i];
        if (!(type instanceof Obj)) continue;
        if (type.name) return type;
        if (!seen) seen = type;
      }
      return seen;
    },

    getType: function(guess) {
      if (this.types.length === 0 && guess !== false) return this.makeupType();
      if (this.types.length === 1) return this.types[0];
      return canonicalType(this.types);
    },

    toString: function(maxDepth, parent) {
      if (this.types.length == 0) return toString(this.makeupType(), maxDepth, parent);
      if (this.types.length == 1) return toString(this.types[0], maxDepth, parent);
      var simplified = simplifyTypes(this.types);
      if (simplified.length > 2) return "?";
      return simplified.map(function(tp) { return toString(tp, maxDepth, parent); }).join("|");
    },

    makeupPropType: function(obj) {
      var propName = this.propertyName;

      var protoProp = obj.proto && obj.proto.hasProp(propName);
      if (protoProp) {
        var fromProto = protoProp.getType();
        if (fromProto) return fromProto;
      }

      if (propName != "<i>") {
        var computedProp = obj.hasProp("<i>");
        if (computedProp) return computedProp.getType();
      } else if (obj.props["<i>"] != this) {
        for (var prop in obj.props) {
          var val = obj.props[prop];
          if (!val.isEmpty()) return val.getType();
        }
      }
    },

    makeupType: function() {
      var computed = this.propertyOf && this.makeupPropType(this.propertyOf);
      if (computed) return computed;

      if (!this.forward) return null;
      for (var i = this.forward.length - 1; i >= 0; --i) {
        var hint = this.forward[i].typeHint();
        if (hint && !hint.isEmpty()) {guessing = true; return hint;}
      }

      var props = Object.create(null), foundProp = null;
      for (var i = 0; i < this.forward.length; ++i) {
        var prop = this.forward[i].propHint();
        if (prop && prop != "length" && prop != "<i>" && prop != "✖" && prop != cx.completingProperty) {
          props[prop] = true;
          foundProp = prop;
        }
      }
      if (!foundProp) return null;

      var objs = objsWithProp(foundProp);
      if (objs) {
        var matches = [];
        search: for (var i = 0; i < objs.length; ++i) {
          var obj = objs[i];
          for (var prop in props) if (!obj.hasProp(prop)) continue search;
          if (obj.hasCtor) obj = getInstance(obj);
          matches.push(obj);
        }
        var canon = canonicalType(matches);
        if (canon) {guessing = true; return canon;}
      }
    },

    typeHint: function() { return this.types.length ? this.getType() : null; },
    propagatesTo: function() { return this; },

    gatherProperties: function(f, depth) {
      for (var i = 0; i < this.types.length; ++i)
        this.types[i].gatherProperties(f, depth);
    },

    guessProperties: function(f) {
      if (this.forward) for (var i = 0; i < this.forward.length; ++i) {
        var prop = this.forward[i].propHint();
        if (prop) f(prop, null, 0);
      }
      var guessed = this.makeupType();
      if (guessed) guessed.gatherProperties(f);
    }
  });

  function similarAVal(a, b, depth) {
    var typeA = a.getType(false), typeB = b.getType(false);
    if (!typeA || !typeB) return true;
    return similarType(typeA, typeB, depth);
  }

  function similarType(a, b, depth) {
    if (!a || depth >= 5) return b;
    if (!a || a == b) return a;
    if (!b) return a;
    if (a.constructor != b.constructor) return false;
    if (a.constructor == Arr) {
      var innerA = a.getProp("<i>").getType(false);
      if (!innerA) return b;
      var innerB = b.getProp("<i>").getType(false);
      if (!innerB || similarType(innerA, innerB, depth + 1)) return b;
    } else if (a.constructor == Obj) {
      var propsA = 0, propsB = 0, same = 0;
      for (var prop in a.props) {
        propsA++;
        if (prop in b.props && similarAVal(a.props[prop], b.props[prop], depth + 1))
          same++;
      }
      for (var prop in b.props) propsB++;
      if (propsA && propsB && same < Math.max(propsA, propsB) / 2) return false;
      return propsA > propsB ? a : b;
    } else if (a.constructor == Fn) {
      if (a.args.length != b.args.length ||
          !a.args.every(function(tp, i) { return similarAVal(tp, b.args[i], depth + 1); }) ||
          !similarAVal(a.retval, b.retval, depth + 1) || !similarAVal(a.self, b.self, depth + 1))
        return false;
      return a;
    } else {
      return false;
    }
  }

  var simplifyTypes = exports.simplifyTypes = function(types) {
    var found = [];
    outer: for (var i = 0; i < types.length; ++i) {
      var tp = types[i];
      for (var j = 0; j < found.length; j++) {
        var similar = similarType(tp, found[j], 0);
        if (similar) {
          found[j] = similar;
          continue outer;
        }
      }
      found.push(tp);
    }
    return found;
  };

  function canonicalType(types) {
    var arrays = 0, fns = 0, objs = 0, prim = null;
    for (var i = 0; i < types.length; ++i) {
      var tp = types[i];
      if (tp instanceof Arr) ++arrays;
      else if (tp instanceof Fn) ++fns;
      else if (tp instanceof Obj) ++objs;
      else if (tp instanceof Prim) {
        if (prim && tp.name != prim.name) return null;
        prim = tp;
      }
    }
    var kinds = (arrays && 1) + (fns && 1) + (objs && 1) + (prim && 1);
    if (kinds > 1) return null;
    if (prim) return prim;

    var maxScore = 0, maxTp = null;
    for (var i = 0; i < types.length; ++i) {
      var tp = types[i], score = 0;
      if (arrays) {
        score = tp.getProp("<i>").isEmpty() ? 1 : 2;
      } else if (fns) {
        score = 1;
        for (var j = 0; j < tp.args.length; ++j) if (!tp.args[j].isEmpty()) ++score;
        if (!tp.retval.isEmpty()) ++score;
      } else if (objs) {
        score = tp.name ? 100 : 2;
      }
      if (score >= maxScore) { maxScore = score; maxTp = tp; }
    }
    return maxTp;
  }

  // PROPAGATION STRATEGIES

  var constraint = exports.constraint = function(methods) {
    var ctor = function() {
      this.origin = cx.curOrigin;
      this.construct.apply(this, arguments);
    };
    ctor.prototype = Object.create(ANull);
    for (var m in methods) if (methods.hasOwnProperty(m)) ctor.prototype[m] = methods[m];
    return ctor;
  };

  var PropIsSubset = constraint({
    construct: function(prop, target) {
      this.prop = prop; this.target = target;
    },
    addType: function(type, weight) {
      if (type.getProp)
        type.getProp(this.prop).propagate(this.target, weight);
    },
    propHint: function() { return this.prop; },
    propagatesTo: function() {
      if (this.prop == "<i>" || !/[^\w_]/.test(this.prop))
        return {target: this.target, pathExt: "." + this.prop};
    }
  });

  var PropHasSubset = exports.PropHasSubset = constraint({
    construct: function(prop, type, originNode) {
      this.prop = prop; this.type = type; this.originNode = originNode;
    },
    addType: function(type, weight) {
      if (!(type instanceof Obj)) return;
      var prop = type.defProp(this.prop, this.originNode);
      if (!prop.origin) prop.origin = this.origin;
      this.type.propagate(prop, weight);
    },
    propHint: function() { return this.prop; }
  });

  var ForAllProps = constraint({
    construct: function(c) { this.c = c; },
    addType: function(type) {
      if (!(type instanceof Obj)) return;
      type.forAllProps(this.c);
    }
  });

  function withDisabledComputing(fn, body) {
    cx.disabledComputing = {fn: fn, prev: cx.disabledComputing};
    var result = body();
    cx.disabledComputing = cx.disabledComputing.prev;
    return result;
  }
  var IsCallee = exports.IsCallee = constraint({
    construct: function(self, args, argNodes, retval) {
      this.self = self; this.args = args; this.argNodes = argNodes; this.retval = retval;
      this.disabled = cx.disabledComputing;
    },
    addType: function(fn, weight) {
      if (!(fn instanceof Fn)) return;
      for (var i = 0; i < this.args.length; ++i) {
        if (i < fn.args.length) this.args[i].propagate(fn.args[i], weight);
        if (fn.arguments) this.args[i].propagate(fn.arguments, weight);
      }
      this.self.propagate(fn.self, this.self == cx.topScope ? WG_GLOBAL_THIS : weight);
      var compute = fn.computeRet;
      if (compute) for (var d = this.disabled; d; d = d.prev)
        if (d.fn == fn || fn.originNode && d.fn.originNode == fn.originNode) compute = null;
      if (compute) {
        var old = cx.disabledComputing;
        cx.disabledComputing = this.disabled;
        compute(this.self, this.args, this.argNodes).propagate(this.retval, weight);
        cx.disabledComputing = old;
      } else {
        fn.retval.propagate(this.retval, weight);
      }
    },
    typeHint: function() {
      var names = [];
      for (var i = 0; i < this.args.length; ++i) names.push("?");
      return new Fn(null, this.self, this.args, names, ANull);
    },
    propagatesTo: function() {
      return {target: this.retval, pathExt: ".!ret"};
    }
  });

  var HasMethodCall = constraint({
    construct: function(propName, args, argNodes, retval) {
      this.propName = propName; this.args = args; this.argNodes = argNodes; this.retval = retval;
      this.disabled = cx.disabledComputing;
    },
    addType: function(obj, weight) {
      var callee = new IsCallee(obj, this.args, this.argNodes, this.retval);
      callee.disabled = this.disabled;
      obj.getProp(this.propName).propagate(callee, weight);
    },
    propHint: function() { return this.propName; }
  });

  var IsCtor = exports.IsCtor = constraint({
    construct: function(target, noReuse) {
      this.target = target; this.noReuse = noReuse;
    },
    addType: function(f, weight) {
      if (!(f instanceof Fn)) return;
      if (cx.parent && !cx.parent.options.reuseInstances) this.noReuse = true;
      f.getProp("prototype").propagate(new IsProto(this.noReuse ? false : f, this.target), weight);
    }
  });

  var getInstance = exports.getInstance = function(obj, ctor) {
    if (ctor === false) return new Obj(obj);

    if (!ctor) ctor = obj.hasCtor;
    if (!obj.instances) obj.instances = [];
    for (var i = 0; i < obj.instances.length; ++i) {
      var cur = obj.instances[i];
      if (cur.ctor == ctor) return cur.instance;
    }
    var instance = new Obj(obj, ctor && ctor.name);
    instance.origin = obj.origin;
    obj.instances.push({ctor: ctor, instance: instance});
    return instance;
  };

  var IsProto = exports.IsProto = constraint({
    construct: function(ctor, target) {
      this.ctor = ctor; this.target = target;
    },
    addType: function(o, _weight) {
      if (!(o instanceof Obj)) return;
      if ((this.count = (this.count || 0) + 1) > 8) return;
      if (o == cx.protos.Array)
        this.target.addType(new Arr);
      else
        this.target.addType(getInstance(o, this.ctor));
    }
  });

  var FnPrototype = constraint({
    construct: function(fn) { this.fn = fn; },
    addType: function(o, _weight) {
      if (o instanceof Obj && !o.hasCtor) {
        o.hasCtor = this.fn;
        var adder = new SpeculativeThis(o, this.fn);
        adder.addType(this.fn);
        o.forAllProps(function(_prop, val, local) {
          if (local) val.propagate(adder);
        });
      }
    }
  });

  var IsAdded = constraint({
    construct: function(other, target) {
      this.other = other; this.target = target;
    },
    addType: function(type, weight) {
      if (type == cx.str)
        this.target.addType(cx.str, weight);
      else if (type == cx.num && this.other.hasType(cx.num))
        this.target.addType(cx.num, weight);
    },
    typeHint: function() { return this.other; }
  });

  var IfObj = exports.IfObj = constraint({
    construct: function(target) { this.target = target; },
    addType: function(t, weight) {
      if (t instanceof Obj) this.target.addType(t, weight);
    },
    propagatesTo: function() { return this.target; }
  });

  var SpeculativeThis = constraint({
    construct: function(obj, ctor) { this.obj = obj; this.ctor = ctor; },
    addType: function(tp) {
      if (tp instanceof Fn && tp.self)
        tp.self.addType(getInstance(this.obj, this.ctor), WG_SPECULATIVE_PROTO_THIS);
    }
  });

  var Muffle = constraint({
    construct: function(inner, weight) {
      this.inner = inner; this.weight = weight;
    },
    addType: function(tp, weight) {
      this.inner.addType(tp, Math.min(weight, this.weight));
    },
    propagatesTo: function() { return this.inner.propagatesTo(); },
    typeHint: function() { return this.inner.typeHint(); },
    propHint: function() { return this.inner.propHint(); }
  });

  // TYPE OBJECTS

  var Type = exports.Type = function() {};
  Type.prototype = extend(ANull, {
    constructor: Type,
    propagate: function(c, w) { c.addType(this, w); },
    hasType: function(other) { return other == this; },
    isEmpty: function() { return false; },
    typeHint: function() { return this; },
    getType: function() { return this; }
  });

  var Prim = exports.Prim = function(proto, name) { this.name = name; this.proto = proto; };
  Prim.prototype = extend(Type.prototype, {
    constructor: Prim,
    toString: function() { return this.name; },
    getProp: function(prop) {return this.proto.hasProp(prop) || ANull;},
    gatherProperties: function(f, depth) {
      if (this.proto) this.proto.gatherProperties(f, depth);
    }
  });

  var Obj = exports.Obj = function(proto, name) {
    if (!this.props) this.props = Object.create(null);
    this.proto = proto === true ? cx.protos.Object : proto;
    if (proto && !name && proto.name && !(this instanceof Fn)) {
      var match = /^(.*)\.prototype$/.exec(this.proto.name);
      if (match) name = match[1];
    }
    this.name = name;
    this.maybeProps = null;
    this.origin = cx.curOrigin;
  };
  Obj.prototype = extend(Type.prototype, {
    constructor: Obj,
    toString: function(maxDepth) {
      if (maxDepth == null) maxDepth = 0;
      if (maxDepth <= 0 && this.name) return this.name;
      var props = [], etc = false;
      for (var prop in this.props) if (prop != "<i>") {
        if (props.length > 5) { etc = true; break; }
        if (maxDepth)
          props.push(prop + ": " + toString(this.props[prop], maxDepth - 1, this));
        else
          props.push(prop);
      }
      props.sort();
      if (etc) props.push("...");
      return "{" + props.join(", ") + "}";
    },
    hasProp: function(prop, searchProto) {
      var found = this.props[prop];
      if (searchProto !== false)
        for (var p = this.proto; p && !found; p = p.proto) found = p.props[prop];
      return found;
    },
    defProp: function(prop, originNode) {
      var found = this.hasProp(prop, false);
      if (found) {
        if (originNode && !found.originNode) found.originNode = originNode;
        return found;
      }
      if (prop == "__proto__" || prop == "✖") return ANull;

      var av = this.maybeProps && this.maybeProps[prop];
      if (av) {
        delete this.maybeProps[prop];
        this.maybeUnregProtoPropHandler();
      } else {
        av = new AVal;
        av.propertyOf = this;
        av.propertyName = prop;
      }

      this.props[prop] = av;
      av.originNode = originNode;
      av.origin = cx.curOrigin;
      this.broadcastProp(prop, av, true);
      return av;
    },
    getProp: function(prop) {
      var found = this.hasProp(prop, true) || (this.maybeProps && this.maybeProps[prop]);
      if (found) return found;
      if (prop == "__proto__" || prop == "✖") return ANull;
      var av = this.ensureMaybeProps()[prop] = new AVal;
      av.propertyOf = this;
      av.propertyName = prop;
      return av;
    },
    broadcastProp: function(prop, val, local) {
      if (local) {
        this.signal("addProp", prop, val);
        // If this is a scope, it shouldn't be registered
        if (!(this instanceof Scope)) registerProp(prop, this);
      }

      if (this.onNewProp) for (var i = 0; i < this.onNewProp.length; ++i) {
        var h = this.onNewProp[i];
        h.onProtoProp ? h.onProtoProp(prop, val, local) : h(prop, val, local);
      }
    },
    onProtoProp: function(prop, val, _local) {
      var maybe = this.maybeProps && this.maybeProps[prop];
      if (maybe) {
        delete this.maybeProps[prop];
        this.maybeUnregProtoPropHandler();
        this.proto.getProp(prop).propagate(maybe);
      }
      this.broadcastProp(prop, val, false);
    },
    ensureMaybeProps: function() {
      if (!this.maybeProps) {
        if (this.proto) this.proto.forAllProps(this);
        this.maybeProps = Object.create(null);
      }
      return this.maybeProps;
    },
    removeProp: function(prop) {
      var av = this.props[prop];
      delete this.props[prop];
      this.ensureMaybeProps()[prop] = av;
      av.types.length = 0;
    },
    forAllProps: function(c) {
      if (!this.onNewProp) {
        this.onNewProp = [];
        if (this.proto) this.proto.forAllProps(this);
      }
      this.onNewProp.push(c);
      for (var o = this; o; o = o.proto) for (var prop in o.props) {
        if (c.onProtoProp)
          c.onProtoProp(prop, o.props[prop], o == this);
        else
          c(prop, o.props[prop], o == this);
      }
    },
    maybeUnregProtoPropHandler: function() {
      if (this.maybeProps) {
        for (var _n in this.maybeProps) return;
        this.maybeProps = null;
      }
      if (!this.proto || this.onNewProp && this.onNewProp.length) return;
      this.proto.unregPropHandler(this);
    },
    unregPropHandler: function(handler) {
      for (var i = 0; i < this.onNewProp.length; ++i)
        if (this.onNewProp[i] == handler) { this.onNewProp.splice(i, 1); break; }
      this.maybeUnregProtoPropHandler();
    },
    gatherProperties: function(f, depth) {
      for (var prop in this.props) if (prop != "<i>")
        f(prop, this, depth);
      if (this.proto) this.proto.gatherProperties(f, depth + 1);
    },
    getObjType: function() { return this; }
  });

  var Fn = exports.Fn = function(name, self, args, argNames, retval) {
    Obj.call(this, cx.protos.Function, name);
    this.self = self;
    this.args = args;
    this.argNames = argNames;
    this.retval = retval;
  };
  Fn.prototype = extend(Obj.prototype, {
    constructor: Fn,
    toString: function(maxDepth) {
      if (maxDepth == null) maxDepth = 0;
      var str = "fn(";
      for (var i = 0; i < this.args.length; ++i) {
        if (i) str += ", ";
        var name = this.argNames[i];
        if (name && name != "?") str += name + ": ";
        str += maxDepth > -3 ? toString(this.args[i], maxDepth - 1, this) : "?";
      }
      str += ")";
      if (!this.retval.isEmpty())
        str += " -> " + (maxDepth > -3 ? toString(this.retval, maxDepth - 1, this) : "?");
      return str;
    },
    getProp: function(prop) {
      if (prop == "prototype") {
        var known = this.hasProp(prop, false);
        if (!known) {
          known = this.defProp(prop);
          var proto = new Obj(true, this.name && this.name + ".prototype");
          proto.origin = this.origin;
          known.addType(proto, WG_MADEUP_PROTO);
        }
        return known;
      }
      return Obj.prototype.getProp.call(this, prop);
    },
    defProp: function(prop, originNode) {
      if (prop == "prototype") {
        var found = this.hasProp(prop, false);
        if (found) return found;
        found = Obj.prototype.defProp.call(this, prop, originNode);
        found.origin = this.origin;
        found.propagate(new FnPrototype(this));
        return found;
      }
      return Obj.prototype.defProp.call(this, prop, originNode);
    },
    getFunctionType: function() { return this; }
  });

  var Arr = exports.Arr = function(contentType) {
    Obj.call(this, cx.protos.Array);
    var content = this.defProp("<i>");
    if (contentType) contentType.propagate(content);
  };
  Arr.prototype = extend(Obj.prototype, {
    constructor: Arr,
    toString: function(maxDepth) {
      if (maxDepth == null) maxDepth = 0;
      return "[" + (maxDepth > -3 ? toString(this.getProp("<i>"), maxDepth - 1, this) : "?") + "]";
    }
  });

  // THE PROPERTY REGISTRY

  function registerProp(prop, obj) {
    var data = cx.props[prop] || (cx.props[prop] = []);
    data.push(obj);
  }

  function objsWithProp(prop) {
    return cx.props[prop];
  }

  // INFERENCE CONTEXT

  exports.Context = function(defs, parent) {
    this.parent = parent;
    this.props = Object.create(null);
    this.protos = Object.create(null);
    this.origins = [];
    this.curOrigin = "ecma5";
    this.paths = Object.create(null);
    this.definitions = Object.create(null);
    this.purgeGen = 0;
    this.workList = null;
    this.disabledComputing = null;

    exports.withContext(this, function() {
      cx.protos.Object = new Obj(null, "Object.prototype");
      cx.topScope = new Scope();
      cx.topScope.name = "<top>";
      cx.protos.Array = new Obj(true, "Array.prototype");
      cx.protos.Function = new Fn("Function.prototype", ANull, [], [], ANull);
      cx.protos.Function.proto = cx.protos.Object;
      cx.protos.RegExp = new Obj(true, "RegExp.prototype");
      cx.protos.String = new Obj(true, "String.prototype");
      cx.protos.Number = new Obj(true, "Number.prototype");
      cx.protos.Boolean = new Obj(true, "Boolean.prototype");
      cx.str = new Prim(cx.protos.String, "string");
      cx.bool = new Prim(cx.protos.Boolean, "bool");
      cx.num = new Prim(cx.protos.Number, "number");
      cx.curOrigin = null;

      if (defs) for (var i = 0; i < defs.length; ++i)
        def.load(defs[i]);
    });
  };

  exports.Context.prototype.startAnalysis = function() {
    this.disabledComputing = this.workList = null;
  };

  var cx = null;
  exports.cx = function() { return cx; };

  exports.withContext = function(context, f) {
    var old = cx;
    cx = context;
    try { return f(); }
    finally { cx = old; }
  };

  exports.TimedOut = function() {
    this.message = "Timed out";
    this.stack = (new Error()).stack;
  };
  exports.TimedOut.prototype = Object.create(Error.prototype);
  exports.TimedOut.prototype.name = "infer.TimedOut";

  var timeout;
  exports.withTimeout = function(ms, f) {
    var end = +new Date + ms;
    var oldEnd = timeout;
    if (oldEnd && oldEnd < end) return f();
    timeout = end;
    try { return f(); }
    finally { timeout = oldEnd; }
  };

  exports.addOrigin = function(origin) {
    if (cx.origins.indexOf(origin) < 0) cx.origins.push(origin);
  };

  var baseMaxWorkDepth = 20, reduceMaxWorkDepth = 0.0001;
  function withWorklist(f) {
    if (cx.workList) return f(cx.workList);

    var list = [], depth = 0;
    var add = cx.workList = function(type, target, weight) {
      if (depth < baseMaxWorkDepth - reduceMaxWorkDepth * list.length)
        list.push(type, target, weight, depth);
    };
    var ret = f(add);
    for (var i = 0; i < list.length; i += 4) {
      if (timeout && +new Date >= timeout)
        throw new exports.TimedOut();
      depth = list[i + 3] + 1;
      list[i + 1].addType(list[i], list[i + 2]);
    }
    cx.workList = null;
    return ret;
  }

  // SCOPES

  var Scope = exports.Scope = function(prev) {
    Obj.call(this, prev || true);
    this.prev = prev;
  };
  Scope.prototype = extend(Obj.prototype, {
    constructor: Scope,
    defVar: function(name, originNode) {
      for (var s = this; ; s = s.proto) {
        var found = s.props[name];
        if (found) return found;
        if (!s.prev) return s.defProp(name, originNode);
      }
    }
  });

  // RETVAL COMPUTATION HEURISTICS

  function maybeInstantiate(scope, score) {
    if (scope.fnType)
      scope.fnType.instantiateScore = (scope.fnType.instantiateScore || 0) + score;
  }

  var NotSmaller = {};
  function nodeSmallerThan(node, n) {
    try {
      walk.simple(node, {Expression: function() { if (--n <= 0) throw NotSmaller; }});
      return true;
    } catch(e) {
      if (e == NotSmaller) return false;
      throw e;
    }
  }

  function maybeTagAsInstantiated(node, scope) {
    var score = scope.fnType.instantiateScore;
    if (!cx.disabledComputing && score && scope.fnType.args.length && nodeSmallerThan(node, score * 5)) {
      maybeInstantiate(scope.prev, score / 2);
      setFunctionInstantiated(node, scope);
      return true;
    } else {
      scope.fnType.instantiateScore = null;
    }
  }

  function setFunctionInstantiated(node, scope) {
    var fn = scope.fnType;
    // Disconnect the arg avals, so that we can add info to them without side effects
    for (var i = 0; i < fn.args.length; ++i) fn.args[i] = new AVal;
    fn.self = new AVal;
    fn.computeRet = function(self, args) {
      // Prevent recursion
      return withDisabledComputing(fn, function() {
        var oldOrigin = cx.curOrigin;
        cx.curOrigin = fn.origin;
        var scopeCopy = new Scope(scope.prev);
        scopeCopy.originNode = scope.originNode;
        for (var v in scope.props) {
          var local = scopeCopy.defProp(v, scope.props[v].originNode);
          for (var i = 0; i < args.length; ++i) if (fn.argNames[i] == v && i < args.length)
            args[i].propagate(local);
        }
        var argNames = fn.argNames.length != args.length ? fn.argNames.slice(0, args.length) : fn.argNames;
        while (argNames.length < args.length) argNames.push("?");
        scopeCopy.fnType = new Fn(fn.name, self, args, argNames, ANull);
        scopeCopy.fnType.originNode = fn.originNode;
        if (fn.arguments) {
          var argset = scopeCopy.fnType.arguments = new AVal;
          scopeCopy.defProp("arguments").addType(new Arr(argset));
          for (var i = 0; i < args.length; ++i) args[i].propagate(argset);
        }
        node.body.scope = scopeCopy;
        walk.recursive(node.body, scopeCopy, null, scopeGatherer);
        walk.recursive(node.body, scopeCopy, null, inferWrapper);
        cx.curOrigin = oldOrigin;
        return scopeCopy.fnType.retval;
      });
    };
  }

  function maybeTagAsGeneric(scope) {
    var fn = scope.fnType, target = fn.retval;
    if (target == ANull) return;
    var targetInner, asArray;
    if (!target.isEmpty() && (targetInner = target.getType()) instanceof Arr)
      target = asArray = targetInner.getProp("<i>");

    function explore(aval, path, depth) {
      if (depth > 3 || !aval.forward) return;
      for (var i = 0; i < aval.forward.length; ++i) {
        var prop = aval.forward[i].propagatesTo();
        if (!prop) continue;
        var newPath = path, dest;
        if (prop instanceof AVal) {
          dest = prop;
        } else if (prop.target instanceof AVal) {
          newPath += prop.pathExt;
          dest = prop.target;
        } else continue;
        if (dest == target) return newPath;
        var found = explore(dest, newPath, depth + 1);
        if (found) return found;
      }
    }

    var foundPath = explore(fn.self, "!this", 0);
    for (var i = 0; !foundPath && i < fn.args.length; ++i)
      foundPath = explore(fn.args[i], "!" + i, 0);

    if (foundPath) {
      if (asArray) foundPath = "[" + foundPath + "]";
      var p = new def.TypeParser(foundPath);
      var parsed = p.parseType(true);
      fn.computeRet = parsed.apply ? parsed : function() { return parsed; };
      fn.computeRetSource = foundPath;
      return true;
    }
  }

  // SCOPE GATHERING PASS

  function addVar(scope, nameNode) {
    return scope.defProp(nameNode.name, nameNode);
  }

  var scopeGatherer = walk.make({
    Function: function(node, scope, c) {
      var inner = node.body.scope = new Scope(scope);
      inner.originNode = node;
      var argVals = [], argNames = [];
      for (var i = 0; i < node.params.length; ++i) {
        var param = node.params[i];
        argNames.push(param.name);
        argVals.push(addVar(inner, param));
      }
      inner.fnType = new Fn(node.id && node.id.name, new AVal, argVals, argNames, ANull);
      inner.fnType.originNode = node;
      if (node.id) {
        var decl = node.type == "FunctionDeclaration";
        addVar(decl ? scope : inner, node.id);
      }
      c(node.body, inner, "ScopeBody");
    },
    TryStatement: function(node, scope, c) {
      c(node.block, scope, "Statement");
      if (node.handler) {
        var v = addVar(scope, node.handler.param);
        c(node.handler.body, scope, "ScopeBody");
        var e5 = cx.definitions.ecma5;
        if (e5 && v.isEmpty()) getInstance(e5["Error.prototype"]).propagate(v, WG_CATCH_ERROR);
      }
      if (node.finalizer) c(node.finalizer, scope, "Statement");
    },
    VariableDeclaration: function(node, scope, c) {
      for (var i = 0; i < node.declarations.length; ++i) {
        var decl = node.declarations[i];
        addVar(scope, decl.id);
        if (decl.init) c(decl.init, scope, "Expression");
      }
    }
  });

  // CONSTRAINT GATHERING PASS

  function propName(node, scope, c) {
    var prop = node.property;
    if (!node.computed) return prop.name;
    if (prop.type == "Literal" && typeof prop.value == "string") return prop.value;
    if (c) infer(prop, scope, c, ANull);
    return "<i>";
  }

  function unopResultType(op) {
    switch (op) {
    case "+": case "-": case "~": return cx.num;
    case "!": return cx.bool;
    case "typeof": return cx.str;
    case "void": case "delete": return ANull;
    }
  }
  function binopIsBoolean(op) {
    switch (op) {
    case "==": case "!=": case "===": case "!==": case "<": case ">": case ">=": case "<=":
    case "in": case "instanceof": return true;
    }
  }
  function literalType(node) {
    if (node.regex) return getInstance(cx.protos.RegExp);
    switch (typeof node.value) {
    case "boolean": return cx.bool;
    case "number": return cx.num;
    case "string": return cx.str;
    case "object":
    case "function":
      if (!node.value) return ANull;
      return getInstance(cx.protos.RegExp);
    }
  }

  function ret(f) {
    return function(node, scope, c, out, name) {
      var r = f(node, scope, c, name);
      if (out) r.propagate(out);
      return r;
    };
  }
  function fill(f) {
    return function(node, scope, c, out, name) {
      if (!out) out = new AVal;
      f(node, scope, c, out, name);
      return out;
    };
  }

  var inferExprVisitor = {
    ArrayExpression: ret(function(node, scope, c) {
      var eltval = new AVal;
      for (var i = 0; i < node.elements.length; ++i) {
        var elt = node.elements[i];
        if (elt) infer(elt, scope, c, eltval);
      }
      return new Arr(eltval);
    }),
    ObjectExpression: ret(function(node, scope, c, name) {
      var obj = node.objType = new Obj(true, name);
      obj.originNode = node;

      for (var i = 0; i < node.properties.length; ++i) {
        var prop = node.properties[i], key = prop.key, name;
        if (prop.value.name == "✖") continue;

        if (key.type == "Identifier") {
          name = key.name;
        } else if (typeof key.value == "string") {
          name = key.value;
        }
        var target;
        if (!name || prop.kind == "set") {
          target = ANull;
        } else {
          var val = target = obj.defProp(name, key)
          val.initializer = true;
          if (prop.kind == "get")
            target = new IsCallee(obj, [], null, val);
        }
        infer(prop.value, scope, c, target, name);
        if (prop.value.type == "FunctionExpression")
          prop.value.body.scope.fnType.self.addType(obj, WG_SPECULATIVE_THIS);
      }
      return obj;
    }),
    FunctionExpression: ret(function(node, scope, c, name) {
      var inner = node.body.scope, fn = inner.fnType;
      if (name && !fn.name) fn.name = name;
      c(node.body, scope, "ScopeBody");
      maybeTagAsInstantiated(node, inner) || maybeTagAsGeneric(inner);
      if (node.id) inner.getProp(node.id.name).addType(fn);
      return fn;
    }),
    SequenceExpression: ret(function(node, scope, c) {
      for (var i = 0, l = node.expressions.length - 1; i < l; ++i)
        infer(node.expressions[i], scope, c, ANull);
      return infer(node.expressions[l], scope, c);
    }),
    UnaryExpression: ret(function(node, scope, c) {
      infer(node.argument, scope, c, ANull);
      return unopResultType(node.operator);
    }),
    UpdateExpression: ret(function(node, scope, c) {
      infer(node.argument, scope, c, ANull);
      return cx.num;
    }),
    BinaryExpression: ret(function(node, scope, c) {
      if (node.operator == "+") {
        var lhs = infer(node.left, scope, c);
        var rhs = infer(node.right, scope, c);
        if (lhs.hasType(cx.str) || rhs.hasType(cx.str)) return cx.str;
        if (lhs.hasType(cx.num) && rhs.hasType(cx.num)) return cx.num;
        var result = new AVal;
        lhs.propagate(new IsAdded(rhs, result));
        rhs.propagate(new IsAdded(lhs, result));
        return result;
      } else {
        infer(node.left, scope, c, ANull);
        infer(node.right, scope, c, ANull);
        return binopIsBoolean(node.operator) ? cx.bool : cx.num;
      }
    }),
    AssignmentExpression: ret(function(node, scope, c) {
      var rhs, name, pName;
      if (node.left.type == "MemberExpression") {
        pName = propName(node.left, scope, c);
        if (node.left.object.type == "Identifier")
          name = node.left.object.name + "." + pName;
      } else {
        name = node.left.name;
      }

      if (node.operator != "=" && node.operator != "+=") {
        infer(node.right, scope, c, ANull);
        rhs = cx.num;
      } else {
        rhs = infer(node.right, scope, c, null, name);
      }

      if (node.left.type == "MemberExpression") {
        var obj = infer(node.left.object, scope, c);
        if (pName == "prototype") maybeInstantiate(scope, 20);
        if (pName == "<i>") {
          // This is a hack to recognize for/in loops that copy
          // properties, and do the copying ourselves, insofar as we
          // manage, because such loops tend to be relevant for type
          // information.
          var v = node.left.property.name, local = scope.props[v], over = local && local.iteratesOver;
          if (over) {
            maybeInstantiate(scope, 20);
            var fromRight = node.right.type == "MemberExpression" && node.right.computed && node.right.property.name == v;
            over.forAllProps(function(prop, val, local) {
              if (local && prop != "prototype" && prop != "<i>")
                obj.propagate(new PropHasSubset(prop, fromRight ? val : ANull));
            });
            return rhs;
          }
        }
        obj.propagate(new PropHasSubset(pName, rhs, node.left.property));
        if (node.right.type == "FunctionExpression")
          obj.propagate(node.right.body.scope.fnType.self, WG_SPECULATIVE_THIS);
      } else { // Identifier
        rhs.propagate(scope.defVar(node.left.name, node.left));
      }
      return rhs;
    }),
    LogicalExpression: fill(function(node, scope, c, out) {
      infer(node.left, scope, c, out);
      infer(node.right, scope, c, out);
    }),
    ConditionalExpression: fill(function(node, scope, c, out) {
      infer(node.test, scope, c, ANull);
      infer(node.consequent, scope, c, out);
      infer(node.alternate, scope, c, out);
    }),
    NewExpression: fill(function(node, scope, c, out, name) {
      if (node.callee.type == "Identifier" && node.callee.name in scope.props)
        maybeInstantiate(scope, 20);

      for (var i = 0, args = []; i < node.arguments.length; ++i)
        args.push(infer(node.arguments[i], scope, c));
      var callee = infer(node.callee, scope, c);
      var self = new AVal;
      callee.propagate(new IsCtor(self, name && /\.prototype$/.test(name)));
      self.propagate(out, WG_NEW_INSTANCE);
      callee.propagate(new IsCallee(self, args, node.arguments, new IfObj(out)));
    }),
    CallExpression: fill(function(node, scope, c, out) {
      for (var i = 0, args = []; i < node.arguments.length; ++i)
        args.push(infer(node.arguments[i], scope, c));
      if (node.callee.type == "MemberExpression") {
        var self = infer(node.callee.object, scope, c);
        var pName = propName(node.callee, scope, c);
        if ((pName == "call" || pName == "apply") &&
            scope.fnType && scope.fnType.args.indexOf(self) > -1)
          maybeInstantiate(scope, 30);
        self.propagate(new HasMethodCall(pName, args, node.arguments, out));
      } else {
        var callee = infer(node.callee, scope, c);
        if (scope.fnType && scope.fnType.args.indexOf(callee) > -1)
          maybeInstantiate(scope, 30);
        var knownFn = callee.getFunctionType();
        if (knownFn && knownFn.instantiateScore && scope.fnType)
          maybeInstantiate(scope, knownFn.instantiateScore / 5);
        callee.propagate(new IsCallee(cx.topScope, args, node.arguments, out));
      }
    }),
    MemberExpression: fill(function(node, scope, c, out) {
      var name = propName(node, scope);
      var obj = infer(node.object, scope, c);
      var prop = obj.getProp(name);
      if (name == "<i>") {
        var propType = infer(node.property, scope, c);
        if (!propType.hasType(cx.num))
          return prop.propagate(out, WG_MULTI_MEMBER);
      }
      prop.propagate(out);
    }),
    Identifier: ret(function(node, scope) {
      if (node.name == "arguments" && scope.fnType && !(node.name in scope.props))
        scope.defProp(node.name, scope.fnType.originNode)
          .addType(new Arr(scope.fnType.arguments = new AVal));
      return scope.getProp(node.name);
    }),
    ThisExpression: ret(function(_node, scope) {
      return scope.fnType ? scope.fnType.self : cx.topScope;
    }),
    Literal: ret(function(node) {
      return literalType(node);
    })
  };

  function infer(node, scope, c, out, name) {
    return inferExprVisitor[node.type](node, scope, c, out, name);
  }

  var inferWrapper = walk.make({
    Expression: function(node, scope, c) {
      infer(node, scope, c, ANull);
    },

    FunctionDeclaration: function(node, scope, c) {
      var inner = node.body.scope, fn = inner.fnType;
      c(node.body, scope, "ScopeBody");
      maybeTagAsInstantiated(node, inner) || maybeTagAsGeneric(inner);
      var prop = scope.getProp(node.id.name);
      prop.addType(fn);
    },

    VariableDeclaration: function(node, scope, c) {
      for (var i = 0; i < node.declarations.length; ++i) {
        var decl = node.declarations[i], prop = scope.getProp(decl.id.name);
        if (decl.init)
          infer(decl.init, scope, c, prop, decl.id.name);
      }
    },

    ReturnStatement: function(node, scope, c) {
      if (!node.argument) return;
      var output = ANull;
      if (scope.fnType) {
        if (scope.fnType.retval == ANull) scope.fnType.retval = new AVal;
        output = scope.fnType.retval;
      }
      infer(node.argument, scope, c, output);
    },

    ForInStatement: function(node, scope, c) {
      var source = infer(node.right, scope, c);
      if ((node.right.type == "Identifier" && node.right.name in scope.props) ||
          (node.right.type == "MemberExpression" && node.right.property.name == "prototype")) {
        maybeInstantiate(scope, 5);
        var varName;
        if (node.left.type == "Identifier") {
          varName = node.left.name;
        } else if (node.left.type == "VariableDeclaration") {
          varName = node.left.declarations[0].id.name;
        }
        if (varName && varName in scope.props)
          scope.getProp(varName).iteratesOver = source;
      }
      c(node.body, scope, "Statement");
    },

    ScopeBody: function(node, scope, c) { c(node, node.scope || scope); }
  });

  // PARSING

  function runPasses(passes, pass) {
    var arr = passes && passes[pass];
    var args = Array.prototype.slice.call(arguments, 2);
    if (arr) for (var i = 0; i < arr.length; ++i) arr[i].apply(null, args);
  }

  var parse = exports.parse = function(text, passes, options) {
    var ast;
    if (passes.preParse) for (var i = 0; i < passes.preParse.length; i++) {
      var result = passes.preParse[i](text, options);
      if (typeof result == "string") text = result;
    }
    try { ast = acorn.parse(text, options); }
    catch(e) { ast = acorn_loose.parse_dammit(text, options); }
    runPasses(passes, "postParse", ast, text);
    return ast;
  };

  // ANALYSIS INTERFACE

  exports.analyze = function(ast, name, scope, passes) {
    if (typeof ast == "string") ast = parse(ast);

    if (!name) name = "file#" + cx.origins.length;
    exports.addOrigin(cx.curOrigin = name);

    if (!scope) scope = cx.topScope;
    cx.startAnalysis();

    walk.recursive(ast, scope, null, scopeGatherer);
    runPasses(passes, "preInfer", ast, scope);
    walk.recursive(ast, scope, null, inferWrapper);
    runPasses(passes, "postInfer", ast, scope);

    cx.curOrigin = null;
  };

  // PURGING

  exports.purge = function(origins, start, end) {
    var test = makePredicate(origins, start, end);
    ++cx.purgeGen;
    cx.topScope.purge(test);
    for (var prop in cx.props) {
      var list = cx.props[prop];
      for (var i = 0; i < list.length; ++i) {
        var obj = list[i], av = obj.props[prop];
        if (!av || test(av, av.originNode)) list.splice(i--, 1);
      }
      if (!list.length) delete cx.props[prop];
    }
  };

  function makePredicate(origins, start, end) {
    var arr = Array.isArray(origins);
    if (arr && origins.length == 1) { origins = origins[0]; arr = false; }
    if (arr) {
      if (end == null) return function(n) { return origins.indexOf(n.origin) > -1; };
      return function(n, pos) { return pos && pos.start >= start && pos.end <= end && origins.indexOf(n.origin) > -1; };
    } else {
      if (end == null) return function(n) { return n.origin == origins; };
      return function(n, pos) { return pos && pos.start >= start && pos.end <= end && n.origin == origins; };
    }
  }

  AVal.prototype.purge = function(test) {
    if (this.purgeGen == cx.purgeGen) return;
    this.purgeGen = cx.purgeGen;
    for (var i = 0; i < this.types.length; ++i) {
      var type = this.types[i];
      if (test(type, type.originNode))
        this.types.splice(i--, 1);
      else
        type.purge(test);
    }
    if (!this.types.length) this.maxWeight = 0;

    if (this.forward) for (var i = 0; i < this.forward.length; ++i) {
      var f = this.forward[i];
      if (test(f)) {
        this.forward.splice(i--, 1);
        if (this.props) this.props = null;
      } else if (f.purge) {
        f.purge(test);
      }
    }
  };
  ANull.purge = function() {};
  Obj.prototype.purge = function(test) {
    if (this.purgeGen == cx.purgeGen) return true;
    this.purgeGen = cx.purgeGen;
    for (var p in this.props) {
      var av = this.props[p];
      if (test(av, av.originNode))
        this.removeProp(p);
      av.purge(test);
    }
  };
  Fn.prototype.purge = function(test) {
    if (Obj.prototype.purge.call(this, test)) return;
    this.self.purge(test);
    this.retval.purge(test);
    for (var i = 0; i < this.args.length; ++i) this.args[i].purge(test);
  };

  // EXPRESSION TYPE DETERMINATION

  function findByPropertyName(name) {
    guessing = true;
    var found = objsWithProp(name);
    if (found) for (var i = 0; i < found.length; ++i) {
      var val = found[i].getProp(name);
      if (!val.isEmpty()) return val;
    }
    return ANull;
  }

  var typeFinder = {
    ArrayExpression: function(node, scope) {
      var eltval = new AVal;
      for (var i = 0; i < node.elements.length; ++i) {
        var elt = node.elements[i];
        if (elt) findType(elt, scope).propagate(eltval);
      }
      return new Arr(eltval);
    },
    ObjectExpression: function(node) {
      return node.objType;
    },
    FunctionExpression: function(node) {
      return node.body.scope.fnType;
    },
    SequenceExpression: function(node, scope) {
      return findType(node.expressions[node.expressions.length-1], scope);
    },
    UnaryExpression: function(node) {
      return unopResultType(node.operator);
    },
    UpdateExpression: function() {
      return cx.num;
    },
    BinaryExpression: function(node, scope) {
      if (binopIsBoolean(node.operator)) return cx.bool;
      if (node.operator == "+") {
        var lhs = findType(node.left, scope);
        var rhs = findType(node.right, scope);
        if (lhs.hasType(cx.str) || rhs.hasType(cx.str)) return cx.str;
      }
      return cx.num;
    },
    AssignmentExpression: function(node, scope) {
      return findType(node.right, scope);
    },
    LogicalExpression: function(node, scope) {
      var lhs = findType(node.left, scope);
      return lhs.isEmpty() ? findType(node.right, scope) : lhs;
    },
    ConditionalExpression: function(node, scope) {
      var lhs = findType(node.consequent, scope);
      return lhs.isEmpty() ? findType(node.alternate, scope) : lhs;
    },
    NewExpression: function(node, scope) {
      var f = findType(node.callee, scope).getFunctionType();
      var proto = f && f.getProp("prototype").getObjType();
      if (!proto) return ANull;
      return getInstance(proto, f);
    },
    CallExpression: function(node, scope) {
      var f = findType(node.callee, scope).getFunctionType();
      if (!f) return ANull;
      if (f.computeRet) {
        for (var i = 0, args = []; i < node.arguments.length; ++i)
          args.push(findType(node.arguments[i], scope));
        var self = ANull;
        if (node.callee.type == "MemberExpression")
          self = findType(node.callee.object, scope);
        return f.computeRet(self, args, node.arguments);
      } else {
        return f.retval;
      }
    },
    MemberExpression: function(node, scope) {
      var propN = propName(node, scope), obj = findType(node.object, scope).getType();
      if (obj) return obj.getProp(propN);
      if (propN == "<i>") return ANull;
      return findByPropertyName(propN);
    },
    Identifier: function(node, scope) {
      return scope.hasProp(node.name) || ANull;
    },
    ThisExpression: function(_node, scope) {
      return scope.fnType ? scope.fnType.self : cx.topScope;
    },
    Literal: function(node) {
      return literalType(node);
    }
  };

  function findType(node, scope) {
    return typeFinder[node.type](node, scope);
  }

  var searchVisitor = exports.searchVisitor = walk.make({
    Function: function(node, _st, c) {
      var scope = node.body.scope;
      if (node.id) c(node.id, scope);
      for (var i = 0; i < node.params.length; ++i)
        c(node.params[i], scope);
      c(node.body, scope, "ScopeBody");
    },
    TryStatement: function(node, st, c) {
      if (node.handler)
        c(node.handler.param, st);
      walk.base.TryStatement(node, st, c);
    },
    VariableDeclaration: function(node, st, c) {
      for (var i = 0; i < node.declarations.length; ++i) {
        var decl = node.declarations[i];
        c(decl.id, st);
        if (decl.init) c(decl.init, st, "Expression");
      }
    }
  });
  exports.fullVisitor = walk.make({
    MemberExpression: function(node, st, c) {
      c(node.object, st, "Expression");
      c(node.property, st, node.computed ? "Expression" : null);
    },
    ObjectExpression: function(node, st, c) {
      for (var i = 0; i < node.properties.length; ++i) {
        c(node.properties[i].value, st, "Expression");
        c(node.properties[i].key, st);
      }
    }
  }, searchVisitor);

  exports.findExpressionAt = function(ast, start, end, defaultScope, filter) {
    var test = filter || function(_t, node) {
      if (node.type == "Identifier" && node.name == "✖") return false;
      return typeFinder.hasOwnProperty(node.type);
    };
    return walk.findNodeAt(ast, start, end, test, searchVisitor, defaultScope || cx.topScope);
  };

  exports.findExpressionAround = function(ast, start, end, defaultScope, filter) {
    var test = filter || function(_t, node) {
      if (start != null && node.start > start) return false;
      if (node.type == "Identifier" && node.name == "✖") return false;
      return typeFinder.hasOwnProperty(node.type);
    };
    return walk.findNodeAround(ast, end, test, searchVisitor, defaultScope || cx.topScope);
  };

  exports.expressionType = function(found) {
    return findType(found.node, found.state);
  };

  // Finding the expected type of something, from context

  exports.parentNode = function(child, ast) {
    var stack = [];
    function c(node, st, override) {
      if (node.start <= child.start && node.end >= child.end) {
        var top = stack[stack.length - 1];
        if (node == child) throw {found: top};
        if (top != node) stack.push(node);
        walk.base[override || node.type](node, st, c);
        if (top != node) stack.pop();
      }
    }
    try {
      c(ast, null);
    } catch (e) {
      if (e.found) return e.found;
      throw e;
    }
  };

  var findTypeFromContext = {
    ArrayExpression: function(parent, _, get) { return get(parent, true).getProp("<i>"); },
    ObjectExpression: function(parent, node, get) {
      for (var i = 0; i < parent.properties.length; ++i) {
        var prop = node.properties[i];
        if (prop.value == node)
          return get(parent, true).getProp(prop.key.name);
      }
    },
    UnaryExpression: function(parent) { return unopResultType(parent.operator); },
    UpdateExpression: function() { return cx.num; },
    BinaryExpression: function(parent) { return binopIsBoolean(parent.operator) ? cx.bool : cx.num; },
    AssignmentExpression: function(parent, _, get) { return get(parent.left); },
    LogicalExpression: function(parent, _, get) { return get(parent, true); },
    ConditionalExpression: function(parent, node, get) {
      if (parent.consequent == node || parent.alternate == node) return get(parent, true);
    },
    NewExpression: function(parent, node, get) {
      return this.CallExpression(parent, node, get);
    },
    CallExpression: function(parent, node, get) {
      for (var i = 0; i < parent.arguments.length; i++) {
        var arg = parent.arguments[i];
        if (arg == node) {
          var calleeType = get(parent.callee).getFunctionType();
          if (calleeType instanceof Fn)
            return calleeType.args[i];
          break;
        }
      }
    },
    ReturnStatement: function(_parent, node, get) {
      var fnNode = walk.findNodeAround(node.sourceFile.ast, node.start, "Function");
      if (fnNode) {
        var fnType = fnNode.node.type == "FunctionExpression"
          ? get(fnNode.node, true).getFunctionType()
          : fnNode.node.body.scope.fnType;
        if (fnType) return fnType.retval.getType();
      }
    },
    VariableDeclaration: function(parent, node, get) {
      for (var i = 0; i < parent.declarations.length; i++) {
        var decl = parent.declarations[i];
        if (decl.init == node) return get(decl.id);
      }
    }
  };

  exports.typeFromContext = function(ast, found) {
    var parent = exports.parentNode(found.node, ast);
    var type = null;
    if (findTypeFromContext.hasOwnProperty(parent.type)) {
      type = findTypeFromContext[parent.type](parent, found.node, function(node, fromContext) {
        var obj = {node: node, state: found.state};
        var tp = fromContext ? exports.typeFromContext(ast, obj) : exports.expressionType(obj);
        return tp || ANull;
      });
    }
    return type || exports.expressionType(found);
  };

  // Flag used to indicate that some wild guessing was used to produce
  // a type or set of completions.
  var guessing = false;

  exports.resetGuessing = function(val) { guessing = val; };
  exports.didGuess = function() { return guessing; };

  exports.forAllPropertiesOf = function(type, f) {
    type.gatherProperties(f, 0);
  };

  var refFindWalker = walk.make({}, searchVisitor);

  exports.findRefs = function(ast, baseScope, name, refScope, f) {
    refFindWalker.Identifier = function(node, scope) {
      if (node.name != name) return;
      for (var s = scope; s; s = s.prev) {
        if (s == refScope) f(node, scope);
        if (name in s.props) return;
      }
    };
    walk.recursive(ast, baseScope, null, refFindWalker);
  };

  var simpleWalker = walk.make({
    Function: function(node, _st, c) { c(node.body, node.body.scope, "ScopeBody"); }
  });

  exports.findPropRefs = function(ast, scope, objType, propName, f) {
    walk.simple(ast, {
      MemberExpression: function(node, scope) {
        if (node.computed || node.property.name != propName) return;
        if (findType(node.object, scope).getType() == objType) f(node.property);
      },
      ObjectExpression: function(node, scope) {
        if (findType(node, scope).getType() != objType) return;
        for (var i = 0; i < node.properties.length; ++i)
          if (node.properties[i].key.name == propName) f(node.properties[i].key);
      }
    }, simpleWalker, scope);
  };

  // LOCAL-VARIABLE QUERIES

  var scopeAt = exports.scopeAt = function(ast, pos, defaultScope) {
    var found = walk.findNodeAround(ast, pos, function(tp, node) {
      return tp == "ScopeBody" && node.scope;
    });
    if (found) return found.node.scope;
    else return defaultScope || cx.topScope;
  };

  exports.forAllLocalsAt = function(ast, pos, defaultScope, f) {
    var scope = scopeAt(ast, pos, defaultScope);
    scope.gatherProperties(f, 0);
  };

  // INIT DEF MODULE

  // Delayed initialization because of cyclic dependencies.
  def = exports.def = def.init({}, exports);
});

/* codemirror/addon/tern/lib/doc_comment.js */
// Parses comments above variable declarations, function declarations,
// and object properties as docstrings and JSDoc-style type
// annotations.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require("../lib/comment"),
               require("acorn"), require("acorn/dist/walk"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", "../lib/comment", "acorn/dist/acorn", "acorn/dist/walk"], mod);
  mod(tern, tern, tern.comment, acorn, acorn.walk);
})(function(infer, tern, comment, acorn, walk) {
  "use strict";

  var WG_MADEUP = 1, WG_STRONG = 101;

  tern.registerPlugin("doc_comment", function(server, options) {
    server.jsdocTypedefs = Object.create(null);
    server.on("reset", function() {
      server.jsdocTypedefs = Object.create(null);
    });
    server._docComment = {
      weight: options && options.strong ? WG_STRONG : undefined,
      fullDocs: options && options.fullDocs
    };

    return {
      passes: {
        postParse: postParse,
        postInfer: postInfer,
        postLoadDef: postLoadDef
      }
    };
  });

  function postParse(ast, text) {
    function attachComments(node) { comment.ensureCommentsBefore(text, node); }

    walk.simple(ast, {
      VariableDeclaration: attachComments,
      FunctionDeclaration: attachComments,
      AssignmentExpression: function(node) {
        if (node.operator == "=") attachComments(node);
      },
      ObjectExpression: function(node) {
        for (var i = 0; i < node.properties.length; ++i)
          attachComments(node.properties[i]);
      },
      CallExpression: function(node) {
        if (isDefinePropertyCall(node)) attachComments(node);
      }
    });
  }

  function isDefinePropertyCall(node) {
    return node.callee.type == "MemberExpression" &&
      node.callee.object.name == "Object" &&
      node.callee.property.name == "defineProperty" &&
      node.arguments.length >= 3 &&
      typeof node.arguments[1].value == "string";
  }

  function postInfer(ast, scope) {
    jsdocParseTypedefs(ast.sourceFile.text, scope);

    walk.simple(ast, {
      VariableDeclaration: function(node, scope) {
        if (node.commentsBefore)
          interpretComments(node, node.commentsBefore, scope,
                            scope.getProp(node.declarations[0].id.name));
      },
      FunctionDeclaration: function(node, scope) {
        if (node.commentsBefore)
          interpretComments(node, node.commentsBefore, scope,
                            scope.getProp(node.id.name),
                            node.body.scope.fnType);
      },
      AssignmentExpression: function(node, scope) {
        if (node.commentsBefore)
          interpretComments(node, node.commentsBefore, scope,
                            infer.expressionType({node: node.left, state: scope}));
      },
      ObjectExpression: function(node, scope) {
        for (var i = 0; i < node.properties.length; ++i) {
          var prop = node.properties[i];
          if (prop.commentsBefore)
            interpretComments(prop, prop.commentsBefore, scope,
                              node.objType.getProp(prop.key.name));
        }
      },
      CallExpression: function(node, scope) {
        if (node.commentsBefore && isDefinePropertyCall(node)) {
          var type = infer.expressionType({node: node.arguments[0], state: scope}).getObjType();
          if (type && type instanceof infer.Obj) {
            var prop = type.props[node.arguments[1].value];
            if (prop) interpretComments(node, node.commentsBefore, scope, prop);
          }
        }
      }
    }, infer.searchVisitor, scope);
  }

  function postLoadDef(data) {
    var defs = data["!typedef"];
    var cx = infer.cx(), orig = data["!name"];
    if (defs) for (var name in defs)
      cx.parent.jsdocTypedefs[name] =
        maybeInstance(infer.def.parse(defs[name], orig, name), name);
  }

  // COMMENT INTERPRETATION

  function stripLeadingChars(lines) {
    for (var head, i = 1; i < lines.length; i++) {
      var line = lines[i], lineHead = line.match(/^[\s\*]*/)[0];
      if (lineHead != line) {
        if (head == null) {
          head = lineHead;
        } else {
          var same = 0;
          while (same < head.length && head.charCodeAt(same) == lineHead.charCodeAt(same)) ++same;
          if (same < head.length) head = head.slice(0, same)
        }
      }
    }
    lines = lines.map(function(line, i) {
      line = line.replace(/\s+$/, "");
      if (i == 0 && head != null) {
        for (var j = 0; j < head.length; j++) {
          var found = line.indexOf(head.slice(j));
          if (found == 0) return line.slice(head.length - j);
        }
      }
      if (head == null || i == 0) return line.replace(/^[\s\*]*/, "");
      if (line.length < head.length) return "";
      return line.slice(head.length);
    });
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    while (lines.length && !lines[0]) lines.shift();
    return lines;
  }

  function interpretComments(node, comments, scope, aval, type) {
    jsdocInterpretComments(node, scope, aval, comments);
    var cx = infer.cx();

    if (!type && aval instanceof infer.AVal && aval.types.length) {
      type = aval.types[aval.types.length - 1];
      if (!(type instanceof infer.Obj) || type.origin != cx.curOrigin || type.doc)
        type = null;
    }

    for (var i = comments.length - 1; i >= 0; i--) {
      var text = stripLeadingChars(comments[i].split(/\r\n?|\n/)).join("\n");
      if (text) {
        if (aval instanceof infer.AVal) aval.doc = text;
        if (type) type.doc = text;
        break;
      }
    }
  }

  // Parses a subset of JSDoc-style comments in order to include the
  // explicitly defined types in the analysis.

  function skipSpace(str, pos) {
    while (/\s/.test(str.charAt(pos))) ++pos;
    return pos;
  }

  function isIdentifier(string) {
    if (!acorn.isIdentifierStart(string.charCodeAt(0))) return false;
    for (var i = 1; i < string.length; i++)
      if (!acorn.isIdentifierChar(string.charCodeAt(i))) return false;
    return true;
  }

  function parseLabelList(scope, str, pos, close) {
    var labels = [], types = [], madeUp = false;
    for (var first = true; ; first = false) {
      pos = skipSpace(str, pos);
      if (first && str.charAt(pos) == close) break;
      var colon = str.indexOf(":", pos);
      if (colon < 0) return null;
      var label = str.slice(pos, colon);
      if (!isIdentifier(label)) return null;
      labels.push(label);
      pos = colon + 1;
      var type = parseType(scope, str, pos);
      if (!type) return null;
      pos = type.end;
      madeUp = madeUp || type.madeUp;
      types.push(type.type);
      pos = skipSpace(str, pos);
      var next = str.charAt(pos);
      ++pos;
      if (next == close) break;
      if (next != ",") return null;
    }
    return {labels: labels, types: types, end: pos, madeUp: madeUp};
  }

  function parseType(scope, str, pos) {
    var type, union = false, madeUp = false;
    for (;;) {
      var inner = parseTypeInner(scope, str, pos);
      if (!inner) return null;
      madeUp = madeUp || inner.madeUp;
      if (union) inner.type.propagate(union);
      else type = inner.type;
      pos = skipSpace(str, inner.end);
      if (str.charAt(pos) != "|") break;
      pos++;
      if (!union) {
        union = new infer.AVal;
        type.propagate(union);
        type = union;
      }
    }
    var isOptional = false;
    if (str.charAt(pos) == "=") {
      ++pos;
      isOptional = true;
    }
    return {type: type, end: pos, isOptional: isOptional, madeUp: madeUp};
  }

  function parseTypeInner(scope, str, pos) {
    pos = skipSpace(str, pos);
    var type, madeUp = false;

    if (str.indexOf("function(", pos) == pos) {
      var args = parseLabelList(scope, str, pos + 9, ")"), ret = infer.ANull;
      if (!args) return null;
      pos = skipSpace(str, args.end);
      if (str.charAt(pos) == ":") {
        ++pos;
        var retType = parseType(scope, str, pos + 1);
        if (!retType) return null;
        pos = retType.end;
        ret = retType.type;
        madeUp = retType.madeUp;
      }
      type = new infer.Fn(null, infer.ANull, args.types, args.labels, ret);
    } else if (str.charAt(pos) == "[") {
      var inner = parseType(scope, str, pos + 1);
      if (!inner) return null;
      pos = skipSpace(str, inner.end);
      madeUp = inner.madeUp;
      if (str.charAt(pos) != "]") return null;
      ++pos;
      type = new infer.Arr(inner.type);
    } else if (str.charAt(pos) == "{") {
      var fields = parseLabelList(scope, str, pos + 1, "}");
      if (!fields) return null;
      type = new infer.Obj(true);
      for (var i = 0; i < fields.types.length; ++i) {
        var field = type.defProp(fields.labels[i]);
        field.initializer = true;
        fields.types[i].propagate(field);
      }
      pos = fields.end;
      madeUp = fields.madeUp;
    } else if (str.charAt(pos) == "(") {
      var inner = parseType(scope, str, pos + 1);
      if (!inner) return null;
      pos = skipSpace(str, inner.end);
      if (str.charAt(pos) != ")") return null;
      ++pos;
      type = inner.type;
    } else {
      var start = pos;
      if (!acorn.isIdentifierStart(str.charCodeAt(pos))) return null;
      while (acorn.isIdentifierChar(str.charCodeAt(pos))) ++pos;
      if (start == pos) return null;
      var word = str.slice(start, pos);
      if (/^(number|integer)$/i.test(word)) type = infer.cx().num;
      else if (/^bool(ean)?$/i.test(word)) type = infer.cx().bool;
      else if (/^string$/i.test(word)) type = infer.cx().str;
      else if (/^(null|undefined)$/i.test(word)) type = infer.ANull;
      else if (/^array$/i.test(word)) {
        var inner = null;
        if (str.charAt(pos) == "." && str.charAt(pos + 1) == "<") {
          var inAngles = parseType(scope, str, pos + 2);
          if (!inAngles) return null;
          pos = skipSpace(str, inAngles.end);
          madeUp = inAngles.madeUp;
          if (str.charAt(pos++) != ">") return null;
          inner = inAngles.type;
        }
        type = new infer.Arr(inner);
      } else if (/^object$/i.test(word)) {
        type = new infer.Obj(true);
        if (str.charAt(pos) == "." && str.charAt(pos + 1) == "<") {
          var key = parseType(scope, str, pos + 2);
          if (!key) return null;
          pos = skipSpace(str, key.end);
          madeUp = madeUp || key.madeUp;
          if (str.charAt(pos++) != ",") return null;
          var val = parseType(scope, str, pos);
          if (!val) return null;
          pos = skipSpace(str, val.end);
          madeUp = key.madeUp || val.madeUp;
          if (str.charAt(pos++) != ">") return null;
          val.type.propagate(type.defProp("<i>"));
        }
      } else {
        while (str.charCodeAt(pos) == 46 ||
               acorn.isIdentifierChar(str.charCodeAt(pos))) ++pos;
        var path = str.slice(start, pos);
        var cx = infer.cx(), defs = cx.parent && cx.parent.jsdocTypedefs, found;
        if (defs && (path in defs)) {
          type = defs[path];
        } else if (found = infer.def.parsePath(path, scope).getObjType()) {
          type = maybeInstance(found, path);
        } else {
          if (!cx.jsdocPlaceholders) cx.jsdocPlaceholders = Object.create(null);
          if (!(path in cx.jsdocPlaceholders))
            type = cx.jsdocPlaceholders[path] = new infer.Obj(null, path);
          else
            type = cx.jsdocPlaceholders[path];
          madeUp = true;
        }
      }
    }

    return {type: type, end: pos, madeUp: madeUp};
  }

  function maybeInstance(type, path) {
    if (type instanceof infer.Fn && /^[A-Z]/.test(path)) {
      var proto = type.getProp("prototype").getObjType();
      if (proto instanceof infer.Obj) return infer.getInstance(proto);
    }
    return type;
  }

  function parseTypeOuter(scope, str, pos) {
    pos = skipSpace(str, pos || 0);
    if (str.charAt(pos) != "{") return null;
    var result = parseType(scope, str, pos + 1);
    if (!result) return null;
    var end = skipSpace(str, result.end);
    if (str.charAt(end) != "}") return null;
    result.end = end + 1;
    return result;
  }

  function jsdocInterpretComments(node, scope, aval, comments) {
    var type, args, ret, foundOne, self, parsed;

    for (var i = 0; i < comments.length; ++i) {
      var comment = comments[i];
      var decl = /(?:\n|$|\*)\s*@(type|param|arg(?:ument)?|returns?|this)\s+(.*)/g, m;
      while (m = decl.exec(comment)) {
        if (m[1] == "this" && (parsed = parseType(scope, m[2], 0))) {
          self = parsed;
          foundOne = true;
          continue;
        }

        if (!(parsed = parseTypeOuter(scope, m[2]))) continue;
        foundOne = true;

        switch(m[1]) {
        case "returns": case "return":
          ret = parsed; break;
        case "type":
          type = parsed; break;
        case "param": case "arg": case "argument":
            var name = m[2].slice(parsed.end).match(/^\s*(\[?)\s*([^\]\s=]+)\s*(?:=[^\]]+\s*)?(\]?).*/);
            if (!name) continue;
            var argname = name[2] + (parsed.isOptional || (name[1] === '[' && name[3] === ']') ? "?" : "");
          (args || (args = Object.create(null)))[argname] = parsed;
          break;
        }
      }
    }

    if (foundOne) applyType(type, self, args, ret, node, aval);
  };

  function jsdocParseTypedefs(text, scope) {
    var cx = infer.cx();

    var re = /\s@typedef\s+(.*)/g, m;
    while (m = re.exec(text)) {
      var parsed = parseTypeOuter(scope, m[1]);
      var name = parsed && m[1].slice(parsed.end).match(/^\s*(\S+)/);
      if (name)
        cx.parent.jsdocTypedefs[name[1]] = parsed.type;
    }
  }

  function propagateWithWeight(type, target) {
    var weight = infer.cx().parent._docComment.weight;
    type.type.propagate(target, weight || (type.madeUp ? WG_MADEUP : undefined));
  }

  function applyType(type, self, args, ret, node, aval) {
    var fn;
    if (node.type == "VariableDeclaration") {
      var decl = node.declarations[0];
      if (decl.init && decl.init.type == "FunctionExpression") fn = decl.init.body.scope.fnType;
    } else if (node.type == "FunctionDeclaration") {
      fn = node.body.scope.fnType;
    } else if (node.type == "AssignmentExpression") {
      if (node.right.type == "FunctionExpression")
        fn = node.right.body.scope.fnType;
    } else if (node.type == "CallExpression") {
    } else { // An object property
      if (node.value.type == "FunctionExpression") fn = node.value.body.scope.fnType;
    }

    if (fn && (args || ret || self)) {
      if (args) for (var i = 0; i < fn.argNames.length; ++i) {
        var name = fn.argNames[i], known = args[name];
        if (!known && (known = args[name + "?"]))
          fn.argNames[i] += "?";
        if (known) propagateWithWeight(known, fn.args[i]);
      }
      if (ret) {
        if (fn.retval == infer.ANull) fn.retval = new infer.AVal;
        propagateWithWeight(ret, fn.retval);
      }
      if (self) propagateWithWeight(self, fn.self);
    } else if (type) {
      propagateWithWeight(type, aval);
    }
  };
});

/* codemirror/addon/fold/foldcode.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function doFold(cm, pos, options, force) {
    if (options && options.call) {
      var finder = options;
      options = null;
    } else {
      var finder = getOption(cm, options, "rangeFinder");
    }
    if (typeof pos == "number") pos = CodeMirror.Pos(pos, 0);
    var minSize = getOption(cm, options, "minFoldSize");

    function getRange(allowFolded) {
      var range = finder(cm, pos);
      if (!range || range.to.line - range.from.line < minSize) return null;
      var marks = cm.findMarksAt(range.from);
      for (var i = 0; i < marks.length; ++i) {
        if (marks[i].__isFold && force !== "fold") {
          if (!allowFolded) return null;
          range.cleared = true;
          marks[i].clear();
        }
      }
      return range;
    }

    var range = getRange(true);
    if (getOption(cm, options, "scanUp")) while (!range && pos.line > cm.firstLine()) {
      pos = CodeMirror.Pos(pos.line - 1, 0);
      range = getRange(false);
    }
    if (!range || range.cleared || force === "unfold") return;

    var myWidget = makeWidget(cm, options);
    CodeMirror.on(myWidget, "mousedown", function(e) {
      myRange.clear();
      CodeMirror.e_preventDefault(e);
    });
    var myRange = cm.markText(range.from, range.to, {
      replacedWith: myWidget,
      clearOnEnter: getOption(cm, options, "clearOnEnter"),
      __isFold: true
    });
    myRange.on("clear", function(from, to) {
      CodeMirror.signal(cm, "unfold", cm, from, to);
    });
    CodeMirror.signal(cm, "fold", cm, range.from, range.to);
  }

  function makeWidget(cm, options) {
    var widget = getOption(cm, options, "widget");
    if (typeof widget == "string") {
      var text = document.createTextNode(widget);
      widget = document.createElement("span");
      widget.appendChild(text);
      widget.className = "CodeMirror-foldmarker";
    }
    return widget;
  }

  // Clumsy backwards-compatible interface
  CodeMirror.newFoldFunction = function(rangeFinder, widget) {
    return function(cm, pos) { doFold(cm, pos, {rangeFinder: rangeFinder, widget: widget}); };
  };

  // New-style interface
  CodeMirror.defineExtension("foldCode", function(pos, options, force) {
    doFold(this, pos, options, force);
  });

  CodeMirror.defineExtension("isFolded", function(pos) {
    var marks = this.findMarksAt(pos);
    for (var i = 0; i < marks.length; ++i)
      if (marks[i].__isFold) return true;
  });

  CodeMirror.commands.toggleFold = function(cm) {
    cm.foldCode(cm.getCursor());
  };
  CodeMirror.commands.fold = function(cm) {
    cm.foldCode(cm.getCursor(), null, "fold");
  };
  CodeMirror.commands.unfold = function(cm) {
    cm.foldCode(cm.getCursor(), null, "unfold");
  };
  CodeMirror.commands.foldAll = function(cm) {
    cm.operation(function() {
      for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++)
        cm.foldCode(CodeMirror.Pos(i, 0), null, "fold");
    });
  };
  CodeMirror.commands.unfoldAll = function(cm) {
    cm.operation(function() {
      for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++)
        cm.foldCode(CodeMirror.Pos(i, 0), null, "unfold");
    });
  };

  CodeMirror.registerHelper("fold", "combine", function() {
    var funcs = Array.prototype.slice.call(arguments, 0);
    return function(cm, start) {
      for (var i = 0; i < funcs.length; ++i) {
        var found = funcs[i](cm, start);
        if (found) return found;
      }
    };
  });

  CodeMirror.registerHelper("fold", "auto", function(cm, start) {
    var helpers = cm.getHelpers(start, "fold");
    for (var i = 0; i < helpers.length; i++) {
      var cur = helpers[i](cm, start);
      if (cur) return cur;
    }
  });

  var defaultOptions = {
    rangeFinder: CodeMirror.fold.auto,
    widget: "\u2194",
    minFoldSize: 0,
    scanUp: false,
    clearOnEnter: true
  };

  CodeMirror.defineOption("foldOptions", null);

  function getOption(cm, options, name) {
    if (options && options[name] !== undefined)
      return options[name];
    var editorOptions = cm.options.foldOptions;
    if (editorOptions && editorOptions[name] !== undefined)
      return editorOptions[name];
    return defaultOptions[name];
  }

  CodeMirror.defineExtension("foldOption", function(options, name) {
    return getOption(this, options, name);
  });
});


/* codemirror/addon/fold/foldgutter.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./foldcode"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./foldcode"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("foldGutter", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.clearGutter(cm.state.foldGutter.options.gutter);
      cm.state.foldGutter = null;
      cm.off("gutterClick", onGutterClick);
      cm.off("change", onChange);
      cm.off("viewportChange", onViewportChange);
      cm.off("fold", onFold);
      cm.off("unfold", onFold);
      cm.off("swapDoc", onChange);
    }
    if (val) {
      cm.state.foldGutter = new State(parseOptions(val));
      updateInViewport(cm);
      cm.on("gutterClick", onGutterClick);
      cm.on("change", onChange);
      cm.on("viewportChange", onViewportChange);
      cm.on("fold", onFold);
      cm.on("unfold", onFold);
      cm.on("swapDoc", onChange);
    }
  });

  var Pos = CodeMirror.Pos;

  function State(options) {
    this.options = options;
    this.from = this.to = 0;
  }

  function parseOptions(opts) {
    if (opts === true) opts = {};
    if (opts.gutter == null) opts.gutter = "CodeMirror-foldgutter";
    if (opts.indicatorOpen == null) opts.indicatorOpen = "CodeMirror-foldgutter-open";
    if (opts.indicatorFolded == null) opts.indicatorFolded = "CodeMirror-foldgutter-folded";
    return opts;
  }

  function isFolded(cm, line) {
    var marks = cm.findMarks(Pos(line, 0), Pos(line + 1, 0));
    for (var i = 0; i < marks.length; ++i)
      if (marks[i].__isFold && marks[i].find().from.line == line) return marks[i];
  }

  function marker(spec) {
    if (typeof spec == "string") {
      var elt = document.createElement("div");
      elt.className = spec + " CodeMirror-guttermarker-subtle";
      return elt;
    } else {
      return spec.cloneNode(true);
    }
  }

  function updateFoldInfo(cm, from, to) {
    var opts = cm.state.foldGutter.options, cur = from;
    var minSize = cm.foldOption(opts, "minFoldSize");
    var func = cm.foldOption(opts, "rangeFinder");
    cm.eachLine(from, to, function(line) {
      var mark = null;
      if (isFolded(cm, cur)) {
        mark = marker(opts.indicatorFolded);
      } else {
        var pos = Pos(cur, 0);
        var range = func && func(cm, pos);
        if (range && range.to.line - range.from.line >= minSize)
          mark = marker(opts.indicatorOpen);
      }
      cm.setGutterMarker(line, opts.gutter, mark);
      ++cur;
    });
  }

  function updateInViewport(cm) {
    var vp = cm.getViewport(), state = cm.state.foldGutter;
    if (!state) return;
    cm.operation(function() {
      updateFoldInfo(cm, vp.from, vp.to);
    });
    state.from = vp.from; state.to = vp.to;
  }

  function onGutterClick(cm, line, gutter) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    if (gutter != opts.gutter) return;
    var folded = isFolded(cm, line);
    if (folded) folded.clear();
    else cm.foldCode(Pos(line, 0), opts.rangeFinder);
  }

  function onChange(cm) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    state.from = state.to = 0;
    clearTimeout(state.changeUpdate);
    state.changeUpdate = setTimeout(function() { updateInViewport(cm); }, opts.foldOnChangeTimeSpan || 600);
  }

  function onViewportChange(cm) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    clearTimeout(state.changeUpdate);
    state.changeUpdate = setTimeout(function() {
      var vp = cm.getViewport();
      if (state.from == state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
        updateInViewport(cm);
      } else {
        cm.operation(function() {
          if (vp.from < state.from) {
            updateFoldInfo(cm, vp.from, state.from);
            state.from = vp.from;
          }
          if (vp.to > state.to) {
            updateFoldInfo(cm, state.to, vp.to);
            state.to = vp.to;
          }
        });
      }
    }, opts.updateViewportTimeSpan || 400);
  }

  function onFold(cm, from) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var line = from.line;
    if (line >= state.from && line < state.to)
      updateFoldInfo(cm, line, line + 1);
  }
});


/* codemirror/addon/fold/foldgutter.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./foldcode"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./foldcode"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("foldGutter", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.clearGutter(cm.state.foldGutter.options.gutter);
      cm.state.foldGutter = null;
      cm.off("gutterClick", onGutterClick);
      cm.off("change", onChange);
      cm.off("viewportChange", onViewportChange);
      cm.off("fold", onFold);
      cm.off("unfold", onFold);
      cm.off("swapDoc", onChange);
    }
    if (val) {
      cm.state.foldGutter = new State(parseOptions(val));
      updateInViewport(cm);
      cm.on("gutterClick", onGutterClick);
      cm.on("change", onChange);
      cm.on("viewportChange", onViewportChange);
      cm.on("fold", onFold);
      cm.on("unfold", onFold);
      cm.on("swapDoc", onChange);
    }
  });

  var Pos = CodeMirror.Pos;

  function State(options) {
    this.options = options;
    this.from = this.to = 0;
  }

  function parseOptions(opts) {
    if (opts === true) opts = {};
    if (opts.gutter == null) opts.gutter = "CodeMirror-foldgutter";
    if (opts.indicatorOpen == null) opts.indicatorOpen = "CodeMirror-foldgutter-open";
    if (opts.indicatorFolded == null) opts.indicatorFolded = "CodeMirror-foldgutter-folded";
    return opts;
  }

  function isFolded(cm, line) {
    var marks = cm.findMarks(Pos(line, 0), Pos(line + 1, 0));
    for (var i = 0; i < marks.length; ++i)
      if (marks[i].__isFold && marks[i].find().from.line == line) return marks[i];
  }

  function marker(spec) {
    if (typeof spec == "string") {
      var elt = document.createElement("div");
      elt.className = spec + " CodeMirror-guttermarker-subtle";
      return elt;
    } else {
      return spec.cloneNode(true);
    }
  }

  function updateFoldInfo(cm, from, to) {
    var opts = cm.state.foldGutter.options, cur = from;
    var minSize = cm.foldOption(opts, "minFoldSize");
    var func = cm.foldOption(opts, "rangeFinder");
    cm.eachLine(from, to, function(line) {
      var mark = null;
      if (isFolded(cm, cur)) {
        mark = marker(opts.indicatorFolded);
      } else {
        var pos = Pos(cur, 0);
        var range = func && func(cm, pos);
        if (range && range.to.line - range.from.line >= minSize)
          mark = marker(opts.indicatorOpen);
      }
      cm.setGutterMarker(line, opts.gutter, mark);
      ++cur;
    });
  }

  function updateInViewport(cm) {
    var vp = cm.getViewport(), state = cm.state.foldGutter;
    if (!state) return;
    cm.operation(function() {
      updateFoldInfo(cm, vp.from, vp.to);
    });
    state.from = vp.from; state.to = vp.to;
  }

  function onGutterClick(cm, line, gutter) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    if (gutter != opts.gutter) return;
    var folded = isFolded(cm, line);
    if (folded) folded.clear();
    else cm.foldCode(Pos(line, 0), opts.rangeFinder);
  }

  function onChange(cm) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    state.from = state.to = 0;
    clearTimeout(state.changeUpdate);
    state.changeUpdate = setTimeout(function() { updateInViewport(cm); }, opts.foldOnChangeTimeSpan || 600);
  }

  function onViewportChange(cm) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var opts = state.options;
    clearTimeout(state.changeUpdate);
    state.changeUpdate = setTimeout(function() {
      var vp = cm.getViewport();
      if (state.from == state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
        updateInViewport(cm);
      } else {
        cm.operation(function() {
          if (vp.from < state.from) {
            updateFoldInfo(cm, vp.from, state.from);
            state.from = vp.from;
          }
          if (vp.to > state.to) {
            updateFoldInfo(cm, state.to, vp.to);
            state.to = vp.to;
          }
        });
      }
    }, opts.updateViewportTimeSpan || 400);
  }

  function onFold(cm, from) {
    var state = cm.state.foldGutter;
    if (!state) return;
    var line = from.line;
    if (line >= state.from && line < state.to)
      updateFoldInfo(cm, line, line + 1);
  }
});


/* codemirror/addon/fold/brace-fold.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerHelper("fold", "brace", function(cm, start) {
  var line = start.line, lineText = cm.getLine(line);
  var tokenType;

  function findOpening(openCh) {
    for (var at = start.ch, pass = 0;;) {
      var found = at <= 0 ? -1 : lineText.lastIndexOf(openCh, at - 1);
      if (found == -1) {
        if (pass == 1) break;
        pass = 1;
        at = lineText.length;
        continue;
      }
      if (pass == 1 && found < start.ch) break;
      tokenType = cm.getTokenTypeAt(CodeMirror.Pos(line, found + 1));
      if (!/^(comment|string)/.test(tokenType)) return found + 1;
      at = found - 1;
    }
  }

  var startToken = "{", endToken = "}", startCh = findOpening("{");
  if (startCh == null) {
    startToken = "[", endToken = "]";
    startCh = findOpening("[");
  }

  if (startCh == null) return;
  var count = 1, lastLine = cm.lastLine(), end, endCh;
  outer: for (var i = line; i <= lastLine; ++i) {
    var text = cm.getLine(i), pos = i == line ? startCh : 0;
    for (;;) {
      var nextOpen = text.indexOf(startToken, pos), nextClose = text.indexOf(endToken, pos);
      if (nextOpen < 0) nextOpen = text.length;
      if (nextClose < 0) nextClose = text.length;
      pos = Math.min(nextOpen, nextClose);
      if (pos == text.length) break;
      if (cm.getTokenTypeAt(CodeMirror.Pos(i, pos + 1)) == tokenType) {
        if (pos == nextOpen) ++count;
        else if (!--count) { end = i; endCh = pos; break outer; }
      }
      ++pos;
    }
  }
  if (end == null || line == end && endCh == startCh) return;
  return {from: CodeMirror.Pos(line, startCh),
          to: CodeMirror.Pos(end, endCh)};
});

CodeMirror.registerHelper("fold", "import", function(cm, start) {
  function hasImport(line) {
    if (line < cm.firstLine() || line > cm.lastLine()) return null;
    var start = cm.getTokenAt(CodeMirror.Pos(line, 1));
    if (!/\S/.test(start.string)) start = cm.getTokenAt(CodeMirror.Pos(line, start.end + 1));
    if (start.type != "keyword" || start.string != "import") return null;
    // Now find closing semicolon, return its position
    for (var i = line, e = Math.min(cm.lastLine(), line + 10); i <= e; ++i) {
      var text = cm.getLine(i), semi = text.indexOf(";");
      if (semi != -1) return {startCh: start.end, end: CodeMirror.Pos(i, semi)};
    }
  }

  var startLine = start.line, has = hasImport(startLine), prev;
  if (!has || hasImport(startLine - 1) || ((prev = hasImport(startLine - 2)) && prev.end.line == startLine - 1))
    return null;
  for (var end = has.end;;) {
    var next = hasImport(end.line + 1);
    if (next == null) break;
    end = next.end;
  }
  return {from: cm.clipPos(CodeMirror.Pos(startLine, has.startCh + 1)), to: end};
});

CodeMirror.registerHelper("fold", "include", function(cm, start) {
  function hasInclude(line) {
    if (line < cm.firstLine() || line > cm.lastLine()) return null;
    var start = cm.getTokenAt(CodeMirror.Pos(line, 1));
    if (!/\S/.test(start.string)) start = cm.getTokenAt(CodeMirror.Pos(line, start.end + 1));
    if (start.type == "meta" && start.string.slice(0, 8) == "#include") return start.start + 8;
  }

  var startLine = start.line, has = hasInclude(startLine);
  if (has == null || hasInclude(startLine - 1) != null) return null;
  for (var end = startLine;;) {
    var next = hasInclude(end + 1);
    if (next == null) break;
    ++end;
  }
  return {from: CodeMirror.Pos(startLine, has + 1),
          to: cm.clipPos(CodeMirror.Pos(end))};
});

});


/* codemirror/addon/fold/comment-fold.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerGlobalHelper("fold", "comment", function(mode) {
  return mode.blockCommentStart && mode.blockCommentEnd;
}, function(cm, start) {
  var mode = cm.getModeAt(start), startToken = mode.blockCommentStart, endToken = mode.blockCommentEnd;
  if (!startToken || !endToken) return;
  var line = start.line, lineText = cm.getLine(line);

  var startCh;
  for (var at = start.ch, pass = 0;;) {
    var found = at <= 0 ? -1 : lineText.lastIndexOf(startToken, at - 1);
    if (found == -1) {
      if (pass == 1) return;
      pass = 1;
      at = lineText.length;
      continue;
    }
    if (pass == 1 && found < start.ch) return;
    if (/comment/.test(cm.getTokenTypeAt(CodeMirror.Pos(line, found + 1))) &&
        (found == 0 || lineText.slice(found - endToken.length, found) == endToken ||
         !/comment/.test(cm.getTokenTypeAt(CodeMirror.Pos(line, found))))) {
      startCh = found + startToken.length;
      break;
    }
    at = found - 1;
  }

  var depth = 1, lastLine = cm.lastLine(), end, endCh;
  outer: for (var i = line; i <= lastLine; ++i) {
    var text = cm.getLine(i), pos = i == line ? startCh : 0;
    for (;;) {
      var nextOpen = text.indexOf(startToken, pos), nextClose = text.indexOf(endToken, pos);
      if (nextOpen < 0) nextOpen = text.length;
      if (nextClose < 0) nextClose = text.length;
      pos = Math.min(nextOpen, nextClose);
      if (pos == text.length) break;
      if (pos == nextOpen) ++depth;
      else if (!--depth) { end = i; endCh = pos; break outer; }
      ++pos;
    }
  }
  if (end == null || line == end && endCh == startCh) return;
  return {from: CodeMirror.Pos(line, startCh),
          to: CodeMirror.Pos(end, endCh)};
});

});


/* codemirror/addon/scroll/scrollpastend.js */
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("scrollPastEnd", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.off("change", onChange);
      cm.off("refresh", updateBottomMargin);
      cm.display.lineSpace.parentNode.style.paddingBottom = "";
      cm.state.scrollPastEndPadding = null;
    }
    if (val) {
      cm.on("change", onChange);
      cm.on("refresh", updateBottomMargin);
      updateBottomMargin(cm);
    }
  });

  function onChange(cm, change) {
    if (CodeMirror.changeEnd(change).line == cm.lastLine())
      updateBottomMargin(cm);
  }

  function updateBottomMargin(cm) {
    var padding = "";
    if (cm.lineCount() > 1) {
      var totalH = cm.display.scroller.clientHeight - 30,
          lastLineH = cm.getLineHandle(cm.lastLine()).height;
      padding = (totalH - lastLineH) + "px";
    }
    if (cm.state.scrollPastEndPadding != padding) {
      cm.state.scrollPastEndPadding = padding;
      cm.display.lineSpace.parentNode.style.paddingBottom = padding;
      cm.off("refresh", updateBottomMargin);
      cm.setSize();
      cm.on("refresh", updateBottomMargin);
    }
  }
});


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


/* code_editor/app.js */
(function() {
    'use strict';

    function CodeEditor() {
        Events.call(this);

        this._hooks = { };
    }
    CodeEditor.prototype = Object.create(Events.prototype);


    CodeEditor.prototype.method = function(name, fn) {
        if (this._hooks[name] !== undefined) {
            throw new Error('can\'t override hook: ' + name);
        }
        this._hooks[name] = fn;
    };


    CodeEditor.prototype.methodRemove = function(name) {
        delete this._hooks[name];
    };


    CodeEditor.prototype.call = function(name) {
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

    window.editor = new CodeEditor();


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


    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.emit('load');
        editor.emit('start');
    }, false);
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


/* code_editor/tern-defs/tern-ecma5.js */
editor.once('load', function () {
    var def =  {
      "!name": "ecma5",
      "!define": {"Error.prototype": "Error.prototype"},
      "Infinity": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Infinity",
        "!doc": "A numeric value representing infinity."
      },
      "undefined": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/undefined",
        "!doc": "The value undefined."
      },
      "NaN": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/NaN",
        "!doc": "A value representing Not-A-Number."
      },
      "Object": {
        "!type": "fn()",
        "getPrototypeOf": {
          "!type": "fn(obj: ?) -> ?",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/getPrototypeOf",
          "!doc": "Returns the prototype (i.e. the internal prototype) of the specified object."
        },
        "create": {
          "!type": "fn(proto: ?) -> !custom:Object_create",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create",
          "!doc": "Creates a new object with the specified prototype object and properties."
        },
        "defineProperty": {
          "!type": "fn(obj: ?, prop: string, desc: ?) -> !custom:Object_defineProperty",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty",
          "!doc": "Defines a new property directly on an object, or modifies an existing property on an object, and returns the object. If you want to see how to use the Object.defineProperty method with a binary-flags-like syntax, see this article."
        },
        "defineProperties": {
          "!type": "fn(obj: ?, props: ?) -> !custom:Object_defineProperties",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty",
          "!doc": "Defines a new property directly on an object, or modifies an existing property on an object, and returns the object. If you want to see how to use the Object.defineProperty method with a binary-flags-like syntax, see this article."
        },
        "getOwnPropertyDescriptor": {
          "!type": "fn(obj: ?, prop: string) -> ?",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor",
          "!doc": "Returns a property descriptor for an own property (that is, one directly present on an object, not present by dint of being along an object's prototype chain) of a given object."
        },
        "keys": {
          "!type": "fn(obj: ?) -> [string]",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys",
          "!doc": "Returns an array of a given object's own enumerable properties, in the same order as that provided by a for-in loop (the difference being that a for-in loop enumerates properties in the prototype chain as well)."
        },
        "getOwnPropertyNames": {
          "!type": "fn(obj: ?) -> [string]",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames",
          "!doc": "Returns an array of all properties (enumerable or not) found directly upon a given object."
        },
        "seal": {
          "!type": "fn(obj: ?)",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/seal",
          "!doc": "Seals an object, preventing new properties from being added to it and marking all existing properties as non-configurable. Values of present properties can still be changed as long as they are writable."
        },
        "isSealed": {
          "!type": "fn(obj: ?) -> bool",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/isSealed",
          "!doc": "Determine if an object is sealed."
        },
        "freeze": {
          "!type": "fn(obj: ?) -> !0",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/freeze",
          "!doc": "Freezes an object: that is, prevents new properties from being added to it; prevents existing properties from being removed; and prevents existing properties, or their enumerability, configurability, or writability, from being changed. In essence the object is made effectively immutable. The method returns the object being frozen."
        },
        "isFrozen": {
          "!type": "fn(obj: ?) -> bool",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/isFrozen",
          "!doc": "Determine if an object is frozen."
        },
        "preventExtensions": {
          "!type": "fn(obj: ?)",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions",
          "!doc": "Prevents new properties from ever being added to an object."
        },
        "isExtensible": {
          "!type": "fn(obj: ?) -> bool",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible",
          "!doc": "The Object.isExtensible() method determines if an object is extensible (whether it can have new properties added to it)."
        },
        "prototype": {
          "!stdProto": "Object",
          "toString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/toString",
            "!doc": "Returns a string representing the object."
          },
          "toLocaleString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/toLocaleString",
            "!doc": "Returns a string representing the object. This method is meant to be overriden by derived objects for locale-specific purposes."
          },
          "valueOf": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/valueOf",
            "!doc": "Returns the primitive value of the specified object"
          },
          "hasOwnProperty": {
            "!type": "fn(prop: string) -> bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/hasOwnProperty",
            "!doc": "Returns a boolean indicating whether the object has the specified property."
          },
          "propertyIsEnumerable": {
            "!type": "fn(prop: string) -> bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/propertyIsEnumerable",
            "!doc": "Returns a Boolean indicating whether the specified property is enumerable."
          },
          "isPrototypeOf": {
            "!type": "fn(obj: ?) -> bool",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isPrototypeOf",
            "!doc": "Tests for an object in another object's prototype chain."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object",
        "!doc": "Creates an object wrapper."
      },
      "Function": {
        "!type": "fn(body: string) -> fn()",
        "prototype": {
          "!stdProto": "Function",
          "apply": {
            "!type": "fn(this: ?, args: [?])",
            "!effects": [
              "call and return !this this=!0 !1.<i> !1.<i> !1.<i>"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/apply",
            "!doc": "Calls a function with a given this value and arguments provided as an array (or an array like object)."
          },
          "call": {
            "!type": "fn(this: ?, args?: ?) -> !this.!ret",
            "!effects": [
              "call and return !this this=!0 !1 !2 !3 !4"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/call",
            "!doc": "Calls a function with a given this value and arguments provided individually."
          },
          "bind": {
            "!type": "fn(this: ?, args?: ?) -> !custom:Function_bind",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind",
            "!doc": "Creates a new function that, when called, has its this keyword set to the provided value, with a given sequence of arguments preceding any provided when the new function was called."
          },
          "prototype": "?"
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function",
        "!doc": "Every function in JavaScript is actually a Function object."
      },
      "Array": {
        "!type": "fn(size: number) -> !custom:Array_ctor",
        "isArray": {
          "!type": "fn(value: ?) -> bool",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/isArray",
          "!doc": "Returns true if an object is an array, false if it is not."
        },
        "prototype": {
          "!stdProto": "Array",
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/length",
            "!doc": "An unsigned, 32-bit integer that specifies the number of elements in an array."
          },
          "concat": {
            "!type": "fn(other: [?]) -> !this",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/concat",
            "!doc": "Returns a new array comprised of this array joined with other array(s) and/or value(s)."
          },
          "join": {
            "!type": "fn(separator?: string) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/join",
            "!doc": "Joins all elements of an array into a string."
          },
          "splice": {
            "!type": "fn(pos: number, amount: number)",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/splice",
            "!doc": "Changes the content of an array, adding new elements while removing old elements."
          },
          "pop": {
            "!type": "fn() -> !this.<i>",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/pop",
            "!doc": "Removes the last element from an array and returns that element."
          },
          "push": {
            "!type": "fn(newelt: ?) -> number",
            "!effects": [
              "propagate !0 !this.<i>"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/push",
            "!doc": "Mutates an array by appending the given elements and returning the new length of the array."
          },
          "shift": {
            "!type": "fn() -> !this.<i>",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/shift",
            "!doc": "Removes the first element from an array and returns that element. This method changes the length of the array."
          },
          "unshift": {
            "!type": "fn(newelt: ?) -> number",
            "!effects": [
              "propagate !0 !this.<i>"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/unshift",
            "!doc": "Adds one or more elements to the beginning of an array and returns the new length of the array."
          },
          "slice": {
            "!type": "fn(from: number, to?: number) -> !this",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/slice",
            "!doc": "Returns a shallow copy of a portion of an array."
          },
          "reverse": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/reverse",
            "!doc": "Reverses an array in place.  The first array element becomes the last and the last becomes the first."
          },
          "sort": {
            "!type": "fn(compare?: fn(a: ?, b: ?) -> number)",
            "!effects": [
              "call !0 !this.<i> !this.<i>"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort",
            "!doc": "Sorts the elements of an array in place and returns the array."
          },
          "indexOf": {
            "!type": "fn(elt: ?, from?: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf",
            "!doc": "Returns the first index at which a given element can be found in the array, or -1 if it is not present."
          },
          "lastIndexOf": {
            "!type": "fn(elt: ?, from?: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/lastIndexOf",
            "!doc": "Returns the last index at which a given element can be found in the array, or -1 if it is not present. The array is searched backwards, starting at fromIndex."
          },
          "every": {
            "!type": "fn(test: fn(elt: ?, i: number) -> bool, context?: ?) -> bool",
            "!effects": [
              "call !0 this=!1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/every",
            "!doc": "Tests whether all elements in the array pass the test implemented by the provided function."
          },
          "some": {
            "!type": "fn(test: fn(elt: ?, i: number) -> bool, context?: ?) -> bool",
            "!effects": [
              "call !0 this=!1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/some",
            "!doc": "Tests whether some element in the array passes the test implemented by the provided function."
          },
          "filter": {
            "!type": "fn(test: fn(elt: ?, i: number) -> bool, context?: ?) -> !this",
            "!effects": [
              "call !0 this=!1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter",
            "!doc": "Creates a new array with all elements that pass the test implemented by the provided function."
          },
          "forEach": {
            "!type": "fn(f: fn(elt: ?, i: number), context?: ?)",
            "!effects": [
              "call !0 this=!1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach",
            "!doc": "Executes a provided function once per array element."
          },
          "map": {
            "!type": "fn(f: fn(elt: ?, i: number) -> ?, context?: ?) -> [!0.!ret]",
            "!effects": [
              "call !0 this=!1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map",
            "!doc": "Creates a new array with the results of calling a provided function on every element in this array."
          },
          "reduce": {
            "!type": "fn(combine: fn(sum: ?, elt: ?, i: number) -> ?, init?: ?) -> !0.!ret",
            "!effects": [
              "call !0 !1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/Reduce",
            "!doc": "Apply a function against an accumulator and each value of the array (from left-to-right) as to reduce it to a single value."
          },
          "reduceRight": {
            "!type": "fn(combine: fn(sum: ?, elt: ?, i: number) -> ?, init?: ?) -> !0.!ret",
            "!effects": [
              "call !0 !1 !this.<i> number"
            ],
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/ReduceRight",
            "!doc": "Apply a function simultaneously against two values of the array (from right-to-left) as to reduce it to a single value."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array",
        "!doc": "The JavaScript Array global object is a constructor for arrays, which are high-level, list-like objects."
      },
      "String": {
        "!type": "fn(value: ?) -> string",
        "fromCharCode": {
          "!type": "fn(code: number) -> string",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/fromCharCode",
          "!doc": "Returns a string created by using the specified sequence of Unicode values."
        },
        "prototype": {
          "!stdProto": "String",
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/JavaScript/Reference/Global_Objects/String/length",
            "!doc": "Represents the length of a string."
          },
          "<i>": "string",
          "charAt": {
            "!type": "fn(i: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/charAt",
            "!doc": "Returns the specified character from a string."
          },
          "charCodeAt": {
            "!type": "fn(i: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/charCodeAt",
            "!doc": "Returns the numeric Unicode value of the character at the given index (except for unicode codepoints > 0x10000)."
          },
          "indexOf": {
            "!type": "fn(char: string, from?: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/indexOf",
            "!doc": "Returns the index within the calling String object of the first occurrence of the specified value, starting the search at fromIndex,\nreturns -1 if the value is not found."
          },
          "lastIndexOf": {
            "!type": "fn(char: string, from?: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/lastIndexOf",
            "!doc": "Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found. The calling string is searched backward, starting at fromIndex."
          },
          "substring": {
            "!type": "fn(from: number, to?: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/substring",
            "!doc": "Returns a subset of a string between one index and another, or through the end of the string."
          },
          "substr": {
            "!type": "fn(from: number, length?: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/substr",
            "!doc": "Returns the characters in a string beginning at the specified location through the specified number of characters."
          },
          "slice": {
            "!type": "fn(from: number, to?: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/slice",
            "!doc": "Extracts a section of a string and returns a new string."
          },
          "trim": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/Trim",
            "!doc": "Removes whitespace from both ends of the string."
          },
          "toUpperCase": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/toUpperCase",
            "!doc": "Returns the calling string value converted to uppercase."
          },
          "toLowerCase": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/toLowerCase",
            "!doc": "Returns the calling string value converted to lowercase."
          },
          "toLocaleUpperCase": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/toLocaleUpperCase",
            "!doc": "Returns the calling string value converted to upper case, according to any locale-specific case mappings."
          },
          "toLocaleLowerCase": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase",
            "!doc": "Returns the calling string value converted to lower case, according to any locale-specific case mappings."
          },
          "split": {
            "!type": "fn(pattern: string) -> [string]",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/split",
            "!doc": "Splits a String object into an array of strings by separating the string into substrings."
          },
          "concat": {
            "!type": "fn(other: string) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/concat",
            "!doc": "Combines the text of two or more strings and returns a new string."
          },
          "localeCompare": {
            "!type": "fn(other: string) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/localeCompare",
            "!doc": "Returns a number indicating whether a reference string comes before or after or is the same as the given string in sort order."
          },
          "match": {
            "!type": "fn(pattern: +RegExp) -> [string]",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/match",
            "!doc": "Used to retrieve the matches when matching a string against a regular expression."
          },
          "replace": {
            "!type": "fn(pattern: string|+RegExp, replacement: string) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/replace",
            "!doc": "Returns a new string with some or all matches of a pattern replaced by a replacement.  The pattern can be a string or a RegExp, and the replacement can be a string or a function to be called for each match."
          },
          "search": {
            "!type": "fn(pattern: +RegExp) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/search",
            "!doc": "Executes the search for a match between a regular expression and this String object."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String",
        "!doc": "The String global object is a constructor for strings, or a sequence of characters."
      },
      "Number": {
        "!type": "fn(value: ?) -> number",
        "MAX_VALUE": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/MAX_VALUE",
          "!doc": "The maximum numeric value representable in JavaScript."
        },
        "MIN_VALUE": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/MIN_VALUE",
          "!doc": "The smallest positive numeric value representable in JavaScript."
        },
        "POSITIVE_INFINITY": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/POSITIVE_INFINITY",
          "!doc": "A value representing the positive Infinity value."
        },
        "NEGATIVE_INFINITY": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/NEGATIVE_INFINITY",
          "!doc": "A value representing the negative Infinity value."
        },
        "prototype": {
          "!stdProto": "Number",
          "toString": {
            "!type": "fn(radix?: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toString",
            "!doc": "Returns a string representing the specified Number object"
          },
          "toFixed": {
            "!type": "fn(digits: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toFixed",
            "!doc": "Formats a number using fixed-point notation"
          },
          "toExponential": {
            "!type": "fn(digits: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toExponential",
            "!doc": "Returns a string representing the Number object in exponential notation"
          },
          "toPrecision": {
            "!type": "fn(digits: number) -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number/toPrecision",
            "!doc": "The toPrecision() method returns a string representing the number to the specified precision."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Number",
        "!doc": "The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor."
      },
      "Boolean": {
        "!type": "fn(value: ?) -> bool",
        "prototype": {
          "!stdProto": "Boolean"
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Boolean",
        "!doc": "The Boolean object is an object wrapper for a boolean value."
      },
      "RegExp": {
        "!type": "fn(source: string, flags?: string)",
        "prototype": {
          "!stdProto": "RegExp",
          "exec": {
            "!type": "fn(input: string) -> [string]",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/exec",
            "!doc": "Executes a search for a match in a specified string. Returns a result array, or null."
          },
          "test": {
            "!type": "fn(input: string) -> bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/test",
            "!doc": "Executes the search for a match between a regular expression and a specified string. Returns true or false."
          },
          "global": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp",
            "!doc": "Creates a regular expression object for matching text with a pattern."
          },
          "ignoreCase": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp",
            "!doc": "Creates a regular expression object for matching text with a pattern."
          },
          "multiline": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/multiline",
            "!doc": "Reflects whether or not to search in strings across multiple lines.\n"
          },
          "source": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/source",
            "!doc": "A read-only property that contains the text of the pattern, excluding the forward slashes.\n"
          },
          "lastIndex": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/lastIndex",
            "!doc": "A read/write integer property that specifies the index at which to start the next match."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp",
        "!doc": "Creates a regular expression object for matching text with a pattern."
      },
      "Date": {
        "!type": "fn(ms: number)",
        "parse": {
          "!type": "fn(source: string) -> +Date",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/parse",
          "!doc": "Parses a string representation of a date, and returns the number of milliseconds since January 1, 1970, 00:00:00 UTC."
        },
        "UTC": {
          "!type": "fn(year: number, month: number, date: number, hour?: number, min?: number, sec?: number, ms?: number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/UTC",
          "!doc": "Accepts the same parameters as the longest form of the constructor, and returns the number of milliseconds in a Date object since January 1, 1970, 00:00:00, universal time."
        },
        "now": {
          "!type": "fn() -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/now",
          "!doc": "Returns the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC."
        },
        "prototype": {
          "toUTCString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toUTCString",
            "!doc": "Converts a date to a string, using the universal time convention."
          },
          "toISOString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toISOString",
            "!doc": "JavaScript provides a direct way to convert a date object into a string in ISO format, the ISO 8601 Extended Format."
          },
          "toDateString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toDateString",
            "!doc": "Returns the date portion of a Date object in human readable form in American English."
          },
          "toTimeString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toTimeString",
            "!doc": "Returns the time portion of a Date object in human readable form in American English."
          },
          "toLocaleDateString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toLocaleDateString",
            "!doc": "Converts a date to a string, returning the \"date\" portion using the operating system's locale's conventions.\n"
          },
          "toLocaleTimeString": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString",
            "!doc": "Converts a date to a string, returning the \"time\" portion using the current locale's conventions."
          },
          "getTime": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getTime",
            "!doc": "Returns the numeric value corresponding to the time for the specified date according to universal time."
          },
          "getFullYear": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getFullYear",
            "!doc": "Returns the year of the specified date according to local time."
          },
          "getYear": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getYear",
            "!doc": "Returns the year in the specified date according to local time."
          },
          "getMonth": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getMonth",
            "!doc": "Returns the month in the specified date according to local time."
          },
          "getUTCMonth": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCMonth",
            "!doc": "Returns the month of the specified date according to universal time.\n"
          },
          "getDate": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getDate",
            "!doc": "Returns the day of the month for the specified date according to local time."
          },
          "getUTCDate": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCDate",
            "!doc": "Returns the day (date) of the month in the specified date according to universal time.\n"
          },
          "getDay": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getDay",
            "!doc": "Returns the day of the week for the specified date according to local time."
          },
          "getUTCDay": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCDay",
            "!doc": "Returns the day of the week in the specified date according to universal time.\n"
          },
          "getHours": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getHours",
            "!doc": "Returns the hour for the specified date according to local time."
          },
          "getUTCHours": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCHours",
            "!doc": "Returns the hours in the specified date according to universal time.\n"
          },
          "getMinutes": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getMinutes",
            "!doc": "Returns the minutes in the specified date according to local time."
          },
          "getUTCMinutes": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date",
            "!doc": "Creates JavaScript Date instances which let you work with dates and times."
          },
          "getSeconds": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getSeconds",
            "!doc": "Returns the seconds in the specified date according to local time."
          },
          "getUTCSeconds": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCSeconds",
            "!doc": "Returns the seconds in the specified date according to universal time.\n"
          },
          "getMilliseconds": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getMilliseconds",
            "!doc": "Returns the milliseconds in the specified date according to local time."
          },
          "getUTCMilliseconds": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getUTCMilliseconds",
            "!doc": "Returns the milliseconds in the specified date according to universal time.\n"
          },
          "getTimezoneOffset": {
            "!type": "fn() -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset",
            "!doc": "Returns the time-zone offset from UTC, in minutes, for the current locale."
          },
          "setTime": {
            "!type": "fn(date: +Date) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setTime",
            "!doc": "Sets the Date object to the time represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC.\n"
          },
          "setFullYear": {
            "!type": "fn(year: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setFullYear",
            "!doc": "Sets the full year for a specified date according to local time.\n"
          },
          "setUTCFullYear": {
            "!type": "fn(year: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCFullYear",
            "!doc": "Sets the full year for a specified date according to universal time.\n"
          },
          "setMonth": {
            "!type": "fn(month: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setMonth",
            "!doc": "Set the month for a specified date according to local time."
          },
          "setUTCMonth": {
            "!type": "fn(month: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCMonth",
            "!doc": "Sets the month for a specified date according to universal time.\n"
          },
          "setDate": {
            "!type": "fn(day: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setDate",
            "!doc": "Sets the day of the month for a specified date according to local time."
          },
          "setUTCDate": {
            "!type": "fn(day: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCDate",
            "!doc": "Sets the day of the month for a specified date according to universal time.\n"
          },
          "setHours": {
            "!type": "fn(hour: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setHours",
            "!doc": "Sets the hours for a specified date according to local time, and returns the number of milliseconds since 1 January 1970 00:00:00 UTC until the time represented by the updated Date instance."
          },
          "setUTCHours": {
            "!type": "fn(hour: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCHours",
            "!doc": "Sets the hour for a specified date according to universal time.\n"
          },
          "setMinutes": {
            "!type": "fn(min: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setMinutes",
            "!doc": "Sets the minutes for a specified date according to local time."
          },
          "setUTCMinutes": {
            "!type": "fn(min: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCMinutes",
            "!doc": "Sets the minutes for a specified date according to universal time.\n"
          },
          "setSeconds": {
            "!type": "fn(sec: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setSeconds",
            "!doc": "Sets the seconds for a specified date according to local time."
          },
          "setUTCSeconds": {
            "!type": "fn(sec: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCSeconds",
            "!doc": "Sets the seconds for a specified date according to universal time.\n"
          },
          "setMilliseconds": {
            "!type": "fn(ms: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setMilliseconds",
            "!doc": "Sets the milliseconds for a specified date according to local time.\n"
          },
          "setUTCMilliseconds": {
            "!type": "fn(ms: number) -> number",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/setUTCMilliseconds",
            "!doc": "Sets the milliseconds for a specified date according to universal time.\n"
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date",
        "!doc": "Creates JavaScript Date instances which let you work with dates and times."
      },
      "Error": {
        "!type": "fn(message: string)",
        "prototype": {
          "name": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error/name",
            "!doc": "A name for the type of error."
          },
          "message": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error/message",
            "!doc": "A human-readable description of the error."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error",
        "!doc": "Creates an error object."
      },
      "SyntaxError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/SyntaxError",
        "!doc": "Represents an error when trying to interpret syntactically invalid code."
      },
      "ReferenceError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/ReferenceError",
        "!doc": "Represents an error when a non-existent variable is referenced."
      },
      "URIError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/URIError",
        "!doc": "Represents an error when a malformed URI is encountered."
      },
      "EvalError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/EvalError",
        "!doc": "Represents an error regarding the eval function."
      },
      "RangeError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RangeError",
        "!doc": "Represents an error when a number is not within the correct range allowed."
      },
      "TypeError": {
        "!type": "fn(message: string)",
        "prototype": "Error.prototype",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/TypeError",
        "!doc": "Represents an error an error when a value is not of the expected type."
      },
      "parseInt": {
        "!type": "fn(string: string, radix?: number) -> number",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/parseInt",
        "!doc": "Parses a string argument and returns an integer of the specified radix or base."
      },
      "parseFloat": {
        "!type": "fn(string: string) -> number",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/parseFloat",
        "!doc": "Parses a string argument and returns a floating point number."
      },
      "isNaN": {
        "!type": "fn(value: number) -> bool",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/isNaN",
        "!doc": "Determines whether a value is NaN or not. Be careful, this function is broken. You may be interested in ECMAScript 6 Number.isNaN."
      },
      "isFinite": {
        "!type": "fn(value: number) -> bool",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/isFinite",
        "!doc": "Determines whether the passed value is a finite number."
      },
      "eval": {
        "!type": "fn(code: string) -> ?",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/eval",
        "!doc": "Evaluates JavaScript code represented as a string."
      },
      "encodeURI": {
        "!type": "fn(uri: string) -> string",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURI",
        "!doc": "Encodes a Uniform Resource Identifier (URI) by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character (will only be four escape sequences for characters composed of two \"surrogate\" characters)."
      },
      "encodeURIComponent": {
        "!type": "fn(uri: string) -> string",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURIComponent",
        "!doc": "Encodes a Uniform Resource Identifier (URI) component by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character (will only be four escape sequences for characters composed of two \"surrogate\" characters)."
      },
      "decodeURI": {
        "!type": "fn(uri: string) -> string",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/decodeURI",
        "!doc": "Decodes a Uniform Resource Identifier (URI) previously created by encodeURI or by a similar routine."
      },
      "decodeURIComponent": {
        "!type": "fn(uri: string) -> string",
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/decodeURIComponent",
        "!doc": "Decodes a Uniform Resource Identifier (URI) component previously created by encodeURIComponent or by a similar routine."
      },
      "Math": {
        "E": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/E",
          "!doc": "The base of natural logarithms, e, approximately 2.718."
        },
        "LN2": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/LN2",
          "!doc": "The natural logarithm of 2, approximately 0.693."
        },
        "LN10": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/LN10",
          "!doc": "The natural logarithm of 10, approximately 2.302."
        },
        "LOG2E": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/LOG2E",
          "!doc": "The base 2 logarithm of E (approximately 1.442)."
        },
        "LOG10E": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/LOG10E",
          "!doc": "The base 10 logarithm of E (approximately 0.434)."
        },
        "SQRT1_2": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/SQRT1_2",
          "!doc": "The square root of 1/2; equivalently, 1 over the square root of 2, approximately 0.707."
        },
        "SQRT2": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/SQRT2",
          "!doc": "The square root of 2, approximately 1.414."
        },
        "PI": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/PI",
          "!doc": "The ratio of the circumference of a circle to its diameter, approximately 3.14159."
        },
        "abs": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/abs",
          "!doc": "Returns the absolute value of a number."
        },
        "cos": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/cos",
          "!doc": "Returns the cosine of a number."
        },
        "sin": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/sin",
          "!doc": "Returns the sine of a number."
        },
        "tan": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/tan",
          "!doc": "Returns the tangent of a number."
        },
        "acos": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/acos",
          "!doc": "Returns the arccosine (in radians) of a number."
        },
        "asin": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/asin",
          "!doc": "Returns the arcsine (in radians) of a number."
        },
        "atan": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/atan",
          "!doc": "Returns the arctangent (in radians) of a number."
        },
        "atan2": {
          "!type": "fn(y: number, x: number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/atan2",
          "!doc": "Returns the arctangent of the quotient of its arguments."
        },
        "ceil": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/ceil",
          "!doc": "Returns the smallest integer greater than or equal to a number."
        },
        "floor": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/floor",
          "!doc": "Returns the largest integer less than or equal to a number."
        },
        "round": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/round",
          "!doc": "Returns the value of a number rounded to the nearest integer."
        },
        "exp": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/exp",
          "!doc": "Returns Ex, where x is the argument, and E is Euler's constant, the base of the natural logarithms."
        },
        "log": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/log",
          "!doc": "Returns the natural logarithm (base E) of a number."
        },
        "sqrt": {
          "!type": "fn(number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/sqrt",
          "!doc": "Returns the square root of a number."
        },
        "pow": {
          "!type": "fn(number, number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/pow",
          "!doc": "Returns base to the exponent power, that is, baseexponent."
        },
        "max": {
          "!type": "fn(number, number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/max",
          "!doc": "Returns the largest of zero or more numbers."
        },
        "min": {
          "!type": "fn(number, number) -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/min",
          "!doc": "Returns the smallest of zero or more numbers."
        },
        "random": {
          "!type": "fn() -> number",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/random",
          "!doc": "Returns a floating-point, pseudo-random number in the range [0, 1) that is, from 0 (inclusive) up to but not including 1 (exclusive), which you can then scale to your desired range."
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math",
        "!doc": "A built-in object that has properties and methods for mathematical constants and functions."
      },
      "JSON": {
        "parse": {
          "!type": "fn(json: string) -> ?",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse",
          "!doc": "Parse a string as JSON, optionally transforming the value produced by parsing."
        },
        "stringify": {
          "!type": "fn(value: ?) -> string",
          "!url": "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/stringify",
          "!doc": "Convert a value to JSON, optionally replacing values if a replacer function is specified, or optionally including only the specified properties if a replacer array is specified."
        },
        "!url": "https://developer.mozilla.org/en-US/docs/JSON",
        "!doc": "JSON (JavaScript Object Notation) is a data-interchange format.  It closely resembles a subset of JavaScript syntax, although it is not a strict subset. (See JSON in the JavaScript Reference for full details.)  It is useful when writing any kind of JavaScript-based application, including websites and browser extensions.  For example, you might store user information in JSON format in a cookie, or you might store extension preferences in JSON in a string-valued browser preference."
      }
    };

    editor.method('tern-ecma5', function () {
        return def;
    });
});



/* code_editor/tern-defs/tern-browser.js */
editor.once('load', function () {
    var def = {
      "!name": "browser",
      "location": {
        "assign": {
          "!type": "fn(url: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "Load the document at the provided URL."
        },
        "replace": {
          "!type": "fn(url: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "Replace the current document with the one at the provided URL. The difference from the assign() method is that after using replace() the current page will not be saved in session history, meaning the user won't be able to use the Back button to navigate to it."
        },
        "reload": {
          "!type": "fn()",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "Reload the document from the current URL. forceget is a boolean, which, when it is true, causes the page to always be reloaded from the server. If it is false or not specified, the browser may reload the page from its cache."
        },
        "origin": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The origin of the URL."
        },
        "hash": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The part of the URL that follows the # symbol, including the # symbol."
        },
        "search": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The part of the URL that follows the ? symbol, including the ? symbol."
        },
        "pathname": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The path (relative to the host)."
        },
        "port": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The port number of the URL."
        },
        "hostname": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The host name (without the port number or square brackets)."
        },
        "host": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The host name and port number."
        },
        "protocol": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The protocol of the URL."
        },
        "href": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
          "!doc": "The entire URL."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.location",
        "!doc": "Returns a location object with information about the current location of the document. Assigning to the location property changes the current page to the new address."
      },
      "Node": {
        "!type": "fn()",
        "prototype": {
          "parentElement": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.parentElement",
            "!doc": "Returns the DOM node's parent Element, or null if the node either has no parent, or its parent isn't a DOM Element."
          },
          "textContent": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.textContent",
            "!doc": "Gets or sets the text content of a node and its descendants."
          },
          "baseURI": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.baseURI",
            "!doc": "The absolute base URI of a node or null if unable to obtain an absolute URI."
          },
          "localName": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.localName",
            "!doc": "Returns the local part of the qualified name of this node."
          },
          "prefix": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.prefix",
            "!doc": "Returns the namespace prefix of the specified node, or null if no prefix is specified. This property is read only."
          },
          "namespaceURI": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.namespaceURI",
            "!doc": "The namespace URI of the node, or null if the node is not in a namespace (read-only). When the node is a document, it returns the XML namespace for the current document."
          },
          "ownerDocument": {
            "!type": "+Document",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.ownerDocument",
            "!doc": "The ownerDocument property returns the top-level document object for this node."
          },
          "attributes": {
            "!type": "+NamedNodeMap",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.attributes",
            "!doc": "A collection of all attribute nodes registered to the specified node. It is a NamedNodeMap,not an Array, so it has no Array methods and the Attr nodes' indexes may differ among browsers."
          },
          "nextSibling": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.nextSibling",
            "!doc": "Returns the node immediately following the specified one in its parent's childNodes list, or null if the specified node is the last node in that list."
          },
          "previousSibling": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.previousSibling",
            "!doc": "Returns the node immediately preceding the specified one in its parent's childNodes list, null if the specified node is the first in that list."
          },
          "lastChild": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.lastChild",
            "!doc": "Returns the last child of a node."
          },
          "firstChild": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.firstChild",
            "!doc": "Returns the node's first child in the tree, or null if the node is childless. If the node is a Document, it returns the first node in the list of its direct children."
          },
          "childNodes": {
            "!type": "+NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.childNodes",
            "!doc": "Returns a collection of child nodes of the given element."
          },
          "parentNode": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.parentNode",
            "!doc": "Returns the parent of the specified node in the DOM tree."
          },
          "nodeType": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.nodeType",
            "!doc": "Returns an integer code representing the type of the node."
          },
          "nodeValue": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.nodeValue",
            "!doc": "Returns or sets the value of the current node."
          },
          "nodeName": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.nodeName",
            "!doc": "Returns the name of the current node as a string."
          },
          "tagName": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.nodeName",
            "!doc": "Returns the name of the current node as a string."
          },
          "insertBefore": {
            "!type": "fn(newElt: +Element, before: +Element) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.insertBefore",
            "!doc": "Inserts the specified node before a reference element as a child of the current node."
          },
          "replaceChild": {
            "!type": "fn(newElt: +Element, oldElt: +Element) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.replaceChild",
            "!doc": "Replaces one child node of the specified element with another."
          },
          "removeChild": {
            "!type": "fn(oldElt: +Element) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.removeChild",
            "!doc": "Removes a child node from the DOM. Returns removed node."
          },
          "appendChild": {
            "!type": "fn(newElt: +Element) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.appendChild",
            "!doc": "Adds a node to the end of the list of children of a specified parent node. If the node already exists it is removed from current parent node, then added to new parent node."
          },
          "hasChildNodes": {
            "!type": "fn() -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.hasChildNodes",
            "!doc": "Returns a Boolean value indicating whether the current Node has child nodes or not."
          },
          "cloneNode": {
            "!type": "fn(deep: bool) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.cloneNode",
            "!doc": "Returns a duplicate of the node on which this method was called."
          },
          "normalize": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.normalize",
            "!doc": "Puts the specified node and all of its subtree into a \"normalized\" form. In a normalized subtree, no text nodes in the subtree are empty and there are no adjacent text nodes."
          },
          "isSupported": {
            "!type": "fn(features: string, version: number) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.isSupported",
            "!doc": "Tests whether the DOM implementation implements a specific feature and that feature is supported by this node."
          },
          "hasAttributes": {
            "!type": "fn() -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.hasAttributes",
            "!doc": "Returns a boolean value of true or false, indicating if the current element has any attributes or not."
          },
          "lookupPrefix": {
            "!type": "fn(uri: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.lookupPrefix",
            "!doc": "Returns the prefix for a given namespaceURI if present, and null if not. When multiple prefixes are possible, the result is implementation-dependent."
          },
          "isDefaultNamespace": {
            "!type": "fn(uri: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.isDefaultNamespace",
            "!doc": "Accepts a namespace URI as an argument and returns true if the namespace is the default namespace on the given node or false if not."
          },
          "lookupNamespaceURI": {
            "!type": "fn(uri: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.lookupNamespaceURI",
            "!doc": "Takes a prefix and returns the namespaceURI associated with it on the given node if found (and null if not). Supplying null for the prefix will return the default namespace."
          },
          "addEventListener": {
            "!type": "fn(type: string, listener: fn(e: +Event), capture: bool)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.addEventListener",
            "!doc": "Registers a single event listener on a single target. The event target may be a single element in a document, the document itself, a window, or an XMLHttpRequest."
          },
          "removeEventListener": {
            "!type": "fn(type: string, listener: fn(), capture: bool)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.removeEventListener",
            "!doc": "Allows the removal of event listeners from the event target."
          },
          "isSameNode": {
            "!type": "fn(other: +Node) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.isSameNode",
            "!doc": "Tests whether two nodes are the same, that is they reference the same object."
          },
          "isEqualNode": {
            "!type": "fn(other: +Node) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.isEqualNode",
            "!doc": "Tests whether two nodes are equal."
          },
          "compareDocumentPosition": {
            "!type": "fn(other: +Node) -> number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.compareDocumentPosition",
            "!doc": "Compares the position of the current node against another node in any other document."
          },
          "contains": {
            "!type": "fn(other: +Node) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Node.contains",
            "!doc": "Indicates whether a node is a descendent of a given node."
          },
          "dispatchEvent": {
            "!type": "fn(event: +Event) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.dispatchEvent",
            "!doc": "Dispatches an event into the event system. The event is subject to the same capturing and bubbling behavior as directly dispatched events."
          },
          "ELEMENT_NODE": "number",
          "ATTRIBUTE_NODE": "number",
          "TEXT_NODE": "number",
          "CDATA_SECTION_NODE": "number",
          "ENTITY_REFERENCE_NODE": "number",
          "ENTITY_NODE": "number",
          "PROCESSING_INSTRUCTION_NODE": "number",
          "COMMENT_NODE": "number",
          "DOCUMENT_NODE": "number",
          "DOCUMENT_TYPE_NODE": "number",
          "DOCUMENT_FRAGMENT_NODE": "number",
          "NOTATION_NODE": "number",
          "DOCUMENT_POSITION_DISCONNECTED": "number",
          "DOCUMENT_POSITION_PRECEDING": "number",
          "DOCUMENT_POSITION_FOLLOWING": "number",
          "DOCUMENT_POSITION_CONTAINS": "number",
          "DOCUMENT_POSITION_CONTAINED_BY": "number",
          "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC": "number"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Node",
        "!doc": "A Node is an interface from which a number of DOM types inherit, and allows these various types to be treated (or tested) similarly."
      },
      "Element": {
        "!type": "fn()",
        "prototype": {
          "!proto": "Node.prototype",
          "getAttribute": {
            "!type": "fn(name: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getAttribute",
            "!doc": "Returns the value of the named attribute on the specified element. If the named attribute does not exist, the value returned will either be null or \"\" (the empty string)."
          },
          "setAttribute": {
            "!type": "fn(name: string, value: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.setAttribute",
            "!doc": "Adds a new attribute or changes the value of an existing attribute on the specified element."
          },
          "removeAttribute": {
            "!type": "fn(name: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.removeAttribute",
            "!doc": "Removes an attribute from the specified element."
          },
          "getAttributeNode": {
            "!type": "fn(name: string) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getAttributeNode",
            "!doc": "Returns the specified attribute of the specified element, as an Attr node."
          },
          "getElementsByTagName": {
            "!type": "fn(tagName: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getElementsByTagName",
            "!doc": "Returns a list of elements with the given tag name. The subtree underneath the specified element is searched, excluding the element itself. The returned list is live, meaning that it updates itself with the DOM tree automatically. Consequently, there is no need to call several times element.getElementsByTagName with the same element and arguments."
          },
          "getElementsByTagNameNS": {
            "!type": "fn(ns: string, tagName: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getElementsByTagNameNS",
            "!doc": "Returns a list of elements with the given tag name belonging to the given namespace."
          },
          "getAttributeNS": {
            "!type": "fn(ns: string, name: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getAttributeNS",
            "!doc": "Returns the string value of the attribute with the specified namespace and name. If the named attribute does not exist, the value returned will either be null or \"\" (the empty string)."
          },
          "setAttributeNS": {
            "!type": "fn(ns: string, name: string, value: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.setAttributeNS",
            "!doc": "Adds a new attribute or changes the value of an attribute with the given namespace and name."
          },
          "removeAttributeNS": {
            "!type": "fn(ns: string, name: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.removeAttributeNS",
            "!doc": "removeAttributeNS removes the specified attribute from an element."
          },
          "getAttributeNodeNS": {
            "!type": "fn(ns: string, name: string) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getAttributeNodeNS",
            "!doc": "Returns the Attr node for the attribute with the given namespace and name."
          },
          "hasAttribute": {
            "!type": "fn(name: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.hasAttribute",
            "!doc": "hasAttribute returns a boolean value indicating whether the specified element has the specified attribute or not."
          },
          "hasAttributeNS": {
            "!type": "fn(ns: string, name: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.hasAttributeNS",
            "!doc": "hasAttributeNS returns a boolean value indicating whether the current element has the specified attribute."
          },
          "focus": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.focus",
            "!doc": "Sets focus on the specified element, if it can be focused."
          },
          "blur": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.blur",
            "!doc": "The blur method removes keyboard focus from the current element."
          },
          "scrollIntoView": {
            "!type": "fn(top: bool)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.scrollIntoView",
            "!doc": "The scrollIntoView() method scrolls the element into view."
          },
          "scrollByLines": {
            "!type": "fn(lines: number)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollByLines",
            "!doc": "Scrolls the document by the given number of lines."
          },
          "scrollByPages": {
            "!type": "fn(pages: number)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollByPages",
            "!doc": "Scrolls the current document by the specified number of pages."
          },
          "getElementsByClassName": {
            "!type": "fn(name: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getElementsByClassName",
            "!doc": "Returns a set of elements which have all the given class names. When called on the document object, the complete document is searched, including the root node. You may also call getElementsByClassName on any element; it will return only elements which are descendants of the specified root element with the given class names."
          },
          "querySelector": {
            "!type": "fn(selectors: string) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.querySelector",
            "!doc": "Returns the first element that is a descendent of the element on which it is invoked that matches the specified group of selectors."
          },
          "querySelectorAll": {
            "!type": "fn(selectors: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.querySelectorAll",
            "!doc": "Returns a non-live NodeList of all elements descended from the element on which it is invoked that match the specified group of CSS selectors."
          },
          "getClientRects": {
            "!type": "fn() -> [+ClientRect]",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
            "!doc": "Returns a collection of rectangles that indicate the bounding rectangles for each box in a client."
          },
          "getBoundingClientRect": {
            "!type": "fn() -> +ClientRect",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getBoundingClientRect",
            "!doc": "Returns a text rectangle object that encloses a group of text rectangles."
          },
          "setAttributeNode": {
            "!type": "fn(attr: +Attr) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.setAttributeNode",
            "!doc": "Adds a new Attr node to the specified element."
          },
          "removeAttributeNode": {
            "!type": "fn(attr: +Attr) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.removeAttributeNode",
            "!doc": "Removes the specified attribute from the current element."
          },
          "setAttributeNodeNS": {
            "!type": "fn(attr: +Attr) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.setAttributeNodeNS",
            "!doc": "Adds a new namespaced attribute node to an element."
          },
          "insertAdjacentHTML": {
            "!type": "fn(position: string, text: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.insertAdjacentHTML",
            "!doc": "Parses the specified text as HTML or XML and inserts the resulting nodes into the DOM tree at a specified position. It does not reparse the element it is being used on and thus it does not corrupt the existing elements inside the element. This, and avoiding the extra step of serialization make it much faster than direct innerHTML manipulation."
          },
          "children": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.children",
            "!doc": "Returns a collection of child elements of the given element."
          },
          "childElementCount": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.childElementCount",
            "!doc": "Returns the number of child elements of the given element."
          },
          "className": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.className",
            "!doc": "Gets and sets the value of the class attribute of the specified element."
          },
          "style": {
            "cssText": "string",
            "alignmentBaseline": "string",
            "background": "string",
            "backgroundAttachment": "string",
            "backgroundClip": "string",
            "backgroundColor": "string",
            "backgroundImage": "string",
            "backgroundOrigin": "string",
            "backgroundPosition": "string",
            "backgroundPositionX": "string",
            "backgroundPositionY": "string",
            "backgroundRepeat": "string",
            "backgroundRepeatX": "string",
            "backgroundRepeatY": "string",
            "backgroundSize": "string",
            "baselineShift": "string",
            "border": "string",
            "borderBottom": "string",
            "borderBottomColor": "string",
            "borderBottomLeftRadius": "string",
            "borderBottomRightRadius": "string",
            "borderBottomStyle": "string",
            "borderBottomWidth": "string",
            "borderCollapse": "string",
            "borderColor": "string",
            "borderImage": "string",
            "borderImageOutset": "string",
            "borderImageRepeat": "string",
            "borderImageSlice": "string",
            "borderImageSource": "string",
            "borderImageWidth": "string",
            "borderLeft": "string",
            "borderLeftColor": "string",
            "borderLeftStyle": "string",
            "borderLeftWidth": "string",
            "borderRadius": "string",
            "borderRight": "string",
            "borderRightColor": "string",
            "borderRightStyle": "string",
            "borderRightWidth": "string",
            "borderSpacing": "string",
            "borderStyle": "string",
            "borderTop": "string",
            "borderTopColor": "string",
            "borderTopLeftRadius": "string",
            "borderTopRightRadius": "string",
            "borderTopStyle": "string",
            "borderTopWidth": "string",
            "borderWidth": "string",
            "bottom": "string",
            "boxShadow": "string",
            "boxSizing": "string",
            "captionSide": "string",
            "clear": "string",
            "clip": "string",
            "clipPath": "string",
            "clipRule": "string",
            "color": "string",
            "colorInterpolation": "string",
            "colorInterpolationFilters": "string",
            "colorProfile": "string",
            "colorRendering": "string",
            "content": "string",
            "counterIncrement": "string",
            "counterReset": "string",
            "cursor": "string",
            "direction": "string",
            "display": "string",
            "dominantBaseline": "string",
            "emptyCells": "string",
            "enableBackground": "string",
            "fill": "string",
            "fillOpacity": "string",
            "fillRule": "string",
            "filter": "string",
            "float": "string",
            "floodColor": "string",
            "floodOpacity": "string",
            "font": "string",
            "fontFamily": "string",
            "fontSize": "string",
            "fontStretch": "string",
            "fontStyle": "string",
            "fontVariant": "string",
            "fontWeight": "string",
            "glyphOrientationHorizontal": "string",
            "glyphOrientationVertical": "string",
            "height": "string",
            "imageRendering": "string",
            "kerning": "string",
            "left": "string",
            "letterSpacing": "string",
            "lightingColor": "string",
            "lineHeight": "string",
            "listStyle": "string",
            "listStyleImage": "string",
            "listStylePosition": "string",
            "listStyleType": "string",
            "margin": "string",
            "marginBottom": "string",
            "marginLeft": "string",
            "marginRight": "string",
            "marginTop": "string",
            "marker": "string",
            "markerEnd": "string",
            "markerMid": "string",
            "markerStart": "string",
            "mask": "string",
            "maxHeight": "string",
            "maxWidth": "string",
            "minHeight": "string",
            "minWidth": "string",
            "opacity": "string",
            "orphans": "string",
            "outline": "string",
            "outlineColor": "string",
            "outlineOffset": "string",
            "outlineStyle": "string",
            "outlineWidth": "string",
            "overflow": "string",
            "overflowWrap": "string",
            "overflowX": "string",
            "overflowY": "string",
            "padding": "string",
            "paddingBottom": "string",
            "paddingLeft": "string",
            "paddingRight": "string",
            "paddingTop": "string",
            "page": "string",
            "pageBreakAfter": "string",
            "pageBreakBefore": "string",
            "pageBreakInside": "string",
            "pointerEvents": "string",
            "position": "string",
            "quotes": "string",
            "resize": "string",
            "right": "string",
            "shapeRendering": "string",
            "size": "string",
            "speak": "string",
            "src": "string",
            "stopColor": "string",
            "stopOpacity": "string",
            "stroke": "string",
            "strokeDasharray": "string",
            "strokeDashoffset": "string",
            "strokeLinecap": "string",
            "strokeLinejoin": "string",
            "strokeMiterlimit": "string",
            "strokeOpacity": "string",
            "strokeWidth": "string",
            "tabSize": "string",
            "tableLayout": "string",
            "textAlign": "string",
            "textAnchor": "string",
            "textDecoration": "string",
            "textIndent": "string",
            "textLineThrough": "string",
            "textLineThroughColor": "string",
            "textLineThroughMode": "string",
            "textLineThroughStyle": "string",
            "textLineThroughWidth": "string",
            "textOverflow": "string",
            "textOverline": "string",
            "textOverlineColor": "string",
            "textOverlineMode": "string",
            "textOverlineStyle": "string",
            "textOverlineWidth": "string",
            "textRendering": "string",
            "textShadow": "string",
            "textTransform": "string",
            "textUnderline": "string",
            "textUnderlineColor": "string",
            "textUnderlineMode": "string",
            "textUnderlineStyle": "string",
            "textUnderlineWidth": "string",
            "top": "string",
            "unicodeBidi": "string",
            "unicodeRange": "string",
            "vectorEffect": "string",
            "verticalAlign": "string",
            "visibility": "string",
            "whiteSpace": "string",
            "width": "string",
            "wordBreak": "string",
            "wordSpacing": "string",
            "wordWrap": "string",
            "writingMode": "string",
            "zIndex": "string",
            "zoom": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.style",
            "!doc": "Returns an object that represents the element's style attribute."
          },
          "classList": {
            "!type": "+DOMTokenList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.classList",
            "!doc": "Returns a token list of the class attribute of the element."
          },
          "contentEditable": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.contentEditable",
            "!doc": "Indicates whether or not the element is editable."
          },
          "firstElementChild": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.firstElementChild",
            "!doc": "Returns the element's first child element or null if there are no child elements."
          },
          "lastElementChild": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.lastElementChild",
            "!doc": "Returns the element's last child element or null if there are no child elements."
          },
          "nextElementSibling": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.nextElementSibling",
            "!doc": "Returns the element immediately following the specified one in its parent's children list, or null if the specified element is the last one in the list."
          },
          "previousElementSibling": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Element.previousElementSibling",
            "!doc": "Returns the element immediately prior to the specified one in its parent's children list, or null if the specified element is the first one in the list."
          },
          "tabIndex": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.tabIndex",
            "!doc": "Gets/sets the tab order of the current element."
          },
          "title": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.title",
            "!doc": "Establishes the text to be displayed in a 'tool tip' popup when the mouse is over the displayed node."
          },
          "width": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetWidth",
            "!doc": "Returns the layout width of an element."
          },
          "height": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetHeight",
            "!doc": "Height of an element relative to the element's offsetParent."
          },
          "getContext": {
            "!type": "fn(id: string) -> CanvasRenderingContext2D",
            "!url": "https://developer.mozilla.org/en/docs/DOM/HTMLCanvasElement",
            "!doc": "DOM canvas elements expose the HTMLCanvasElement interface, which provides properties and methods for manipulating the layout and presentation of canvas elements. The HTMLCanvasElement interface inherits the properties and methods of the element object interface."
          },
          "supportsContext": "fn(id: string) -> bool",
          "oncopy": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.oncopy",
            "!doc": "The oncopy property returns the onCopy event handler code on the current element."
          },
          "oncut": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.oncut",
            "!doc": "The oncut property returns the onCut event handler code on the current element."
          },
          "onpaste": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onpaste",
            "!doc": "The onpaste property returns the onPaste event handler code on the current element."
          },
          "onbeforeunload": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/HTML/Element/body",
            "!doc": "The HTML <body> element represents the main content of an HTML document. There is only one <body> element in a document."
          },
          "onfocus": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onfocus",
            "!doc": "The onfocus property returns the onFocus event handler code on the current element."
          },
          "onblur": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onblur",
            "!doc": "The onblur property returns the onBlur event handler code, if any, that exists on the current element."
          },
          "onchange": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onchange",
            "!doc": "The onchange property sets and returns the onChange event handler code for the current element."
          },
          "onclick": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onclick",
            "!doc": "The onclick property returns the onClick event handler code on the current element."
          },
          "ondblclick": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.ondblclick",
            "!doc": "The ondblclick property returns the onDblClick event handler code on the current element."
          },
          "onmousedown": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmousedown",
            "!doc": "The onmousedown property returns the onMouseDown event handler code on the current element."
          },
          "onmouseup": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmouseup",
            "!doc": "The onmouseup property returns the onMouseUp event handler code on the current element."
          },
          "onmousewheel": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/wheel",
            "!doc": "The wheel event is fired when a wheel button of a pointing device (usually a mouse) is rotated. This event deprecates the legacy mousewheel event."
          },
          "onmouseover": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmouseover",
            "!doc": "The onmouseover property returns the onMouseOver event handler code on the current element."
          },
          "onmouseout": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmouseout",
            "!doc": "The onmouseout property returns the onMouseOut event handler code on the current element."
          },
          "onmousemove": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmousemove",
            "!doc": "The onmousemove property returns the mousemove event handler code on the current element."
          },
          "oncontextmenu": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/window.oncontextmenu",
            "!doc": "An event handler property for right-click events on the window. Unless the default behavior is prevented, the browser context menu will activate. Note that this event will occur with any non-disabled right-click event and does not depend on an element possessing the \"contextmenu\" attribute."
          },
          "onkeydown": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onkeydown",
            "!doc": "The onkeydown property returns the onKeyDown event handler code on the current element."
          },
          "onkeyup": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onkeyup",
            "!doc": "The onkeyup property returns the onKeyUp event handler code for the current element."
          },
          "onkeypress": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onkeypress",
            "!doc": "The onkeypress property sets and returns the onKeyPress event handler code for the current element."
          },
          "onresize": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onresize",
            "!doc": "onresize returns the element's onresize event handler code. It can also be used to set the code to be executed when the resize event occurs."
          },
          "onscroll": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.onscroll",
            "!doc": "The onscroll property returns the onScroll event handler code on the current element."
          },
          "ondragstart": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
            "!doc": "The following describes the steps that occur during a drag and drop operation."
          },
          "ondragover": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/dragover",
            "!doc": "The dragover event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds)."
          },
          "ondragleave": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/dragleave",
            "!doc": "The dragleave event is fired when a dragged element or text selection leaves a valid drop target."
          },
          "ondragenter": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/dragenter",
            "!doc": "The dragenter event is fired when a dragged element or text selection enters a valid drop target."
          },
          "ondragend": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/dragend",
            "!doc": "The dragend event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key)."
          },
          "ondrag": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Mozilla_event_reference/drag",
            "!doc": "The drag event is fired when an element or text selection is being dragged (every few hundred milliseconds)."
          },
          "offsetTop": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetTop",
            "!doc": "Returns the distance of the current element relative to the top of the offsetParent node."
          },
          "offsetLeft": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetLeft",
            "!doc": "Returns the number of pixels that the upper left corner of the current element is offset to the left within the offsetParent node."
          },
          "offsetHeight": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetHeight",
            "!doc": "Height of an element relative to the element's offsetParent."
          },
          "offsetWidth": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.offsetWidth",
            "!doc": "Returns the layout width of an element."
          },
          "scrollTop": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.scrollTop",
            "!doc": "Gets or sets the number of pixels that the content of an element is scrolled upward."
          },
          "scrollLeft": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.scrollLeft",
            "!doc": "Gets or sets the number of pixels that an element's content is scrolled to the left."
          },
          "scrollHeight": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.scrollHeight",
            "!doc": "Height of the scroll view of an element; it includes the element padding but not its margin."
          },
          "scrollWidth": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.scrollWidth",
            "!doc": "Read-only property that returns either the width in pixels of the content of an element or the width of the element itself, whichever is greater."
          },
          "clientTop": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.clientTop",
            "!doc": "The width of the top border of an element in pixels. It does not include the top margin or padding. clientTop is read-only."
          },
          "clientLeft": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.clientLeft",
            "!doc": "The width of the left border of an element in pixels. It includes the width of the vertical scrollbar if the text direction of the element is right-to-left and if there is an overflow causing a left vertical scrollbar to be rendered. clientLeft does not include the left margin or the left padding. clientLeft is read-only."
          },
          "clientHeight": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.clientHeight",
            "!doc": "Returns the inner height of an element in pixels, including padding but not the horizontal scrollbar height, border, or margin."
          },
          "clientWidth": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.clientWidth",
            "!doc": "The inner width of an element in pixels. It includes padding but not the vertical scrollbar (if present, if rendered), border or margin."
          },
          "innerHTML": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.innerHTML",
            "!doc": "Sets or gets the HTML syntax describing the element's descendants."
          },
          "createdCallback": {
            "!type": "fn()",
            "!url": "http://w3c.github.io/webcomponents/spec/custom/index.html#dfn-created-callback",
            "!doc": "This callback is invoked after custom element instance is created and its definition is registered. The actual timing of this callback is defined further in this specification."
          },
          "attachedCallback": {
            "!type": "fn()",
            "!url": "http://w3c.github.io/webcomponents/spec/custom/index.html#dfn-entered-view-callback",
            "!doc": "Unless specified otherwise, this callback must be enqueued whenever custom element is inserted into a document and this document has a browsing context."
          },
          "detachedCallback": {
            "!type": "fn()",
            "!url": "http://w3c.github.io/webcomponents/spec/custom/index.html#dfn-left-view-callback",
            "!doc": "Unless specified otherwise, this callback must be enqueued whenever custom element is removed from the document and this document has a browsing context."
          },
          "attributeChangedCallback": {
            "!type": "fn()",
            "!url": "http://w3c.github.io/webcomponents/spec/custom/index.html#dfn-attribute-changed-callback",
            "!doc": "Unless specified otherwise, this callback must be enqueued whenever custom element's attribute is added, changed or removed."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Element",
        "!doc": "Represents an element in an HTML or XML document."
      },
      "Text": {
        "!type": "fn()",
        "prototype": {
          "!proto": "Node.prototype",
          "wholeText": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Text.wholeText",
            "!doc": "Returns all text of all Text nodes logically adjacent to the node.  The text is concatenated in document order.  This allows you to specify any text node and obtain all adjacent text as a single string."
          },
          "splitText": {
            "!type": "fn(offset: number) -> +Text",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Text.splitText",
            "!doc": "Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Text",
        "!doc": "In the DOM, the Text interface represents the textual content of an Element or Attr.  If an element has no markup within its content, it has a single child implementing Text that contains the element's text.  However, if the element contains markup, it is parsed into information items and Text nodes that form its children."
      },
      "Document": {
        "!type": "fn()",
        "prototype": {
          "!proto": "Node.prototype",
          "activeElement": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.activeElement",
            "!doc": "Returns the currently focused element, that is, the element that will get keystroke events if the user types any. This attribute is read only."
          },
          "compatMode": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.compatMode",
            "!doc": "Indicates whether the document is rendered in Quirks mode or Strict mode."
          },
          "designMode": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.designMode",
            "!doc": "Can be used to make any document editable, for example in a <iframe />:"
          },
          "dir": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Document.dir",
            "!doc": "This property should indicate and allow the setting of the directionality of the text of the document, whether left to right (default) or right to left."
          },
          "height": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.height",
            "!doc": "Returns the height of the <body> element of the current document."
          },
          "width": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.width",
            "!doc": "Returns the width of the <body> element of the current document in pixels."
          },
          "characterSet": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.characterSet",
            "!doc": "Returns the character encoding of the current document."
          },
          "readyState": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.readyState",
            "!doc": "Returns \"loading\" while the document is loading, \"interactive\" once it is finished parsing but still loading sub-resources, and \"complete\" once it has loaded."
          },
          "location": {
            "!type": "location",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.location",
            "!doc": "Returns a Location object, which contains information about the URL of the document and provides methods for changing that URL."
          },
          "lastModified": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.lastModified",
            "!doc": "Returns a string containing the date and time on which the current document was last modified."
          },
          "head": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.head",
            "!doc": "Returns the <head> element of the current document. If there are more than one <head> elements, the first one is returned."
          },
          "body": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.body",
            "!doc": "Returns the <body> or <frameset> node of the current document."
          },
          "cookie": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.cookie",
            "!doc": "Get and set the cookies associated with the current document."
          },
          "URL": "string",
          "domain": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.domain",
            "!doc": "Gets/sets the domain portion of the origin of the current document, as used by the same origin policy."
          },
          "referrer": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.referrer",
            "!doc": "Returns the URI of the page that linked to this page."
          },
          "title": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.title",
            "!doc": "Gets or sets the title of the document."
          },
          "defaultView": {
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.defaultView",
            "!doc": "In browsers returns the window object associated with the document or null if none available."
          },
          "documentURI": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.documentURI",
            "!doc": "Returns the document location as string. It is read-only per DOM4 specification."
          },
          "xmlStandalone": "bool",
          "xmlVersion": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.xmlVersion",
            "!doc": "Returns the version number as specified in the XML declaration (e.g., <?xml version=\"1.0\"?>) or \"1.0\" if the declaration is absent."
          },
          "xmlEncoding": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Document.xmlEncoding",
            "!doc": "Returns the encoding as determined by the XML declaration. Should be null if unspecified or unknown."
          },
          "inputEncoding": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.inputEncoding",
            "!doc": "Returns a string representing the encoding under which the document was parsed (e.g. ISO-8859-1)."
          },
          "documentElement": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.documentElement",
            "!doc": "Read-only"
          },
          "implementation": {
            "hasFeature": "fn(feature: string, version: number) -> bool",
            "createDocumentType": {
              "!type": "fn(qualifiedName: string, publicId: string, systemId: string) -> +Node",
              "!url": "https://developer.mozilla.org/en/docs/DOM/DOMImplementation.createDocumentType",
              "!doc": "Returns a DocumentType object which can either be used with DOMImplementation.createDocument upon document creation or they can be put into the document via Node.insertBefore() or Node.replaceChild(): http://www.w3.org/TR/DOM-Level-3-Cor...l#ID-B63ED1A31 (less ideal due to features not likely being as accessible: http://www.w3.org/TR/DOM-Level-3-Cor...createDocument ). In any case, entity declarations and notations will not be available: http://www.w3.org/TR/DOM-Level-3-Cor...-createDocType   "
            },
            "createHTMLDocument": {
              "!type": "fn(title: string) -> +Document",
              "!url": "https://developer.mozilla.org/en/docs/DOM/DOMImplementation.createHTMLDocument",
              "!doc": "This method (available from document.implementation) creates a new HTML document."
            },
            "createDocument": {
              "!type": "fn(namespaceURI: string, qualifiedName: string, type: +Node) -> +Document",
              "!url": "https://developer.mozilla.org/en-US/docs/DOM/DOMImplementation.createHTMLDocument",
              "!doc": "This method creates a new HTML document."
            },
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.implementation",
            "!doc": "Returns a DOMImplementation object associated with the current document."
          },
          "doctype": {
            "!type": "+Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.doctype",
            "!doc": "Returns the Document Type Declaration (DTD) associated with current document. The returned object implements the DocumentType interface. Use DOMImplementation.createDocumentType() to create a DocumentType."
          },
          "open": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.open",
            "!doc": "The document.open() method opens a document for writing."
          },
          "close": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.close",
            "!doc": "The document.close() method finishes writing to a document, opened with document.open()."
          },
          "write": {
            "!type": "fn(html: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.write",
            "!doc": "Writes a string of text to a document stream opened by document.open()."
          },
          "writeln": {
            "!type": "fn(html: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.writeln",
            "!doc": "Writes a string of text followed by a newline character to a document."
          },
          "clear": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.clear",
            "!doc": "In recent versions of Mozilla-based applications as well as in Internet Explorer and Netscape 4 this method does nothing."
          },
          "hasFocus": {
            "!type": "fn() -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.hasFocus",
            "!doc": "Returns a Boolean value indicating whether the document or any element inside the document has focus. This method can be used to determine whether the active element in a document has focus."
          },
          "createElement": {
            "!type": "fn(tagName: string) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createElement",
            "!doc": "Creates the specified element."
          },
          "createElementNS": {
            "!type": "fn(ns: string, tagName: string) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createElementNS",
            "!doc": "Creates an element with the specified namespace URI and qualified name."
          },
          "createDocumentFragment": {
            "!type": "fn() -> +DocumentFragment",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createDocumentFragment",
            "!doc": "Creates a new empty DocumentFragment."
          },
          "createTextNode": {
            "!type": "fn(content: string) -> +Text",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createTextNode",
            "!doc": "Creates a new Text node."
          },
          "createComment": {
            "!type": "fn(content: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createComment",
            "!doc": "Creates a new comment node, and returns it."
          },
          "createCDATASection": {
            "!type": "fn(content: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createCDATASection",
            "!doc": "Creates a new CDATA section node, and returns it. "
          },
          "createProcessingInstruction": {
            "!type": "fn(content: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createProcessingInstruction",
            "!doc": "Creates a new processing instruction node, and returns it."
          },
          "createAttribute": {
            "!type": "fn(name: string) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createAttribute",
            "!doc": "Creates a new attribute node, and returns it."
          },
          "createAttributeNS": {
            "!type": "fn(ns: string, name: string) -> +Attr",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Attr",
            "!doc": "This type represents a DOM element's attribute as an object. In most DOM methods, you will probably directly retrieve the attribute as a string (e.g., Element.getAttribute(), but certain functions (e.g., Element.getAttributeNode()) or means of iterating give Attr types."
          },
          "importNode": {
            "!type": "fn(node: +Node, deep: bool) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.importNode",
            "!doc": "Creates a copy of a node from an external document that can be inserted into the current document."
          },
          "getElementById": {
            "!type": "fn(id: string) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getElementById",
            "!doc": "Returns a reference to the element by its ID."
          },
          "getElementsByTagName": {
            "!type": "fn(tagName: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getElementsByTagName",
            "!doc": "Returns a NodeList of elements with the given tag name. The complete document is searched, including the root node. The returned NodeList is live, meaning that it updates itself automatically to stay in sync with the DOM tree without having to call document.getElementsByTagName again."
          },
          "getElementsByTagNameNS": {
            "!type": "fn(ns: string, tagName: string) -> +NodeList",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getElementsByTagNameNS",
            "!doc": "Returns a list of elements with the given tag name belonging to the given namespace. The complete document is searched, including the root node."
          },
          "createEvent": {
            "!type": "fn(type: string) -> +Event",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createEvent",
            "!doc": "Creates an event of the type specified. The returned object should be first initialized and can then be passed to element.dispatchEvent."
          },
          "createRange": {
            "!type": "fn() -> +Range",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createRange",
            "!doc": "Returns a new Range object."
          },
          "evaluate": {
            "!type": "fn(expr: ?) -> +XPathResult",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.evaluate",
            "!doc": "Returns an XPathResult based on an XPath expression and other given parameters."
          },
          "execCommand": {
            "!type": "fn(cmd: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla#Executing_Commands",
            "!doc": "Run command to manipulate the contents of an editable region."
          },
          "queryCommandEnabled": {
            "!type": "fn(cmd: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document",
            "!doc": "Returns true if the Midas command can be executed on the current range."
          },
          "queryCommandIndeterm": {
            "!type": "fn(cmd: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document",
            "!doc": "Returns true if the Midas command is in a indeterminate state on the current range."
          },
          "queryCommandState": {
            "!type": "fn(cmd: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document",
            "!doc": "Returns true if the Midas command has been executed on the current range."
          },
          "queryCommandSupported": {
            "!type": "fn(cmd: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.queryCommandSupported",
            "!doc": "Reports whether or not the specified editor query command is supported by the browser."
          },
          "queryCommandValue": {
            "!type": "fn(cmd: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document",
            "!doc": "Returns the current value of the current range for Midas command."
          },
          "getElementsByName": {
            "!type": "fn(name: string) -> +HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getElementsByName",
            "!doc": "Returns a list of elements with a given name in the HTML document."
          },
          "elementFromPoint": {
            "!type": "fn(x: number, y: number) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.elementFromPoint",
            "!doc": "Returns the element from the document whose elementFromPoint method is being called which is the topmost element which lies under the given point.  To get an element, specify the point via coordinates, in CSS pixels, relative to the upper-left-most point in the window or frame containing the document."
          },
          "getSelection": {
            "!type": "fn() -> +Selection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.getSelection",
            "!doc": "The DOM getSelection() method is available on the Window and Document interfaces."
          },
          "adoptNode": {
            "!type": "fn(node: +Node) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.adoptNode",
            "!doc": "Adopts a node from an external document. The node and its subtree is removed from the document it's in (if any), and its ownerDocument is changed to the current document. The node can then be inserted into the current document."
          },
          "createTreeWalker": {
            "!type": "fn(root: +Node, mask: number) -> ?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createTreeWalker",
            "!doc": "Returns a new TreeWalker object."
          },
          "createExpression": {
            "!type": "fn(text: string) -> ?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createExpression",
            "!doc": "This method compiles an XPathExpression which can then be used for (repeated) evaluations."
          },
          "createNSResolver": {
            "!type": "fn(node: +Node)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.createNSResolver",
            "!doc": "Creates an XPathNSResolver which resolves namespaces with respect to the definitions in scope for a specified node."
          },
          "scripts": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Document.scripts",
            "!doc": "Returns a list of the <script> elements in the document. The returned object is an HTMLCollection."
          },
          "plugins": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.plugins",
            "!doc": "Returns an HTMLCollection object containing one or more HTMLEmbedElements or null which represent the <embed> elements in the current document."
          },
          "embeds": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.embeds",
            "!doc": "Returns a list of the embedded OBJECTS within the current document."
          },
          "anchors": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.anchors",
            "!doc": "Returns a list of all of the anchors in the document."
          },
          "links": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.links",
            "!doc": "The links property returns a collection of all AREA elements and anchor elements in a document with a value for the href attribute. "
          },
          "forms": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.forms",
            "!doc": "Returns a collection (an HTMLCollection) of the form elements within the current document."
          },
          "styleSheets": {
            "!type": "+HTMLCollection",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.styleSheets",
            "!doc": "Returns a list of stylesheet objects for stylesheets explicitly linked into or embedded in a document."
          },
          "currentScript": {
            "!type": "+Node",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/document.currentScript",
            "!doc": "Returns the <script> element whose script is currently being processed."
          },
          "registerElement": {
            "!type": "fn(type: string, options?: ?)",
            "!url": "http://w3c.github.io/webcomponents/spec/custom/#extensions-to-document-interface-to-register",
            "!doc": "The registerElement method of the Document interface provides a way to register a custom element and returns its custom element constructor."
          },
          "getElementsByClassName": "Element.prototype.getElementsByClassName",
          "querySelector": "Element.prototype.querySelector",
          "querySelectorAll": "Element.prototype.querySelectorAll"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/document",
        "!doc": "Each web page loaded in the browser has its own document object. This object serves as an entry point to the web page's content (the DOM tree, including elements such as <body> and <table>) and provides functionality global to the document (such as obtaining the page's URL and creating new elements in the document)."
      },
      "document": {
        "!type": "+Document",
        "!url": "https://developer.mozilla.org/en/docs/DOM/document",
        "!doc": "Each web page loaded in the browser has its own document object. This object serves as an entry point to the web page's content (the DOM tree, including elements such as <body> and <table>) and provides functionality global to the document (such as obtaining the page's URL and creating new elements in the document)."
      },
      "XMLDocument": {
        "!type": "fn()",
        "prototype": "Document.prototype",
        "!url": "https://developer.mozilla.org/en/docs/Parsing_and_serializing_XML",
        "!doc": "The Web platform provides the following objects for parsing and serializing XML:"
      },
      "HTMLElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement"
      },
      "HTMLAnchorElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement"
      },
      "HTMLAreaElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement"
      },
      "HTMLAudioElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement"
      },
      "HTMLBaseElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLBaseElement"
      },
      "HTMLBodyElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement"
      },
      "HTMLBRElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLBRElement"
      },
      "HTMLButtonElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement"
      },
      "HTMLCanvasElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement"
      },
      "HTMLDataElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataElement"
      },
      "HTMLDataListElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataListElement"
      },
      "HTMLDivElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement"
      },
      "HTMLDListElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDListElement"
      },
      "HTMLDocument": {
        "!type": "Document",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLDocument"
      },
      "HTMLEmbedElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLEmbedElement"
      },
      "HTMLFieldSetElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement"
      },
      "HTMLFormControlsCollection": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection"
      },
      "HTMLFormElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement"
      },
      "HTMLHeadElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadElement"
      },
      "HTMLHeadingElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement"
      },
      "HTMLHRElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLHRElement"
      },
      "HTMLHtmlElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLHtmlElement"
      },
      "HTMLIFrameElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement"
      },
      "HTMLImageElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement"
      },
      "HTMLInputElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement"
      },
      "HTMLKeygenElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLKeygenElement"
      },
      "HTMLLabelElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement"
      },
      "HTMLLegendElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLLegendElement"
      },
      "HTMLLIElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLLIElement"
      },
      "HTMLLinkElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement"
      },
      "HTMLMapElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement"
      },
      "HTMLMediaElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement"
      },
      "HTMLMetaElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLMetaElement"
      },
      "HTMLMeterElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLMeterElement"
      },
      "HTMLModElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement"
      },
      "HTMLObjectElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement"
      },
      "HTMLOListElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLOListElement"
      },
      "HTMLOptGroupElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptGroupElement"
      },
      "HTMLOptionElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement"
      },
      "HTMLOptionsCollection": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionsCollection"
      },
      "HTMLOutputElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLOutputElement"
      },
      "HTMLParagraphElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLParagraphElement"
      },
      "HTMLParamElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLParamElement"
      },
      "HTMLPreElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement"
      },
      "HTMLProgressElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement"
      },
      "HTMLQuoteElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement"
      },
      "HTMLScriptElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement"
      },
      "HTMLSelectElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement"
      },
      "HTMLSourceElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLSourceElement"
      },
      "HTMLSpanElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLSpanElement"
      },
      "HTMLStyleElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement"
      },
      "HTMLTableCaptionElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCaptionElement"
      },
      "HTMLTableCellElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement"
      },
      "HTMLTableColElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement"
      },
      "HTMLTableDataCellElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableDataCellElement"
      },
      "HTMLTableElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement"
      },
      "HTMLTableHeaderCellElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableHeaderCellElement"
      },
      "HTMLTableRowElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement"
      },
      "HTMLTableSectionElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement"
      },
      "HTMLTextAreaElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement"
      },
      "HTMLTimeElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTimeElement"
      },
      "HTMLTitleElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTitleElement"
      },
      "HTMLTrackElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement"
      },
      "HTMLUListElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLUListElement"
      },
      "HTMLUnknownElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement"
      },
      "HTMLVideoElement": {
        "!type": "Element",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement"
      },
      "Attr": {
        "!type": "fn()",
        "prototype": {
          "isId": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Attr",
            "!doc": "This type represents a DOM element's attribute as an object. In most DOM methods, you will probably directly retrieve the attribute as a string (e.g., Element.getAttribute(), but certain functions (e.g., Element.getAttributeNode()) or means of iterating give Attr types."
          },
          "name": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Attr",
            "!doc": "This type represents a DOM element's attribute as an object. In most DOM methods, you will probably directly retrieve the attribute as a string (e.g., Element.getAttribute(), but certain functions (e.g., Element.getAttributeNode()) or means of iterating give Attr types."
          },
          "value": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Attr",
            "!doc": "This type represents a DOM element's attribute as an object. In most DOM methods, you will probably directly retrieve the attribute as a string (e.g., Element.getAttribute(), but certain functions (e.g., Element.getAttributeNode()) or means of iterating give Attr types."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Attr",
        "!doc": "This type represents a DOM element's attribute as an object. In most DOM methods, you will probably directly retrieve the attribute as a string (e.g., Element.getAttribute(), but certain functions (e.g., Element.getAttributeNode()) or means of iterating give Attr types."
      },
      "NodeList": {
        "!type": "fn()",
        "prototype": {
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.length",
            "!doc": "Returns the number of items in a NodeList."
          },
          "item": {
            "!type": "fn(i: number) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NodeList.item",
            "!doc": "Returns a node from a NodeList by index."
          },
          "<i>": "+Element"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/NodeList",
        "!doc": "NodeList objects are collections of nodes returned by getElementsByTagName, getElementsByTagNameNS, Node.childNodes, querySelectorAll, getElementsByClassName, etc."
      },
      "HTMLCollection": {
        "!type": "fn()",
        "prototype": {
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/HTMLCollection",
            "!doc": "The number of items in the collection."
          },
          "item": {
            "!type": "fn(i: number) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/HTMLCollection",
            "!doc": "Returns the specific node at the given zero-based index into the list. Returns null if the index is out of range."
          },
          "namedItem": {
            "!type": "fn(name: string) -> +Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/HTMLCollection",
            "!doc": "Returns the specific node whose ID or, as a fallback, name matches the string specified by name. Matching by name is only done as a last resort, only in HTML, and only if the referenced element supports the name attribute. Returns null if no node exists by the given name."
          },
          "<i>": "+Element"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/HTMLCollection",
        "!doc": "HTMLCollection is an interface representing a generic collection of elements (in document order) and offers methods and properties for traversing the list."
      },
      "NamedNodeMap": {
        "!type": "fn()",
        "prototype": {
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "The number of items in the map."
          },
          "getNamedItem": {
            "!type": "fn(name: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Gets a node by name."
          },
          "setNamedItem": {
            "!type": "fn(node: +Node) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Adds (or replaces) a node by its nodeName."
          },
          "removeNamedItem": {
            "!type": "fn(name: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Removes a node (or if an attribute, may reveal a default if present)."
          },
          "item": {
            "!type": "fn(i: number) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Returns the item at the given index (or null if the index is higher or equal to the number of nodes)."
          },
          "getNamedItemNS": {
            "!type": "fn(ns: string, name: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Gets a node by namespace and localName."
          },
          "setNamedItemNS": {
            "!type": "fn(node: +Node) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Adds (or replaces) a node by its localName and namespaceURI."
          },
          "removeNamedItemNS": {
            "!type": "fn(ns: string, name: string) -> +Node",
            "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
            "!doc": "Removes a node (or if an attribute, may reveal a default if present)."
          },
          "<i>": "+Node"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/NamedNodeMap",
        "!doc": "A collection of nodes returned by Element.attributes (also potentially for DocumentType.entities, DocumentType.notations). NamedNodeMaps are not in any particular order (unlike NodeList), although they may be accessed by an index as in an array (they may also be accessed with the item() method). A NamedNodeMap object are live and will thus be auto-updated if changes are made to their contents internally or elsewhere."
      },
      "DocumentFragment": {
        "!type": "fn()",
        "prototype": {
          "!proto": "Node.prototype"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/document.createDocumentFragment",
        "!doc": "Creates a new empty DocumentFragment."
      },
      "DOMTokenList": {
        "!type": "fn()",
        "prototype": {
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "The amount of items in the list."
          },
          "item": {
            "!type": "fn(i: number) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "Returns an item in the list by its index."
          },
          "contains": {
            "!type": "fn(token: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "Return true if the underlying string contains token, otherwise false."
          },
          "add": {
            "!type": "fn(token: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "Adds token to the underlying string."
          },
          "remove": {
            "!type": "fn(token: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "Remove token from the underlying string."
          },
          "toggle": {
            "!type": "fn(token: string) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
            "!doc": "Removes token from string and returns false. If token doesn't exist it's added and the function returns true."
          },
          "<i>": "string"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/DOMTokenList",
        "!doc": "This type represents a set of space-separated tokens. Commonly returned by HTMLElement.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList or HTMLAreaElement.relList. It is indexed beginning with 0 as with JavaScript arrays. DOMTokenList is always case-sensitive."
      },
      "XPathResult": {
        "!type": "fn()",
        "prototype": {
          "boolValue": "bool",
          "invalidIteratorState": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript",
            "!doc": "This document describes the interface for using XPath in JavaScript internally, in extensions, and from websites. Mozilla implements a fair amount of the DOM 3 XPath. Which means that XPath expressions can be run against both HTML and XML documents."
          },
          "numberValue": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/XPathResult",
            "!doc": "Refer to nsIDOMXPathResult for more detail."
          },
          "resultType": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/document.evaluate",
            "!doc": "Returns an XPathResult based on an XPath expression and other given parameters."
          },
          "singleNodeValue": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript",
            "!doc": "This document describes the interface for using XPath in JavaScript internally, in extensions, and from websites. Mozilla implements a fair amount of the DOM 3 XPath. Which means that XPath expressions can be run against both HTML and XML documents."
          },
          "snapshotLength": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/XPathResult",
            "!doc": "Refer to nsIDOMXPathResult for more detail."
          },
          "stringValue": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript",
            "!doc": "This document describes the interface for using XPath in JavaScript internally, in extensions, and from websites. Mozilla implements a fair amount of the DOM 3 XPath. Which means that XPath expressions can be run against both HTML and XML documents."
          },
          "iterateNext": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/Introduction_to_using_XPath_in_JavaScript",
            "!doc": "This document describes the interface for using XPath in JavaScript internally, in extensions, and from websites. Mozilla implements a fair amount of the DOM 3 XPath. Which means that XPath expressions can be run against both HTML and XML documents."
          },
          "snapshotItem": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en-US/docs/XPathResult#snapshotItem()"
          },
          "ANY_TYPE": "number",
          "NUMBER_TYPE": "number",
          "STRING_TYPE": "number",
          "BOOL_TYPE": "number",
          "UNORDERED_NODE_ITERATOR_TYPE": "number",
          "ORDERED_NODE_ITERATOR_TYPE": "number",
          "UNORDERED_NODE_SNAPSHOT_TYPE": "number",
          "ORDERED_NODE_SNAPSHOT_TYPE": "number",
          "ANY_UNORDERED_NODE_TYPE": "number",
          "FIRST_ORDERED_NODE_TYPE": "number"
        },
        "!url": "https://developer.mozilla.org/en/docs/XPathResult",
        "!doc": "Refer to nsIDOMXPathResult for more detail."
      },
      "ClientRect": {
        "!type": "fn()",
        "prototype": {
          "top": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
            "!doc": "Top of the box, in pixels, relative to the viewport."
          },
          "left": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
            "!doc": "Left of the box, in pixels, relative to the viewport."
          },
          "bottom": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
            "!doc": "Bottom of the box, in pixels, relative to the viewport."
          },
          "right": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
            "!doc": "Right of the box, in pixels, relative to the viewport."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.getClientRects",
        "!doc": "Returns a collection of rectangles that indicate the bounding rectangles for each box in a client."
      },
      "Event": {
        "!type": "fn()",
        "prototype": {
          "stopPropagation": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.stopPropagation",
            "!doc": "Prevents further propagation of the current event."
          },
          "preventDefault": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.preventDefault",
            "!doc": "Cancels the event if it is cancelable, without stopping further propagation of the event."
          },
          "initEvent": {
            "!type": "fn(type: string, bubbles: bool, cancelable: bool)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.initEvent",
            "!doc": "The initEvent method is used to initialize the value of an event created using document.createEvent."
          },
          "stopImmediatePropagation": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.stopImmediatePropagation",
            "!doc": "Prevents other listeners of the same event to be called."
          },
          "type": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/event.type",
            "!doc": "Returns a string containing the type of event."
          },
          "NONE": "number",
          "CAPTURING_PHASE": "number",
          "AT_TARGET": "number",
          "BUBBLING_PHASE": "number",
          "MOUSEDOWN": "number",
          "MOUSEUP": "number",
          "MOUSEOVER": "number",
          "MOUSEOUT": "number",
          "MOUSEMOVE": "number",
          "MOUSEDRAG": "number",
          "CLICK": "number",
          "DBLCLICK": "number",
          "KEYDOWN": "number",
          "KEYUP": "number",
          "KEYPRESS": "number",
          "DRAGDROP": "number",
          "FOCUS": "number",
          "BLUR": "number",
          "SELECT": "number",
          "CHANGE": "number",
          "target": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget",
            "!doc": "An EventTarget is a DOM interface implemented by objects that can receive DOM events and have listeners for them. The most common EventTargets are DOM elements, although other objects can be EventTargets too, for example document, window, XMLHttpRequest, and others."
          },
          "relatedTarget": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.relatedTarget",
            "!doc": "Identifies a secondary target for the event."
          },
          "pageX": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.pageX",
            "!doc": "Returns the horizontal coordinate of the event relative to whole document."
          },
          "pageY": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.pageY",
            "!doc": "Returns the vertical coordinate of the event relative to the whole document."
          },
          "clientX": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.clientX",
            "!doc": "Returns the horizontal coordinate within the application's client area at which the event occurred (as opposed to the coordinates within the page). For example, clicking in the top-left corner of the client area will always result in a mouse event with a clientX value of 0, regardless of whether the page is scrolled horizontally."
          },
          "clientY": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.clientY",
            "!doc": "Returns the vertical coordinate within the application's client area at which the event occurred (as opposed to the coordinates within the page). For example, clicking in the top-left corner of the client area will always result in a mouse event with a clientY value of 0, regardless of whether the page is scrolled vertically."
          },
          "keyCode": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.keyCode",
            "!doc": "Returns the Unicode value of a non-character key in a keypress event or any key in any other type of keyboard event."
          },
          "charCode": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.charCode",
            "!doc": "Returns the Unicode value of a character key pressed during a keypress event."
          },
          "which": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.which",
            "!doc": "Returns the numeric keyCode of the key pressed, or the character code (charCode) for an alphanumeric key pressed."
          },
          "button": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.button",
            "!doc": "Indicates which mouse button caused the event."
          },
          "shiftKey": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.shiftKey",
            "!doc": "Indicates whether the SHIFT key was pressed when the event fired."
          },
          "ctrlKey": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.ctrlKey",
            "!doc": "Indicates whether the CTRL key was pressed when the event fired."
          },
          "altKey": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.altKey",
            "!doc": "Indicates whether the ALT key was pressed when the event fired."
          },
          "metaKey": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.metaKey",
            "!doc": "Indicates whether the META key was pressed when the event fired."
          },
          "returnValue": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/window.onbeforeunload",
            "!doc": "An event that fires when a window is about to unload its resources. The document is still visible and the event is still cancelable."
          },
          "cancelBubble": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/event.cancelBubble",
            "!doc": "bool is the boolean value of true or false."
          },
          "dataTransfer": {
            "dropEffect": {
              "!type": "string",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/DataTransfer",
              "!doc": "The actual effect that will be used, and should always be one of the possible values of effectAllowed."
            },
            "effectAllowed": {
              "!type": "string",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
              "!doc": "Specifies the effects that are allowed for this drag."
            },
            "files": {
              "!type": "+FileList",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/DataTransfer",
              "!doc": "Contains a list of all the local files available on the data transfer."
            },
            "types": {
              "!type": "[string]",
              "!url": "https://developer.mozilla.org/en-US/docs/DragDrop/DataTransfer",
              "!doc": "Holds a list of the format types of the data that is stored for the first item, in the same order the data was added. An empty list will be returned if no data was added."
            },
            "addElement": {
              "!type": "fn(element: +Element)",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/DataTransfer",
              "!doc": "Set the drag source."
            },
            "clearData": {
              "!type": "fn(type?: string)",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
              "!doc": "Remove the data associated with a given type."
            },
            "getData": {
              "!type": "fn(type: string) -> string",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
              "!doc": "Retrieves the data for a given type, or an empty string if data for that type does not exist or the data transfer contains no data."
            },
            "setData": {
              "!type": "fn(type: string, data: string)",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
              "!doc": "Set the data for a given type."
            },
            "setDragImage": {
              "!type": "fn(image: +Element)",
              "!url": "https://developer.mozilla.org/en/docs/DragDrop/Drag_Operations",
              "!doc": "Set the image to be used for dragging if a custom one is desired."
            },
            "!url": "https://developer.mozilla.org/en/docs/DragDrop/DataTransfer",
            "!doc": "This object is available from the dataTransfer property of all drag events. It cannot be created separately."
          }
        },
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/event",
        "!doc": "The DOM Event interface is accessible from within the handler function, via the event object passed as the first argument."
      },
      "TouchEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/Touch_events",
        "!doc": "In order to provide quality support for touch-based user interfaces, touch events offer the ability to interpret finger activity on touch screens or trackpads."
      },
      "WheelEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/WheelEvent",
        "!doc": "The DOM WheelEvent represents events that occur due to the user moving a mouse wheel or similar input device."
      },
      "MouseEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/MouseEvent",
        "!doc": "The DOM MouseEvent represents events that occur due to the user interacting with a pointing device (such as a mouse). It's represented by the nsINSDOMMouseEvent interface, which extends the nsIDOMMouseEvent interface."
      },
      "KeyboardEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/KeyboardEvent",
        "!doc": "KeyboardEvent objects describe a user interaction with the keyboard. Each event describes a key; the event type (keydown, keypress, or keyup) identifies what kind of activity was performed."
      },
      "HashChangeEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onhashchange",
        "!doc": "The hashchange event fires when a window's hash changes."
      },
      "ErrorEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/DOM_event_reference/error",
        "!doc": "The error event is fired whenever a resource fails to load."
      },
      "CustomEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/Event/CustomEvent",
        "!doc": "The DOM CustomEvent are events initialized by an application for any purpose."
      },
      "BeforeLoadEvent": {
        "!type": "fn()",
        "prototype": "Event.prototype",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window",
        "!doc": "This section provides a brief reference for all of the methods, properties, and events available through the DOM window object. The window object implements the Window interface, which in turn inherits from the AbstractView interface. Some additional global functions, namespaces objects, and constructors, not typically associated with the window, but available on it, are listed in the JavaScript Reference."
      },
      "WebSocket": {
        "!type": "fn(url: string)",
        "prototype": {
          "close": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/CloseEvent",
            "!doc": "A CloseEvent is sent to clients using WebSockets when the connection is closed. This is delivered to the listener indicated by the WebSocket object's onclose attribute."
          },
          "send": {
            "!type": "fn(data: string)",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/WebSocket",
            "!doc": "The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection."
          },
          "binaryType": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/WebSocket",
            "!doc": "The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection."
          },
          "bufferedAmount": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/Writing_WebSocket_client_applications",
            "!doc": "WebSockets is a technology that makes it possible to open an interactive communication session between the user's browser and a server. Using a WebSocket connection, Web applications can perform real-time communication instead of having to poll for changes back and forth."
          },
          "extensions": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/WebSocket",
            "!doc": "The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection."
          },
          "onclose": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/CloseEvent",
            "!doc": "A CloseEvent is sent to clients using WebSockets when the connection is closed. This is delivered to the listener indicated by the WebSocket object's onclose attribute."
          },
          "onerror": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/Writing_WebSocket_client_applications",
            "!doc": "WebSockets is a technology that makes it possible to open an interactive communication session between the user's browser and a server. Using a WebSocket connection, Web applications can perform real-time communication instead of having to poll for changes back and forth."
          },
          "onmessage": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/WebSocket",
            "!doc": "The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection."
          },
          "onopen": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/WebSockets_reference/WebSocket",
            "!doc": "The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection."
          },
          "protocol": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets",
            "!doc": "WebSockets is an advanced technology that makes it possible to open an interactive communication session between the user's browser and a server. With this API, you can send messages to a server and receive event-driven responses without having to poll the server for a reply."
          },
          "url": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/WebSockets/Writing_WebSocket_client_applications",
            "!doc": "WebSockets is a technology that makes it possible to open an interactive communication session between the user's browser and a server. Using a WebSocket connection, Web applications can perform real-time communication instead of having to poll for changes back and forth."
          },
          "CONNECTING": "number",
          "OPEN": "number",
          "CLOSING": "number",
          "CLOSED": "number"
        },
        "!url": "https://developer.mozilla.org/en/docs/WebSockets",
        "!doc": "WebSockets is an advanced technology that makes it possible to open an interactive communication session between the user's browser and a server. With this API, you can send messages to a server and receive event-driven responses without having to poll the server for a reply."
      },
      "Worker": {
        "!type": "fn(scriptURL: string)",
        "prototype": {
          "postMessage": {
            "!type": "fn(message: ?)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
            "!doc": "Sends a message to the worker's inner scope. This accepts a single parameter, which is the data to send to the worker. The data may be any value or JavaScript object handled by the structured clone algorithm, which includes cyclical references."
          },
          "terminate": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
            "!doc": "Immediately terminates the worker. This does not offer the worker an opportunity to finish its operations; it is simply stopped at once."
          },
          "onmessage": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
            "!doc": "An event listener that is called whenever a MessageEvent with type message bubbles through the worker. The message is stored in the event's data member."
          },
          "onerror": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
            "!doc": "An event listener that is called whenever an ErrorEvent with type error bubbles through the worker."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
        "!doc": "Workers are background tasks that can be easily created and can send messages back to their creators. Creating a worker is as simple as calling the Worker() constructor, specifying a script to be run in the worker thread."
      },
      "localStorage": {
        "setItem": {
          "!type": "fn(name: string, value: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
          "!doc": "Store an item in storage."
        },
        "getItem": {
          "!type": "fn(name: string) -> string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
          "!doc": "Retrieve an item from storage."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
        "!doc": "The DOM Storage mechanism is a means through which string key/value pairs can be securely stored and later retrieved for use."
      },
      "sessionStorage": {
        "setItem": {
          "!type": "fn(name: string, value: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
          "!doc": "Store an item in storage."
        },
        "getItem": {
          "!type": "fn(name: string) -> string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
          "!doc": "Retrieve an item from storage."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Storage",
        "!doc": "This is a global object (sessionStorage) that maintains a storage area that's available for the duration of the page session. A page session lasts for as long as the browser is open and survives over page reloads and restores. Opening a page in a new tab or window will cause a new session to be initiated."
      },
      "FileList": {
        "!type": "fn()",
        "prototype": {
          "length": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileList",
            "!doc": "A read-only value indicating the number of files in the list."
          },
          "item": {
            "!type": "fn(i: number) -> +File",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileList",
            "!doc": "Returns a File object representing the file at the specified index in the file list."
          },
          "<i>": "+File"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/FileList",
        "!doc": "An object of this type is returned by the files property of the HTML input element; this lets you access the list of files selected with the <input type=\"file\"> element. It's also used for a list of files dropped into web content when using the drag and drop API."
      },
      "File": {
        "!type": "fn()",
        "prototype": {
          "!proto": "Blob.prototype",
          "fileName": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/File.fileName",
            "!doc": "Returns the name of the file. For security reasons the path is excluded from this property."
          },
          "fileSize": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/File.fileSize",
            "!doc": "Returns the size of a file in bytes."
          },
          "lastModifiedDate": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/File.lastModifiedDate",
            "!doc": "Returns the last modified date of the file. Files without a known last modified date use the current date instead."
          },
          "name": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/File.name",
            "!doc": "Returns the name of the file. For security reasons, the path is excluded from this property."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/File",
        "!doc": "The File object provides information about -- and access to the contents of -- files. These are generally retrieved from a FileList object returned as a result of a user selecting files using the input element, or from a drag and drop operation's DataTransfer object."
      },
      "Blob": {
        "!type": "fn(parts: [?], properties?: ?)",
        "prototype": {
          "size": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Blob",
            "!doc": "The size, in bytes, of the data contained in the Blob object. Read only."
          },
          "type": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Blob",
            "!doc": "An ASCII-encoded string, in all lower case, indicating the MIME type of the data contained in the Blob. If the type is unknown, this string is empty. Read only."
          },
          "slice": {
            "!type": "fn(start: number, end?: number, type?: string) -> +Blob",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Blob",
            "!doc": "Returns a new Blob object containing the data in the specified range of bytes of the source Blob."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Blob",
        "!doc": "A Blob object represents a file-like object of immutable, raw data. Blobs represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system."
      },
      "FileReader": {
        "!type": "fn()",
        "prototype": {
          "abort": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Aborts the read operation. Upon return, the readyState will be DONE."
          },
          "readAsArrayBuffer": {
            "!type": "fn(blob: +Blob)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Starts reading the contents of the specified Blob, producing an ArrayBuffer."
          },
          "readAsBinaryString": {
            "!type": "fn(blob: +Blob)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Starts reading the contents of the specified Blob, producing raw binary data."
          },
          "readAsDataURL": {
            "!type": "fn(blob: +Blob)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Starts reading the contents of the specified Blob, producing a data: url."
          },
          "readAsText": {
            "!type": "fn(blob: +Blob, encoding?: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Starts reading the contents of the specified Blob, producing a string."
          },
          "EMPTY": "number",
          "LOADING": "number",
          "DONE": "number",
          "error": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "The error that occurred while reading the file. Read only."
          },
          "readyState": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Indicates the state of the FileReader. This will be one of the State constants. Read only."
          },
          "result": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "The file's contents. This property is only valid after the read operation is complete, and the format of the data depends on which of the methods was used to initiate the read operation. Read only."
          },
          "onabort": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called when the read operation is aborted."
          },
          "onerror": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called when an error occurs."
          },
          "onload": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called when the read operation is successfully completed."
          },
          "onloadend": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called when the read is completed, whether successful or not. This is called after either onload or onerror."
          },
          "onloadstart": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called when reading the data is about to begin."
          },
          "onprogress": {
            "!type": "?",
            "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
            "!doc": "Called periodically while the data is being read."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/FileReader",
        "!doc": "The FileReader object lets web applications asynchronously read the contents of files (or raw data buffers) stored on the user's computer, using File or Blob objects to specify the file or data to read. File objects may be obtained from a FileList object returned as a result of a user selecting files using the <input> element, from a drag and drop operation's DataTransfer object, or from the mozGetAsFile() API on an HTMLCanvasElement."
      },
      "URL": {
        "createObjectURL": {
          "!type": "fn(blob: +Blob) -> string",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL",
          "!doc": "The URL.createObjectURL() static method creates a DOMString containing an URL representing the object given in parameter."

        },
        "revokeObjectURL": {
          "!type": "fn(string)",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL",
          "!doc": "The URL.revokeObjectURL() static method releases an existing object URL which was previously created by calling window.URL.createObjectURL()."
        }
      },
      "Range": {
        "!type": "fn()",
        "prototype": {
          "collapsed": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.collapsed",
            "!doc": "Returns a boolean indicating whether the range's start and end points are at the same position."
          },
          "commonAncestorContainer": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.commonAncestorContainer",
            "!doc": "Returns the deepest Node that contains the  startContainer and  endContainer Nodes."
          },
          "endContainer": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.endContainer",
            "!doc": "Returns the Node within which the Range ends."
          },
          "endOffset": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.endOffset",
            "!doc": "Returns a number representing where in the  endContainer the Range ends."
          },
          "startContainer": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.startContainer",
            "!doc": "Returns the Node within which the Range starts."
          },
          "startOffset": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.startOffset",
            "!doc": "Returns a number representing where in the startContainer the Range starts."
          },
          "setStart": {
            "!type": "fn(node: +Element, offset: number)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setStart",
            "!doc": "Sets the start position of a Range."
          },
          "setEnd": {
            "!type": "fn(node: +Element, offset: number)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setEnd",
            "!doc": "Sets the end position of a Range."
          },
          "setStartBefore": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setStartBefore",
            "!doc": "Sets the start position of a Range relative to another Node."
          },
          "setStartAfter": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setStartAfter",
            "!doc": "Sets the start position of a Range relative to a Node."
          },
          "setEndBefore": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setEndBefore",
            "!doc": "Sets the end position of a Range relative to another Node."
          },
          "setEndAfter": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.setEndAfter",
            "!doc": "Sets the end position of a Range relative to another Node."
          },
          "selectNode": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.selectNode",
            "!doc": "Sets the Range to contain the Node and its contents."
          },
          "selectNodeContents": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.selectNodeContents",
            "!doc": "Sets the Range to contain the contents of a Node."
          },
          "collapse": {
            "!type": "fn(toStart: bool)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.collapse",
            "!doc": "Collapses the Range to one of its boundary points."
          },
          "cloneContents": {
            "!type": "fn() -> +DocumentFragment",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.cloneContents",
            "!doc": "Returns a DocumentFragment copying the Nodes of a Range."
          },
          "deleteContents": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.deleteContents",
            "!doc": "Removes the contents of a Range from the Document."
          },
          "extractContents": {
            "!type": "fn() -> +DocumentFragment",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.extractContents",
            "!doc": "Moves contents of a Range from the document tree into a DocumentFragment."
          },
          "insertNode": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.insertNode",
            "!doc": "Insert a node at the start of a Range."
          },
          "surroundContents": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.surroundContents",
            "!doc": "Moves content of a Range into a new node, placing the new node at the start of the specified range."
          },
          "compareBoundaryPoints": {
            "!type": "fn(how: number, other: +Range) -> number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.compareBoundaryPoints",
            "!doc": "Compares the boundary points of two Ranges."
          },
          "cloneRange": {
            "!type": "fn() -> +Range",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.cloneRange",
            "!doc": "Returns a Range object with boundary points identical to the cloned Range."
          },
          "detach": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/range.detach",
            "!doc": "Releases a Range from use to improve performance. This lets the browser choose to release resources associated with this Range. Subsequent attempts to use the detached range will result in a DOMException being thrown with an error code of INVALID_STATE_ERR."
          },
          "END_TO_END": "number",
          "END_TO_START": "number",
          "START_TO_END": "number",
          "START_TO_START": "number"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/range.detach",
        "!doc": "Releases a Range from use to improve performance. This lets the browser choose to release resources associated with this Range. Subsequent attempts to use the detached range will result in a DOMException being thrown with an error code of INVALID_STATE_ERR."
      },
      "XMLHttpRequest": {
        "!type": "fn()",
        "prototype": {
          "abort": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Aborts the request if it has already been sent."
          },
          "getAllResponseHeaders": {
            "!type": "fn() -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Returns all the response headers as a string, or null if no response has been received. Note: For multipart requests, this returns the headers from the current part of the request, not from the original channel."
          },
          "getResponseHeader": {
            "!type": "fn(header: string) -> string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Returns the string containing the text of the specified header, or null if either the response has not yet been received or the header doesn't exist in the response."
          },
          "open": {
            "!type": "fn(method: string, url: string, async?: bool, user?: string, password?: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Initializes a request."
          },
          "overrideMimeType": {
            "!type": "fn(type: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Overrides the MIME type returned by the server."
          },
          "send": {
            "!type": "fn(data?: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Sends the request. If the request is asynchronous (which is the default), this method returns as soon as the request is sent. If the request is synchronous, this method doesn't return until the response has arrived."
          },
          "setRequestHeader": {
            "!type": "fn(header: string, value: string)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Sets the value of an HTTP request header.You must call setRequestHeader() after open(), but before send()."
          },
          "onreadystatechange": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "A JavaScript function object that is called whenever the readyState attribute changes."
          },
          "readyState": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The state of the request. (0=unsent, 1=opened, 2=headers_received, 3=loading, 4=done)"
          },
          "response": {
            "!type": "+Document",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The response entity body according to responseType, as an ArrayBuffer, Blob, Document, JavaScript object (for \"json\"), or string. This is null if the request is not complete or was not successful."
          },
          "responseText": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The response to the request as text, or null if the request was unsuccessful or has not yet been sent."
          },
          "responseType": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "Can be set to change the response type."
          },
          "responseXML": {
            "!type": "+Document",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The response to the request as a DOM Document object, or null if the request was unsuccessful, has not yet been sent, or cannot be parsed as XML or HTML."
          },
          "status": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The status of the response to the request. This is the HTTP result code"
          },
          "statusText": {
            "!type": "string",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
            "!doc": "The response string returned by the HTTP server. Unlike status, this includes the entire text of the response message (\"200 OK\", for example)."
          },
          "timeout": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest/Synchronous_and_Asynchronous_Requests",
            "!doc": "The number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout."
          },
          "UNSENT": "number",
          "OPENED": "number",
          "HEADERS_RECEIVED": "number",
          "LOADING": "number",
          "DONE": "number"
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/XMLHttpRequest",
        "!doc": "XMLHttpRequest is a JavaScript object that was designed by Microsoft and adopted by Mozilla, Apple, and Google. It's now being standardized in the W3C. It provides an easy way to retrieve data at a URL. Despite its name, XMLHttpRequest can be used to retrieve any type of data, not just XML, and it supports protocols other than HTTP (including file and ftp)."
      },
      "DOMParser": {
        "!type": "fn()",
        "prototype": {
          "parseFromString": {
            "!type": "fn(data: string, mime: string) -> +Document",
            "!url": "https://developer.mozilla.org/en/docs/DOM/DOMParser",
            "!doc": "DOMParser can parse XML or HTML source stored in a string into a DOM Document. DOMParser is specified in DOM Parsing and Serialization."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/DOMParser",
        "!doc": "DOMParser can parse XML or HTML source stored in a string into a DOM Document. DOMParser is specified in DOM Parsing and Serialization."
      },
      "FormData": {
        "!type": "fn()",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData",
        "prototype": {
          "append": {
            "!type": "fn(name: string, value: ?, filename: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/append",
            "!doc": "Appends a new value onto an existing key inside a FormData object, or adds the key if it does not already exist."
          },
          "delete": {
            "!type": "fn(name: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/delete",
            "!doc": "Deletes a key/value pair from a FormData object."
          },
          "get": {
            "!type": "fn(name: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/get",
            "!doc": "Returns the first value associated with a given key from within a FormData object."
          },
          "getAll": {
            "!type": "fn(name: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/getAll",
            "!doc": "Returns an array of all the values associated with a given key from within a FormData."
          },
          "has": {
            "!type": "fn(name: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/has",
            "!doc": "Returns a boolean stating whether a FormData object contains a certain key/value pair."
          },
          "set": {
            "!type": "fn(name: string, value: ?, filename: string)",
            "!url": "https://developer.mozilla.org/en-US/docs/Web/API/FormData/set",
            "!doc": "Sets a new value for an existing key inside a FormData object, or adds the key/value if it does not already exist."
          }
        }
      },
      "Selection": {
        "!type": "fn()",
        "prototype": {
          "anchorNode": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/anchorNode",
            "!doc": "Returns the node in which the selection begins."
          },
          "anchorOffset": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/anchorOffset",
            "!doc": "Returns the number of characters that the selection's anchor is offset within the anchorNode."
          },
          "focusNode": {
            "!type": "+Element",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/focusNode",
            "!doc": "Returns the node in which the selection ends."
          },
          "focusOffset": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/focusOffset",
            "!doc": "Returns the number of characters that the selection's focus is offset within the focusNode. "
          },
          "isCollapsed": {
            "!type": "bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/isCollapsed",
            "!doc": "Returns a boolean indicating whether the selection's start and end points are at the same position."
          },
          "rangeCount": {
            "!type": "number",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/rangeCount",
            "!doc": "Returns the number of ranges in the selection."
          },
          "getRangeAt": {
            "!type": "fn(i: number) -> +Range",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/getRangeAt",
            "!doc": "Returns a range object representing one of the ranges currently selected."
          },
          "collapse": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/collapse",
            "!doc": "Collapses the current selection to a single point. The document is not modified. If the content is focused and editable, the caret will blink there."
          },
          "extend": {
            "!type": "fn(node: +Element, offset: number)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/extend",
            "!doc": "Moves the focus of the selection to a specified point. The anchor of the selection does not move. The selection will be from the anchor to the new focus regardless of direction."
          },
          "collapseToStart": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/collapseToStart",
            "!doc": "Collapses the selection to the start of the first range in the selection.  If the content of the selection is focused and editable, the caret will blink there."
          },
          "collapseToEnd": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/collapseToEnd",
            "!doc": "Collapses the selection to the end of the last range in the selection.  If the content the selection is in is focused and editable, the caret will blink there."
          },
          "selectAllChildren": {
            "!type": "fn(node: +Element)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/selectAllChildren",
            "!doc": "Adds all the children of the specified node to the selection. Previous selection is lost."
          },
          "addRange": {
            "!type": "fn(range: +Range)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/addRange",
            "!doc": "Adds a Range to a Selection."
          },
          "removeRange": {
            "!type": "fn(range: +Range)",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/removeRange",
            "!doc": "Removes a range from the selection."
          },
          "removeAllRanges": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/removeAllRanges",
            "!doc": "Removes all ranges from the selection, leaving the anchorNode and focusNode properties equal to null and leaving nothing selected. "
          },
          "deleteFromDocument": {
            "!type": "fn()",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/deleteFromDocument",
            "!doc": "Deletes the actual text being represented by a selection object from the document's DOM."
          },
          "containsNode": {
            "!type": "fn(node: +Element) -> bool",
            "!url": "https://developer.mozilla.org/en/docs/DOM/Selection/containsNode",
            "!doc": "Indicates if the node is part of the selection."
          }
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Selection",
        "!doc": "Selection is the class of the object returned by window.getSelection() and other methods. It represents the text selection in the greater page, possibly spanning multiple elements, when the user drags over static text and other parts of the page. For information about text selection in an individual text editing element."
      },
      "console": {
        "error": {
          "!type": "fn(text: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/console.error",
          "!doc": "Outputs an error message to the Web Console."
        },
        "info": {
          "!type": "fn(text: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/console.info",
          "!doc": "Outputs an informational message to the Web Console."
        },
        "log": {
          "!type": "fn(text: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/console.log",
          "!doc": "Outputs a message to the Web Console."
        },
        "warn": {
          "!type": "fn(text: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/console.warn",
          "!doc": "Outputs a warning message to the Web Console."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/console",
        "!doc": "The console object provides access to the browser's debugging console. The specifics of how it works vary from browser to browser, but there is a de facto set of features that are typically provided."
      },
      "top": {
        "!type": "<top>",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.top",
        "!doc": "Returns a reference to the topmost window in the window hierarchy."
      },
      "parent": {
        "!type": "<top>",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.parent",
        "!doc": "A reference to the parent of the current window or subframe."
      },
      "window": {
        "!type": "<top>",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window",
        "!doc": "The window object represents a window containing a DOM document."
      },
      "opener": {
        "!type": "<top>",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.opener",
        "!doc": "Returns a reference to the window that opened this current window."
      },
      "self": {
        "!type": "<top>",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.self",
        "!doc": "Returns an object reference to the window object. "
      },
      "devicePixelRatio": "number",
      "name": {
        "!type": "string",
        "!url": "https://developer.mozilla.org/en/docs/JavaScript/Reference/Global_Objects/Function/name",
        "!doc": "The name of the function."
      },
      "closed": {
        "!type": "bool",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.closed",
        "!doc": "This property indicates whether the referenced window is closed or not."
      },
      "pageYOffset": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollY",
        "!doc": "Returns the number of pixels that the document has already been scrolled vertically."
      },
      "pageXOffset": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollX",
        "!doc": "Returns the number of pixels that the document has already been scrolled vertically."
      },
      "scrollY": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollY",
        "!doc": "Returns the number of pixels that the document has already been scrolled vertically."
      },
      "scrollX": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollX",
        "!doc": "Returns the number of pixels that the document has already been scrolled vertically."
      },
      "screenTop": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.top",
        "!doc": "Returns the distance in pixels from the top side of the current screen."
      },
      "screenLeft": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.left",
        "!doc": "Returns the distance in pixels from the left side of the main screen to the left side of the current screen."
      },
      "screenY": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/event.screenY",
        "!doc": "Returns the vertical coordinate of the event within the screen as a whole."
      },
      "screenX": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/event.screenX",
        "!doc": "Returns the horizontal coordinate of the event within the screen as a whole."
      },
      "innerWidth": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.innerWidth",
        "!doc": "Width (in pixels) of the browser window viewport including, if rendered, the vertical scrollbar."
      },
      "innerHeight": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.innerHeight",
        "!doc": "Height (in pixels) of the browser window viewport including, if rendered, the horizontal scrollbar."
      },
      "outerWidth": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.outerWidth",
        "!doc": "window.outerWidth gets the width of the outside of the browser window. It represents the width of the whole browser window including sidebar (if expanded), window chrome and window resizing borders/handles."
      },
      "outerHeight": {
        "!type": "number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.outerHeight",
        "!doc": "window.outerHeight gets the height in pixels of the whole browser window."
      },
      "frameElement": {
        "!type": "+Element",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.frameElement",
        "!doc": "Returns the element (such as <iframe> or <object>) in which the window is embedded, or null if the window is top-level."
      },
      "crypto": {
        "getRandomValues": {
          "!type": "fn([number])",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.crypto.getRandomValues",
          "!doc": "This methods lets you get cryptographically random values."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.crypto.getRandomValues",
        "!doc": "This methods lets you get cryptographically random values."
      },
      "navigator": {
        "appName": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.appName",
          "!doc": "Returns the name of the browser. The HTML5 specification also allows any browser to return \"Netscape\" here, for compatibility reasons."
        },
        "appVersion": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.appVersion",
          "!doc": "Returns the version of the browser as a string. It may be either a plain version number, like \"5.0\", or a version number followed by more detailed information. The HTML5 specification also allows any browser to return \"4.0\" here, for compatibility reasons."
        },
        "language": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.language",
          "!doc": "Returns a string representing the language version of the browser."
        },
        "platform": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.platform",
          "!doc": "Returns a string representing the platform of the browser."
        },
        "plugins": {
          "!type": "[?]",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.plugins",
          "!doc": "Returns a PluginArray object, listing the plugins installed in the application."
        },
        "userAgent": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.userAgent",
          "!doc": "Returns the user agent string for the current browser."
        },
        "vendor": {
          "!type": "string",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.vendor",
          "!doc": "Returns the name of the browser vendor for the current browser."
        },
        "javaEnabled": {
          "!type": "bool",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator.javaEnabled",
          "!doc": "This method indicates whether the current browser is Java-enabled or not."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.navigator",
        "!doc": "Returns a reference to the navigator object, which can be queried for information about the application running the script."
      },
      "history": {
        "state": {
          "!type": "?",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "length": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "go": {
          "!type": "fn(delta: number)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.history",
          "!doc": "Returns a reference to the History object, which provides an interface for manipulating the browser session history (pages visited in the tab or frame that the current page is loaded in)."
        },
        "forward": {
          "!type": "fn()",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "back": {
          "!type": "fn()",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "pushState": {
          "!type": "fn(data: ?, title: string, url?: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "replaceState": {
          "!type": "fn(data: ?, title: string, url?: string)",
          "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
          "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/Manipulating_the_browser_history",
        "!doc": "The DOM window object provides access to the browser's history through the history object. It exposes useful methods and properties that let you move back and forth through the user's history, as well as -- starting with HTML5 -- manipulate the contents of the history stack."
      },
      "screen": {
        "availWidth": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.availWidth",
          "!doc": "Returns the amount of horizontal space in pixels available to the window."
        },
        "availHeight": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.availHeight",
          "!doc": "Returns the amount of vertical space available to the window on the screen."
        },
        "availTop": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.availTop",
          "!doc": "Specifies the y-coordinate of the first pixel that is not allocated to permanent or semipermanent user interface features."
        },
        "availLeft": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.availLeft",
          "!doc": "Returns the first available pixel available from the left side of the screen."
        },
        "pixelDepth": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.pixelDepth",
          "!doc": "Returns the bit depth of the screen."
        },
        "colorDepth": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.colorDepth",
          "!doc": "Returns the color depth of the screen."
        },
        "width": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.width",
          "!doc": "Returns the width of the screen."
        },
        "height": {
          "!type": "number",
          "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen.height",
          "!doc": "Returns the height of the screen in pixels."
        },
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.screen",
        "!doc": "Returns a reference to the screen object associated with the window."
      },
      "postMessage": {
        "!type": "fn(message: string, targetOrigin: string)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.postMessage",
        "!doc": "window.postMessage, when called, causes a MessageEvent to be dispatched at the target window when any pending script that must be executed completes (e.g. remaining event handlers if window.postMessage is called from an event handler, previously-set pending timeouts, etc.). The MessageEvent has the type message, a data property which is set to the value of the first argument provided to window.postMessage, an origin property corresponding to the origin of the main document in the window calling window.postMessage at the time window.postMessage was called, and a source property which is the window from which window.postMessage is called. (Other standard properties of events are present with their expected values.)"
      },
      "close": {
        "!type": "fn()",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.close",
        "!doc": "Closes the current window, or a referenced window."
      },
      "blur": {
        "!type": "fn()",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.blur",
        "!doc": "The blur method removes keyboard focus from the current element."
      },
      "focus": {
        "!type": "fn()",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.focus",
        "!doc": "Sets focus on the specified element, if it can be focused."
      },
      "onload": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onload",
        "!doc": "An event handler for the load event of a window."
      },
      "onunload": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onunload",
        "!doc": "The unload event is raised when the window is unloading its content and resources. The resources removal is processed after the unload event occurs."
      },
      "onscroll": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onscroll",
        "!doc": "Specifies the function to be called when the window is scrolled."
      },
      "onresize": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onresize",
        "!doc": "An event handler for the resize event on the window."
      },
      "ononline": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/document.ononline",
        "!doc": "\"online\" event is fired when the browser switches between online and offline mode."
      },
      "onoffline": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/Online_and_offline_events",
        "!doc": "Some browsers implement Online/Offline events from the WHATWG Web Applications 1.0 specification."
      },
      "onmousewheel": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/DOM_event_reference/mousewheel",
        "!doc": "The DOM mousewheel event is fired asynchronously when mouse wheel or similar device is operated. It's represented by the MouseWheelEvent interface."
      },
      "onmouseup": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onmouseup",
        "!doc": "An event handler for the mouseup event on the window."
      },
      "onmouseover": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmouseover",
        "!doc": "The onmouseover property returns the onMouseOver event handler code on the current element."
      },
      "onmouseout": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmouseout",
        "!doc": "The onmouseout property returns the onMouseOut event handler code on the current element."
      },
      "onmousemove": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onmousemove",
        "!doc": "The onmousemove property returns the mousemove event handler code on the current element."
      },
      "onmousedown": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onmousedown",
        "!doc": "An event handler for the mousedown event on the window."
      },
      "onclick": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onclick",
        "!doc": "The onclick property returns the onClick event handler code on the current element."
      },
      "ondblclick": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.ondblclick",
        "!doc": "The ondblclick property returns the onDblClick event handler code on the current element."
      },
      "onmessage": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/Worker",
        "!doc": "Dedicated Web Workers provide a simple means for web content to run scripts in background threads.  Once created, a worker can send messages to the spawning task by posting messages to an event handler specified by the creator."
      },
      "onkeyup": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onkeyup",
        "!doc": "The onkeyup property returns the onKeyUp event handler code for the current element."
      },
      "onkeypress": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onkeypress",
        "!doc": "The onkeypress property sets and returns the onKeyPress event handler code for the current element."
      },
      "onkeydown": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onkeydown",
        "!doc": "An event handler for the keydown event on the window."
      },
      "oninput": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/DOM_event_reference/input",
        "!doc": "The DOM input event is fired synchronously when the value of an <input> or <textarea> element is changed. Additionally, it's also fired on contenteditable editors when its contents are changed. In this case, the event target is the editing host element. If there are two or more elements which have contenteditable as true, \"editing host\" is the nearest ancestor element whose parent isn't editable. Similarly, it's also fired on root element of designMode editors."
      },
      "onpopstate": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onpopstate",
        "!doc": "An event handler for the popstate event on the window."
      },
      "onhashchange": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onhashchange",
        "!doc": "The hashchange event fires when a window's hash changes."
      },
      "onfocus": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onfocus",
        "!doc": "The onfocus property returns the onFocus event handler code on the current element."
      },
      "onblur": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onblur",
        "!doc": "The onblur property returns the onBlur event handler code, if any, that exists on the current element."
      },
      "onerror": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onerror",
        "!doc": "An event handler for runtime script errors."
      },
      "ondrop": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/drop",
        "!doc": "The drop event is fired when an element or text selection is dropped on a valid drop target."
      },
      "ondragstart": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/dragstart",
        "!doc": "The dragstart event is fired when the user starts dragging an element or text selection."
      },
      "ondragover": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/dragover",
        "!doc": "The dragover event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds)."
      },
      "ondragleave": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/dragleave",
        "!doc": "The dragleave event is fired when a dragged element or text selection leaves a valid drop target."
      },
      "ondragenter": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/dragenter",
        "!doc": "The dragenter event is fired when a dragged element or text selection enters a valid drop target."
      },
      "ondragend": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/dragend",
        "!doc": "The dragend event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key)."
      },
      "ondrag": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/drag",
        "!doc": "The drag event is fired when an element or text selection is being dragged (every few hundred milliseconds)."
      },
      "oncontextmenu": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.oncontextmenu",
        "!doc": "An event handler property for right-click events on the window. Unless the default behavior is prevented, the browser context menu will activate (though IE8 has a bug with this and will not activate the context menu if a contextmenu event handler is defined). Note that this event will occur with any non-disabled right-click event and does not depend on an element possessing the \"contextmenu\" attribute."
      },
      "onchange": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/element.onchange",
        "!doc": "The onchange property sets and returns the onChange event handler code for the current element."
      },
      "onbeforeunload": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onbeforeunload",
        "!doc": "An event that fires when a window is about to unload its resources. The document is still visible and the event is still cancelable."
      },
      "onabort": {
        "!type": "?",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.onabort",
        "!doc": "An event handler for abort events sent to the window."
      },
      "getSelection": {
        "!type": "fn() -> +Selection",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.getSelection",
        "!doc": "Returns a selection object representing the range of text selected by the user. "
      },
      "alert": {
        "!type": "fn(message: string)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.alert",
        "!doc": "Display an alert dialog with the specified content and an OK button."
      },
      "confirm": {
        "!type": "fn(message: string) -> bool",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.confirm",
        "!doc": "Displays a modal dialog with a message and two buttons, OK and Cancel."
      },
      "prompt": {
        "!type": "fn(message: string, value: string) -> string",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.prompt",
        "!doc": "Displays a dialog with a message prompting the user to input some text."
      },
      "scrollBy": {
        "!type": "fn(x: number, y: number)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollBy",
        "!doc": "Scrolls the document in the window by the given amount."
      },
      "scrollTo": {
        "!type": "fn(x: number, y: number)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scrollTo",
        "!doc": "Scrolls to a particular set of coordinates in the document."
      },
      "scroll": {
        "!type": "fn(x: number, y: number)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.scroll",
        "!doc": "Scrolls the window to a particular place in the document."
      },
      "setTimeout": {
        "!type": "fn(f: fn(), ms: number) -> number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.setTimeout",
        "!doc": "Calls a function or executes a code snippet after specified delay."
      },
      "clearTimeout": {
        "!type": "fn(timeout: number)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.clearTimeout",
        "!doc": "Clears the delay set by window.setTimeout()."
      },
      "setInterval": {
        "!type": "fn(f: fn(), ms: number) -> number",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.setInterval",
        "!doc": "Calls a function or executes a code snippet repeatedly, with a fixed time delay between each call to that function."
      },
      "clearInterval": {
        "!type": "fn(interval: number)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.clearInterval",
        "!doc": "Cancels repeated action which was set up using setInterval."
      },
      "atob": {
        "!type": "fn(encoded: string) -> string",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.atob",
        "!doc": "Decodes a string of data which has been encoded using base-64 encoding."
      },
      "btoa": {
        "!type": "fn(data: string) -> string",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.btoa",
        "!doc": "Creates a base-64 encoded ASCII string from a string of binary data."
      },
      "addEventListener": {
        "!type": "fn(type: string, listener: fn(e: +Event), capture: bool)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.addEventListener",
        "!doc": "Registers a single event listener on a single target. The event target may be a single element in a document, the document itself, a window, or an XMLHttpRequest."
      },
      "removeEventListener": {
        "!type": "fn(type: string, listener: fn(), capture: bool)",
        "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.removeEventListener",
        "!doc": "Allows the removal of event listeners from the event target."
      },
      "dispatchEvent": {
        "!type": "fn(event: +Event) -> bool",
        "!url": "https://developer.mozilla.org/en/docs/DOM/EventTarget.dispatchEvent",
        "!doc": "Dispatches an event into the event system. The event is subject to the same capturing and bubbling behavior as directly dispatched events."
      },
      "getComputedStyle": {
        "!type": "fn(node: +Element, pseudo?: string) -> Element.prototype.style",
        "!url": "https://developer.mozilla.org/en/docs/DOM/window.getComputedStyle",
        "!doc": "Gives the final used values of all the CSS properties of an element."
      },
      "CanvasRenderingContext2D": {
        "canvas": "+Element",
        "width": "number",
        "height": "number",
        "commit": "fn()",
        "save": "fn()",
        "restore": "fn()",
        "currentTransform": "?",
        "scale": "fn(x: number, y: number)",
        "rotate": "fn(angle: number)",
        "translate": "fn(x: number, y: number)",
        "transform": "fn(a: number, b: number, c: number, d: number, e: number, f: number)",
        "setTransform": "fn(a: number, b: number, c: number, d: number, e: number, f: number)",
        "resetTransform": "fn()",
        "globalAlpha": "number",
        "globalCompositeOperation": "string",
        "imageSmoothingEnabled": "bool",
        "strokeStyle": "string",
        "fillStyle": "string",
        "createLinearGradient": "fn(x0: number, y0: number, x1: number, y1: number) -> ?",
        "createPattern": "fn(image: ?, repetition: string) -> ?",
        "shadowOffsetX": "number",
        "shadowOffsetY": "number",
        "shadowBlur": "number",
        "shadowColor": "string",
        "clearRect": "fn(x: number, y: number, w: number, h: number)",
        "fillRect": "fn(x: number, y: number, w: number, h: number)",
        "strokeRect": "fn(x: number, y: number, w: number, h: number)",
        "fillRule": "string",
        "fill": "fn()",
        "beginPath": "fn()",
        "stroke": "fn()",
        "clip": "fn()",
        "resetClip": "fn()",
        "fillText": "fn(text: string, x: number, y: number, maxWidth: number)",
        "strokeText": "fn(text: string, x: number, y: number, maxWidth: number)",
        "measureText": "fn(text: string) -> ?",
        "drawImage": "fn(image: ?, dx: number, dy: number)",
        "createImageData": "fn(sw: number, sh: number) -> ?",
        "getImageData": "fn(sx: number, sy: number, sw: number, sh: number) -> ?",
        "putImageData": "fn(imagedata: ?, dx: number, dy: number)",
        "lineWidth": "number",
        "lineCap": "string",
        "lineJoin": "string",
        "miterLimit": "number",
        "setLineDash": "fn(segments: [number])",
        "getLineDash": "fn() -> [number]",
        "lineDashOffset": "number",
        "font": "string",
        "textAlign": "string",
        "textBaseline": "string",
        "direction": "string",
        "closePath": "fn()",
        "moveTo": "fn(x: number, y: number)",
        "lineTo": "fn(x: number, y: number)",
        "quadraticCurveTo": "fn(cpx: number, cpy: number, x: number, y: number)",
        "bezierCurveTo": "fn(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number)",
        "arcTo": "fn(x1: number, y1: number, x2: number, y2: number, radius: number)",
        "rect": "fn(x: number, y: number, w: number, h: number)",
        "arc": "fn(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: bool)",
        "ellipse": "fn(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise: bool)"
      }
    };

    editor.method('tern-browser', function () {
        return def;
    });
});

/* code_editor/tern-defs/tern-pc.js */
editor.once('load', function () {
    if (config.asset && config.asset.type !== 'script')
        return;

    var def = {};

    var data = {
        url: config.url.autocomplete,
        method: 'GET'
    };

    Ajax(data)
    .on('load', function(status, data) {
        def = data;
        editor.emit('tern:load');
    })
    .on('error', function(status, data) {
        editor.emit('tern:error', status);
    });

    editor.method('tern-pc', function () {
        return def;
    });
});

/* code_editor/editor-sync-realtime.js */
editor.once('load', function() {
    'use strict';

    // do nothing if we're editing a script instead
    // of an asset.
    // TODO: Remove this when scripts are assets
    if (! config.asset)
        return;

    var RECONNECT_INTERVAL = 1;

    var isLoading = false;
    var isSaving;
    var isDirty = false;
    var isConnected = false;
    var loadedScriptOnce = false;
    var hasError = false;

    var textDocument = null;
    var assetDocument = null;
    var editingContext = null;

    var onError = function (err) {
        console.error(err);
        hasError = true;
        editor.emit('permissions:writeState', false);
        editor.emit('realtime:error', err);
    };

    editor.method('document:isDirty', function () {
        return isDirty;
    });

    editor.method('editor:canSave', function () {
        return !hasError &&
                editor.call('editor:isDirty') &&
                !editor.call('editor:isReadonly') &&
                !isSaving &&
                isConnected;
    });

    editor.method('editor:isLoading', function () {
        return isLoading;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:isConnected', function () {
        return isConnected;
    });

    editor.method('editor:loadAssetFile', function (fn) {
        if (! assetDocument)
            return fn(new Error("Asset not loaded"));

       // var filename = assetDocument.getSnapshot().file.filename;
       var filename="assets.json"
        console.log('{{url.api}}/assets/{{asset.id}}/file/' + filename)

        Ajax({
            url: '{{url.api}}/assets/{{asset.id}}/file/' + filename,
            auth: true,
            notJson: true
        })
        .on('load', function(status, data) {
            fn(null, data);
        })
        .on('error', function (err) {
            fn(err);
        });
    });

    editor.method('editor:save', function () {
        if (! editor.call('editor:canSave'))
            return;

        isSaving = true;
        editor.emit('editor:save:start');

        if (textDocument.hasPending()) {
            // wait for pending data to be sent and
            // acknowledged by the server before saving
            textDocument.once('nothing pending', function () {
                editor.call('realtime:send', 'doc:save:', parseInt(config.asset.id, 10));
            });
        } else {
            editor.call('realtime:send', 'doc:save:', parseInt(config.asset.id, 10));
        }
    });

    // revert loads the asset file
    // and sets the document content to be the same as the asset file
    editor.method('editor:revert', function () {
        editor.call('editor:loadAssetFile', function (err, data) {
            if (err) {
                onError('Could not revert, try again later.');
                return;
            }

            var cm = editor.call('editor:codemirror');

            // force merge ops so that
            // otherwise the user will have to undo 2 times to get to the previous result
            editor.call('editor:realtime:mergeOps', true);
            cm.setValue(data);
            editor.call('editor:realtime:mergeOps', false);

            cm.focus();

            editor.call('editor:save');
        });
    });

    editor.method('editor:isReadonly', function () {
        return ! editor.call('permissions:write');
    });

    editor.once('start', function() {
        var auth = false;
        var socket;
        var connection;
        var data;
        var reconnectInterval = RECONNECT_INTERVAL;
        var documentContent = null;
        var assetContent = null;

        editor.method('realtime:connection', function () {
            return connection;
        });

        editor.method('realtime:context', function () {
            return editingContext;
        });

        editor.method('realtime:document', function () {
            return textDocument;
        });

        var reconnect = function () {
            isLoading = true;
            editor.emit('realtime:connecting');

            // create new socket...
            socket = new WebSocket(config.url.realtime.http);

            // if the connection does not exist
            // then create a new sharejs connection
            if (! connection) {
                connection = new sharejs.Connection(socket);

                connection.on('connected', function() {
                    reconnectInterval = RECONNECT_INTERVAL;

                    this.socket.send('auth' + JSON.stringify({
                        accessToken: config.accessToken
                    }));

                    isConnected = true;

                    editor.emit('realtime:connected');
                });

                connection.on('error', onError);
            } else {
                // we are reconnecting so use existing connection
                // but bind it to new socket
                connection.bindToSocket(socket);
            }

            var sharejsMessage = connection.socket.onmessage;

            connection.socket.onmessage = function(msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (!auth) {
                            auth = true;
                            data = JSON.parse(msg.data.slice(4));

                            editor.emit('realtime:authenticated');

                            // load document
                            if (! textDocument) {
                                loadDocument();
                            } else {
                                // send doc:reconnect in order for C3 to
                                // fetch the document and its asset again
                                socket.send('doc:reconnect:' + config.asset.id);
                                textDocument.resume();
                            }

                            if (! assetDocument)
                                loadAsset();
                        }
                    } else if (msg.data.startsWith('whoisonline:')) {
                        data = msg.data.slice('whoisonline:'.length);
                        var ind = data.indexOf(':');
                        if (ind !== -1) {
                            var op = data.slice(0, ind);
                            if (op === 'set') {
                                data = JSON.parse(data.slice(ind + 1));
                            } else if (op === 'add' || op === 'remove') {
                                data = parseInt(data.slice(ind + 1), 10);
                            }
                            editor.call('whoisonline:' + op, data);
                        } else {
                            sharejsMessage(msg);
                        }
                    } else {
                        sharejsMessage(msg);
                    }
                } catch (e) {
                    onError(e);
                }

            };


            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                onConnectionClosed(reason);

                auth = false;

                if (textDocument) {
                    // pause document and resume it
                    // after we have reconnected and re-authenticated
                    // otherwise the document will attempt to sync to the server
                    // as soon as we reconnect (before authentication) causing
                    // forbidden errors
                    textDocument.pause();
                }

                isLoading = false;
                isConnected = false;
                isDirty = false;

                // if we were in the middle of saving cancel that..
                isSaving = false;
                editor.emit('editor:save:cancel');

                // disconnected event
                editor.emit('realtime:disconnected', reason);

                // try to reconnect after a while
                editor.emit('realtime:nextAttempt', reconnectInterval);

                if (editor.call('visibility')) {
                    setTimeout(reconnect, reconnectInterval * 1000);
                } else {
                    editor.once('visible', reconnect);
                }

                if (reconnectInterval < 5)
                    reconnectInterval++;
            };
        };

        if (editor.call('visibility')) {
            reconnect();
        } else {
            editor.once('visible', reconnect);
        }

        var checkIfDirty = function () {
            isDirty = false;
            if (documentContent !== null && assetContent !== null) {
                isDirty = documentContent !== assetContent;

                documentContent = null;
                assetContent = null;
            }

            if (isDirty) {
                editor.emit('editor:dirty');
            }
        };

        var loadDocument = function() {
            textDocument = connection.get('documents', '' + config.asset.id);

            // error
            textDocument.on('error', onError);

            // every time we subscribe to the document
            // (so on reconnects too) listen for the 'ready' event
            // and when ready check if the document content is different
            // than the asset content in order to activate the REVERT button
            textDocument.on('subscribe', function () {
                // if we have a permanent error we need to reload the page
                // so don't continue
                if (hasError)
                    return;

                // ready to sync
                textDocument.whenReady(function () {
                    // notify of scene load
                    isLoading = false;

                    if (! editingContext) {
                        editingContext = textDocument.createContext();
                    }

                    documentContent = textDocument.getSnapshot();

                    if (! loadedScriptOnce) {
                        editor.emit('editor:loadScript', documentContent);
                        loadedScriptOnce = true;
                    } else {
                        editor.emit('editor:reloadScript', documentContent);
                    }

                    checkIfDirty();
                });
            });

            // subscribe for realtime events
            textDocument.subscribe();
        };

        var loadAsset = function() {
            // load asset document too
            assetDocument = connection.get('assets', '' + config.asset.id);

            // listen to "after op" in order to check if the asset
            // file has been saved. When the file changes this means that the
            // save operation has finished
            assetDocument.on('after op', function(ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    if (ops[i].p.length === 1 && ops[i].p[0] === 'file') {
                        isSaving = false;
                        isDirty = false;
                        editor.emit('editor:save:end');
                    }
                }
            });

            // Every time the 'subscribe' event is fired on the asset document
            // reload the asset content and check if it's different than the document content in
            // order to activate the REVERT button
            assetDocument.on('subscribe', function () {
                if (hasError)
                    return;

                assetDocument.whenReady(function() {
                    // load asset file to check if it has different contents
                    // than the sharejs document, so that we can enable the
                    // SAVE button if that is the case.
                    editor.call('editor:loadAssetFile', function (err, data) {
                        if (err) {
                            onError('Could not load asset file - please try again later.');
                            return;
                        }

                        assetContent = data;
                        checkIfDirty();
                    });
                });
            });

            assetDocument.subscribe();
        };

        editor.method('realtime:send', function(name, data) {
            socket.send(name + JSON.stringify(data));
        });


        // editor.on('realtime:disconnected', function () {
        //     editor.emit('permissions:writeState', false);
        // });

        var onLoadScript = function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        };

        editor.on('editor:loadScript', onLoadScript);
        editor.on('editor:reloadScript', onLoadScript);
    });
});


/* code_editor/editor-sync.js */
editor.once('load', function () {
    'use strict';

    // Return if we are changing an asset instead
    // of a script.
    // TODO: Remove this when scripts are assets
    if (config.asset)
        return;

    var isLoading = true;
    var isSaving = false;

    editor.method('editor:canSave', function () {
        return editor.call('editor:isDirty') && !editor.call('editor:isReadonly') && !isSaving;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:isReadonly', function () {
        return !editor.call('permissions:write') || config.project.repositories.current !== 'directory';
    });

    editor.method('editor:save', function () {
        if (! editor.call('editor:canSave')) return;

        isSaving = true;

        editor.emit('editor:save:start');

        var content = editor.call('editor:content');

        var data = {
            url: '/api/projects/{{project.id}}/repositories/directory/sourcefiles/{{file.name}}',
            method: 'PUT',
            auth: true,
            data: {
                filename: config.file.name,
                content: content
            },
            ignoreContentType: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        Ajax(data)
        .on('load', function(status, data) {
            isSaving = false;
            editor.emit('editor:save:end');
        })
        .on('progress', function(progress) {
        })
        .on('error', function(status, data) {
            isSaving = false;
            editor.emit('editor:save:error', status);
        });
    });

    editor.method('editor:loadScript', function () {
        var data = {
            url: '/api/projects/{{project.id}}/repositories/directory/sourcefiles/{{file.name}}',
            method: 'GET',
            auth: true,
            notJson: true
        };

        Ajax(data)
        .on('load', function(status, data) {
            isSaving = false;
            isLoading = false;
            editor.emit('editor:loadScript', data);
        })
        .on('progress', function(progress) {
        })
        .on('error', function(status, data) {
            isLoading = false;
            editor.emit('editor:loadScript:error', status);
        });
    });

    editor.once('start', function () {
        editor.call('editor:loadScript');
    });
});


/* code_editor/editor-codemirror.js */
editor.once('load', function () {
    'use strict';

    var element = document.getElementById('editor-container');

    // create editor
    var options = {
        mode: 'javascript',
        tabIndex: 1,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineComment: true,
        blockComment: true,
        indentUnit: 4,
        unComment: true,
        continueComments: true,
        styleActiveLine: true,
        scrollPastEnd: true,

        readOnly: editor.call('editor:isReadonly') ? true : false,

        /* match - highlighter */
        highlightSelectionMatches: {
            delay: 0,
            wordsOnly: true
        },

        // auto complete
        hintOptions: {
            completeSingle: false,
            completeOnSingleClick: false
        }
    };

    if (config.asset) {
        if (config.asset.type === 'script') {
            options.mode = 'javascript';
        } else if (config.asset.type === 'html') {
            options.mode = 'htmlmixed';
        } else if (config.asset.type === 'css') {
            options.mode = 'css';
        } else if (config.asset.type === 'json') {
            options.mode = 'javascript';
        } else if (config.asset.type === 'shader') {
            options.mode = 'glsl';
        } else {
            options.mode = 'text';
            options.lineWrapping = true;
        }

        options.gutters = ["CodeMirror-pc-gutter"];
    }

    if (!config.asset || config.asset.type === 'script') {
        options.lint = true;
        options.gutters = ["CodeMirror-lint-markers", "CodeMirror-foldgutter"];

        // folding
        options.foldOptions = {
            widget: '\u2026'
        }
        options.foldGutter = true;
    }

    options.lineNumbers = true;

    if (options.readOnly) {
        options.cursorBlinkRate = -1; // hide cursor
    }

    var codeMirror = CodeMirror(element, options);

    editor.method('editor:codemirror', function () {
        return codeMirror;
    });

    var isLoading = false;
    var code = null;
    var loadedDefinitions = false;

    var init = function () {
        if (code === null)
            return;

        var extraKeys;

        if (config.asset) {
            extraKeys = {
                'Ctrl-Z': function (cm) {
                    editor.call('editor:undo');
                },
                'Cmd-Z': function (cm) {
                    editor.call('editor:undo');
                },
                'Shift-Ctrl-Z': function (cm) {
                    editor.call('editor:redo');
                },
                'Ctrl-Y': function (cm) {
                    editor.call('editor:redo');
                },
                'Shift-Cmd-Z': function (cm) {
                    editor.call('editor:redo');
                },
                'Cmd-Y': function (cm) {
                    editor.call('editor:redo');
                }
            };
        }

        if (! config.asset || config.asset.type === 'script') {
            if (! loadedDefinitions)
                return;

            var patchScriptBeforeTern = function (code) {
                // match last occurence of 'return Name' and replace it with
                // new Name(new pc.Entity()); return Name'
                // This is so that the type inference system can deduce that Name.entity
                // is a pc.Entity
                code = code.replace(/return(\s+)?(\w+)?(?![\s\S]*return)/, 'new $2(new pc.Entity()); return $2');

                // turn this:
                // var MyScript = pc.createScript('myScript');
                // into this:
                // var MyScript = ScriptType
                code = code.replace(/var (\w+).*?=.*?pc.createScript\(.*?\)/g, 'var $1 = ScriptType');

                return code;

            };

            var server;

            // set up tern
            try {
                var server = new CodeMirror.TernServer({
                    // add definition JSON's
                    defs: [
                        editor.call('tern-ecma5'),
                        editor.call('tern-browser'),
                        editor.call('tern-pc')
                    ],
                    fileFilter: patchScriptBeforeTern,

                    // called when we are about to show the docs for a method
                    completionTip: function (data) {
                        if (data.doc) {
                            var div = document.createElement('div');
                            div.innerHTML = data.doc;
                            return div;
                        } else {
                            return null;
                        }
                    },

                    // called when we are about to show the definition of a type
                    typeTip: function (data) {
                        var tip = document.createElement('span');
                        var type = data.type;
                        if (data.url) {
                            var parts = data.url.split('/');
                            type = parts[parts.length-1].replace('.html', '');
                        }
                        tip.innerHTML = '<span><strong>' + type + '</strong>&nbsp;';
                        if (data.url) {
                            tip.innerHTML += '<a class="link-docs" href="' + data.url + '" target="_blank">View docs</a>';
                        }

                        tip.innerHTML += '</span><br/><p>' + (data.doc || 'Empty description') + '</p>';
                        return tip;
                    }
                });

                // update hints on cursor activity
                codeMirror.on("cursorActivity", function(cm) {
                    server.updateArgHints(cm);
                });

                // autocomplete
                var completeTimeout = null;
                var doComplete = function () {
                    server.complete(codeMirror);
                };

                var wordChar = /\w/;
                var shouldComplete = function (e) {
                    // auto complete on '.' or word chars
                    return !e.ctrlKey && !e.altKey && !e.metaKey && (e.keyCode === 190 || (e.key.length === 1 && wordChar.test(e.key)));
                }

                // auto complete on keydown after a bit
                // so that we have the chance to cancel autocompletion
                // if a non-word character was inserted (e.g. a semicolon).
                // Otherwise we might quickly type semicolon and get completions
                // afterwards (because it's async) and that's not what we want.
                codeMirror.on("keydown", function (cm, e) {
                    var complete = shouldComplete(e);
                    if (! complete && completeTimeout) {
                        clearTimeout(completeTimeout);
                        completeTimeout = null;
                    } else if (complete) {
                        completeTimeout = setTimeout(doComplete, 150);
                    }
                });

                extraKeys = extraKeys || {};

                extraKeys['Ctrl-Space'] = function (cm) {server.complete(cm);};
                extraKeys['Ctrl-O'] = function (cm) {server.showDocs(cm);};
                extraKeys['Cmd-O'] = function (cm) {server.showDocs(cm);};
                extraKeys['Alt-.'] = function (cm) {server.jumpToDef(cm);};
                extraKeys['Alt-,'] = function (cm) {server.jumpBack(cm);};
                extraKeys['Ctrl-Q'] = function (cm) {server.rename(cm);};
                extraKeys['Ctrl-.'] = function (cm) {server.selectName(cm);};
            } catch (ex) {
                console.error('Could not initialize auto complete');
                console.error(ex);
            }
        }

        extraKeys = extraKeys || {};

        extraKeys['Ctrl-S'] = function (cm) {editor.call('editor:save');};
        extraKeys['Cmd-S'] = function (cm) {editor.call('editor:save');};
        extraKeys['Tab'] = function(cm) {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.execCommand('insertSoftTab');
            }
        };

        extraKeys['Esc'] = function (cm) {cm.execCommand('clearSearch'); cm.setSelection(cm.getCursor("anchor"), cm.getCursor("anchor"));};
        extraKeys["Shift-Tab"] = "indentLess";
        extraKeys['Ctrl-/'] = 'toggleComment';
        extraKeys['Cmd-/'] = 'toggleComment';

        extraKeys['Ctrl-I'] = 'indentAuto';
        extraKeys['Cmd-I'] = 'indentAuto';

        extraKeys['Alt-Up'] = function (cm) {cm.execCommand('goLineUp'); cm.execCommand('goLineEnd');};
        extraKeys['Alt-Down'] = function (cm) {cm.execCommand('goLineDown'); cm.execCommand('goLineEnd');};

        // create key bindings
        codeMirror.setOption("extraKeys", CodeMirror.normalizeKeyMap(extraKeys));

        isLoading = true;
        codeMirror.setValue(code);
        code = null;

        // if there is a line parameter then go to that line
        var line = config.file.line;
        var col = config.file.col;
        if (line) {
            codeMirror.setCursor(line - 1, col - 1);

            // add error class to the container if there is an error
            if (config.file.error) {
                element.classList.add('error');

                // clear error class when we interact with the editor
                var clearError = function () {
                    element.classList.remove('error');
                    codeMirror.off('beforeSelectionChange', clearError);
                };

                codeMirror.on('beforeSelectionChange', clearError);
            }
        }

        codeMirror.clearHistory();
        codeMirror.markClean();

        codeMirror.focus();

        isLoading = false;

    };

    // wait for tern definitions to be loaded
    editor.on('tern:load', function () {
        loadedDefinitions = true;
        init();
    });

    // load script
    editor.on('editor:loadScript', function (data) {
        code = data;
        init();
    });

    editor.on('editor:reloadScript', function (data) {
        // if the reloaded data are different
        // than the current editor value then reset the contents
        // of the editor - that can happen if a change has been rolled back
        // by sharejs for example
        if (codeMirror.getValue() === data)
            return;

        var isDirty = editor.call('editor:isDirty');
        isLoading = true;
        code = data;
        codeMirror.setValue(code);

        if (!isDirty)
            codeMirror.markClean();

        isLoading = false;

    });

    // emit change
    // use 'beforeChange' event so that
    // we capture the state of the document before it's changed.
    // This is so that we send correct operations to sharejs.
    codeMirror.on('beforeChange', function (cm, change) {
        if (isLoading) return;
        editor.emit('editor:change', cm, change);
    });

    // called after a change has been made
    codeMirror.on('change', function (cm, change) {
        if (isLoading) return;
        editor.emit('editor:afterChange', cm, change);
    });

    var stateBeforeReadOnly = null;

    var toggleReadOnly = function (readOnly) {
        var cm = codeMirror;

        // remember state before we make this read only
        if (readOnly) {
            stateBeforeReadOnly = {
                scrollInfo: cm.getScrollInfo(),
                cursor: cm.getCursor()
            };
        }

        codeMirror.setOption('readOnly', readOnly ? true : false);
        codeMirror.setOption('cursorBlinkRate', readOnly ? -1 : 530);

        // if we are enabling write then restore
        // previous state
        if (! readOnly && stateBeforeReadOnly) {
            var cursorCoords = cm.cursorCoords(stateBeforeReadOnly.cursor, 'local');
            cm.setCursor(stateBeforeReadOnly.cursor);

            // scroll back to where we were if needed
            var scrollInfo = stateBeforeReadOnly.scrollInfo;
            if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
                cm.scrollTo(scrollInfo.left, scrollInfo.top);
            }
        }
    };

    // permissions changed so set readonly
    editor.on('permissions:set:' + config.self.id, function (level) {
        toggleReadOnly(editor.call('editor:isReadonly'));
    });

    // set readonly if writeState becomes false (like when we're disconnected from sharejs)
    editor.on('permissions:writeState', function (state) {
        toggleReadOnly(!state);
    });

    // return document content
    editor.method('editor:content', function () {
        return codeMirror.getValue();
    });

    // returns true if document is dirty
    editor.method('editor:isDirty', function () {
        return !codeMirror.isClean() || editor.call('document:isDirty');
    });

    // mark document as clean
    editor.on('editor:save:end', function () {
        codeMirror.markClean();
    });

    // fired when the user tries to leave the current page
    if (! config.asset) {
        window.onbeforeunload = function (event) {
            var message;

            editor.emit('editor:beforeQuit');

            if (editor.call('editor:canSave')) {
                message = 'You have unsaved changes. Are you sure you want to leave?';
                event.returnValue = message;
            }

            return message;
        };
    }

});


/* code_editor/editor-codemirror-realtime.js */
// credit to https://github.com/share/share-codemirror
// most of the code in here is taken from there

editor.once('load', function () {
    'use strict';

    if (!config.asset)
        return;

    // editor
    var cm = editor.call('editor:codemirror');
    // sharejs document context
    var share;

    var undoStack = [];
    var redoStack = [];

    var MAX_UNDO_SIZE = 200;

    // amount of time to merge local edits into one
    var delay = 2000;

    // amount of time since last local edit
    var lastEditTime = 0;

    // if true then the last two ops will be concatenated no matter what
    var forceConcatenate = false;

    var isConnected = false;

    var lastChangedLine = null;
    var changedLine = null;

    editor.method('editor:realtime:mergeOps', function (force) {
        forceConcatenate = force;
    });


    // create local copy of insert operation
    var createInsertOp = function (pos, text) {
        return customOp(
            pos ? [pos, text] : [text]
        );
    };

    // create local copy of remove operation
    var createRemoveOp = function (pos, length, text) {
        var result = customOp(
            pos ? [pos, {d: length}] : [{d: length}]
        );

        // if text exists remember if it's whitespace
        // so that we concatenate multiple whitespaces together
        if (text) {
            if (/^[ ]+$/.test(text)) {
                result.isWhiteSpace = true;
            } else if (/^\n+$/.test(text)) {
                result.isWhiteSpace = true;
                result.isNewLine = true;
            }
        }

        return result;
    };

    // Returns an object that represents an operation
    // result.op - the operation
    // result.time - the time when the operation was created (used to concatenate adjacent operations)
    var customOp = function (op) {
        return {
            op: op,
            time: Date.now()
        };
    };

    // returns true if the two operations can be concatenated
    var canConcatOps = function (prev, next) {
        if (forceConcatenate)
            return true;

        var prevLen = prev.op.length;
        var nextLen = next.op.length;

        // true if both are noops
        if (prevLen === 0 || nextLen === 0) {
            return true;
        }

        var prevDelete = false;
        for (var i = 0; i < prevLen; i++) {
            if (typeof(prev.op[i]) === 'object') {
                prevDelete = true;
                break;
            }
        }

        var nextDelete = false;
        for (var i = 0; i < nextLen; i++) {
            if (typeof(next.op[i]) === 'object') {
                nextDelete = true;
                break;
            }
        }


        // if one of the ops is a delete op and the other an insert op return false
        if (prevDelete !== nextDelete) {
            return false;
        }

        // if we added a whitespace after a non-whitespace return false
        if (next.isWhiteSpace && !prev.isWhiteSpace)
            return false;

        // check if the two ops are on different lines
        if (changedLine !== lastChangedLine) {
            // allow multiple whitespaces to be concatenated
            // on different lines unless the previous op is a new line
            if (prev.isWhiteSpace && !prev.isNewLine) {
                return false;
            }

            // don't allow concatenating multiple inserts in different lines
            if (!next.isWhiteSpace && !prev.isWhiteSpace)
                return false;
        }

        return true;
    };

    // transform first operation against second operation
    // priority is either 'left' or 'right' to break ties
    var transform = function (op1, op2, priority) {
        return share._doc.type.transform(op1, op2, priority);
    };

    // concatenate two ops
    var concat = function (prev, next) {
        if (! next.isWhiteSpace) {
            prev.isWhiteSpace = false;
            prev.isNewLine = false;
        } else {
            if (next.isNewLine)
                prev.isNewLine = true;
        }

        prev.op = share._doc.type.compose(next.op, prev.op);
    };

    // invert an op an return the result
    var invert = function (op, snapshot) {
        return share._doc.type.semanticInvert(snapshot, op);
    };

    // transform undo and redo operations against the new remote operation
    var transformStacks = function (remoteOp) {
        var i = undoStack.length;
        var initialRemoteOp = remoteOp.op;

        while (i--) {
            var localOp = undoStack[i];
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left');

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                undoStack.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right');
            }
        }

        remoteOp.op = initialRemoteOp;
        i = redoStack.length;
        while (i--) {
            var localOp = redoStack[i] ;
            var old = localOp.op;
            localOp.op = transform(localOp.op, remoteOp.op, 'left');

            // remove noop
            if (localOp.op.length === 0 || (localOp.op.length === 1 && typeof localOp.op === 'object' && localOp.op.d === 0)) {
                redoStack.splice(i, 1);
            } else {
                remoteOp.op = transform(remoteOp.op, old, 'right');
            }
        }

        //console.log('transform', remoteOp.op);
        //printStacks();
    };

    // creates dummy operation in order to move the cursor
    // correctly when remote ops are happening
    var createCursorOp = function (pos) {
        return createInsertOp(cm.indexFromPos(pos), ' ');
    };

    // create 2 ops if anchor and head are different or 1 if they are the same (which is just a cursor..)
    var createCursorOpsFromSelection = function (selection) {
        return selection.anchor === selection.head ?
               createCursorOp(selection.anchor) :
               [createCursorOp(selection.anchor), createCursorOp(selection.head)];
    };

    // transform dummy ops with remote op
    var transformCursorOps = function (ops, remoteOp) {
        for (var i = 0, len = ops.length; i < len; i++) {
            var data = ops[i];
            if (data.length) {
                for (var j = 0; j < data.length; j++) {
                    data[j].op = transform(data[j].op, remoteOp, 'right')
                }
            } else {
                data.op = transform(data.op, remoteOp, 'right');
            }
        }
    };

    var posFromCursorOp = function (cursorOp) {
        return cm.posFromIndex(cursorOp.op.length > 1 ? cursorOp.op[0] : 0);
    };

    var restoreSelectionsOptions = {
        scroll: false
    };

    // restore selections after remote ops
    var restoreSelections = function (cursorOps) {
        for (var i = 0, len = cursorOps.length; i < len; i++) {
            var data = cursorOps[i];
            var start,end;

            if (data.length) {
                start = posFromCursorOp(data[0]);
                end = posFromCursorOp(data[1]);
            } else {
                start = posFromCursorOp(data);
                end = start;
            }

            cm.addSelection(start, end, restoreSelectionsOptions);
        }
    };

    // Called when the script / asset is loaded
    var onLoaded = function () {
        share = editor.call('realtime:context');

        // insert server -> local
        share.onInsert = function (pos, text) {
            // transform undos / redos with new remote op
            var remoteOp = createInsertOp(pos, text);
            transformStacks(remoteOp);

            // apply the operation locally
            suppress = true;
            var from = cm.posFromIndex(pos);

            // get selections before we change the contents
            var selections = cm.listSelections();
            var cursorOps = selections.map(createCursorOpsFromSelection);
            transformCursorOps(cursorOps, remoteOp.op);

            cm.replaceRange(text, from);

            // restore selections after we set the content
            restoreSelections(cursorOps);

            suppress = false;
        };

        // remove server -> local
        share.onRemove = function (pos, length) {
            suppress = true;
            var from = cm.posFromIndex(pos);
            var to = cm.posFromIndex(pos + length);

            // add remote operation to the edits stack
            var remoteOp = createRemoveOp(pos, length);
            transformStacks(remoteOp);

            // get selections before we change the contents
            var selections = cm.listSelections();
            var cursorOps = selections.map(createCursorOpsFromSelection);
            transformCursorOps(cursorOps, remoteOp.op);

            // apply operation locally
            cm.replaceRange('', from, to);

            // restore selections after we set the content
            restoreSelections(cursorOps);

            suppress = false;
        };

        isConnected = true;
    };

    editor.on('editor:loadScript', onLoaded);

    // editor.on('realtime:disconnected', function () {
    //     isConnected = false;
    // });

    // debug function
    var printStacks = function () {
        console.log('undo');
        undoStack.forEach(function (i) {
            console.log(i.op);
        });

        console.log('redo');
        redoStack.forEach(function (i) {
            console.log(i.op);
        });
    };


    // Called when the user presses keys to Undo
    editor.method('editor:undo', function () {
        if (!isConnected || ! undoStack.length) return;

        var snapshot = share.get() || '';
        var curr = undoStack.pop();

        var inverseOp = {op: invert(curr.op, snapshot)};
        redoStack.push(inverseOp);

        applyCustomOp(curr.op);

        //printStacks();
    });

    // Called when the user presses keys to Redo
    editor.method('editor:redo', function () {
        if (! isConnected || !redoStack.length) return;

        var snapshot = share.get() || '';
        var curr = redoStack.pop();

        var inverseOp = {op: invert(curr.op, snapshot)};
        undoStack.push(inverseOp);

        applyCustomOp(curr.op);

        //printStacks();
    });

    // Applies an operation to the sharejs document
    // and sets the result to the editor
    var applyCustomOp = function (op) {
        share.submitOp(op, function (err) {
            if (err) {
                console.error(err);
                editor.emit('realtime:error', err);
                return;
            }
        });

        var scrollInfo = cm.getScrollInfo();

        // remember folded positions
        var folds = cm.findMarks(
            CodeMirror.Pos(cm.firstLine(), 0),
            CodeMirror.Pos(cm.lastLine(), 0)
        ).filter(function (mark) {
            return mark.__isFold
        });

        // transform folded positions with op
        var foldOps;
        if (folds.length) {
            foldOps = [];
            for (var i = 0; i < folds.length; i++) {
                var pos = CodeMirror.Pos(folds[i].lines[0].lineNo(), 0);
                foldOps.push(createCursorOp(pos));
            }

            transformCursorOps(foldOps, op);
        }

        suppress = true;
        cm.setValue(share.get() || '');
        suppress = false;

        // restore folds because after cm.setValue they will all be lost
        if (foldOps) {
            for (var i = 0; i < foldOps.length; i++) {
                var pos = posFromCursorOp(foldOps[i]);
                cm.foldCode(pos);
            }
        }

        // set cursor
        // put it after the text if text was inserted
        // or keep at the the delete position if text was deleted
        var cursor = 0;
        if (op.length === 1) {
            if (typeof op[0] === 'string') {
                cursor += op[0].length;
            }
        } else if (op.length > 1) {
            cursor = op[0];
            if (typeof op[1] === 'string') {
                cursor += op[1].length;
            }
        }

        var cursorPos = cm.posFromIndex(cursor);
        var cursorCoords = cm.cursorCoords(cursorPos, 'local');

        cm.setCursor(cursorPos);

        // scroll back to where we were if needed
        if (cursorCoords.top >= scrollInfo.top && cursorCoords.top <= scrollInfo.top + scrollInfo.clientHeight) {
            cm.scrollTo(scrollInfo.left, scrollInfo.top);
        }

        // instantly flush changes
        // share._doc.resume();
        // share._doc.pause();
    };

    var suppress = false;

    // local -> server
    editor.on('editor:change', function (cm, change) {
        if (!share || suppress) return;

        applyToShareJS(cm, change);

        // clear redo stack
        redoStack.length = 0;

    });

    // // started saving so flush changes
    // editor.on('editor:save:start', function () {
    //     flushInterval();
    // });

    // editor.on('editor:beforeQuit', function () {
    //     // flush changes before leaving the window
    //     flushInterval();
    // });

    // add local op to undo history
    var addToHistory = function (localOp) {
        // try to concatenate new op with latest op in the undo stack
        var timeSinceLastEdit = localOp.time - lastEditTime;
        if (timeSinceLastEdit <= delay || forceConcatenate) {
            var prev = undoStack[undoStack.length-1];
            if (prev && canConcatOps(prev, localOp)) {
                concat(prev, localOp);
                return;
            }
        }

        // cannot concatenate so push new op
        undoStack.push(localOp);

        // make sure our undo stack doens't get too big
        if (undoStack.length > MAX_UNDO_SIZE) {
            undoStack.splice(0, 1);
        }

        // update lastEditTime
        lastEditTime = Date.now();
    };

    // Flush changes to the server
    // and pause until next flushInterval
    // var flushInterval = function () {
    //     if (share && share._doc) {
    //         share._doc.resume();
    //         share._doc.pause();
    //     }
    // };

    // flush changes to server every once in a while
    // setInterval(flushInterval, 500);

    // Convert a CodeMirror change into an op understood by share.js
    function applyToShareJS(cm, change) {
        var startPos = 0;  // Get character position from # of chars in each line.
        var i = 0;         // i goes through all lines.
        var text;
        var op;

        lastChangedLine = changedLine || change.from.line;
        changedLine = change.from.line;

        while (i < change.from.line) {
            startPos += cm.lineInfo(i).text.length + 1;   // Add 1 for '\n'
            i++;
        }

        startPos += change.from.ch;

        // handle delete
        if (change.to.line != change.from.line || change.to.ch != change.from.ch) {
            text = cm.getRange(change.from, change.to);

            if (text) {
                op = createInsertOp(startPos, text);
                addToHistory(op);

                share.remove(startPos, text.length);

                // force concatenation of subsequent ops for this frame
                forceConcatenate = true;
            }
        }

        // handle insert
        if (change.text) {
            text = change.text.join('\n');

            if (text) {
                op = createRemoveOp(startPos, text.length, text);
                addToHistory(op);

                share.insert(startPos, text);

                // force concatenation of subsequent ops for this frame
                forceConcatenate = true;
            }
        }

        if (change.next) {
            applyToShareJS(cm, change.next);
        }

        // restore forceConcatenate after 1 frame
        // do it in a timeout so that operations done
        // by multiple cursors for example are treated as one
        setTimeout(function () {
            forceConcatenate = false;
        });
    }

    // function print (text) {
    //     var chars = [];
    //     if (! text) return chars;

    //     for (var i = 0; i < text.length; i++)
    //         chars.push(text.charCodeAt(i));

    //     return chars;
    // }
});

/* code_editor/editor-toolbar.js */
editor.once('load', function () {
    'use strict';

    document.getElementById('editor').style.display = 'block';

    var saveBtn = document.getElementById('btn-save');
    saveBtn.addEventListener('click', function () {
        editor.call('editor:save');
    });

    var revertBtn = document.getElementById('btn-revert');
    revertBtn.addEventListener('click', function () {
        editor.call('editor:revert');
    });

    var progress = document.getElementById('progress');
    var connecting = document.getElementById('connection-progress');
    var readonly = document.getElementById('readonly');
    var error = document.getElementById('error');
    var errorMsg = null;

    var refreshSaveButton = function () {
        if (editor.call('editor:isDirty')) {
            if (! /^\* /.test(document.title)) {
                document.title = '* ' + document.title;
            }
        } else {
            if (/^\* /.test(document.title)) {
                document.title = document.title.substring(2);
            }
        }

        if (! editor.call('editor:canSave')) {
            saveBtn.setAttribute('disabled', '');
            revertBtn.setAttribute('disabled', '');
        } else {
            saveBtn.removeAttribute('disabled');
            revertBtn.removeAttribute('disabled');
        }
    };

    var shouldShowProgress = function () {
        return editor.call('editor:isConnected') &&
                (editor.call('editor:isSaving') ||  editor.call('editor:isLoading'));
    };

    var shouldShowConnectionProgress = function () {
        return config.asset && !editor.call('editor:isConnected');
    };

    var refreshButtons = function () {
        var isReadonly = editor.call('editor:isReadonly');

        var hide = 'none';
        var show = 'inline-block';

        progress.style.display = shouldShowProgress() ? show : hide;
        connecting.style.display = shouldShowConnectionProgress() ? show : hide;
        readonly.style.display = isReadonly ? show : hide;
        saveBtn.style.display = isReadonly ? hide : show;
        revertBtn.style.display = isReadonly || !config.asset ? hide : show;
        error.style.display = errorMsg ? show : hide;

        refreshSaveButton();
    };

    refreshButtons();

    var showError = function (error) {
        console.error('There was an error: ' + error);
    };

    editor.on('editor:save:start', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:save:end', refreshButtons);
    editor.on('editor:save:cancel', refreshButtons);
    editor.on('editor:dirty', refreshButtons);

    editor.on('editor:save:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while saving: ' + err;
        refreshButtons();
    });

    editor.on('editor:loadScript', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:reloadScript', function () {
        errorMsg = null;
        refreshButtons();
    });

    editor.on('editor:loadScript:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while loading: ' + err;
        refreshButtons();
    });

    editor.on('tern:error', function (err) {
        errorMsg = err;
        error.innerHTML = 'Error while loading autocomplete: ' + err;
        refreshButtons();
    });

    var knownErrors = [
        /Invalid version from server/,
        /Op apply failed/,
        /opAcknowledged called from a null state/
    ];

    editor.on('realtime:error', function (err) {
        for (var i = 0; i < knownErrors.length; i++) {
            if (knownErrors[i].test(err)) {
                err = 'Could not reconnect successfully, please refresh the page.'
            }
        }

        errorMsg = err;
        error.innerHTML = 'Error: ' + err;
        refreshButtons();
    });

    editor.on('realtime:connecting', refreshButtons);

    var reconnectTimeout;

    editor.on('realtime:connected', function () {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (disconnectedTimeout) {
            showDisconnectionErrors = false;
            clearTimeout(disconnectedTimeout);
            disconnectedTimeout = null;
        }
    });

    var disconnectedTimeout;
    var showDisconnectionErrors = false;

    var disconnectedDelay = 5; // seconds before we show disconnected messages

    var deferDisconnected = function () {
        refreshButtons();

        if (disconnectedTimeout)
            return;

        disconnectedTimeout = setTimeout(function () {
            showDisconnectionErrors = true;
        }, disconnectedDelay * 1000);
    }

    editor.on('realtime:nextAttempt', function (time) {
        var before = new Date();

        deferDisconnected();

        function setText (remaining) {
            if (! showDisconnectionErrors)
                return;

            errorMsg = 'Disconnected. Reconnecting in ' + time + ' seconds...';
            error.innerHTML = errorMsg;
            refreshButtons();
        }

        function renderTime () {
            var now = new Date();
            var elapsed = now.getTime() - before.getTime();
            before = now;
            time -= Math.round(elapsed / 1000);
            if (time < 0) {
                time = 0;
            } else {
                reconnectTimeout = setTimeout(renderTime, 1000);
            }

            setText(time);
        }

        setText(time);

        reconnectTimeout = setTimeout(renderTime, 1000);
    });

    editor.on('editor:afterChange', refreshSaveButton);

    editor.on('permissions:set:' + config.self.id, function (level) {
        refreshButtons();
    });

    // online users
    var users = document.getElementById('users');

    var createUser = function (id) {
        var a = document.createElement('a');
        a.href = '/' + id;
        a.id = 'user-' + id;
        a.target = '_blank';
        var img = document.createElement('img');
        img.src = '/api/' + id + '/thumbnail?size=32';
        a.appendChild(img);
        users.appendChild(a);
    };

    var deleteUser = function (id) {
        var a = document.getElementById('user-' + id);
        if (a) {
            a.parentNode.removeChild(a);
        }
    };

    editor.on('whoisonline:set', function (data) {
        users.innerHTML = '';

        // add users
        for (var id in data)
            createUser(id);
    });

    editor.on('whoisonline:add', createUser);
    editor.on('whoisonline:remove', deleteUser);
});


/* code_editor/editor-whoisonline.js */
editor.once('load', function () {
    'use strict';

    var whoisonline = { };

    editor.method('whoisonline:set', function (list) {
        for (var i = 0; i < list.length; i++)
            whoisonline[list[i]] = true;

        editor.emit('whoisonline:set', whoisonline);
    });

    editor.method('whoisonline:add', function (id) {
        whoisonline[id] = true;
        editor.emit('whoisonline:add', id);
    });

    editor.method('whoisonline:remove', function (id) {
        delete whoisonline[id];
        editor.emit('whoisonline:remove', id);
    });

    // remove all users if we are disconnected
    editor.on('realtime:disconnected', function () {
        for (var key in whoisonline) {
            editor.call('whoisonline:remove', key);
        }
    });
});


