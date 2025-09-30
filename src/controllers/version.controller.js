const fs = require('fs');
const path = require('path');

/**
 * 从文件名中提取版本号
 * 支持格式：题库1.0.3.apk, app-1.0.3.apk, 1.0.3.apk 等
 */
function extractVersionFromFilename(filename) {
  // 匹配版本号格式：x.x.x 或 x.x
  const versionMatch = filename.match(/(\d+\.\d+\.?\d*)/);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * 比较版本号大小
 * 返回 1 表示 v1 > v2，返回 -1 表示 v1 < v2，返回 0 表示相等
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

exports.checkUpdate = (req, res) => {
  // APK 文件存放目录
  const apkDir = path.join(__dirname, '..', '..', 'apk');

  // 检查目录是否存在
  if (!fs.existsSync(apkDir)) {
    console.error('APK 目录不存在:', apkDir);
    return res.status(500).send({ message: '无法获取版本信息，APK目录不存在。' });
  }

  // 读取目录中的所有文件
  fs.readdir(apkDir, (err, files) => {
    if (err) {
      console.error('读取 APK 目录失败:', err);
      return res.status(500).send({ message: '无法获取版本信息，请稍后重试。' });
    }

    // 过滤出 .apk 文件并提取版本信息
    const apkFiles = files
      .filter(file => file.toLowerCase().endsWith('.apk'))
      .map(file => ({
        filename: file,
        version: extractVersionFromFilename(file)
      }))
      .filter(item => item.version !== null); // 只保留能提取到版本号的文件

    // 如果没有找到任何APK文件
    if (apkFiles.length === 0) {
      console.error('未找到任何有效的 APK 文件');
      return res.status(404).send({ message: '未找到可用的应用版本。' });
    }

    // 找到最新版本的APK
    let latestApk = apkFiles[0];
    for (let i = 1; i < apkFiles.length; i++) {
      if (compareVersions(apkFiles[i].version, latestApk.version) > 0) {
        latestApk = apkFiles[i];
      }
    }

    // 获取服务器地址（从环境变量或请求头获取）
    const protocol = req.protocol;
    const host = req.get('host');
    const serverUrl = process.env.SERVER_URL || `${protocol}://${host}`;

    // 构造版本信息
    const versionInfo = {
      version: latestApk.version,
      downloadUrl: `${serverUrl}/apk/${encodeURIComponent(latestApk.filename)}`,
      notes: process.env.UPDATE_NOTES || `版本 ${latestApk.version} 更新说明：\n1. 修复了若干已知bug。\n2. 优化了应用的性能和稳定性。`,
      forceUpdate: process.env.FORCE_UPDATE === 'true' || false
    };

    console.log('返回版本信息:', versionInfo);
    res.status(200).json(versionInfo);
  });
};
