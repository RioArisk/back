const fs = require('fs');
const path = require('path');

exports.checkUpdate = (req, res) => {
  // 构造 version.json 文件的绝对路径
  const filePath = path.join(__dirname, '..', '..', 'version.json');

  // 读取 version.json 文件
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取 version.json 文件失败:', err);
      return res.status(500).send({ message: '无法获取版本信息，请稍后重试。' });
    }

    try {
      // 解析 JSON 数据并发送
      const versionInfo = JSON.parse(data);
      res.status(200).json(versionInfo);
    } catch (parseErr) {
      console.error('解析 version.json 文件失败:', parseErr);
      return res.status(500).send({ message: '版本信息文件格式错误。' });
    }
  });
};
