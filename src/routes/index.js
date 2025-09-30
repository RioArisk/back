const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const versionController = require('../controllers/version.controller');

// 定义题库接口路由
// GET /api/questions
router.get('/questions', questionController.getQuestions);

// 定义获取题目层级树的路由
// GET /api/tree
router.get('/tree', questionController.getQuestionTree);

// 定义根据ID批量获取题目的路由
// GET /api/questions/by-ids
router.get('/questions/by-ids', questionController.getQuestionsByIds);

// 定义版本检查接口路由
// GET /api/version/check
router.get('/version/check', versionController.checkUpdate);

// 定义搜题接口
router.get('/questions/search-by-content', questionController.searchByContent);
router.get('/questions/search-by-answer', questionController.searchByAnswer);
router.get('/questions/search-by-options', questionController.searchByOptions);

module.exports = router;
