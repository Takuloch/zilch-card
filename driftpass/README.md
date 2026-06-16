# DRIFT PASS 🏁

**One touch. Full drift.** — 見下ろし型ドリフトタイムアタックゲーム（オリジナル・Phaser 3 / PWA）

自動加速する車を「画面の左右タッチだけ」で操り、壁に当たらず、できるだけ速くゴールを目指す。
タイム・壁接触・ドリフト評価・ノーミスボーナスでスコアが決まる完全オリジナル作品です。
（既存ゲームの名称・ロゴ・コース・車種・画像・音声は一切使用していません）

---

## 操作方法
- **画面の左半分タッチ** → 左にステア
- **画面の右半分タッチ** → 右にステア
- 両方押した場合 → 最後に押した側を優先
- 離すとステアは中央へ戻る
- 加速は自動。アクセル/ブレーキはありません
- キーボード：←/A=左、→/D=右、Esc=一時停止、Space/Enter=決定
- 一時停止：右上の ⏸ ボタン or Esc

## 遊び方
SafariでURLを開く → 難易度を選ぶ → コースを選ぶ → 3・2・1・GO →
全チェックポイント通過後にゴールラインを越えるとリザルト。ベストタイムは自動保存。

---

## ✅ いま動く版（ビルド不要・そのまま配信できる）
このフォルダは **ビルド不要でそのまま動きます**。`index.html` を Web サーバー（HTTPS）に置くだけ。
- カードゲームと同じ GitHub Pages にこの `driftpass/` フォルダを丸ごとアップロードすれば公開できます。
- カードゲームのホームの「🏁 ドリフト PASS」ボタンからリンクしています。
- `phaser.min.js` を同梱しているため、CDN なしでオフライン動作（Service Worker）します。

### ローカルで確認する方法（Nodeなしでも可）
このフォルダの1つ上で簡易サーバーを起動して、ブラウザで開くだけ：
```
python3 -m http.server 8000
# → http://localhost:8000/driftpass/
```

### iPhoneで確認 / ホーム画面に追加
1. 同じURLを iPhone の Safari で開く
2. 共有メニュー → 「ホーム画面に追加」
3. アイコンから起動するとフルスクリーンのアプリ風に動作（縦画面・オフライン対応）

---

## 🔧 （任意）Vite + Phaser の開発パイプライン
Node.js がある環境では、Vite で開発サーバ/最適化ビルドが使えます。
※この成果物は Node 不要で動くよう作ってありますが、要件のスタックも用意しています。
```
npm install
npm run dev       # 開発サーバ（http://localhost:5173）
npm run build     # dist/ に最適化ビルド
npm run preview   # ビルド結果をプレビュー
```
ビルドした `dist/` を静的ホスティング（Vercel / Netlify / GitHub Pages）に置けば公開できます。
（TypeScript へ移行する場合は `src/*.js` を `*.ts` 化し、`types.js` の JSDoc を `interface` に置換してください）

---

## ディレクトリ構成
```
driftpass/
├ index.html                 # エントリ（PWA meta / Phaser読込）
├ phaser.min.js              # Phaser 3.80.1（同梱）
├ manifest.webmanifest       # PWAマニフェスト
├ sw.js                      # Service Worker（オフライン/自動更新）
├ package.json / vite.config.js  # （任意）Vite用
├ icons/icon-192.png / icon-512.png
└ src/
   ├ main.js          # Phaser起動・シーン登録・SW登録
   ├ config.js        # 解像度・車両基本値・難易度/ハンドリング
   ├ types.js         # 状態enum / JSDoc型
   ├ storage.js       # localStorage（ベスト記録・設定・ゴースト枠）
   ├ physics.js       # ベクトル演算・道路/ゴール/CP判定
   ├ courses.js       # 3コース定義（中心線生成）
   ├ audio.js         # Web Audio簡易SE/エンジン/スキッド音
   ├ ui.js            # 共通ボタン・タイム整形
   ├ BootScene.js / PreloadScene.js   # 起動・テクスチャ生成
   ├ TitleScene.js    # タイトル/コース/難易度/設定/記録
   ├ GameScene.js     # コア（物理・壁・CP・ゴール・HUD・一時停止）
   ├ ResultScene.js   # リザルト・スコア・ランク
   └ styles.css       # フルスクリーン/スクロール禁止/SafeArea
```

## コース追加方法
`src/courses.js` の `COURSES` 配列に `makeCourse(...)` を追加するだけ：
```
makeCourse(id, name, difficulty, roadWidth, segs, step, targetTimeMs, theme)
// segs: [曲がり角度(度/ステップ), ステップ数] の並び。0=直線
```
チェックポイント・ゴールライン・スタート位置は中心線から自動生成されます。

## 車両パラメータ調整
`src/config.js` の `BASE_CAR`（最高速・グリップ・ステア等）と `DIFFICULTY` / `HANDLING` を編集。
物理は `src/GameScene.js` の `stepCar()` に実装。

## スコア / ランク
`baseScore 100000 − タイム/10 − 壁×5000 + ドリフト + ノーヒット30000 + 目標達成20000`
ランク：S=ノーヒット&目標以内 / A=目標以内 / B=目標+20%以内 / C=その他 / D=壁5回以上

---

## 実装済み（Phase 1 + 2）
- iPhone縦画面・FIT中央寄せ・Safe Area考慮・スクロール禁止
- タイトル/コース選択/難易度/設定/ベスト記録
- 自動加速・左右タッチ＆キーボード操作・ステア戻り
- アーケード・ドリフト物理（滑り・ドリフト角・過回転減速）
- 壁判定（減速/跳ね返り/0.35s無敵/カメラシェイク/火花/HITカウント）
- チェックポイント順次通過＋ゴールライン交差判定
- タイム計測・スコア・ランク・ノーヒットボーナス・目標タイムボーナス
- ドリフトスコア＆GOOD/GREAT/LEGEND DRIFT
- タイヤ痕（上限つきリサイクル）・火花パーティクル
- localStorageベスト保存・設定保存・記録リセット
- Web Audio簡易SE（決定/カウント/GO/ドリフト/ヒット/ゴール/ベスト/エンジン/スキッド）
- PWA（manifest / service worker / オフライン / ホーム画面追加）
- カードゲームからのリンク／戻るリンク
- `?debug=1` でFPS/速度/ドリフト角/CP等を表示（R=リスタート, G=ゴールワープ, H=壁テスト）

## 今後の拡張（Phase 3 用の土台）
- ゴースト走行（`storage.js` の saveGhost/loadGhost と GameScene の ghostFrames を実装済みの土台あり）
- ランキング風UI / 車種選択 / チューニング / 差し替え可能なBGM / コースエディタ
