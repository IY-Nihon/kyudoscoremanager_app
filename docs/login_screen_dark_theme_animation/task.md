# タスクリスト：ログイン画面のダークテーマ化と「矢と的」背景アニメーションの実装

- [ ] `KyudoBackgroundAnimation` コンポーネントの実装
  - [ ] Webプラットフォーム向けの `Three.js` による3Dアニメーションの実装（CDN経由で `three.js` を読み込み）
  - [ ] Nativeプラットフォーム（iOS/Android）向けの `react-native-svg` と `react-native-reanimated` による2D/3D浮遊・回転アニメーションの実装
- [ ] ログイン画面 `src/JP_LoginScreen_1036.js` の改修
  - [ ] 最背面に `KyudoBackgroundAnimation` を絶対配置（`position: 'absolute', zIndex: -1`）
  - [ ] `S.container` の背景色を `#030508` に変更
  - [ ] タイトル・サブタイトル・入力フォームラベルのテキストカラーをダークテーマに最適化（白・ゴールド・グレー）
  - [ ] ログインカード `S.card` を半透明かつ美しいゴールド枠線のアクア調ダークスタイルに変更
  - [ ] その他ヘルプリンク等の色を視認性の高い配色に変更
- [ ] 動作確認と検証
  - [ ] Web環境での動作確認（`npm run dev` などの確認）
  - [ ] 全体の崩れやテキストの視認性に問題がないかのチェック
  - [ ] `walkthrough.md` の作成と報告
