(function () {

'use strict';

// Browserify
var _, renderPreview;
if (typeof module == "object" && typeof require == "function") {
  _ = require('./iterhate');
  renderPreview = require('./previews');
} else {
  _ = window._;
  renderPreview = window.styledocco.renderPreview;
}

var doc = document;

_(doc.getElementsByClassName('preview-code')).forEach(function(codeEl) {

  renderPreview(codeEl);

  codeEl._editEvent = new CustomEvent('edit');
  codeEl._code = '';
  Object.defineProperty(codeEl, 'code', {
    get: function() {
      return this._code;
    },
    set: function(val) {
      this.dispatchEvent(this._editEvent);
      this._code = val;
    }
  });
  var updateCode = function() {
    if (this.code !== this.value) this.code = this.value;
  };
  codeEl.addEventListener('keypress', updateCode);
  codeEl.addEventListener('keyup', updateCode);

});

})();
