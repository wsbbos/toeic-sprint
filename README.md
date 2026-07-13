# TOEIC Sprint

TOEIC Sprint 是一個 local-first 的 TOEIC 練習 MVP。核心流程不需登入即可使用；設定 Supabase 後，登入使用者可同步學習進度。這個版本保留既有 Part 7 與 Supabase 功能，並完成 Part 5 題庫、可恢復練習、個人化複習、PWA、測試與 CI 的 production-ready 基礎。

## 已完成的核心能力

- Part 5：300 題、14 類題型、A/B/C/D 各 75 題，全部通過 schema 與內容分布驗證。
- Part 7：保留既有 30 題閱讀題，資料來源與 Part 5 分離。
- 練習模式：快速、自訂題數、分類、難度、計時與完整模擬。
- 作答流程：上一題、下一題、標記、提交確認、重整恢復與防重複提交。
- 學習系統：錯題本、收藏、重新作答、間隔複習、弱點分析、每日目標、連續天數與趨勢。
- 資料策略：訪客模式完整可用；Supabase 未設定或失敗時安全降級至 local storage。
- 體驗與品質：RWD、鍵盤焦點、離線狀態、PWA shell、Vitest、React Testing Library、Playwright 與 GitHub Actions。

任何 TOEIC 分數區間都只可視為非官方學習估算，不能當成正式成績預測。

## 環境需求與啟動

- Node.js 22（CI 使用版本）
- npm 10+

```powershell
cd C:\dev\toeic-sprint-original
npm.cmd ci
npm.cmd run dev
```

瀏覽器預設開啟 `http://localhost:5173`。若不設定 Supabase，直接選擇「訪客模式」即可使用核心練習。

## 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動 Vite 開發伺服器 |
| `npm run build` | 建立壓縮、分割過的 production bundle |
| `npm run preview` | 本機預覽 production build |
| `npm run validate:questions` | 驗證 Part 5 schema、重複、答案、解析與分布 |
| `npm run test:node` | 執行 baseline 與 domain 單元測試 |
| `npm run test:component` | 執行 Vitest / React Testing Library 測試 |
| `npm run test:e2e` | 執行桌面與手機 Playwright 流程 |
| `npm run audit:deps` | 檢查 high 以上的 npm 已知弱點 |
| `npm run verify:ci` | 題庫、測試、lint 與 build 完整閘門 |
| `npm run verify:baseline` | 先檢查受保護資產，再執行完整閘門 |

首次執行 E2E 如尚未安裝 Chromium：

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

## 專案架構

```text
src/
  components/   共用 UI、路由與系統狀態
  pages/        頁面與延遲載入 route adapters
  hooks/        session 與 application controller
  services/     練習、進度、同步、驗證與儲存邏輯
  data/         Part 5、Part 7、單字與正式 schema
  utils/        錯誤遮罩、storage、語音等工具
supabase/
  migrations/   可重複套用的資料表、索引、約束與 RLS
tests/
  baseline/ unit/ component/ e2e/
```

頁面使用 `React.lazy` 延遲載入；Part 5 題庫、Supabase 與大型頁面會輸出為獨立 chunk，避免阻塞初始訪客入口。架構與資料流詳見 [docs/architecture.md](docs/architecture.md)。

## Supabase 設定

1. 複製 `.env.example` 為 `.env.local`。
2. 只填入 Supabase project URL 與 public anon key。
3. 依檔名順序套用 `supabase/migrations`。
4. 重啟 Vite，使用真實測試帳號驗證登入與跨裝置同步。

```powershell
Copy-Item -LiteralPath .env.example -Destination .env.local
```

不要將 service-role key、私人 JWT 或任何 secret 放入 `VITE_*`；前端變數會進入瀏覽器 bundle。RLS 與資料邊界詳見 [docs/supabase.md](docs/supabase.md)。

## Production 檢查與部署步驟

本專案沒有在本次升級中自行 push、merge 或部署。人工發布前應依序執行：

```powershell
git status --short
git branch --show-current
git log -1 --oneline
npm.cmd ci
npm.cmd run verify:ci
npm.cmd run audit:deps
npm.cmd run test:e2e
```

接著在 Vercel Preview 設定公開 Supabase 環境變數，套用 migrations，完成人工驗收後才決定是否升級 production。不要把 service-role key 放入 Vercel 前端環境變數。

## 已知限制

- 真實信箱註冊、驗證信與跨裝置同步需要外部 Supabase 測試專案，無法在無憑證的本機 CI 中端到端驗證。
- PWA 目前提供 app shell 與同源 GET runtime cache，不包含背景同步或完整離線帳號功能。
- 分數區間是非官方學習估算；正式成績仍以 ETS TOEIC 測驗為準。
- 上線前仍應用真實手機、螢幕閱讀器與 Vercel Preview 做人工驗收。

完整驗收紀錄與人工清單見 [docs/production-acceptance.md](docs/production-acceptance.md)。
