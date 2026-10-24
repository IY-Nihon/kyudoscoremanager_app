/**
 * Alert を、ブラウザの窓ではなくアプリの中の窓（AppDialog）へ流す橋渡し。
 */
'use strict';

class Alert {
  static alert(title, message, buttons) {
    require('./AppDialog').出す(title, message, buttons);
  }
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Alert;
