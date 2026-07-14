# Visual Content System

## 目標與範圍

視覺內容的優先順序是「提升閱讀真實度與學習判斷」，不是替頁面增加無關裝飾。所有素材均為本專案原創幾何 SVG，不使用 ETS／TOEIC 官方圖片或來源不明素材。

## Part 7 文件系統

- `data/part7Documents.js`：為既有 passage 提供向下相容的結構化文件 metadata。
- `services/documentModel.js`：把 legacy 純文字與結構化資料正規化成共同 document model。
- `components/documents/DocumentRenderer.jsx`：支援 email、memo、notice、advertisement、schedule、form、invoice、review、message thread、table/chart。
- `data/part7Evidence.js`：30 題逐題保留可在原文找到的答案依據；測試會阻止不存在於 passage 的線索進入 production。

若新題沒有 `document`，renderer 會由原有 `passage` 推斷基本樣式，因此舊資料仍可使用。新增題目時應優先提供 `document.type`、`title`、`fields`、`rows` 或 `callouts`，但不得改寫題目原意。

## 解析視覺

- Part 5：句子空格、正解詞、文法分類、判斷關鍵字與四選項狀態比較。
- Part 7：將 `evidence.quote` 安全切分為 React text nodes 與 `<mark>`，不使用 `dangerouslySetInnerHTML`。
- 找不到可信逐字依據時顯示保守提示，不製造不存在於文件的高亮。

## 插圖與資產載入

- 高層級插圖：`public/assets/visuals/*.svg`，由 `src/assets/visuals/manifest.js` 集中管理。
- 小型 icon：`LearningVisual` inline SVG，不增加 HTTP 請求。
- 圖片元件：`VisualAsset` 固定寬高與 aspect ratio，預防 cumulative layout shift。
- 首屏 hero：`loading="eager"`、`fetchpriority="high"`。
- 其他插圖：`loading="lazy"`、`decoding="async"`，載入前顯示低成本 CSS placeholder。
- 圖片失敗：自動退回同風格 inline SVG，不顯示破圖。

每個 standalone SVG 必須小於 12 KB、使用 `320 × 240` viewBox、kebab-case 檔名，且不得含 script、遠端 URL、外部字型或嵌入憑證。完整命名規則見 `src/assets/visuals/README.md`。

## PWA 與快取

Service worker v3 在安裝階段預快取原創 SVG；`/assets/visuals/` 使用 cache-first 並在背景更新，其他同源 GET 維持既有 network-first/local fallback。這讓曾載入過的練習與視覺資產在暫時離線時仍可顯示。

## 驗證

```powershell
npm.cmd run validate:visuals
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

`validate:visuals` 會驗證 manifest、檔名、尺寸、檔案大小、外部引用與 PWA 快取；元件測試涵蓋 lazy/eager、placeholder、load/error fallback；Playwright 涵蓋桌面、手機、Part 7、結果與空錯題本。

## 新增資產檢查表

1. 在 `public/assets/visuals/` 新增原創 SVG。
2. 在 manifest 加入 `src`、`width`、`height`、`alt`、fallback variant。
3. 非首屏資產不得標記 `priority`。
4. 更新 `public/sw.js` 的 visual precache 清單。
5. 執行 `npm.cmd run validate:visuals` 與 RWD E2E。
