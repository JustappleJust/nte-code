# MEMORY — 芝碼 SesameCode（工作快照）

## Current State
**最新 UI 修正**：頁尾底部的 `NTE · BAGEL · SESAMECODE` 色帶改回灰色（深淺主題分別採用 `--bar-alt` / `--on-bar-alt`），不再與頂欄同樣為藍色；色帶依各自容器寬度重複至填滿，縮放時自動重算且不使用跑馬燈；網站圖示為雙圓環圓形藍底。
PNG 導出仍使用 Blob URL + `S.encodePNG` 備援；單檔由 `node app/build-single.mjs` 產生。
Phase 8／9 既有驗收仍有效。

## Task
Web 芝碼（唄果 bagel-barcode）產生器＋掃描器：任意二進位資料、任意方向解碼、
解析度以人話描述、可離線單檔。三層結構（外框／主體／內框）、切口長度碼、無版本號、四語系、深淺主題。

## User Constraints & Corrections（務必遵守）
- 不得用膠囊／藥丸形；不得有段落編號；不得用 `<details>` 收合（Phase 9 明令）。
- 不得有跑馬燈動畫（使用回報會中斷、浪費資源）。
- 掃描器文案不得出現像素數字（改「畫面寬度三分之一」這類人話）。
- 「離線可用／不上傳／自由使用」只放頁尾；頁面不得出現「在這台裝置上」。
- 「不上傳」等宣稱不得放 hero；頁尾一句為限（`footer` key）。
- 標示（圓形-標示）文字：**固定 `NTE · BAGEL`，只一段、置於正下方、用底色上色**；
  透明底上看不見是可接受的（使用者明說）。
- 按鈕字樣必須是「導出 PNG」「導出 SVG」。
- 深淺主題配色都要可讀；大標題高度要一致；輸出區要有藍色標題條。
- 「完全掃描器」按鈕必須明顯可見；分頁 icon 與文字要水平對齊。
- 來源聲明不獨立成標題、不放目錄；不得用 AI／生成式等字眼。

## Workspace
- `src/sesame-core.js`（約 2,100 行，UMD）：GEO(RI 6.0 / INNER_T 2.2 / FRAME_T 2.8 / HEADER 60° / 12 模組)、4–16 圈；
  `encode`／`decodeImage`／`renderCode`／`toSVG`／`encodePNG`；`shape:'square'|'circle'|'label'`。
  **Phase 9 新增**：模組層 `LABEL_FONT`（Quicksand Bold 輪廓，11 字 `NTEBAGLSMCOD·`，約 17.7 KB 資料）
  → `LF`（upem 1000、cap 700）→ `labelGeometry(str, plateR, gh0)`（回傳已彎曲到單位座標的輪廓；TRACK 0.16，
  弧長上限 1.95 rad ≈ 112°，rC = plate + gh/2 + 0.9，rBase = rC + gh/2，字往圓心長）。
  `renderCode` 用 `arcText()` 以 4×4 子掃描線＋**非零繞數**光柵化到獨立 `textCov`，最後合層時以**底色**上色；
  `toSVG` 用同一份 `labelGeometry` 產生 `<path fill-rule="nonzero">`（不再用 textPath／系統字型）。
  label 預設 `padU 4.9`、`labelTextU 2.8`。
- `app/index.html`（約 430 行）：`#gen`/`#scan`/`#spec`＋`#full`；`.tabs` 分頁（產生器／掃描器／說明，含 icon）；
  hero（大標＋副標＋一句說明＋三賣點）；預覽卡（藍標題條＋canvas＋讀數）＋輸出卡（導出 PNG／導出 SVG／試掃看看）；
  內容／容錯與圈數／外觀／最近，**全部常駐無收合**。
- `app/style.css`（約 470 行，v6 幾乎重寫）：`--bar:#1c78c6`（深）／`#0d63b0`（淺）、`--mag:#c2185b`／`#b3144f`、
  `.box-h{height:38px}`、`.sub-h` 洋紅長方塊＋點點、`.outbar` 兩欄（icon 在上、文字在下）、
  `.tag.linkish` 白底藍字（完全掃描器）、`#dbg{display:none}`、桌機 `.stagewrap{position:sticky}`、無區塊內捲軸。
- `app/app.js`（約 1,120 行）：`fillBands()` 量測各色帶寬度並靜態重複固定字樣至填滿；`ResizeObserver` 在容器縮放時重算；
  `.fx .wm` 各寫一個字（`wm.words`）；`styleOpts()` 對 label 固定 `ringText='NTE · BAGEL'`；切語言會重建選項並重新產生。
- `app/i18n.js`：四語系各 233+ keys；檔尾有 `V9` 覆寫表（hero.*、gen.png/svg、readout.print=列印估計、
  scan.req.value 白話、footer、band、label.ringText）＋ `SPEC_PATCH` 修正說明頁字串；`dict[lang]['wm.words']`
  是背景三個字（異環|唄果|芝碼／NTE|BAGEL|SESAMECODE／ネバエバ|ベーグル|ゴマコード）。
- `LICENSE-FONT.txt`：Quicksand（SIL OFL 1.1）授權全文。
- `app/sesamecode-standalone.html`：283.3 KB 單檔（0 外部請求）。
- PNG 導出：`saveBlob` 用 Blob URL（不再把 `canvas.toDataURL` 直接塞進 `<a href>`）；canvas 壓縮失敗時改走 `S.encodePNG`。
- `docs/`：ui-generate / ui-label / ui-appearance / ui-scan / ui-spec / ui-light / ui-mobile（1440×950、手機 390×844）。
- `README.md`：v6 條列、檔案結構、v6 驗證列、標示文字限制說明。

## Actions Taken（本輪）
1. fontTools 取 Quicksand wght700 → RDP(ε2.5) 輪廓 → 嵌入核心（首版 26 KB，簡化後 17.7 KB）。
2. 改寫 `arcText` 三次：先線條字（否決）→ 字形輪廓（方向錯、字距單位錯、even-odd 破洞）→ 定案（非零繞數、4×SS）。
3. `labelGeometry` 抽出共用；`toSVG` 改 path，PNG/SVG 完全一致。
4. 重寫 style.css（v6）、index.html（hero＋分頁＋輸出卡＋全常駐）、i18n 補 V9 與 wm.words、app.js 配合。
5. 修：分頁無 `.panel` 規則（三頁同時顯示）、手機頂欄換行、720 px 分頁寬度、掃描器滑桿換行、
   相機區 aspect-ratio 導致右側留白、色帶動畫移除、`tag.linkish` 在藍條上看不見、按鈕效果與 icon 排版。
6. 驗證：run/style/photo 測試、label 三外形解碼、e2e 22 項、單檔 file:// 離線、字型授權檔、README、MEMORY。

## Errors & Dead Ends
- 用線段筆畫自製「圓體字」→ 像手寫字，否決；改成內嵌真實字型輪廓。
- 字形上下顛倒／偏左：rBase 方向與 pen 單位（em vs u）搞混；正確為 `r = rBase - nu`、`penU` 一律用 u。
- even-odd 填色會在 B／A 等重疊輪廓產生髮絲縫 → 必須用**非零繞數**。
- `.panel` 規則在改版時漏寫 → 三頁同時出現（e2e 可測）。
- 手機 `.top-in` 沒 `flex-wrap` 會把 `.tabs{width:100%}` 擠在同一列並截掉品牌名。
- `.cam-wrap{aspect-ratio}+max-height` 會讓寬度由高度決定（右側留白）→ 改成固定高度。
- 舊 `/tmp` 截圖工具需 `PUPPETEER_CACHE_DIR=/tmp/pptr-cache`；Chrome 在 `/tmp/pptr-cache/chrome/linux-131…/chrome`。

## Key Results
- 容量不變：4:117·25/21/19/15、8:334·72、10:480·104、12:652·140、**16:1070·230**（bytes L/M/Q/H）。
- 解析度下限仍為 **3 px/unit**（芝麻長邊 6 px）；2.5、2 px/u 為既定失敗。
- 對比（深／淺）：白字／藍條 4.61、白字／洋紅 5.87、正文／面板 17.1 / 19.2、次要字 7.3 / 7.4。
- 標示文字幾何：gh 2.8u、字距 0.16·gh、弧長 ≤ 1.95 rad、空白 0.55·gh、cap 高 700/1000。
- e2e 22 項：無收合、無跑馬燈、標題條同高 38 px、按鈕「導出 PNG／導出 SVG」、完全掃描器可見、
  列印估計、標示可自掃回（168 ms）、英文全譯、路由與上一頁、手機無溢出。

## 第九輪（使用者 8 點）
1. 色帶只留 `NTE · BAGEL · SESAMECODE`（四語系同字串，`app/i18n.js` 檔尾覆寫）。
2. 刪除整個 hero／大標區塊（`app/index.html` 已無 `.hero`，`style.css` 樣式一併移除）。
3. 外形 SVG 圖示：圓心 (12,9)、半徑 5.2 的圓 ＋ 同心 8.0 的弧（±40°，`M17.14 15.13A8 8 0 0 1 6.86 15.13`，sweep=1 才是往下凸）。
4. 頁尾句子改為「芝碼是佈滿了芝麻的貝果形狀的條碼，源自於《異環》。」（`footer` 改用 `data-i18n-html`）。
5. `.outbar` 改 flex；空間夠就一列（手機自動換行）。
6. 點範例不再跳 toast。
7. 面板半透明：`--panel:rgba(...,.72)`＋`backdrop-filter:blur(10px)`。
8. 色票只寫配色名（`preset.classic`＝經典…、`grad.*`＝霓虹／冰晶…）。
