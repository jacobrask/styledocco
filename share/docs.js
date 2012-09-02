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

  var editEvent = new CustomEvent('edit');
  var didChange = function() {
    if (this._oldValue !== this.value) this.dispatchEvent(editEvent);
    this._oldValue = this.value;
  };
  codeEl.addEventListener('keypress', didChange);
  codeEl.addEventListener('keyup', didChange);

});

})();
