const db = require('../db/mysql');
const { normalizeToSearch, escapeForLike, normalizedSqlExpr, normalizeKeyChar, toHalfWidthAlphaNumeric } = require('../utils/normalize');

// 构建规范化后的选项映射：{ A: '内容', B: '内容', 1: '内容' }
function buildOptionsMap(raw) {
  const map = {};
  let options = raw;
  try {
    if (typeof raw === 'string') {
      options = JSON.parse(raw);
    }
  } catch (e) {
    return map;
  }

  // 处理数组：可能是对象数组或字符串数组
  if (Array.isArray(options)) {
    for (const item of options) {
      if (item == null) continue;
      if (typeof item === 'string') {
        const s = item.trim();
        // 尝试从前缀提取键，如："A. 文本"、"A、文本"、"A) 文本"、"１）文本"
        const firstChar = s.charAt(0);
        const nk = normalizeKeyChar(firstChar);
        if (nk) {
          const rest = s.replace(/^\s*[A-Za-z0-9Ａ-Ｚａ-ｚ０-９][\.|、|\)|）]?\s*/, '');
          map[nk] = String(rest);
          continue;
        }
        // 无法提取键，跳过
        continue;
      }
      if (typeof item === 'object') {
        const keyCandidate = item.key ?? item.K ?? item.label ?? item.option ?? item.opt ?? item.k;
        const valCandidate = item.value ?? item.text ?? item.label ?? item.content ?? item.v ?? item.optionValue ?? item.val;
        if (keyCandidate !== undefined) {
          const nk = normalizeKeyChar(keyCandidate);
          if (nk) {
            map[nk] = String(valCandidate ?? '');
            continue;
          }
        }
        // 尝试对象键值形式：{"A":"文本"}
        for (const [k, v] of Object.entries(item)) {
          const nk = normalizeKeyChar(k);
          if (nk) {
            map[nk] = String(v ?? '');
          }
        }
      }
    }
    return map;
  }

  // 处理对象：{"A":"文本"} 或 {"1":"文本"}
  if (options && typeof options === 'object') {
    for (const [k, v] of Object.entries(options)) {
      const nk = normalizeKeyChar(k);
      if (nk) {
        map[nk] = String(v ?? '');
      }
    }
  }
  return map;
}

const getQuestions = async (req, res) => {
  // 1. 从查询参数中获取筛选条件，移除 kind_text
  const { qtree2, Qtree1, number, random } = req.query;

  // 2. 校验必需参数，现在是 Qtree1 和 qtree2
  if (!Qtree1 || !qtree2) {
    return res.status(400).json({
      error: '参数缺失',
      message: '`Qtree1` 和 `qtree2` 是必需的查询参数。',
      example: '/api/questions?Qtree1=主分类&qtree2=子分类&number=5&random=true'
    });
  }

  try {
    // 3. 动态构建SQL查询
    let whereClauses = [];
    let params = [];

    // 处理 Qtree1 (现在是必需的)
    const qtree1Array = Qtree1.split(',');
    whereClauses.push('Qtree1 IN (?)');
    params.push(qtree1Array);

    // 处理 qtree2
    const qtree2Array = qtree2.split(',');
    whereClauses.push('Qtree2 IN (?)');
    params.push(qtree2Array);
    
    const limit = parseInt(number, 10) || 10;
    
    // 处理 random 参数，默认为随机
    const orderByClause = (random === 'false') ? 'ORDER BY id ASC' : 'ORDER BY RAND()';

    // 拼接最终的SQL语句
    let sql = `
      SELECT id, title, explain_text, difficulty_text, options_json, answer, kind_text, Qtree1, Qtree2 
      FROM questions 
      WHERE ${whereClauses.join(' AND ')}
      ${orderByClause}
      LIMIT ?
    `;

    // 将 limit 添加到参数列表末尾
    params.push(limit);

    // 4. 执行查询
    const questions = await db.query(sql, params);

    // 5. 返回结果
    res.status(200).json(questions);

  } catch (error) {
    console.error('查询数据库时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

const getQuestionTree = async (req, res) => {
  try {
    const sql = `
      SELECT Qtree1, Qtree2 
      FROM questions 
      WHERE Qtree1 IS NOT NULL AND Qtree2 IS NOT NULL AND Qtree1 != '' AND Qtree2 != ''
      GROUP BY Qtree1, Qtree2 
      ORDER BY Qtree1, Qtree2;
    `;
    const results = await db.query(sql);

    const tree = {};

    results.forEach(row => {
      if (!tree[row.Qtree1]) {
        tree[row.Qtree1] = [];
      }
      tree[row.Qtree1].push(row.Qtree2);
    });

    res.status(200).json(tree);

  } catch (error) {
    console.error('查询题目层级树时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

const getQuestionsByIds = async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({
      error: '参数缺失',
      message: '`ids` 是必需的查询参数。',
      example: '/api/questions/by-ids?ids=123,456'
    });
  }

  try {
    // 1. 将逗号分隔的字符串转换为ID数组，并确保它们是数字
    const idArray = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    // 如果转换后没有有效的ID，则直接返回空数组
    if (idArray.length === 0) {
      return res.status(200).json([]);
    }

    // 2. 构建SQL查询
    const sql = `
      SELECT id, title, explain_text, difficulty_text, options_json, answer, kind_text, Qtree1, Qtree2 
      FROM questions 
      WHERE id IN (?)
    `;
    
    // 3. 执行查询
    const questions = await db.query(sql, [idArray]);

    // 4. 返回结果
    res.status(200).json(questions);

  } catch (error) {
    console.error('根据ID查询题目时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

const searchByContent = async (req, res) => {
  const { keyword, page = 1, pageSize = 5 } = req.query;

  if (!keyword) {
    return res.status(400).json({
      error: '参数缺失',
      message: '`keyword` 是必需的查询参数。',
      example: '/api/questions/search-by-content?keyword=your_keyword&page=1&pageSize=5'
    });
  }

  try {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);

    // 规范化关键词，并在 SQL 端做同样的规范化（大小写 + 全/半角括号、逗号、句号）
    const normalizedKeyword = normalizeToSearch(keyword);
    const likePattern = `%${escapeForLike(normalizedKeyword)}%`;
    const titleExpr = normalizedSqlExpr('title');

    // 先获取前100条匹配的结果
    const sql = `
      SELECT id, title, explain_text, difficulty_text, options_json, answer, kind_text, Qtree1, Qtree2 
      FROM questions 
      WHERE ${titleExpr} LIKE ?
      LIMIT 100
    `;

    const allQuestions = await db.query(sql, [likePattern]);
    
    // 去重：相同题干内容只保留第一条
    const uniqueQuestions = [];
    const seenTitles = new Set();
    
    for (const question of allQuestions) {
      const normalizedTitle = normalizeToSearch(question.title || '');
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueQuestions.push(question);
      }
    }

    // 分页处理
    const total = uniqueQuestions.length;
    const paginatedQuestions = uniqueQuestions.slice(offset, offset + limit);

    console.log(`🔍 题干搜索: 原始关键词="${keyword}", 规范化="${normalizedKeyword}", 找到${allQuestions.length}条, 去重后${total}条结果`);
    
    res.status(200).json({
      total,
      page: parseInt(page, 10),
      pageSize: limit,
      data: paginatedQuestions
    });
  } catch (error) {
    console.error('根据题干内容搜题时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

const searchByAnswer = async (req, res) => {
  const { answer, page = 1, pageSize = 5 } = req.query;

  if (!answer) {
    return res.status(400).json({
      error: '参数缺失',
      message: '`answer` 是必需的查询参数。',
      example: '/api/questions/search-by-answer?answer=your_answer&page=1&pageSize=5'
    });
  }

  try {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);

    // 修复：根据答案字母找到对应选项内容，然后搜索该内容
    // 思路：先获取所有题目，然后在应用层过滤
    const getAllSql = `
      SELECT id, title, explain_text, difficulty_text, options_json, answer, kind_text, Qtree1, Qtree2 
      FROM questions 
      WHERE options_json IS NOT NULL AND answer IS NOT NULL
    `;
    
    const allQuestions = await db.query(getAllSql);
    const matchedQuestions = [];

    // 在应用层进行过滤
    for (const question of allQuestions) {
      try {
        // 构建规范化后的选项键映射（兼容多种 JSON 结构）
        const normalizedOptions = buildOptionsMap(question.options_json);
        
        // 获取正确答案（可能是单个字母如"A"或多个字母如"AB"）
        const correctAnswersRaw = String(question.answer || '');
        const correctAnswers = [];
        for (const ch of correctAnswersRaw) {
          const nk = normalizeKeyChar(ch);
          if (nk) correctAnswers.push(nk);
        }

        // 规范化用户输入
        const normalizedUser = normalizeToSearch(answer);

        // 检查正确答案对应的选项内容是否包含搜索关键词（规范化匹配）
        let hasMatch = false;
        for (const answerKey of correctAnswers) {
          const optionValue = normalizedOptions[answerKey];
          if (optionValue !== undefined && optionValue !== null) {
            const normalizedOption = normalizeToSearch(optionValue);
            if (normalizedOption.includes(normalizedUser)) {
              hasMatch = true;
              break;
            }
          }
        }
        
        if (hasMatch) {
          matchedQuestions.push(question);
        }
      } catch (e) {
        // 跳过JSON解析失败的题目
        continue;
      }
    }

    // 分页处理
    const total = matchedQuestions.length;
    const paginatedQuestions = matchedQuestions.slice(offset, offset + limit);

    // 添加调试信息
    console.log(`🔍 答案搜索: 原始关键词="${answer}", 规范化="${normalizeToSearch(answer)}", 找到${total}条结果`);

    res.status(200).json({
      total,
      page: parseInt(page, 10),
      pageSize: limit,
      data: paginatedQuestions
    });
  } catch (error) {
    console.error('根据答案搜题时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

const searchByOptions = async (req, res) => {
  const { option, page = 1, pageSize = 5 } = req.query;

  if (!option) {
    return res.status(400).json({
      error: '参数缺失',
      message: '`option` 是必需的查询参数。',
      example: '/api/questions/search-by-options?option=your_option&page=1&pageSize=5'
    });
  }

  try {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize, 10);

    // 优化：在选项内容中搜索（大小写无关 + 全/半角括号、逗号、句号统一）
    const optionsExpr = normalizedSqlExpr('options_json');
    const normalizedOption = normalizeToSearch(option);
    const likePattern = `%${escapeForLike(normalizedOption)}%`;
    const prioritizedPattern = `%"${escapeForLike(normalizedOption)}"%`;

    const sql = `
      SELECT id, title, explain_text, difficulty_text, options_json, answer, kind_text, Qtree1, Qtree2 
      FROM questions 
      WHERE ${optionsExpr} LIKE ?
      ORDER BY 
        CASE 
          WHEN ${optionsExpr} LIKE ? THEN 1 
          ELSE 2 
        END
      LIMIT ? OFFSET ?
    `;
    const questions = await db.query(sql, [likePattern, prioritizedPattern, limit, offset]);
    
    const countSql = `SELECT COUNT(*) as total FROM questions WHERE ${optionsExpr} LIKE ?`;
    const totalResult = await db.query(countSql, [likePattern]);
    const total = totalResult[0].total;

    // 添加调试信息
    console.log(`🔍 选项搜索: 原始关键词="${option}", 规范化="${normalizedOption}", 找到${total}条结果`);

    res.status(200).json({
      total,
      page: parseInt(page, 10),
      pageSize: limit,
      data: questions
    });
  } catch (error) {
    console.error('根据选项搜题时出错:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '查询数据库时发生未知错误。'
    });
  }
};

module.exports = {
  getQuestions,
  getQuestionTree,
  getQuestionsByIds,
  searchByContent,
  searchByAnswer,
  searchByOptions
};
