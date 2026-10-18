# MEMORY — 芝碼 SesameCode（工作快照）

## Current State
**最新更新（第十三輪：支援 24 圈與 4 顆芝麻內容長度標示）**：
1. 最大圈數擴充至 24 圈（`GEO.MAX_VERSION = 24`，L 級最大容量提升至 477 bytes）。
2. 資料格式直接更新：主體格點（`digits`）最前安排 4 顆芝麻作為內容長度標示（5 進位，5⁴ = 625，表示 0–624 bytes），後續格點存放 Reed–Solomon codeword；解碼端直接還原精確長度，不再遺失二進位末尾 0x00，字串亦無需依賴 `trimZeros`。
3. 範例圖片 `docs/example-1.png` 與 `docs/example-2.png` 重新導出，採用新格式並維持範本配色（`g.mint` 與 `g.neon`，label 外形），解讀測試均 100% 通過。
4. 前端資源快取破除更新至 `20261018-a`，單檔 `app/sesamecode-standalone.html` 同步重打。

**既有修正（SVG 巨大留白）**：`toSVG` 的座標系一度混用「單位 u」與「×64 縮放」——路徑座標是 u，
viewBox／背景矩形／底盤半徑卻乘了 64（且把半寬當成全寬），導致內容只佔畫布 1/32、四邊出現大片空白，
`circle` 外形也因為 clip 半徑是畫布半寬的 2 倍而裁不掉四角。
現在 viewBox 全程用 u：`v2 = 2·S`（全寬）、`plateR = o.plateU ?? R6 + margin`；viewBox 緊貼內容
（方形 外框＋留白、圓形 再＋0.5u、圓形-標示 再＋4.9u），SVG 與 PNG 比例一致。
標示字形輪廓改 `toFixed(4)`（u 尺度下仍保有列印解析度）。
`test/style.js` 新增 6 項 viewBox 回歸檢查（47 通過 / 0 失敗）；`docs/example-*.svg` 重新導出；
新增 `docs/svg-whitespace-before-after.png`（上排修正前／下排修正後）。

**UI 修正**：
1. 解決下拉選單（`.sel`）展開時被下方卡片（`.box`、`.fields`、`.stage`、`footer` 等）因堆疊上下文（stacking context）遮擋的問題：展開時動態提升祖先容器之 z-index（`:has(.sel.open)` 與 `.has-open-sel` 雙層機制），並支援視窗邊界自動向上彈出（`.open-up`），選單清單改用不透明背景與陰影，保證所有選項皆可見且能點擊。
2. 頁尾底部的 `NTE · BAGEL · SESAMECODE` 色帶改回灰色（深淺主題分別採用 `--bar-alt` / `--on-bar-alt`），不再與頂欄同樣為藍色；色帶依各自容器寬度重複至填滿，縮放時自動重算且不使用跑馬燈；網站圖示為雙圓環圓形藍底。
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
- `src/sesame-core.js`（約 2,100 行，UMD）：GEO(RI 6.0 / INNER_T 2.2 / FRAME_T 2.8 / HEADER 60° / 12 模組)、4–24 圈；
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

## 第十二輪（SVG 巨大留白，使用者 1 點）
導出的 SVG 四邊有錯誤的巨大留白（內容縮在中央，面積僅約 0.1%）。
- 原因：`toSVG` 內 `const v2 = S * 64` 把 viewBox 與背景矩形放大 64 倍，但**所有 `<path>`／`<ellipse>` 座標都是 u**；
  而且 `S = R6 + margin + padU` 是**半寬**（同 `renderCode` 的 `halfU`），`box` 卻用 `-v2/2 … v2` 當邊長，
  等於半寬再 ×32。`plateR` 另外乘了 64（註解「64 = viewBox 每 u 的單位數」，這個縮放根本不存在），
  使圓形底盤 clip 半徑 = 畫布半寬的 2 倍 → `circle` 四角裁不掉（PNG 是透明、SVG 是方角白底）。
- 修正：座標系全部統一為 u —— `v2 = 2 * S`（全寬）、`plateR = o.plateU ?? (R6 + margin)`；
  漸層跨度、mask 區域本來就用 v2，比例自然正確。標示字形輪廓 `n2` 改 `toFixed(4)`（u 尺度下 0.0001u ≈ 4K 輸出的 0.01 px）。
- 驗證（resvg 光柵化 + `decodeImage`）：方形／圓形／圓形-標示 × 留白 0.5／2／6u 共 9 組，
  與 `renderCode` 墨跡 **IoU 0.994–0.996**、墨量差 < 0.06 個百分點，全部解回原文；
  修正前同一份比對的內容只佔面積 0.10%、9 組全部「找不到外框環」。
- 一併重出 `docs/example-1.svg`、`docs/example-2.svg`（label 外形、`ecLevel 1`、解回原 URL：
  `https://justapplejust.github.io/nte-code/app/index.html` 8 圈 / `https://discord.gg/GtCdyxxWSN` 5 圈，
  viewBox 半寬 41.3u / 32.9u 與舊檔一致）與 `app/sesamecode-standalone.html`。
- 對照圖 `docs/svg-whitespace-before-after.png`：上排修正前（三種外形都是空白）、下排修正後。
- README：API 註解改為輪廓 `<path>`（不再是 `<textPath>`）、留白列補 SVG viewBox 說明、
  標示墊 4.2u → 4.9u、style 測試 42 → 47、新增 SVG 導出比對一列。
- **使用者對 PR #7 的判斷是「無效」並在 6 分鐘內 revert（#8）**。實測 #7 的程式本身是有效的
  （光柵化後內容滿版），所以「無效」幾乎確定是**頁面還在跑舊檔**：舊分頁把舊 JS 留在記憶體、
  GitHub Pages 對 HTML／JS 有約 10 分鐘快取（#7 部署 13:47:20 完成、13:52 就 revert）。
  重新做的 PR **#10** 因此加了「可驗證性」：
  - `app/index.html` 的 `<html data-build="…">` ＋ 四個資源 `?v=…`（快取破除）
  - 頁尾一行低調的 `build …`（`#build-note`，四語系共用、非文案宣稱）＋ `console.info`
  - `app/build-single.mjs` 改用 regex 吃掉 `?v=`，找不到標籤就**拋錯**（避免單檔打包靜默失效）
  - 真瀏覽器 E2E（headless Chromium，`@sparticuz/chromium` + `puppeteer-core`，`/tmp/al2023/lib`）：
    開發版與 `file://` 單檔點「導出 SVG」→ viewBox 半寬 36.9、墨跡佔 98.8%（revert 後的 main 為 3.0%）
- 給下一個 session：**改動任何前端資源時要一起換 `data-build` 與 `?v=`**；使用者若說「沒效果」，
  先請他看頁尾 build 或重新整理，再談程式。

## 第十一輪（相機凍結，使用者 1 點）
「完全掃描頁」的「掃描效果」開啟時，掃到芝碼要**暫時凍結相機畫面**，動畫完成後（**不用按「再掃一次」**）
以**漸變**恢復 live 相機畫面。
- 做法：沿用既有 `#fs-bg` 圖層（原本只有圖片掃描才鋪）。`fxPlay` 一開場就 `fxMakeHitCanvas(hit)` 把**剛剛解碼的那一格**
  畫進 `fs-bg`，`.fs-cam` 加 `bg-frozen`（`opacity:1; transition:none` → 立即凍結）。
- 解凍：動畫 `finish()` 與 `fxStop()` 都呼叫 `fsThawCam()`（移除 `bg-frozen`），由 CSS `.fs-bg{transition:opacity .72s}`
  漸變回 live 畫面；`#fs-video` 全程不暫停（只是被蓋住）。
- 狀態：`bg-frozen`（相機凍結）／`bg-still`（圖片掃描，來源畫面一直保留、不淡出）／無 class（live）。`fsClearBg()` 會清掉兩者。
- `fsHit` 開頭若舊動畫仍在跑先 `fxStop(false)`，避免兩個 rAF 迴圈搶同一顆 `#fs-fx`；`closeFull`／`fs-again`／`beforeunload` 走 `fxStop` 也會解凍。
- 關閉效果或 `prefers-reduced-motion` 不進 `fxPlay`，因此不凍結（維持原行為）。

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

## 第十輪（完全掃描器「掃描效果」，使用者 4 點）
1. **切換開關預設開**：`#full` 的 `.fs-foot` 加方形滑鈕開關（`.swx`，全站直角），`role="switch"`、
   `aria-checked`，存在 `localStorage['sesame.fsfx']`（'0' 關／預設開）；四語系 `fs.fx`／`fs.fx.t`。
2. **掃描成功效果**（`app/app.js` 的 `fxPlay(hit, r)`，`#fs-fx` canvas 疊在影片上）：
   - ① 亮度環過內外環一圈：沿橢圓仿射（`geometry.cx/cy/A/B/phi`）以 `lighter` 合成掃過
     外框 `metaMid(rings)` 與內環 `(INNER_RI+RI)/2`，亮頭＋拖尾＋完成整圈閃光。
   - ② 芝麻波浪：依 `encode` 的 cells（`r, deg, state`）由內往外＋角度微起伏排延遲，
     每顆以 SA/SB 橢圓放大再縮小（1→1.85→1）＋光核；同心波前圓同步擴散。
   - ③ 乾淨複製：`S.encode(r.bytes,{version,ecLevel})` 重編 → `renderCode({shape:'circle',rotDeg:0})`，
     顏色由 `fxSampleColors` 從原圖取樣（墨/底各取亮度分群平均；底色用「亮度～設計座標」線性回歸
     求漸層方向→`bgStyle{from,to,angle}`）；繪製時以仿射對上原圖角度形變（設計0°方向 = `baseDeg+phi`），
     掃描線自上而下顯影＋lift pop。場景 vignette 讓複製品浮出。
   - ④ 往下飛行變幻：圓形（圓角矩形 clip 半徑 r→0）→ 結果面板矩形，代碼縮影攤平（形變→正圓）淡出，
     面板底色長出；**圓環→按鈕**（下緣弧 quadraticCurveTo 攤平成按鈕列線）、**芝麻→文字**（8 顆小方點
     散入文字列）；fp≥0.72 時結果面板 `.show` 進場（文字 blur→清晰、按鈕 nth-child 依序彈入）。
   - 時序約 3.2s：sweep 80–900、wave 330–1430、reveal 1260–1880、lift 1900、fly 2120–3000。
3. **圖片掃描背景**：`#fs-bg` 持久畫布鋪來源影像（cover-fit），fx 結束不清除（像場景）；
   相機模式由 live 畫面當背景。`fs-hint` 掃到後隱藏（避免透出結果面板），再掃一次還原。
4. **無障礙／降級**：`prefers-reduced-motion` 直接出結果；關閉開關＝原本行為；`fxStop(revealNow)`
   可中斷並立刻顯示結果；closeFull／fs-again／beforeunload 皆清 fx 與背景。
- 驗證：自製照片場景（斜 23°、漸層卡）經 `#fs-file` 全流程 e2e（亮/暗主題、reduced-motion、
  開關持久化、無 console 錯誤）；`baseDeg+phi≈23.3°` 對上渲染旋轉，仿射公式與核心 `makeMapper` 一致。
- 修正：`test/run.js`／`style.js`／`debug-geom.js` 的 `/home/user/sesame-code/test/out` 硬編碼改 `__dirname`；
  新增 `.gitignore`（`test/out/`）。run.js 結果 49 過／2 失敗（2.5、2 px/u 為既定失敗）。
- 測試工具：本輪無 Puppeteer 快取，改用 npm `@sparticuz/chromium`（內嵌 chromium.br＋al2023.tar.br
  解到 `/tmp/al2023`，需 `LD_LIBRARY_PATH=/tmp/al2023/lib`）＋ `puppeteer-core`，放在 repo 外 `/home/user/pptr`。
