# Firebase 版说明

这一版已经接入 Firebase Firestore，不再使用 Supabase。

## 本地运行

在本文件夹中打开命令窗口，依次运行：

```bash
npm install
npm run dev
```

然后打开：

- 学生端：http://localhost:8080/#/student
- 管理端：http://localhost:8080/#/admin

如果终端显示的是 5173，就把 8080 换成 5173。

## Firestore 规则

如果你创建 Firestore 时选择了“测试模式”，它默认大约 30 天后会过期。正式课程使用前，请到 Firebase：Firestore Database → 规则，把规则改成下面这样，然后发布：

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ratings/{docId} {
      allow read, write: if true;
    }
    match /portfolios/{docId} {
      allow read, write: if true;
    }
  }
}
```

注意：这是无登录的公开读写规则，只适合本课程这种低风险小范围评分系统。不要在里面存身份证、手机号、隐私信息。

## 数据集合

系统会自动使用两个集合：

- ratings：评分记录
- portfolios：作品集链接

不需要你手动创建集合。第一次保存数据后，Firebase 会自动出现对应集合。
