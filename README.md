# amista - 友情婚活マッチングプラットフォーム

> 友情・信頼・パートナーシップを大切にする、新しいかたちの婚活サービス

恋愛感情より深い「友情」から始まるパートナー探しをサポートします。
価値観・人柄・ライフスタイルが合う、信頼できるライフパートナーを見つけましょう。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) |
| 認証・DB | Supabase (PostgreSQL + GoTrue) |
| スタイリング | Tailwind CSS (ダークテーマ) |
| 型安全 | TypeScript |
| 開発環境 | Docker + docker-compose |

## 機能一覧

- ✅ ユーザー登録・ログイン
- ✅ プロフィール作成・編集（価値観・ライフスタイル重視）
- ✅ 会員一覧・検索・フィルタリング
- ✅ プロフィール詳細表示
- ✅ いいね送受信
- ✅ 自動マッチング（相互いいねで成立）
- ✅ マッチング一覧
- ✅ Row Level Security（RLS）によるデータ保護
- 🚧 メッセージ機能（実装中）
- 🚧 プロフィール写真アップロード（実装中）
- 🚧 価値観診断テスト（予定）

## 開発環境セットアップ

### 前提条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) インストール済み

### 起動手順

```bash
# 1. 環境変数の設定
cp .env.example .env

# 2. Docker で全サービスを起動
docker-compose up -d

# 3. （初回のみ）内部ユーザーパスワード設定 & マイグレーション
#    ※ db-migrate コンテナが自動実行します
```

### アクセス先

| サービス | URL |
|---------|-----|
| 🌸 **amistaアプリ** | http://localhost:3000 |
| 🛠️ **Supabase Studio** | http://localhost:54323 |
| 📧 **テストメール** | http://localhost:54324 |
| 🐘 **PostgreSQL** | localhost:54322 |

## プロジェクト構成

```
.
├── docker-compose.yml          # Docker設定（nginx + Supabaseスタック）
├── nginx/
│   └── default.conf            # API Gateway設定
├── supabase/migrations/        # DBスキーマ・RLSポリシー
└── src/
    ├── app/
    │   ├── page.tsx            # ランディングページ（友情婚活特化）
    │   ├── (auth)/             # ログイン・新規登録
    │   └── (main)/             # 認証必須ページ
    │       ├── dashboard/      # ホーム
    │       ├── members/        # 会員一覧・詳細
    │       ├── profile/        # マイプロフィール・編集
    │       └── matching/       # マッチング一覧
    ├── components/             # UIコンポーネント
    ├── lib/supabase/           # Supabaseクライアント（SSR対応）
    ├── types/                  # 型定義（React Native共有可能）
    └── middleware.ts           # 認証ガード
```

## データベーススキーマ

```
profiles    - ユーザープロフィール（価値観・ライフスタイル詳細）
likes       - いいね（相互で自動マッチングトリガー付き）
matches     - マッチング（相互いいねで自動生成）
messages    - チャットメッセージ
```

## デザインコンセプト

- **ダークテーマ**: zinc-950/zinc-900 ベースの黒・ダークグレー背景
- **アクセントカラー**: ティールグリーン（#0d9488）
- **ロゴ**: `ami`**sta** — "友達" を意味するラテン語由来

## 友情婚活コンセプト

一般的な婚活との違い：

| | 一般的な婚活 | amistaの友情婚活 |
|--|-------------|-------------|
| 重視項目 | 外見・条件 | 価値観・人柄 |
| 始まり方 | 恋愛感情から | 信頼・友情から |
| プレッシャー | 早期交際を求める | 友人として交流 |
| 写真 | 必須 | 任意 |

## React Native 対応設計

- `src/types/index.ts` — プラットフォーム非依存の型定義
- `src/lib/utils.ts` — ビジネスロジック（プラットフォーム非依存）
- Supabase JS SDK — Web / React Native 両対応

## ライセンス

MIT
