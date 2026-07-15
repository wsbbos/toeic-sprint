# Production MVP 驗收報告

日期：2026-07-15

分支：`feat/toeic-sprint-production-mvp`

工作目錄：`C:\dev\toeic-sprint-original`

## 自動驗收結果

- Part 5：300 題；答案 A/B/C/D 各 75 題。
- 難度：easy 77、medium 149、hard 74。
- 類別：14 類，每類 20–24 題；Part 7 仍為獨立的 30 題。
- Node baseline/domain tests：51 passed。
- Component tests：28 passed。
- Playwright development：11 passed、7 skipped；production build：12 passed、6 skipped（依 viewport 與 production-only 條件執行）。
- ESLint：0 errors。
- Production build：通過；初始 app chunk 42.01 kB（gzip 13.18 kB）。
- npm audit：0 vulnerabilities。
- 靜態安全掃描：未發現 `dangerouslySetInnerHTML`、直接 `innerHTML`、`eval`、service-role key 或硬編碼 JWT。

實際結果以最後一次 `npm run verify:ci`、`npm run audit:deps`、`npm run test:e2e` 與 production preview smoke test 的終端輸出為準。

## 已驗收流程

- 訪客入口與 local storage fallback。
- Part 5 快速練習、作答、提交與結果頁。
- 錯題寫入、錯題本與重新作答入口。
- 重整恢復、收藏與多題統計完整保存、題數不足保護與提交冪等性。
- 桌面與 Pixel 5 viewport；手機頁面無整體橫向溢出。
- Supabase 登入 component contract 與 migration/RLS 靜態驗證。
- Part 7 已通過實際訪客閱讀流程與 baseline 保護，沒有混入 Part 5 題庫。
- Mini Mock 倒數會使用最新答案，自動／手動交卷具防重複保護，結果只顯示非官方區間估計。
- 訪客設定頁可安全清除本機資料，不會誤報雲端同步或因缺少 email 發生錯誤。
- PWA manifest、service worker、icon 資產與 production 離線重開。

## 安全與效能決策

- Vite 已升級至 8.1.4，修復 Windows 開發伺服器路徑繞過與 UNC credential disclosure 弱點。
- Production 使用 Oxc minify；頁面、題庫、React 與 Supabase 依賴採 lazy loading / cache groups。
- 已移除 runtime 未使用的 100 題舊 Part 5 重複資料。
- Supabase client 會驗證 URL/key，設定錯誤或初始化失敗時回退本機模式。
- 錯誤訊息會遮罩 token 與 Supabase project URL；前端不接受 service-role key。

## 需要人工或外部環境驗收

- 使用真實 Supabase 測試帳號完成註冊信、登入、登出與兩台裝置同步。
- 在 Supabase Dashboard 確認 migrations 已依序套用，並以兩個帳號交叉驗證 RLS 隔離。
- 在本次 Vercel Preview 重新執行公開 smoke test；若啟用 Supabase，再驗證登入與網路失敗降級。
- 使用 iOS Safari / Android Chrome 實機驗證鍵盤遮擋、加入主畫面與離線重開。
- 使用螢幕閱讀器與純鍵盤完成一次作答流程。

## 已知限制

- 自動化登入測試使用 mocked Supabase contract；沒有外部帳號憑證時不會建立真實雲端資料。
- PWA 是基本 app shell/runtime cache，不含背景同步與離線衝突合併。
- TOEIC 區間只標示為非官方估算，不能宣稱精準預測正式分數。
- 本次任務不會 push、merge、升級 production 或修改 Git remote；僅建立 Vercel Preview。
