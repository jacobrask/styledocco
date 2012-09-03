// Modified version of "Sugared DOM" from https://gist.github.com/1532562

(function () {

'use strict';

var domsugar = function (doc) {
  var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  };
  var isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };
  var directProperties = {
    'class': 'className',
    className: 'className',
    defaultValue: 'defaultValue',
    'for': 'htmlFor',
    html: 'innerHTML',
    id: 'id',
    name: 'name',
    src: 'src',
    text: 'textContent',
    title: 'title',
    value: 'value'
  };
  var booleanProperties = {
    checked: 1,
    defaultChecked: 1,
    disabled: 1,
    hidden: 1,
    multiple: 1,
    selected: 1
  };

  var setProperty = function (el, key, value) {
    var prop = directProperties[key];
    if (prop) {
      el[prop] = (value == null ? '' : '' + value);
    } else if (booleanProperties[key]) {
      el[key] = !!value;
    } else if (value == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, '' + value);
    }
  };

  var appendChildren = function (el, children) {
    for (var i = 0, l = children.length, child; i < l; i += 1) {
      child = children[i];
      if (isArray(child)) {
        appendChildren(el, child);
      } else {
        if (typeof child === 'string') child = doc.createTextNode(child);
        el.appendChild(child);
      }
    }
  };

  var splitter = /(#|\.)/;
  return function (tag, props, children) {
    if (isArray(props)) {
      children = props;
      props = {};
    }
    props = props || {};
    if (typeof tag === 'string' && splitter.test(tag)) {
      var parts = tag.split(splitter);
      tag = parts[0] || 'div';
      for (var i = 1, j = 2, name; j < parts.length; i += 2, j += 2) {
        name = parts[j];
        if (parts[i] === '#') props.id = name;
        else props.className = props.className ? props.className + ' ' + name : name;
      }
    }
    tag = tag || 'div';
    var el = isElement(tag) ? tag : doc.createElement(tag);
    for (var prop in props) {
      setProperty(el, prop, props[prop]);
    }
    if (children) appendChildren(el, children);
    return el;
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = domsugar;
} else {
  window.domsugar = domsugar;
}

}());
