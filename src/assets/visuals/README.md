# Visual asset conventions

- 路徑：可快取插圖放在 `public/assets/visuals/`；小型操作 icon 保留在 React inline SVG。
- 命名：`<context>-<purpose>.svg`，全小寫 kebab-case，不使用版本號或來源不明名稱。
- 尺寸：目前插圖統一 `320 × 240` 與 `viewBox="0 0 320 240"`，避免版面位移。
- 來源：所有 SVG 為本專案原創幾何圖形，不含 TOEIC／ETS 官方素材、外部字型、script 或遠端連結。
- 載入：只能透過 `manifest.js` 與 `VisualAsset` 使用；首屏 hero 可 eager，其餘一律 lazy。
- 預算：每個 SVG 小於 12 KB。新增檔案時同步更新 manifest、service worker 與測試。
