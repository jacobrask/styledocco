// StyleDocco shared JavaScript
// ============================
(function () {

'use strict';

var doc = document;

// Inspired by / stolen from "Sugared DOM" https://gist.github.com/1532562
var makeElFn = function (doc) {
  var win = doc.defaultView;
  var directProperties = {
    'class': 'className',
    className: 'className',
    html: 'innerHTML',
    id: 'id',
    name: 'name',
    src: 'src',
    text: 'textContent',
    title: 'title',
    value: 'value'
  };
  var booleanProperties = [ 'checked', 'disabled', 'hidden', 'multiple', 'selected' ];

  var setProperty = function (el, key, value) {
    var prop = directProperties[key];
    if (prop) {
      el[prop] = (value == null ? '' : '' + value);
    } else if (booleanProperties.indexOf(key) !== -1) {
      el[key] = !!value;
    } else if (value == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, '' + value);
    }
  };

  var appendChildren = function (el, children) {
    for (var i = 0, child; i < children.length; i += 1) {
      child = children[i];
      if (child instanceof win.Array) {
        appendChildren(el, child);
      } else {
        if (typeof child === 'string') child = doc.createTextNode(child);
        el.appendChild(child);
      }
    }
  };

  var splitter = /(#|\.)/;
  var create = function (tagName, props, children) {
    if (props instanceof win.Array) {
      children = props;
      props = {};
    }
    props = props || {};

    if (splitter.test(tagName)) {
      var parts = tagName.split(splitter);
      tagName = parts[0];
      if (tagName === '') tagName = 'div';
      var name;
      for (var i = 1, j = 2; j < parts.length; i += 2, j += 2) {
        name = parts[j];
        if (parts[i] === '#') props.id = name;
        else props.className = props.className ? props.className + ' ' + name : name;
      }
    }
    var el = doc.createElement(tagName);
    for (var prop in props) {
      setProperty(el, prop, props[prop]);
    }
    if (children) appendChildren(el, children);
    return el;
  };
  return create;
};

// Get the style property of element. Convert numerical values to integers
// and falsy values to null.
var getStyle = function(el, prop) {
  var val = el.ownerDocument.defaultView.getComputedStyle(el).getPropertyValue(prop);
  val = ([ 'none', '' ].indexOf(val) !== -1) ? null : val;
  var integer = parseInt(val, 10);
  return isNaN(integer) ? val : integer;
};

var styledocco = window.styledocco = {};
styledocco.el = makeElFn(doc);
styledocco.el.makeElFn = makeElFn;
styledocco.getStyle = getStyle;

}());
