# 開発・オンライン運用

## LLM設定

`.env.example` を参考に、無視対象の `.dev.vars` を作成する。`LLM_BASE_URL` は `/chat/completions` を除く互換APIのベースURL、`LLM_MODEL` はJSON object出力に対応するモデルID。特定プロバイダーSDKには依存しない。キーなしならフォールバックする。

本番では `npx wrangler secret put LLM_API_KEY` と `npx wrangler secret put RATE_SALT` で秘密を設定する。ベースURLとモデルは `wrangler.jsonc` のvarsに設定可能。キーをクライアントの環境変数・ログ・Gitへ書かない。

## D1・配備

Wranglerスキルとインストール済みCLIのhelp、公式ドキュメントに従う。新規アカウントへの自動公開は行っていない。`wrangler.jsonc` のDB IDはローカル用のプレースホルダー。本番に出す際は意図したアカウントとDBを必ず指定する。

```sh
npx wrangler d1 create last-lesson
# 返されたdatabase_idをwrangler.jsoncに設定
npx wrangler d1 migrations apply last-lesson --remote
npm run types
npm run build
npx wrangler deploy --dry-run
npm run deploy
```

互換日はUTC日付2026-10-24（作業環境の日本時間では25日）。Workerローカルruntimeが受け付ける日付で動作確認する。公開対象の最新対応日を確認して更新する。

Workerはstatic assetsとAPIを同じoriginで配信する。Vite開発サーバーの `/api` は8787へproxyされる。オンライン機能はD1に接続するが、Viteのみで起動しても本編は動く。

## ランキング・信頼境界

`POST /api/records` に確認後の教え、名前、シード、介入step/index（最大2）と `consent:true` を送る。スコアやクライアントの人生データは受け付けず、同じv1エンジンで全編再実行する。存在しない介入・重複stepを拒否する。教えの編集はゲームルールとして認めるので、サーバーはLLM解析時の値に固定しない。

`GET /api/records?category=saved|harm|age|civilization|trust` は該当指標の降順上位100件。指標は順に救助人数、累積被害、稼働年数、復興への累積貢献、最終信頼値。単位のない数値は物語の影響指標であり、全てを死者数とはみなさない。同点は先に投稿された人生が上位。

SQLはパラメータバインド、並び順は固定allowlist。公開本文はReactのテキストとして描画する。投稿本文はストリームで8KiBまでに制限。Origin一致、公開同意、IPのsalt付きハッシュ/時間帯別の原子的カウンター（解析10件・投稿5件/時）、投稿内容全体のハッシュで重複抑制を行う。重複投稿もレートを消費する。

レート表は投稿時に期限切れ行を削除する。IPは保存しないが、saltなしのローカル既定値を本番で使わない。匿名のランキングであり、シード厳選や動機の調整は不正とは扱わない。複数IP・高度なBotへの対策には認証/Turnstileなどが必要。

## 公開内容と審査

名前、三つの教え、解釈、シード、判断履歴、数値が公開される。端末保存だけでは外部へ公開しない。教え解析時は、入力した教えが設定したAIサービスへ送られる場合がある。

URLとごく一部の不適切表現を拒む簡易フィルターのみ実装。文脈、個人情報、差別などの包括的な審査は未実装。本番公開前に通報、審査、削除、利用規約/プライバシー案内、運用責任者を整える。

暫定的に管理者はD1で対象IDの `hidden=1` にしてランキングから非表示にできる。IDを確認し、適切にバインドしたSQLかD1管理画面で操作する。本人が削除する認証・UIはまだない。投稿の任意性だけをもって完全な公開運用対策と説明しない。

## セーブ互換と更新

保存キーはv1。初期状態、乱数状態、確認済みの教え、全履歴を保存する。現在は公開済みシナリオ変更に対する旧版エンジン保管やセーブ移行はない。本番コンテンツ更新前にバージョン別再実行を実装する。IndexedDB書込みの失敗は画面に通知する。

## 公式資料

- [Workers static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)
- [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
