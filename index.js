require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes');

const app = express();

// 1. 中间件
app.use(cors()); // 启用 CORS，允许所有跨域请求
app.use(express.json()); // 解析 JSON 请求体
app.use(express.static(path.join(__dirname, 'public'))); // 托管 public 目录下的静态文件
app.use('/apk', express.static(path.join(__dirname, 'apk'))); // 托管 apk 目录下的APK文件供下载


// 2. 注册 API 路由
app.use('/api', apiRoutes);

// 3. 定义一个根路径的欢迎接口
app.get('/', (req, res) => {
  res.send('欢迎使用题库 API 服务！请访问 /api/questions 来获取题目数据。');
});

// 4. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器正在运行，监听端口 ${PORT}`);
  console.log(`现在您可以通过 http://localhost:${PORT} 或服务器的公网/局域网IP地址访问`);
});
