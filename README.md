# ねこのいちにち — A Cat's Day

茶トラねこ「みかん」の一日を描いた、60秒でループするピクセルアートアニメーションです。SVGアニメーションとWeb Audioによる音楽・効果音で動作します。

## 公開先

[https://makiabe.github.io/emoi-cat//index.html](https://makiabe.github.io/emoi-cat/index.html)

## 操作

- 下のチャプターをクリックすると、好きな場面に移動できます。
- 再生・一時停止ボタン、またはスペースキーで再生を切り替えます。
- 左右の矢印キーで2秒ずつ移動できます。
- 映像内の左下にある「SOUND」を押すと、音楽・効果音を切り替えられます。初期状態は消音です。

## ビルド

Node.js 22で確認しています。通常のビルドにnpmパッケージのインストールは不要です。

```sh
node build.js
```

`out/index.html`、`out/player.html`、`out/cat_day.svg`が生成されます。

## GitHub Pages

`main`への更新時に、ワークフローがビルド・検証したプレイヤーを公開します。既存のPages設定を読み取り、次のどちらの公開方法にも対応します。

- **Deploy from a branch**（`main` / `(root)` または `/docs`）: 生成したHTML・SVG・`.nojekyll`・`deployment.json`を指定フォルダーへ自動コミットし、Pagesの再ビルドを明示的に要求します。リポジトリ直下のREADMEがトップページとして公開される状態を防ぎます。
- **GitHub Actions**: 生成先の`out/`だけをPagesアーティファクトとして公開します。

Pages設定そのものはワークフローから変更しません。ブランチ公開の場合は、そのフォルダーに含まれる他の公開ソースも配信対象になります。生成ファイルは直接編集せず、`lib/`、`scenes/`、`tools/player.js`などのソースを変更してください。

公開後は、公開URLのHTMLがビルド結果と完全一致することをSHA-256で確認します。その後Chromiumで再生・一時停止・全6シーン・チャプター移動・キーボード・音声切り替えを検証し、スクリーンショットをActionsの`public-site-verification`アーティファクトに保存します。

## 構成

- `lib/`: 描画エンジン、猫のスプライト、画面オーバーレイ、音楽
- `scenes/`: 朝・ごはん・まどべ・あそび・夕焼け・夜の各場面
- `tools/player.js`: ブラウザ用プレイヤー
- `tools/check-build.js`: ビルド結果の検証
- `tools/check-live.js`: 公開HTMLと実ブラウザでの動作検証
- `build.js`: SVGとHTMLの生成
- `.github/workflows/pages.yml`: 公開方式に合わせたビルド・公開・検証
