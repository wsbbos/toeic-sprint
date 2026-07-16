# Production release candidate 驗收紀錄

日期：2026-07-16

分支：`feat/toeic-sprint-production-mvp`

工作目錄：`C:\dev\toeic-sprint-original`

## 最後一輪自動驗收

以下結果來自同一份本機工作樹；完整輸出仍以終端紀錄與 CI 重跑結果為準。

- `npm run validate:questions`：通過。Part 5 為 300 題，A/B/C/D 各 75 題，14 類、easy 77／medium 149／hard 74；Part 7 為 30 題、10 passages，A/B/C/D 為 8／8／7／7，所有答案 evidence 均存在原文。
- Node baseline：2/2 passed；domain/unit：83/83 passed。
- Vitest / React Testing Library：19 files、55/55 passed。
- ESLint：0 errors；TypeScript `checkJs` typecheck：通過。
- Production build：通過；主 app chunk 48.21 kB（gzip 14.91 kB），題庫、React、Supabase 與頁面維持分割載入。
- Playwright production E2E：16 passed、8 skipped。Skipped cases 是專案設定中互斥的 desktop/mobile viewport 條件，不是關閉的功能測試。
- `npm audit --audit-level=high`：0 vulnerabilities。
- E2E runner 結束後沒有殘留 Vite listener；頁面監控未發現 `console.error`、`pageerror` 或 unhandled rejection。

Part 7 驗證仍會輸出「沒有 hard 題」警告。這不是 schema failure；現有題目沒有足夠依據可安全改標 hard，因此保留誠實警告。

## 已驗收流程與風險控制

- 訪客入口、local-first fallback、損壞 JSON 修復與 localStorage 寫入失敗提示。
- Part 5 快速／自訂／分類／難度練習，Part 7 獨立閱讀流程與商務文件 renderer。
- 作答、上一題、下一題、標記、收藏、提交確認、防重複提交、題數不足與結果解析。
- 練習與 Mini Mock 重整恢復、倒數與最新答案交卷；draft 依使用者隔離。
- 錯題本、錯題重練、間隔複習、弱點分析、學習趨勢與非官方分數區間標示。
- 桌面與 Pixel 5 viewport；核心 route 無頁面級橫向溢出，可見按鈕高度至少 43px。
- Answer choices 支援 radio 語意、方向鍵、Home/End、Space/Enter 與 roving focus。
- Mobile navigation 支援 dialog 語意、focus trap、Escape 關閉、焦點還原與 body scroll lock。
- Supabase 登入 component contract、失敗降級、profile owner 隔離、migration/RLS 靜態與 domain 驗證。
- PWA manifest、service worker、icon／原創 SVG 資產與 production 離線 app-shell 重開。
- UI 不再暴露 raw Supabase 錯誤、token、project URL 或衝突的硬編碼產品版本。

## 資料與同步邊界

- 本機 profile 正規化會保留最近 2,000 筆一般練習、100 筆 Mini Mock 與 730 天每日紀錄；累積統計、錯題與收藏不因歷史截斷而歸零。
- 登入同步採整份 profile 的 last-write-wins，會比較活動時間避免舊雲端快照覆蓋較新的本機進度。
- 兩台離線裝置同時修改再上線時，尚未支援欄位級或 operation-level conflict merge；較晚同步的完整 profile 可能覆蓋另一份變更。

## 仍需人工或外部環境驗收

- 使用真實 Supabase 測試帳號完成註冊信、登入、登出，以及兩台裝置的正常與衝突同步。
- 在 Supabase Dashboard 確認 migrations 已依序套用，並以兩個帳號交叉驗證 RLS 隔離。
- 在新的 Vercel Preview 重新執行公開 smoke test；若啟用 Supabase，再驗證登入與網路失敗降級。
- 使用 iOS Safari／Android Chrome 實機驗證虛擬鍵盤、加入主畫面與離線重開。
- 使用 NVDA、VoiceOver 或同等螢幕閱讀器完成登入、作答、交卷與錯題重練。

## 已知限制

- 自動化登入測試使用 mocked Supabase contract；沒有外部測試帳號時不建立真實雲端資料。
- PWA 是 app shell／runtime cache，不含背景資料同步與完整離線帳號功能。
- Part 7 目前僅 30 題，且沒有經內容證據支持的 hard 題。
- TOEIC 區間僅為非官方學習估算，不能宣稱精準預測正式分數。
- 本輪 hardening 沒有 push、merge、rebase、部署或修改 remote，既有 Vercel Preview 也未被覆蓋。
