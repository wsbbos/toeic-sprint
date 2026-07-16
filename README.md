# TOEIC Sprint

TOEIC Sprint 是一個 local-first 的 TOEIC 練習 MVP。核心流程不需登入即可使用；設定 Supabase 後，登入使用者可同步學習進度。這個版本保留既有 Part 7 與 Supabase 功能，並完成 Part 5 題庫、可恢復練習、個人化複習、PWA、測試與 CI 的 production-ready 基礎。

## 已完成的核心能力

- Part 5：300 題、14 類題型、A/B/C/D 各 75 題，全部通過 schema 與內容分布驗證。
- Part 7：保留既有 30 題閱讀題，提供 10 種真實商務文件版型與 30/30 題原文答案線索，資料仍與 Part 5 分離。
- 練習模式：快速、自訂題數、分類、難度、計時與完整模擬。
- 作答流程：上一題、下一題、標記、提交確認、重整恢復與防重複提交。
- 學習系統：錯題本、收藏、重新作答、間隔複習、弱點分析、每日目標、連續天數與趨勢。
- 資料策略：訪客模式完整可用；Supabase 未設定或失敗時安全降級至 local storage。
- 體驗與品質：原創 SVG 視覺系統、解析高亮、RWD、鍵盤焦點、lazy asset、離線快取、PWA、Vitest、React Testing Library、Playwright 與 GitHub Actions。

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
| `npm run validate:questions` | 驗證 Part 5／Part 7 schema、跨 Part ID、選項、答案、解析、原文 evidence 與分布 |
| `npm run validate:visuals` | 驗證原創 SVG manifest、尺寸、大小、安全引用與 PWA 快取 |
| `npm run test:node` | 執行 baseline 與 domain 單元測試 |
| `npm run test:component` | 執行 Vitest / React Testing Library 測試 |
| `npm run test:e2e` | 以受控 Vite runner 執行桌面與手機 Playwright 流程，結束後自動清理伺服器 |
| `npm run audit:deps` | 檢查 high 以上的 npm 已知弱點 |
| `npm run verify:ci` | 題庫、測試、lint、typecheck 與 build 完整閘門 |
| `npm run verify:baseline` | 先檢查受保護資產，再執行完整閘門 |

首次執行 E2E 如尚未安裝 Chromium：

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

## 專案架構

```text
src/
  assets/       視覺資產 manifest 與命名規則
  components/   共用 UI、文件、解析、視覺與系統狀態
  pages/        頁面與延遲載入 route adapters
  hooks/        session 與 application controller
  services/     練習、進度、同步、驗證與儲存邏輯
  data/         Part 5、Part 7、單字與正式 schema
  utils/        錯誤清理、語音等通用工具
public/
  assets/visuals/ 原創、可快取的 SVG 插圖
supabase/
  migrations/   可重複套用的資料表、索引、約束與 RLS
tests/
  baseline/ unit/ component/ e2e/
```

頁面使用 `React.lazy` 延遲載入；Part 5 題庫、Supabase 與大型頁面會輸出為獨立 chunk，避免阻塞初始訪客入口。架構與資料流詳見 [docs/architecture.md](docs/architecture.md)；文件 renderer、解析高亮與圖片資產規則詳見 [docs/visual-content-system.md](docs/visual-content-system.md)。

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

本專案只允許 Preview 部署；不得由此流程直接升級 production、push 或 merge。部署前應依序執行：

```powershell
git status --short
git branch --show-current
git log -1 --oneline
npm.cmd ci
npm.cmd run verify:ci
npm.cmd run audit:deps
npm.cmd run test:e2e
```

接著使用 `vercel deploy` 建立 Preview（不要加 `--prod`），在 Preview 設定公開 Supabase 環境變數並套用 migrations。可用下列方式在 production build／Preview 上額外執行 PWA 離線驗收：

```powershell
$env:PLAYWRIGHT_BASE_URL='https://your-preview.vercel.app'
npm.cmd run test:e2e
```

完成人工驗收後才決定是否升級 production。不要把 service-role key 放入 Vercel 前端環境變數。

## 已知限制

- 真實信箱註冊、驗證信與跨裝置同步需要外部 Supabase 測試專案，無法在無憑證的本機 CI 中端到端驗證。
- PWA 提供 app shell、原創視覺 precache 與同源 GET runtime cache；仍不包含背景資料同步或完整離線帳號功能。
- 分數區間是非官方學習估算；正式成績仍以 ETS TOEIC 測驗為準。
- 登入同步以整份 profile 的最新時間為準；兩台離線裝置同時修改後才上線時，不做欄位級衝突合併，較晚同步的完整 profile 可能覆蓋另一份變更。
- 本機 profile 會保留最近 2,000 筆一般練習、100 筆 Mini Mock 與 730 天每日紀錄；累積統計、錯題與收藏不因歷史截斷而歸零。
- Part 7 現有題庫沒有具充分證據可標示為 hard 的題目，驗證器會保留警告而不虛假調高難度。
- 上線前仍應用真實手機、螢幕閱讀器與 Vercel Preview 做人工驗收。

完整驗收紀錄與人工清單見 [docs/production-acceptance.md](docs/production-acceptance.md)。
