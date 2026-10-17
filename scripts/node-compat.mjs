import util from 'node:util';
import { syncBuiltinESMExports } from 'node:module';

const origStyleText = util.styleText;

/**
 * 向下相容修補程式 (Polyfill)：
 * Node.js v20.12.x 之 util.styleText 尚未支援陣列格式參數（如 ['underline', 'gray']，於 v20.13.0+ 始支援）。
 * 透過修改 util.styleText 並呼叫 syncBuiltinESMExports()，使 ESM 模組具名匯入同步生效。
 * @param {string|string[]} format - 樣式名稱或樣式名稱陣列。
 * @param {string} text - 欲套用終端機色彩樣式之文字。
 * @returns {string} 套用 ANSI Escape Code 後之字串。
 */
if (typeof origStyleText === 'function') {
  util.styleText = function patchedStyleText(format, text) {
    if (Array.isArray(format)) {
      return format.reduce((acc, fmt) => origStyleText(fmt, acc), text);
    }
    return origStyleText(format, text);
  };
  syncBuiltinESMExports();
}
