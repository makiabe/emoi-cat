# ねこのいちにち — A Cat's Day

茶トラねこ「みかん」の一日を描いた、60秒でループするピクセルアートアニメーションです。SVGアニメーションとWeb Audioによる音楽・効果音で動作します。

## 公開先

GitHub Pages: https://makiabe.github.io/emoi-cat/

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

リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択してください。

`main`への更新時に、ワークフローがソースからビルドし、`out/`だけを公開します。ソースファイルや開発用資料は公開ページの配信対象に含めません。

## 構成

- `lib/`: 描画エンジン、猫のスプライト、画面オーバーレイ、音楽
- `scenes/`: 朝・ごはん・まどべ・あそび・夕焼け・夜の各場面
- `tools/player.js`: ブラウザ用プレイヤー
- `build.js`: SVGとHTMLの生成
- `.github/workflows/pages.yml`: ビルドと公開
