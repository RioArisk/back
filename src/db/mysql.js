const mysql = require('mysql2/promise');
require('dotenv').config();

// 使用.env文件中的配置创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 导出一个函数，用于执行SQL查询
const query = async (sql, params) => {
  // 使用 pool.query 来支持 IN (?) 语法中的数组参数
  const [results, ] = await pool.query(sql, params);
  return results;
};

// 导出query函数，以便在其他文件中使用
module.exports = {
  query
};
