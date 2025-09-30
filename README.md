# 题库 API 服务

这是一个基于 Node.js 和 Express 构建的后端服务，用于提供题库数据接口。

## ✨ 功能特性

-   连接到 MySQL 数据库 (`exam` 库)
-   提供一个强大的题目筛选接口
-   支持按题目类型 (`kind_text`) 和子分类 (`qtree2`) 进行多选筛选
-   支持自定义返回的题目数量
-   包含清晰的错误提示和使用示例

## 📦 安装与配置

### 1. 前提条件

-   已安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本)
-   可访问项目配置的 MySQL 数据库

### 2. 安装依赖

在 `backend_service` 目录下，执行以下命令来安装所有必需的依赖项：

```bash
npm install
```

### 3. 配置环境变量

在 `backend_service` 目录下，创建一个名为 `.env` 的文件。这个文件用于存放敏感信息，例如数据库密码。

**请手动创建此文件**，并填入以下内容（根据您的实际情况修改）：

```ini
DB_HOST=39.97.52.134
DB_PORT=3306
DB_USER=RioArisk
DB_PASSWORD=Zq20021116!
DB_NAME=exam
PORT=3000
```

## 🚀 启动服务

完成安装和配置后，在 `backend_service` 目录下运行以下命令来启动服务：

```bash
node index.js
```

如果看到以下输出，说明服务已成功启动：

```
服务器正在运行，监听端口 3000
请通过 http://localhost:3000 访问
```

## 📖 API 接口文档

### 获取题目

根据条件筛选并随机返回指定数量的题目。

-   **URL**: `/api/questions`
-   **Method**: `GET`
-   **Query Parameters**:

| 参数名 | 类型 | 是否必需 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `Qtree1` | `String` | **是** | - | 题目主分类。多个值用英文逗号 `,` 分隔。 |
| `qtree2` | `String` | **是** | - | 题目子分类。多个值用英文逗号 `,` 分隔。 |
| `number` | `Number` | 否 | 10 | 需要返回的题目数量。 |
| `random` | `String` | 否 | `true` | 是否随机返回题目。传 `false` 可按题目ID顺序返回。 |

---

#### ✅ 成功响应示例

**请求 URL:**
```
http://localhost:3000/api/questions?Qtree1=③安全规章（精简、路局、强化）&qtree2=单选题（精简）&number=2&random=false
```

**响应 Body (Status: `200 OK`):**
```json
[
  {
    "id": 12345,
    "title": "这是一个单选题的题目...",
    "explain_text": "这是题目的解析...",
    "difficulty_text": "普通",
    "options_json": "[{\"key\":\"A\",\"value\":\"选项A\"},{\"key\":\"B\",\"value\":\"选项B\"}]",
    "answer": "A",
    "kind_text": "单选题",
    "Qtree1": "②真题（2024、2025）",
    "Qtree2": "单选题(2024)"
  },
  {
    "id": 67890,
    "title": "这是一个判断题的题目...",
    "explain_text": "这是判断题的解析...",
    "difficulty_text": "简单",
    "options_json": "[{\"key\":\"A\",\"value\":\"正确\"},{\"key\":\"B\",\"value\":\"错误\"}]",
    "answer": "B",
    "kind_text": "判断题",
    "Qtree1": "②真题（2024、2025）",
    "Qtree2": "判断题(2025)"
  }
]
```

---

#### ❌ 失败响应示例 (参数缺失)

**请求 URL:**
```
http://39.97.52.134:3000/api/questions?kind_text=单选题
```

**响应 Body (Status: `400 Bad Request`):**
```json
{
  "error": "参数缺失",
  "message": "`kind_text` 和 `qtree2` 是必需的查询参数。",
  "example": "/api/questions?kind_text=单选题,判断题&qtree2=单选题 (2025）,判断题 (2025）&number=5"
}
```

### 获取题目层级树

获取所有题目的分类层级关系，以 `Qtree1` 为键，`Qtree2` 数组为值的形式返回。这对于前端渲染级联选择器或树状菜单非常有用。

-   **URL**: `/api/tree`
-   **Method**: `GET`
-   **Query Parameters**: 无

---

#### ✅ 成功响应示例

**请求 URL:**
```
http://localhost:3000/api/tree
```

**响应 Body (Status: `200 OK`):**
```json
{
  "②真题（2024、2025）": [
    "判断题",
    "判断题(2024)",
    "判断题 (2025）",
    "单选题",
    "单选题(2024)",
    "单选题 (2025）",
    "多选题",
    "多选题(2025)"
  ],
  "③安全规章（精简、路局、强化）": [
    "判断题（京局津段）",
    "判断题（强化）",
    "判断题（沈阳局）",
    "判断题（精简）",
    "单选题（京局津段）",
    "单选题（强化）",
    "单选题（沈阳局）",
    "单选题（精简）",
    "多选题（京局、上局、武局）",
    "多选题（京局津段）",
    "多选题（强化）",
    "多选题（沈阳局）",
    "多选题（精简）"
  ]
}
```

### 根据 ID 批量获取题目

根据一个或多个题目 ID，返回对应的题目详细信息。

-   **URL**: `/api/questions/by-ids`
-   **Method**: `GET`
-   **Query Parameters**:

| 参数名 | 类型 | 是否必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `ids` | `String` | **是** | 题目的 ID 列表，多个 ID 之间用英文逗号 `,`