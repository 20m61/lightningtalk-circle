/**
 * setImmediate polyfill for test environment
 * Node.js v22 で setImmediate が削除されたため、テスト環境用のポリフィルを提供
 */

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = function (callback, ...args) {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = function (id) {
    return clearTimeout(id);
  };
}
