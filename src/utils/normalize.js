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


