// 文本规范化与 LIKE 转义工具

/**
 * 规范化文本用于搜索：
 * - 转为字符串
 * - 转为小写
 * - 标准化全角/半角括号、逗号、句号
 * - 去除首尾空白，并压缩多余空白
 */
function normalizeToSearch(input) {
  if (input === null || input === undefined) return '';
  let text = String(input);

  // 转小写
  text = text.toLowerCase();

  // 替换全角括号/逗号/句号为半角
  text = text
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/。/g, '.');

  // 规整空白
  text = text.trim().replace(/\s+/g, ' ');

  return text;
}

/**
 * 转义 LIKE 模式中的特殊字符
 * % 和 _ 在 LIKE 中有特殊含义，需要转义
 */
function escapeForLike(input) {
  return String(input)
    .replace(/\\/g, "\\\\") // 先转义反斜杠本身
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * 获取用于 SQL 的标准化表达式（与 normalizeToSearch 对应）
 * 注意：这里不处理空白压缩，仅做必要的符号替换与 lower
 */
function normalizedSqlExpr(columnName) {
  // 与 JS 端保持一致：lower + 括号/逗号/句号替换
  return `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(${columnName}, '（', '('), '）', ')'), '，', ','), '。', '.'))`;
}

module.exports = {
  normalizeToSearch,
  escapeForLike,
  normalizedSqlExpr,
};

// 将全角字母/数字转换为半角；保留其他字符
function toHalfWidthAlphaNumeric(input) {
  if (input === null || input === undefined) return '';
  let out = '';
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // 全角数字 ０-９
    if (code >= 0xFF10 && code <= 0xFF19) {
      out += String.fromCharCode(code - 0xFF10 + 0x30);
      continue;
    }
    // 全角大写 A-Z
    if (code >= 0xFF21 && code <= 0xFF3A) {
      out += String.fromCharCode(code - 0xFF21 + 0x41);
      continue;
    }
    // 全角小写 a-z
    if (code >= 0xFF41 && code <= 0xFF5A) {
      out += String.fromCharCode(code - 0xFF41 + 0x61);
      continue;
    }
    out += s[i];
  }
  return out;
}

/**
 * 规范化选项键字符（如 A/B/C 或 1/2/3）：
 * - 全角转半角
 * - 转为大写
 * - 提取第一个 [A-Z0-9] 字符
 */
function normalizeKeyChar(input) {
  if (input === null || input === undefined) return '';
  const half = toHalfWidthAlphaNumeric(input);
  const upper = String(half).toUpperCase();
  const match = upper.match(/[A-Z0-9]/);
  return match ? match[0] : '';
}

module.exports.toHalfWidthAlphaNumeric = toHalfWidthAlphaNumeric;
module.exports.normalizeKeyChar = normalizeKeyChar;


