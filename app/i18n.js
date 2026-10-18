/* 芝碼 SesameCode — 介面翻譯（繁體中文 / 简体中文 / English / 日本語）
 * 用法： SesameI18N.setLang('en'); SesameI18N.t('gen.btn');
 * 靜態文字以 data-i18n / data-i18n-html / data-i18n-ph / data-i18n-title 標記。
 */
(function (root) {
  'use strict';

  const LANGS = [
    { code: 'zh-Hant', label: '繁體中文' },
    { code: 'zh-Hans', label: '简体中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
  ];

  const dict = {
    'zh-Hant': {
      'gen.ringsOpt': '{v} 圈（{cells} 個可讀點）',
      'cap.denseHint': '這是高密度芝碼（{rings} 圈）：畫面上每個芝麻點都更小，建議輸出 1536 px 以上、拍照時讓芝碼佔滿畫面，會好掃很多。',
      'scan.pass': '第 {n} 次嘗試成功',
      'spec.title': '芝碼怎麼運作',
      'scan.maxdim.2048': '2048（高密度芝碼）',
      'style.shape.transparent': '外圍透明',
      'style.square': '方形',
      'style.circle': '圓形',
      'brand.name': '芝碼 SesameCode',
      'band': '芝碼 · 唄果 · 免費離線 · 不上傳 · 芝碼產生器 ＋ 掃描器 · SESAMECODE · SESAMECODE · SESAMECODE',
      'rail.foot': '離線可用<br>不上傳資料<br>自由使用',
      'style.gradShort': '漸層',
      'scan.idle.t': '攝影機未開啟',
      'scan.idle': '把芝碼放在圓框內按下「開啟攝影機」；也可以直接拖放圖片、選擇檔案或貼上剪貼簿。',
      'gen.recent': '最近做過的芝碼',
      'gen.recentEmpty': '還沒有紀錄 — 做出來之後會自動記在這裡',
      'toast.recent': '已載入先前的輸入並重新產生（{rings} 圈）。',
      'scan.noCam': '這個瀏覽器環境沒有攝影機 API（或非 https / localhost）：請改用「從圖片掃描」、拖放或貼上剪貼簿。',
      'brand.badge.short': '啟發於《異環》',
      'stage.working': '計算中…',
      'stage.decoding': '讀回解碼中…',
      'readout.rings': '圈數',
      'readout.rings.t': '圈數越多，能裝的內容越多，但掃描時需要越清楚',
      'readout.cells': '可讀點',
      'readout.cells.t': '這張芝碼上一共有多少個芝麻點',
      'readout.payload': '資料量',
      'readout.payload.t': '你的內容 {data} bytes ＋ 容錯 {ec} bytes',
      'readout.ec': '容錯',
      'readout.ec.t': '容錯 {n} bytes：刮傷、反光或模糊時，還能把內容救回來',
      'readout.diameter': '直徑',
      'readout.diameter.t': '輸出檔案中芝碼本身的直徑（不含留白）',
      'readout.print': '印出來約',
      'readout.print.t': '以 300 dpi 列印時的實際大小；每個芝麻點約 {mm} mm（小於 0.3 mm 容易印壞或掃不到）',
      'readout.minres': '拍攝建議',
      'readout.minres.t': '拍照時芝碼在畫面中至少要有這麼大；圖片檔的極限約 {hard} px',
      'scan.req.title': '這樣拍最好掃',
      'scan.req.value': '這張芝碼建議在畫面中佔到 {px} px 以上（越大越好，圖片檔最低約 {hard} px）。不用擺正、不用乾淨背景，對準圓框隨手拍就行。',
      'scan.cam.device': '鏡頭',
      'scan.cam.n': '鏡頭 {n}',
      'scan.reading': '讀取影像中…',
      'scan.tune': '進階設定（通常不用動）',
      'scan.del': '刪除',
      'scan.histEmpty': '還沒有掃描紀錄',
      'hud.locked': '已鎖定 · {rings} 圈',
      'spec.toc': '目錄',
      'spec.back': '↑ 回到頂部',
      'gen.examples': '快速範例',
      'gen.placeholderHex': '例如：00 ff 12 8a 3c 7d（十六進位，任意長度）',
      'ex.greeting': '嗨！異環',
      'ex.id': '唄主編號',
      'ex.url': '唄果網址',
      'ex.json': 'JSON',
      'ex.binary': '二進位',
      'toast.copied': '已複製到剪貼簿。',
      'toast.saved': '已輸出 {fmt}：{name}',
      'toast.example': '已載入範例「{v}」並重新產生。',
      'toast.readbackOk': '讀回成功：{ms} ms，{rings} 圈。',
      'toast.readbackFail': '讀回失敗（{ms} ms）— 詳見下方訊息。',
      'toast.scanOk': '掃描成功：{ms} ms，{rings} 圈。',
      'brand.badge': '啟發於《異環》',
      'brand.badge.name': 'Neverness to Everness',
      'brand.badge.title': '本專案為《異環》世界觀的同人創作，非官方作品',
      'style.gradInk': '墨色漸層',
      'style.gradBg': '底色漸層',
      'style.shape': '外形',
      'style.shape.square': '方形',
      'style.shape.circle': '圓形',
      'grad.ntecity': '異環夜色',
      'grad.neon': '霓虹洋紅',
      'grad.alert': '警報琥珀',
      'grad.mint': '薄荷訊號',
      'grad.ice': '冰晶藍',
      'grad.rose': '玫瑰金',
      'grad.deepcity': '深夜都市',
      'grad.mist': '晨霧',
      'grad.neonfog': '霓虹霧',
      'grad.paper': '米白紙',
      'preset.nte': '異環（青／深夜藍）',
      'preset.alert': '警報（洋紅／暗）',
      'disclaimer.title': '來源聲明',
      'disclaimer.body': '「芝碼 SesameCode」是受《異環》(Neverness to Everness) 世界觀啟發的同人工具：唄果、唄主、芝碼等設定皆為致敬性的再創作。本專案與 Hotta Studio、完美世界及其代理商沒有任何關聯，未經授權、亦未使用任何官方素材或美術；介面配色與版面僅為風格上的致敬。遊戲名稱與相關商標屬於其各自權利人所有。',
      'doc.title': '芝碼 SesameCode ｜ 唄果',
      'brand.sub': '做出自己的芝碼，隨手就能掃',
      'nav.gen': '產生器', 'nav.scan': '掃描器', 'nav.spec': '說明',
      'theme.toggle': '切換深色／淺色',
      'theme.dark': '深色', 'theme.light': '淺色',

      /* ---------- 產生器 ---------- */
      'gen.content': '想放進芝碼的內容',
      'gen.mode.text': '打字',
      'gen.mode.hex': '十六進位（進階）',
      'gen.placeholder': '想放什麼都可以：一句話、一段網址、一串編號…',
      'gen.ec': '容錯等級',
      'gen.ec.l': '標準（可修約 12%）',
      'gen.ec.m': '較高（可修約 17%）',
      'gen.ec.q': '高（可修約 22%）',
      'gen.ec.h': '最高（可修約 27%）',
      'gen.rings': '圈數',
      'gen.rings.auto': '自動（依內容長度）',
      'gen.size': '輸出大小',
      'gen.btn': '做出芝碼',
      'gen.png': '下載圖片',
      'gen.svg': '下載向量檔',
      'gen.self': '試掃看看（在這台裝置上）',
      'gen.info': '這張芝碼的詳細資料',
      'gen.preview': '芝碼',
      'gen.appear': '外觀',
      'gen.needGenerate': '請先產生芝碼',

      'style.preset': '快速配色',
      'style.ink': '芝麻（墨色）',
      'style.bg': '底（背景）',
      'style.color': '顏色',
      'style.color2': '第二顏色',
      'style.gradient': '使用漸層',
      'style.angle': '漸層角度',
      'style.opacity': '不透明度',
      'style.cutout': '挖空（墨變成透明洞）',
      'style.margin': '圖形留白',
      'style.swap': '對調墨色／底色',
      'style.reset': '回復預設',
      'style.invert': '反相',

      'contrast.label': '對比度檢查',
      'contrast.ratio': '最差配對 {ratio}:1',
      'contrast.ok': '對比充足，掃描沒有問題。',
      'contrast.weak': '對比偏低（{ratio}:1），在光線不足或模糊時可能掃不到；建議 ≥ 4.5:1。',
      'contrast.bad': '對比不足（{ratio}:1），很可能掃描失敗；請把墨色與底色拉開或改用深淺差更大的組合。',
      'contrast.transparentBg': '背景透明：實際對比取決於底材，請確認底材與墨色的亮度差異足夠。',
      'contrast.transparentInk': '墨色透明：實際對比取決於底材。',
      'contrast.cutout': '挖空模式：紋樣是透明洞，對比取決於底材。',
      'contrast.sameColors': '墨色與底色相同，芝碼將完全無法辨識。',

      'preset.classic': '經典（黑／白）',
      'preset.sesame': '芝麻（棕／米）',
      'preset.matcha': '抹茶（深綠／淺綠）',
      'preset.midnight': '夜藍（金／深藍）',
      'preset.blueprint': '藍曬（白／藍）',
      'preset.rose': '玫瑰（酒紅／粉白）',

      /* ---------- 掃描器 ---------- */
      'scan.title': '掃描芝碼',
      'scan.cam.on': '開啟攝影機',
      'scan.cam.off': '停止',
      'scan.hint': '把芝碼放進圓框內，任何方向都可以',
      'scan.file': '選圖片',
      'scan.paste': '貼上剪貼簿',
      'scan.drop': '把芝碼圖片拖進來',
      'scan.thr': '掃描靈敏度',
      'scan.maxdim': '解析度上限',
      'scan.maxdim.720': '720（快）',
      'scan.maxdim.1280': '1280（建議）',
      'scan.maxdim.1600': '1600（慢但更遠）',
      'scan.result': '掃到的內容',
      'scan.empty': '還沒有掃到東西 — 把芝碼放進圓框，或直接選一張圖片',
      'scan.copy': '複製內容',
      'scan.clear': '清除紀錄',
      'scan.history': '這次掃到的',
      'scan.debug': '除錯資訊',
      'scan.ok': '辨識成功（{ms} ms）',
      'scan.fail': '未辨識（{ms} ms）：{err}',
      'scan.camErr': '無法開啟攝影機（需 https 或 localhost，且瀏覽器需授權）：{err}　可改用「從圖片掃描」。',
      'scan.clipErr': '無法讀取剪貼簿：{err}',
      'scan.clipNone': '剪貼簿沒有圖片',
      'scan.imgErr': '無法讀取圖片',
      'scan.copied': '已複製',
      'scan.copyFail': '複製失敗，請手動選取',
      'scan.binary': '（非 UTF-8 文字，以十六進位顯示）',

      'result.rings': '{n} 圈',
      'result.ec': '糾錯 {key}（{bytes} bytes）',
      'result.corrected': '修正 {n} bytes',
      'result.total': '共 {n} bytes',
      'result.normal': '正常方向',
      'result.mirror': '鏡像（已自動還原）',
      'result.refined': '單應精修',
      'result.resid': '擬合殘差 {px} px',
      'result.conf': '格點信度 {p}%',

      /* ---------- 訊息 ---------- */
      'msg.generated': '做好了：{rings} 圈 · {ec} 容錯',
      'msg.readbackOk': '讀回成功（{ms} ms）：{rings} 圈 / {ec} / 修正 {fixed} bytes / 長度碼 [{widths}] / 格點信度 {conf}%',
      'msg.readbackFail': '讀回失敗（{ms} ms）：{err}',
      'msg.downloaded': '已下載 {fmt}',
      'msg.readbackSubstrate': '　（透明區域已模擬疊在淺色底材上解碼）',
      'msg.hexEven': '十六進位長度需為偶數',
      'msg.hexBad': '含非十六進位字元',
      'msg.capInfo': '內容 {bytes} bytes ｜ 用 {rings} 圈裝得下：資料 {data} bytes ＋ 容錯 {ecBytes} bytes（約可修復 {fix} bytes 的污損）｜ 共 {cells} 個可讀點',
      'msg.overCapacity': '內容太長了（{bytes} bytes）— 目前最多可以放 {cap} bytes。',
      'msg.labelVersion': '圈數', 'msg.labelEc': '糾錯', 'msg.labelFormat': '格式版本',
      'msg.labelDataCap': '資料容量', 'msg.labelUsed': '實用', 'msg.labelCells': '總格數',
      'msg.labelCode': '切口長度碼', 'msg.labelIndex': '索引', 'msg.labelOuter': '外框外緣半徑',
      'msg.labelInner': '內框環外緣', 'msg.labelHole': '內孔', 'msg.labelRatio': '內外環比',
      'msg.labelRings': '各圈格數',

      /* ---------- 規格頁 ---------- */
      'spec.cols': ['圈數', '各圈格數', '總格數', '內外環比', 'L', 'M', 'Q', 'H', '外框半徑 u'],
      'spec.note': '單位 u = 芝麻基準尺（芝麻長邊 2u、短邊 1u）。「格數」為可寫入的格點總數，每格 5 種狀態（log₂5 ≈ 2.32 bit）。容量欄位為扣除 Reed–Solomon 糾錯位元組後可存放的資料位元組數。',
      'spec.html': `
        <h2>芝碼的結構</h2>
        <p>芝碼是<b>極座標上的二維條碼</b>：用同心圓與角度共同定位，資料寫在「圈 × 角度」的格點上；外框則像傳統條碼那樣，<b>用圓弧的長度（粗細）</b>攜帶元資料。外觀像一枚撒滿芝麻的貝果。</p>
        <h3 class="h3">三個部分</h3>
        <ul>
          <li><b>外框（圓環・單層）</b>：厚度 2.8u 的一道圓環，被切掉 <b>60°</b>。切口兩端是半圓形的<b>膠囊端帽</b>（半徑 = 環厚的一半 1.4u）。</li>
          <li><b>切口內的長度碼</b>：60° 切成 12 格（每格 5°），安排 4 段「<b>墨・空・墨・空</b>」，每段長 2、3 或 4 格（四段總和恰為 12 格）。每段都是與外框同厚、兩端圓滑的<b>膠囊弧</b> —— 就像傳統條碼用寬窄不同的條紋承載資訊，這裡用<b>圓弧的長短</b>承載：19 種組合，其中 16 種對應「格式版本(2) + 糾錯等級(2)」，剩下 3 種保留給未來格式。</li>
          <li><b>主體</b>：同心環狀格陣。第 k 圈半徑 r<sub>k</sub> = 9.0 + 2.8k，可用格數 <b>n<sub>k</sub> = ⌊2π r<sub>k</sub> / 2.8⌋</b>。每格可放 0 或 1 顆芝麻。</li>
          <li><b>內框（圓環）</b>：外緣 6u、內孔 3.8u 的圓環，提供圓心與尺度基準。</li>
        </ul>
        <h3 class="h3">圈數怎麼決定</h3>
        <p>沒有版本號。圈數由<b>內外環的半徑比</b>決定：比例越大（外框相對越細）圈數越多、容量越大，但掃描時對解析度要求也越高。解碼端量出比例後，依「最接近哪個比例」排序並逐一嘗試，因此同一張圖永遠解得到正確圈數。</p>
        <h3 class="h3">每個「芝麻」的資訊量</h3>
        <p>芝麻是 2u × 1u 的橢圓，具有方向性：相對於該處的切線方向可旋轉 0° / 45° / 90° / 135°，加上「沒有芝麻」共 <b>5 種狀態</b>，每格 log<sub>2</sub>5 ≈ 2.32 bit。</p>
        <h3 class="h3">資料流程</h3>
        <p>任意二進位資料 → Reed–Solomon（GF(256)，可修 t = ec/2 個位元組）→ 以 5 進位打包（32 位元組一段）→ 依「內圈到外圈、同圈依角度」填入格點 → 不足補零。</p>
        <h3 class="h3">外觀與列印</h3>
        <ul>
          <li>墨色與底色可自選，支援<b>雙色漸層</b>與<b>透明</b>（透明底、半透明墨、挖空成洞）。</li>
          <li>選色時會即時顯示 <b>WCAG 對比度</b>；建議 ≥ 4.5:1，低於 3:1 很可能掃不到。</li>
          <li>「圖形留白」可調 0.5–8u。芝碼本身不要求特定留白，留白主要是為了列印裁切與視覺平衡。</li>
        </ul>
        <h3 class="h3">掃描需求</h3>
        <ul>
          <li>方向：<b>不限</b>。方向由切口與長度碼決定，鏡像亦可自動偵測。</li>
          <li>角度：可容許明顯傾斜（實測 40° 透視仍可解析，內部以單應矩陣精修）。</li>
          <li>背景：不需純白，但需與芝碼有對比（局部自適應二值化，可容忍漸層與暗角）。</li>
          <li>解析度：芝麻長邊建議 ≥ 10 像素（約 5 px/單位）；極限約 8 px（4 px/單位）。</li>
          <li>距離：以手機 1200 萬像素為例，芝碼直徑 40 mm 時約可在 20–40 cm 外成功掃描。</li>
        </ul>`,
      'footer': '芝碼（SesameCode）是《異環》唄果世界的條碼玩法重現：圓圈、角度、芝麻方向，就是一串資料。整個網站都在你的裝置上執行，不上傳任何內容。'
    },

    'zh-Hans': {
      'gen.ringsOpt': '{v} 圈（{cells} 个可读点）',
      'cap.denseHint': '这是高密度芝码（{rings} 圈）：每个芝麻点都更小，建议输出 1536 px 以上、拍照时让芝码占满画面，会好扫很多。',
      'scan.pass': '第 {n} 次尝试成功',
      'spec.title': '芝码怎么运作',
      'scan.maxdim.2048': '2048（高密度芝码）',
      'style.shape.transparent': '外围透明',
      'style.square': '方形',
      'style.circle': '圆形',
      'brand.name': '芝码 SesameCode',
      'band': '芝码 · 呗果 · 免费离线 · 不上传 · 芝码生成器 ＋ 扫描器 · SESAMECODE · SESAMECODE · SESAMECODE',
      'rail.foot': '离线可用<br>不上传数据<br>自由使用',
      'style.gradShort': '渐变',
      'scan.idle.t': '摄像头未开启',
      'scan.idle': '把芝麻码放在圆框内按下「打开摄像头」；也可以直接拖放图片、选择文件或粘贴剪贴板。',
      'gen.recent': '最近生成的芝码',
      'gen.recentEmpty': '还没有记录 — 生成后会自动记在这里',
      'toast.recent': '已载入先前的输入并重新生成（{rings} 圈）。',
      'scan.noCam': '此浏览器环境没有摄像头 API（或非 https / localhost）：请改用「从图片扫描」、拖放或粘贴剪贴板。',
      'brand.badge.short': '启发于《异环》',
      'stage.working': '计算中…',
      'stage.decoding': '读回解码中…',
      'readout.rings': '圈数',
      'readout.rings.t': '圈数越多，能装的容量越大，但扫描时需要越清晰',
      'readout.cells': '可读点',
      'readout.cells.t': '这张芝码上一共有多少个芝麻点',
      'readout.payload': '数据量',
      'readout.payload.t': '你的内容 {data} bytes ＋ 容错 {ec} bytes',
      'readout.ec': '容错',
      'readout.ec.t': '容错 {n} bytes：刮伤、反光或模糊时，也能把内容救回来',
      'readout.diameter': '直径',
      'readout.diameter.t': '输出文件中芝码本身的直径（不含留白）',
      'readout.print': '打印约',
      'readout.print.t': '300 dpi 打印时的实际大小；每个芝麻点约 {mm} mm（小于 0.3 mm 容易印坏或扫不到）',
      'readout.minres': '拍摄建议',
      'readout.minres.t': '拍照时芝码在画面中至少要有这么大；图片文件的极限约 {hard} px',
      'scan.req.title': '这样拍最好扫',
      'scan.req.value': '这张芝码建议在画面中占到 {px} px 以上（越大越好，图片文件最低约 {hard} px）。不用摆正、不用干净背景，对准圆框随手拍就行。',
      'scan.cam.device': '镜头',
      'scan.cam.n': '镜头 {n}',
      'scan.reading': '读取图像中…',
      'scan.tune': '高级设置（通常不用动）',
      'scan.del': '删除',
      'scan.histEmpty': '还没有扫描记录',
      'hud.locked': '已锁定 · {rings} 圈',
      'spec.toc': '目录',
      'spec.back': '↑ 回到顶部',
      'gen.examples': '快速示例',
      'gen.placeholderHex': '例如：00 ff 12 8a 3c 7d（十六进制，任意长度）',
      'ex.greeting': '嗨！异环',
      'ex.id': '呗主编号',
      'ex.url': '呗果网址',
      'ex.json': 'JSON',
      'ex.binary': '二进制',
      'toast.copied': '已复制到剪贴板。',
      'toast.saved': '已输出 {fmt}：{name}',
      'toast.example': '已载入示例「{v}」并重新生成。',
      'toast.readbackOk': '读回成功：{ms} ms，{rings} 圈。',
      'toast.readbackFail': '读回失败（{ms} ms）— 详见下方信息。',
      'toast.scanOk': '扫描成功：{ms} ms，{rings} 圈。',
      'brand.badge': '启发于《异环》',
      'brand.badge.name': 'Neverness to Everness',
      'brand.badge.title': '本项目为《异环》世界观的同人创作，非官方作品',
      'style.gradInk': '墨色渐变',
      'style.gradBg': '底色渐变',
      'style.shape': '外形',
      'style.shape.square': '方形',
      'style.shape.circle': '圆形',
      'grad.ntecity': '异环夜色',
      'grad.neon': '霓虹洋红',
      'grad.alert': '警报琥珀',
      'grad.mint': '薄荷信号',
      'grad.ice': '冰晶蓝',
      'grad.rose': '玫瑰金',
      'grad.deepcity': '深夜都市',
      'grad.mist': '晨雾',
      'grad.neonfog': '霓虹雾',
      'grad.paper': '米白纸',
      'preset.nte': '异环（青／深夜蓝）',
      'preset.alert': '警报（洋红／暗）',
      'disclaimer.title': '来源声明',
      'disclaimer.body': '「芝码 SesameCode」是受《异环》(Neverness to Everness) 世界观启发的同人工具：呗果、呗主、芝码等设定皆为致敬性再创作。本项目与 Hotta Studio、完美世界及其代理商没有任何关联，未经授权、亦未使用任何官方素材或美术；界面配色与版面仅为风格上的致敬。游戏名称与相关商标属其各自权利人所有。',
      'doc.title': '芝码 SesameCode ｜ 呗果',
      'brand.sub': '做一张自己的芝码，随手就能扫',
      'nav.gen': '生成器', 'nav.scan': '扫描器', 'nav.spec': '说明',
      'theme.toggle': '切换深色／浅色',
      'theme.dark': '深色', 'theme.light': '浅色',

      'gen.content': '想放进芝码的内容',
      'gen.mode.text': '打字',
      'gen.mode.hex': '十六进制（进阶）',
      'gen.placeholder': '想放什么都可以：一句话、一段网址、一串编号…',
      'gen.ec': '容错等级',
      'gen.ec.l': '标准（可修约 12%）',
      'gen.ec.m': '较高（可修约 17%）',
      'gen.ec.q': '高（可修约 22%）',
      'gen.ec.h': '最高（可修约 27%）',
      'gen.rings': '圈数',
      'gen.rings.auto': '自动（按内容长度）',
      'gen.size': '输出大小',
      'gen.btn': '生成芝码',
      'gen.png': '下载图片',
      'gen.svg': '下载矢量档',
      'gen.self': '试扫看看（在这台设备上）',
      'gen.info': '这张芝码的详细资料',
      'gen.preview': '芝码',
      'gen.appear': '外观',
      'gen.needGenerate': '请先生成芝码',

      'style.preset': '快速配色',
      'style.ink': '芝麻（墨色）',
      'style.bg': '底（背景）',
      'style.color': '颜色',
      'style.color2': '第二颜色',
      'style.gradient': '使用渐变',
      'style.angle': '渐变角度',
      'style.opacity': '不透明度',
      'style.cutout': '挖空（墨变为透明洞）',
      'style.margin': '图形留白',
      'style.swap': '对调墨色／底色',
      'style.reset': '恢复默认',
      'style.invert': '反相',

      'contrast.label': '对比度检查',
      'contrast.ratio': '最差配对 {ratio}:1',
      'contrast.ok': '对比充足，扫描没有问题。',
      'contrast.weak': '对比偏低（{ratio}:1），在光线不足或模糊时可能扫不到；建议 ≥ 4.5:1。',
      'contrast.bad': '对比不足（{ratio}:1），很可能扫描失败；请拉开墨色与底色或改用明暗差更大的组合。',
      'contrast.transparentBg': '背景透明：实际对比取决于底材，请确认底材与墨色的亮度差异足够。',
      'contrast.transparentInk': '墨色透明：实际对比取决于底材。',
      'contrast.cutout': '挖空模式：纹样是透明洞，对比取决于底材。',
      'contrast.sameColors': '墨色与底色相同，芝码将完全无法辨识。',

      'preset.classic': '经典（黑／白）',
      'preset.sesame': '芝麻（棕／米）',
      'preset.matcha': '抹茶（深绿／浅绿）',
      'preset.midnight': '夜蓝（金／深蓝）',
      'preset.blueprint': '蓝晒（白／蓝）',
      'preset.rose': '玫瑰（酒红／粉白）',

      'scan.title': '扫描芝码',
      'scan.cam.on': '开启摄像头',
      'scan.cam.off': '停止',
      'scan.hint': '把芝码放进圆框内，任何方向都可以',
      'scan.file': '选图片',
      'scan.paste': '粘贴剪贴板',
      'scan.drop': '把芝码图片拖进来',
      'scan.thr': '扫描灵敏度',
      'scan.maxdim': '分辨率上限',
      'scan.maxdim.720': '720（快）',
      'scan.maxdim.1280': '1280（建议）',
      'scan.maxdim.1600': '1600（慢但更远）',
      'scan.result': '扫到的内容',
      'scan.empty': '还没有扫到东西 — 把芝码放进圆框，或直接选一张图片',
      'scan.copy': '复制内容',
      'scan.clear': '清除记录',
      'scan.history': '这次扫到的',
      'scan.debug': '调试信息',
      'scan.ok': '识别成功（{ms} ms）',
      'scan.fail': '未识别（{ms} ms）：{err}',
      'scan.camErr': '无法开启摄像头（需 https 或 localhost，且浏览器需授权）：{err}　可改用「从图片扫描」。',
      'scan.clipErr': '无法读取剪贴板：{err}',
      'scan.clipNone': '剪贴板没有图片',
      'scan.imgErr': '无法读取图片',
      'scan.copied': '已复制',
      'scan.copyFail': '复制失败，请手动选取',
      'scan.binary': '（非 UTF-8 文字，以十六进制显示）',

      'result.rings': '{n} 圈',
      'result.ec': '纠错 {key}（{bytes} bytes）',
      'result.corrected': '修正 {n} bytes',
      'result.total': '共 {n} bytes',
      'result.normal': '正常方向',
      'result.mirror': '镜像（已自动还原）',
      'result.refined': '单应精修',
      'result.resid': '拟合残差 {px} px',
      'result.conf': '格点信度 {p}%',

      'msg.generated': '做好了：{rings} 圈 · {ec} 容错',
      'msg.readbackOk': '读回成功（{ms} ms）：{rings} 圈 / {ec} / 修正 {fixed} bytes / 长度码 [{widths}] / 格点信度 {conf}%',
      'msg.readbackFail': '读回失败（{ms} ms）：{err}',
      'msg.downloaded': '已下载 {fmt}',
      'msg.readbackSubstrate': '　（透明区域已模拟叠在浅色底材上解码）',
      'msg.hexEven': '十六进制长度需为偶数',
      'msg.hexBad': '含非十六进制字符',
      'msg.capInfo': '内容 {bytes} bytes ｜ 用 {rings} 圈装得下：数据 {data} bytes ＋ 容错 {ecBytes} bytes（约可修复 {fix} bytes 的污损）｜ 共 {cells} 个可读点',
      'msg.overCapacity': '内容太长了（{bytes} bytes）— 目前最多可以放 {cap} bytes。',
      'msg.labelVersion': '圈数', 'msg.labelEc': '纠错', 'msg.labelFormat': '格式版本',
      'msg.labelDataCap': '数据容量', 'msg.labelUsed': '实用', 'msg.labelCells': '总格数',
      'msg.labelCode': '切口长度码', 'msg.labelIndex': '索引', 'msg.labelOuter': '外框外缘半径',
      'msg.labelInner': '内框环外缘', 'msg.labelHole': '内孔', 'msg.labelRatio': '内外环比',
      'msg.labelRings': '各圈格数',

      'spec.cols': ['圈数', '各圈格数', '总格数', '内外环比', 'L', 'M', 'Q', 'H', '外框半径 u'],
      'spec.note': '单位 u = 芝麻基准尺（芝麻长边 2u、短边 1u）。「格数」为可写入的格点总数，每格 5 种状态（log₂5 ≈ 2.32 bit）。容量栏为扣除 Reed–Solomon 纠错字节后可存放的数据字节数。',
      'spec.html': `
        <h2>芝码的结构</h2>
        <p>芝码是<b>极坐标上的二维条码</b>：用同心圆与角度共同定位，数据写在「圈 × 角度」的格点上；外框则像传统条码那样，<b>用圆弧的长度（粗细）</b>携带元数据。外观像一枚撒满芝麻的贝果。</p>
        <h3 class="h3">三个部分</h3>
        <ul>
          <li><b>外框（圆环・单层）</b>：厚度 2.8u 的一道圆环，被切掉 <b>60°</b>。切口两端是半圆形的<b>胶囊端帽</b>（半径 = 环厚的一半 1.4u）。</li>
          <li><b>切口内的长度码</b>：60° 切成 12 格（每格 5°），安排 4 段「<b>墨・空・墨・空</b>」，每段长 2、3 或 4 格（四段总和恰为 12 格）。每段都是与外框同厚、两端圆滑的<b>胶囊弧</b> —— 就像传统条码用宽窄不同的条纹承载信息，这里用<b>圆弧的长短</b>承载：19 种组合，其中 16 种对应「格式版本(2) + 纠错等级(2)」，剩下 3 种保留给未来格式。</li>
          <li><b>主体</b>：同心环状格阵。第 k 圈半径 r<sub>k</sub> = 9.0 + 2.8k，可用格数 <b>n<sub>k</sub> = ⌊2π r<sub>k</sub> / 2.8⌋</b>。每格可放 0 或 1 颗芝麻。</li>
          <li><b>内框（圆环）</b>：外缘 6u、内孔 3.8u 的圆环，提供圆心与尺度基准。</li>
        </ul>
        <h3 class="h3">圈数怎么决定</h3>
        <p>没有版本号。圈数由<b>内外环的半径比</b>决定：比例越大（外框相对越细）圈数越多、容量越大，但扫描时对分辨率要求也越高。解码端量出比例后，依「最接近哪个比例」排序并逐一尝试，因此同一张图永远解得到正确圈数。</p>
        <h3 class="h3">每个「芝麻」的信息量</h3>
        <p>芝麻是 2u × 1u 的椭圆，具有方向性：相对于该处的切线方向可旋转 0° / 45° / 90° / 135°，加上「没有芝麻」共 <b>5 种状态</b>，每格 log<sub>2</sub>5 ≈ 2.32 bit。</p>
        <h3 class="h3">数据流程</h3>
        <p>任意二进制数据 → Reed–Solomon（GF(256)，可修 t = ec/2 个字节）→ 以 5 进制打包（32 字节一段）→ 依「内圈到外圈、同圈依角度」填入格点 → 不足补零。</p>
        <h3 class="h3">外观与打印</h3>
        <ul>
          <li>墨色与底色可自选，支持<b>双色渐变</b>与<b>透明</b>（透明底、半透明墨、挖空成洞）。</li>
          <li>选色时会即时显示 <b>WCAG 对比度</b>；建议 ≥ 4.5:1，低于 3:1 很可能扫不到。</li>
          <li>「图形留白」可调 0.5–8u。芝码本身不要求特定留白，留白主要是为了打印裁切与视觉平衡。</li>
        </ul>
        <h3 class="h3">扫描要求</h3>
        <ul>
          <li>方向：<b>不限</b>。方向由切口与长度码决定，镜像也可自动侦测。</li>
          <li>角度：可容许明显倾斜（实测 40° 透视仍可解析，内部以单应矩阵精修）。</li>
          <li>背景：不需纯白，但需与芝码有对比（局部自适应二值化，可容忍渐变与暗角）。</li>
          <li>分辨率：芝麻长边建议 ≥ 10 像素（约 5 px/单位）；极限约 8 px（4 px/单位）。</li>
          <li>距离：以手机 1200 万像素为例，芝码直径 40 mm 时约可在 20–40 cm 外成功扫描。</li>
        </ul>`,
      'footer': '芝码（SesameCode）是《异环》呗果世界的条码玩法重现：圆、角度、芝麻方向，就是一串数据。整个网站都在你的设备上运行，不上传任何内容。'
    },

    'en': {
      'gen.ringsOpt': '{v} rings ({cells} dots)',
      'cap.denseHint': 'This is a high-density code ({rings} rings): each dot is smaller, so export at 1536 px or more and let the code fill the frame when you shoot.',
      'scan.pass': 'succeeded on pass {n}',
      'spec.title': 'How a sesame code works',
      'scan.maxdim.2048': '2048 (high-density codes)',
      'style.shape.transparent': 'transparent outside',
      'style.square': 'Square',
      'style.circle': 'Circle',
      'brand.name': 'SesameCode 芝碼',
      'band': 'SESAMECODE · BEIGUO · FREE · OFFLINE · NO UPLOADS · GENERATOR + SCANNER · SESAMECODE · SESAMECODE',
      'rail.foot': 'works offline<br>nothing is uploaded<br>free to use',
      'style.gradShort': 'grad',
      'scan.idle.t': 'Camera is off',
      'scan.idle': 'Start the camera and put the code inside the circle — or drag and drop an image, pick a file, or paste from the clipboard.',
      'gen.recent': 'Recently made',
      'gen.recentEmpty': 'Nothing yet — codes you make show up here',
      'toast.recent': 'Loaded a previous payload and regenerated ({rings} rings).',
      'scan.noCam': 'No camera API in this environment (or not https/localhost): use “scan from image”, drag & drop, or paste from the clipboard.',
      'brand.badge.short': 'Inspired by NTE',
      'stage.working': 'Computing…',
      'stage.decoding': 'Decoding read-back…',
      'readout.rings': 'rings',
      'readout.rings.t': 'More rings hold more data, but need a clearer shot',
      'readout.cells': 'dots',
      'readout.cells.t': 'How many sesame dots this code has in total',
      'readout.payload': 'payload',
      'readout.payload.t': 'Your content is {data} bytes plus {ec} bytes of error correction',
      'readout.ec': 'tolerance',
      'readout.ec.t': '{n} bytes of tolerance: survives scratches, glare or blur',
      'readout.diameter': 'size',
      'readout.diameter.t': 'Diameter of the code itself in the exported file (margin excluded)',
      'readout.print': 'printed',
      'readout.print.t': 'Real size at 300 dpi; one sesame dot is about {mm} mm (below 0.3 mm printing gets unreliable)',
      'readout.minres': 'shoot at',
      'readout.minres.t': 'Aim for at least this size in the photo; image files can go down to about {hard} px',
      'scan.req.title': 'Best way to shoot it',
      'scan.req.value': 'This code wants about {px} px across in the shot (bigger is better; image files can go down to ~{hard} px). No straightening, no clean background — just aim at the circle.',
      'scan.cam.device': 'Camera',
      'scan.cam.n': 'Camera {n}',
      'scan.reading': 'Reading image…',
      'scan.tune': 'Advanced (rarely needed)',
      'scan.del': 'Delete',
      'scan.histEmpty': 'No scans yet',
      'hud.locked': 'locked · {rings} rings',
      'spec.toc': 'Contents',
      'spec.back': '↑ Back to top',
      'gen.examples': 'Quick examples',
      'gen.placeholderHex': 'e.g. 00 ff 12 8a 3c 7d (hex, any length)',
      'ex.greeting': 'Hello, NTE',
      'ex.id': 'Beizhu ID',
      'ex.url': 'Beiguo URL',
      'ex.json': 'JSON',
      'ex.binary': 'Binary',
      'toast.copied': 'Copied to clipboard.',
      'toast.saved': 'Saved {fmt}: {name}',
      'toast.example': 'Loaded example “{v}” and regenerated.',
      'toast.readbackOk': 'Read back OK: {ms} ms, {rings} rings.',
      'toast.readbackFail': 'Read-back failed ({ms} ms) — see the message below.',
      'toast.scanOk': 'Scanned: {ms} ms, {rings} rings.',
      'brand.badge': 'Inspired by NTE',
      'brand.badge.name': 'Neverness to Everness',
      'brand.badge.title': 'A fan-made tool inspired by the world of Neverness to Everness — not an official product',
      'style.gradInk': 'Ink gradients',
      'style.gradBg': 'Background gradients',
      'style.shape': 'Shape',
      'style.shape.square': 'Square',
      'style.shape.circle': 'Circle',
      'grad.ntecity': 'NTE night',
      'grad.neon': 'Neon magenta',
      'grad.alert': 'Alert amber',
      'grad.mint': 'Mint signal',
      'grad.ice': 'Ice blue',
      'grad.rose': 'Rosé gold',
      'grad.deepcity': 'Deep city',
      'grad.mist': 'Morning mist',
      'grad.neonfog': 'Neon fog',
      'grad.paper': 'Warm paper',
      'preset.nte': 'NTE (cyan / deep blue)',
      'preset.alert': 'Alert (magenta / dark)',
      'disclaimer.title': 'Attribution & disclaimer',
      'disclaimer.body': '“SesameCode” is a fan-made tool inspired by the world of Neverness to Everness: Beiguo, Beizhu and the sesame code are affectionate re-imaginings. This project is not affiliated with, endorsed by, or sponsored by Hotta Studio, Perfect World, or their partners, and it uses no official assets or artwork — the interface palette and layout are a stylistic homage only. All game names and trademarks belong to their respective owners.',
      'doc.title': 'SesameCode ｜ Beiguo',
      'brand.sub': 'Make your own, scan it anywhere',
      'nav.gen': 'Generate', 'nav.scan': 'Scan', 'nav.spec': 'Guide',
      'theme.toggle': 'Toggle dark / light',
      'theme.dark': 'Dark', 'theme.light': 'Light',

      'gen.content': 'What goes in the code',
      'gen.mode.text': 'Text',
      'gen.mode.hex': 'Hex (advanced)',
      'gen.placeholder': 'Anything: a message, a link, an ID…',
      'gen.ec': 'Damage tolerance',
      'gen.ec.l': 'Standard (repairs ~12%)',
      'gen.ec.m': 'Higher (repairs ~17%)',
      'gen.ec.q': 'High (repairs ~22%)',
      'gen.ec.h': 'Maximum (repairs ~27%)',
      'gen.rings': 'Rings',
      'gen.rings.auto': 'Auto (fits your text)',
      'gen.size': 'Output size',
      'gen.btn': 'Create the code',
      'gen.png': 'Download image',
      'gen.svg': 'Download vector',
      'gen.self': 'Try scanning it (on this device)',
      'gen.info': 'Details of this code',
      'gen.preview': 'Sesame code',
      'gen.appear': 'Looks',
      'gen.needGenerate': 'Generate a code first',

      'style.preset': 'Presets',
      'style.ink': 'Sesame (ink)',
      'style.bg': 'Plate (background)',
      'style.color': 'Colour',
      'style.color2': 'Second colour',
      'style.gradient': 'Use gradient',
      'style.angle': 'Gradient angle',
      'style.opacity': 'Opacity',
      'style.cutout': 'Cut-out (ink → holes)',
      'style.margin': 'Quiet margin',
      'style.swap': 'Swap ink / background',
      'style.reset': 'Reset',
      'style.invert': 'Invert',

      'contrast.label': 'Contrast check',
      'contrast.ratio': 'worst pair {ratio}:1',
      'contrast.ok': 'Contrast is sufficient — this will scan well.',
      'contrast.weak': 'Low contrast ({ratio}:1). In dim light or with blur it may fail; ≥ 4.5:1 recommended.',
      'contrast.bad': 'Not enough contrast ({ratio}:1) — scanning will likely fail. Separate the ink and background, or pick a wider lightness gap.',
      'contrast.transparentBg': 'Transparent background: real contrast depends on the substrate — make sure it differs enough from the ink.',
      'contrast.transparentInk': 'Transparent ink: real contrast depends on the substrate.',
      'contrast.cutout': 'Cut-out mode: the marks are transparent holes; contrast depends on the substrate.',
      'contrast.sameColors': 'Ink and background are identical — the code is unreadable.',

      'preset.classic': 'Classic (black / white)',
      'preset.sesame': 'Sesame (brown / cream)',
      'preset.matcha': 'Matcha (dark / pale green)',
      'preset.midnight': 'Midnight (gold / navy)',
      'preset.blueprint': 'Blueprint (white / blue)',
      'preset.rose': 'Rosé (wine / blush)',

      'scan.title': 'Scan a code',
      'scan.cam.on': 'Start camera',
      'scan.cam.off': 'Stop',
      'scan.hint': 'Keep the code inside the circle — any rotation works',
      'scan.file': 'Pick an image',
      'scan.paste': 'Paste from clipboard',
      'scan.drop': 'Drop an image here',
      'scan.thr': 'Sensitivity',
      'scan.maxdim': 'Resolution cap',
      'scan.maxdim.720': '720 (fast)',
      'scan.maxdim.1280': '1280 (recommended)',
      'scan.maxdim.1600': '1600 (slow, longer range)',
      'scan.result': 'What was read',
      'scan.empty': 'Nothing yet — put a code in the circle, or pick an image',
      'scan.copy': 'Copy payload',
      'scan.clear': 'Clear history',
      'scan.history': 'Scanned this session',
      'scan.debug': 'Debug info',
      'scan.ok': 'Decoded in {ms} ms',
      'scan.fail': 'Not recognised ({ms} ms): {err}',
      'scan.camErr': 'Cannot open the camera (needs https or localhost, and permission): {err} — you can use “Scan from image” instead.',
      'scan.clipErr': 'Cannot read the clipboard: {err}',
      'scan.clipNone': 'No image in the clipboard',
      'scan.imgErr': 'Cannot read the image',
      'scan.copied': 'Copied',
      'scan.copyFail': 'Copy failed — please select manually',
      'scan.binary': '(not valid UTF-8 — shown as hex)',

      'result.rings': '{n} rings',
      'result.ec': 'EC {key} ({bytes} bytes)',
      'result.corrected': '{n} bytes corrected',
      'result.total': '{n} bytes total',
      'result.normal': 'upright',
      'result.mirror': 'mirrored (auto-restored)',
      'result.refined': 'homography refined',
      'result.resid': 'fit residual {px} px',
      'result.conf': 'cell confidence {p}%',

      'msg.generated': 'Done — {rings} rings, {ec} tolerance',
      'msg.readbackOk': 'Read back in {ms} ms: {rings} rings / {ec} / {fixed} bytes corrected / length code [{widths}] / cell confidence {conf}%',
      'msg.readbackFail': 'Read-back failed ({ms} ms): {err}',
      'msg.downloaded': 'Saved {fmt}',
      'msg.readbackSubstrate': '  (transparent areas composited on a light substrate)',
      'msg.hexEven': 'Hex string must have an even length',
      'msg.hexBad': 'Contains non-hex characters',
      'msg.capInfo': '{bytes} bytes of content ｜ fits in {rings} rings: {data} bytes of data + {ecBytes} bytes of tolerance (roughly {fix} bytes of damage repairable) ｜ {cells} readable dots',
      'msg.overCapacity': 'That is too long ({bytes} bytes) — the current maximum is {cap} bytes.',
      'msg.labelVersion': 'Rings', 'msg.labelEc': 'EC', 'msg.labelFormat': 'Format',
      'msg.labelDataCap': 'Data capacity', 'msg.labelUsed': 'Used', 'msg.labelCells': 'Cells',
      'msg.labelCode': 'Notch length code', 'msg.labelIndex': 'Index', 'msg.labelOuter': 'Outer frame radius',
      'msg.labelInner': 'Inner ring outer edge', 'msg.labelHole': 'Inner hole', 'msg.labelRatio': 'Inner/outer ratio',
      'msg.labelRings': 'Cells per ring',

      'spec.cols': ['Rings', 'Cells per ring', 'Total cells', 'Inner/outer', 'L', 'M', 'Q', 'H', 'Outer radius u'],
      'spec.note': 'Unit u = sesame base length (sesame grain: 2u long, 1u wide). “Cells” counts writable slots; each slot has 5 states (log₂5 ≈ 2.32 bit). Capacity columns are payload bytes after Reed–Solomon parity.',
      'spec.html': `
        <h2>How a SesameCode is built</h2>
        <p>A SesameCode is a <b>2-D barcode in polar coordinates</b>: concentric rings and angles locate every cell, and payload lives in the (ring × angle) grid. The outer frame carries metadata the way ordinary barcodes do — <b>by the length (width) of an arc</b>. Visually it is a bagel sprinkled with sesame.</p>
        <h3 class="h3">Three parts</h3>
        <ul>
          <li><b>Outer frame (single ring)</b>: a 2.8u-thick ring with a <b>60°</b> notch cut out; both cut ends are <b>rounded capsule caps</b> (radius = half the ring thickness, 1.4u).</li>
          <li><b>Length code inside the notch</b>: the 60° gap is divided into 12 modules (5° each) holding four segments — <b>ink · gap · ink · gap</b> — each 2, 3 or 4 modules long (the four always sum to 12). Every segment is a <b>capsule arc</b> as thick as the frame → information rides on <b>arc length</b>, just like bar widths in a classic barcode. 19 combinations exist; 16 map to (format version 2 bits + EC level 2 bits) and 3 are reserved.</li>
          <li><b>Body</b>: concentric cells. Ring k has radius r<sub>k</sub> = 9.0 + 2.8k and <b>n<sub>k</sub> = ⌊2π r<sub>k</sub> / 2.8⌋</b> slots, each empty or holding one sesame grain.</li>
          <li><b>Inner frame (ring)</b>: outer edge 6u, bore 3.8u — gives an unbiased centre and a scale reference.</li>
        </ul>
        <h3 class="h3">How the ring count is chosen</h3>
        <p>There is no version number. The ring count follows from the <b>inner/outer radius ratio</b>: more rings (relatively thinner frame) means more capacity but a higher resolution demand. The decoder measures the ratio, ranks ring counts by closeness and simply tries them in order — so any code always decodes to the right ring count.</p>
        <h3 class="h3">Information per sesame grain</h3>
        <p>A grain is a 2u × 1u ellipse with orientation: 0° / 45° / 90° / 135° relative to the local tangent, plus “no grain” → <b>5 states per cell</b>, log₂5 ≈ 2.32 bit.</p>
        <h3 class="h3">Data path</h3>
        <p>Arbitrary bytes → Reed–Solomon (GF(256), repairs t = ec/2 bytes) → base-5 packing (32-byte chunks) → filled inner ring to outer, by angle → zero padding.</p>
        <h3 class="h3">Appearance &amp; printing</h3>
        <ul>
          <li>Ink and background are free: <b>two-colour gradients</b> and <b>transparency</b> (transparent background, semi-transparent ink, cut-out holes) are supported.</li>
          <li>The <b>WCAG contrast ratio</b> updates live while you pick colours; keep it ≥ 4.5:1 — below 3:1 scanning will likely fail.</li>
          <li>The quiet margin is adjustable (0.5–8u). The format itself does not require a margin; it is for printing and visual balance.</li>
        </ul>
        <h3 class="h3">Scanning requirements</h3>
        <ul>
          <li>Orientation: <b>any</b>. The notch and length code give the direction; mirrors are auto-detected.</li>
          <li>Angle: strong tilt is fine (40° perspective verified; refined internally with a homography).</li>
          <li>Background: need not be white, but must contrast (local adaptive binarisation tolerates gradients and vignetting).</li>
          <li>Resolution: grain long edge ≥ 10 px (≈ 5 px per unit); the limit is ≈ 8 px (4 px per unit).</li>
          <li>Range: a 40 mm code scans from roughly 20–40 cm with a 12 MP phone.</li>
        </ul>`,
      'footer': 'SesameCode is a fan re-imagining of the Beiguo barcode from Neverness to Everness: rings, angles and grain directions are the data. Everything runs on your device; nothing is uploaded.'
    },

    'ja': {
      'gen.ringsOpt': '{v} リング（{cells} ドット）',
      'cap.denseHint': '高密度コード（{rings} リング）です：粒が小さいので、出力は 1536 px 以上、撮影時は画面いっぱいに写すと読みやすくなります。',
      'scan.pass': '{n} 回目の試行で成功',
      'spec.title': 'ゴマコードの仕組み',
      'scan.maxdim.2048': '2048（高密度コード）',
      'style.shape.transparent': '外側は透明',
      'style.square': '正方形',
      'style.circle': '円形',
      'brand.name': 'ゴマコード SesameCode',
      'band': 'ゴマコード · ベイグオ · 無料・オフライン · アップロードなし · 生成＋読み取り · SESAMECODE · SESAMECODE',
      'rail.foot': 'オフライン動作<br>アップロードなし<br>自由に使えます',
      'style.gradShort': 'グラデ',
      'scan.idle.t': 'カメラは停止中',
      'scan.idle': '円の中にコードを合わせて「カメラを開始」を押してください。画像のドラッグ＆ドロップ、ファイル選択、貼り付けでも読み取れます。',
      'gen.recent': '最近作ったコード',
      'gen.recentEmpty': 'まだありません — 作るとここに残ります',
      'toast.recent': '以前の入力を読み込み再生成しました（{rings} リング）。',
      'scan.noCam': 'この環境ではカメラ API が使えません（https / localhost 以外など）。「画像からスキャン」、ドラッグ＆ドロップ、貼り付けをご利用ください。',
      'brand.badge.short': '『異環』に着想',
      'stage.working': '計算中…',
      'stage.decoding': '読み戻し中…',
      'readout.rings': 'リング',
      'readout.rings.t': 'リングが多いほど多く入れられますが、はっきり撮る必要があります',
      'readout.cells': 'ドット',
      'readout.cells.t': 'このコードにあるゴマ粒の総数',
      'readout.payload': 'データ',
      'readout.payload.t': '内容 {data} bytes ＋ 誤り訂正 {ec} bytes',
      'readout.ec': '耐性',
      'readout.ec.t': '訂正 {n} bytes：傷・反射・ブレでも内容を取り戻せます',
      'readout.diameter': '直径',
      'readout.diameter.t': '書き出したファイル内でのコード本体の直径（余白を除く）',
      'readout.print': '印刷サイズ',
      'readout.print.t': '300 dpi 印刷時の実寸。ゴマ粒 1 つは約 {mm} mm（0.3 mm 未満は印刷・読み取りが不安定）',
      'readout.minres': '撮影の目安',
      'readout.minres.t': '撮影時、画面内でこれ以上の大きさが目安。画像ファイルなら約 {hard} px まで可',
      'scan.req.title': 'こう撮ると読みやすい',
      'scan.req.value': 'このコードは画面内で {px} px 以上が目安（大きいほど確実、画像ファイルは約 {hard} px まで可）。傾きも背景も気にせず、円に合わせて撮るだけ。',
      'scan.cam.device': 'カメラ',
      'scan.cam.n': 'カメラ {n}',
      'scan.reading': '画像を読み込み中…',
      'scan.tune': '詳細設定（通常は不要）',
      'scan.del': '削除',
      'scan.histEmpty': 'スキャン履歴はまだありません',
      'hud.locked': 'ロック · {rings} リング',
      'spec.toc': '目次',
      'spec.back': '↑ 先頭へ',
      'gen.examples': 'サンプル',
      'gen.placeholderHex': '例：00 ff 12 8a 3c 7d（16 進数、長さ自由）',
      'ex.greeting': 'こんにちは異環',
      'ex.id': 'ベイシュ ID',
      'ex.url': 'ベイグオ URL',
      'ex.json': 'JSON',
      'ex.binary': 'バイナリ',
      'toast.copied': 'クリップボードにコピーしました。',
      'toast.saved': '{fmt} を書き出しました：{name}',
      'toast.example': 'サンプル「{v}」を読み込み再生成しました。',
      'toast.readbackOk': '読み戻し成功：{ms} ms、{rings} リング。',
      'toast.readbackFail': '読み戻し失敗（{ms} ms）。下のメッセージを参照。',
      'toast.scanOk': '読み取り成功：{ms} ms、{rings} リング。',
      'brand.badge': '『異環』に着想',
      'brand.badge.name': 'Neverness to Everness',
      'brand.badge.title': '『異環』の世界観に着想を得た二次創作ツールです（非公式）',
      'style.gradInk': 'インクのグラデ',
      'style.gradBg': '背景のグラデ',
      'style.shape': '外形',
      'style.shape.square': '正方形',
      'style.shape.circle': '円形',
      'grad.ntecity': '異環ナイト',
      'grad.neon': 'ネオンマゼンタ',
      'grad.alert': 'アラート琥珀',
      'grad.mint': 'ミントシグナル',
      'grad.ice': 'アイスブルー',
      'grad.rose': 'ロゼゴールド',
      'grad.deepcity': '深夜都市',
      'grad.mist': '朝霧',
      'grad.neonfog': 'ネオンフォグ',
      'grad.paper': '生成り紙',
      'preset.nte': '異環（シアン／深夜藍）',
      'preset.alert': 'アラート（マゼンタ／暗）',
      'disclaimer.title': '出典・免責事項',
      'disclaimer.body': '「ゴマコード SesameCode」は『異環』(Neverness to Everness) の世界観に着想を得た二次創作ツールです。ベイグオ、ベイシュ、ゴマコードなどの設定は敬意を込めた再解釈であり、Hotta Studio・Perfect World およびその関連会社とは一切関係がなく、公式素材やアートワークも使用していません。配色とレイアウトはスタイル上のオマージュに留まります。ゲーム名および商標は各権利者に帰属します。',
      'doc.title': 'ゴマコード SesameCode ｜ ベイグオ',
      'brand.sub': '自分のゴマコードを作って、すぐ読み取る',
      'nav.gen': '生成', 'nav.scan': 'スキャン', 'nav.spec': '説明',
      'theme.toggle': 'ダーク／ライト切替',
      'theme.dark': 'ダーク', 'theme.light': 'ライト',

      'gen.content': '入れたい内容',
      'gen.mode.text': '文字',
      'gen.mode.hex': '16 進数（上級）',
      'gen.placeholder': '何でも入れられます：ひとこと、URL、番号など',
      'gen.ec': '傷への強さ',
      'gen.ec.l': '標準（約 12% 修復）',
      'gen.ec.m': 'やや高め（約 17% 修復）',
      'gen.ec.q': '高い（約 22% 修復）',
      'gen.ec.h': '最高（約 27% 修復）',
      'gen.rings': 'リング数',
      'gen.rings.auto': '自動（内容に合わせる）',
      'gen.size': '出力サイズ',
      'gen.btn': 'ゴマコードを作る',
      'gen.png': '画像を保存',
      'gen.svg': 'ベクターを保存',
      'gen.self': '読み取ってみる（この端末で）',
      'gen.info': 'このコードの詳細',
      'gen.preview': 'ゴマコード',
      'gen.appear': '見た目',
      'gen.needGenerate': '先にコードを生成してください',

      'style.preset': '配色プリセット',
      'style.ink': 'ゴマ（インク）',
      'style.bg': '下地（背景）',
      'style.color': '色',
      'style.color2': '2 色目',
      'style.gradient': 'グラデーションを使う',
      'style.angle': 'グラデーション角度',
      'style.opacity': '不透明度',
      'style.cutout': 'くり抜き（墨＝穴）',
      'style.margin': '図形の余白',
      'style.swap': 'インクと背景を入れ替え',
      'style.reset': '初期値に戻す',
      'style.invert': '反転',

      'contrast.label': 'コントラスト検査',
      'contrast.ratio': '最悪ペア {ratio}:1',
      'contrast.ok': 'コントラストは十分です。問題なく読み取れます。',
      'contrast.weak': 'コントラストが低めです（{ratio}:1）。暗所やブレで失敗しやすくなります。4.5:1 以上を推奨。',
      'contrast.bad': 'コントラスト不足（{ratio}:1）。読み取りに失敗する可能性が高いです。インクと背景の明暗差を広げてください。',
      'contrast.transparentBg': '背景が透明です。実際のコントラストは下地次第なので、明暗差を確認してください。',
      'contrast.transparentInk': 'インクが透明です。実際のコントラストは下地次第です。',
      'contrast.cutout': 'くり抜きモード：模様は透明な穴で、コントラストは下地次第です。',
      'contrast.sameColors': 'インクと背景が同色です。読み取りは不可能です。',

      'preset.classic': 'クラシック（黒／白）',
      'preset.sesame': 'ゴマ（茶／生成り）',
      'preset.matcha': '抹茶（濃緑／淡緑）',
      'preset.midnight': 'ミッドナイト（金／紺）',
      'preset.blueprint': '青焼き（白／青）',
      'preset.rose': 'ロゼ（ワイン／桜色）',

      'scan.title': 'コードを読み取る',
      'scan.cam.on': 'カメラを開始',
      'scan.cam.off': '停止',
      'scan.hint': '円の中にコードを入れてください — どの向きでも OK',
      'scan.file': '画像を選ぶ',
      'scan.paste': 'クリップボードから貼り付け',
      'scan.drop': '画像をドロップ',
      'scan.thr': '感度',
      'scan.maxdim': '解像度の上限',
      'scan.maxdim.720': '720（高速）',
      'scan.maxdim.1280': '1280（推奨）',
      'scan.maxdim.1600': '1600（低速・遠距離向け）',
      'scan.result': '読み取った内容',
      'scan.empty': 'まだ何も読んでいません — 円の中にコードを置くか、画像を選んでください',
      'scan.copy': '内容をコピー',
      'scan.clear': '履歴を消去',
      'scan.history': '今回読み取ったもの',
      'scan.debug': 'デバッグ情報',
      'scan.ok': '認識成功（{ms} ms）',
      'scan.fail': '未認識（{ms} ms）：{err}',
      'scan.camErr': 'カメラを起動できません（https か localhost、および許可が必要）：{err}　「画像からスキャン」も使えます。',
      'scan.clipErr': 'クリップボードを読めません：{err}',
      'scan.clipNone': 'クリップボードに画像がありません',
      'scan.imgErr': '画像を読み込めません',
      'scan.copied': 'コピーしました',
      'scan.copyFail': 'コピー失敗。手動で選択してください',
      'scan.binary': '（UTF-8 文字列ではないため 16 進表示）',

      'result.rings': '{n} リング',
      'result.ec': '訂正 {key}（{bytes} バイト）',
      'result.corrected': '{n} バイト訂正',
      'result.total': '全 {n} バイト',
      'result.normal': '正立',
      'result.mirror': '鏡像（自動復元）',
      'result.refined': 'ホモグラフィ補正',
      'result.resid': 'フィット残差 {px} px',
      'result.conf': 'セル信頼度 {p}%',

      'msg.generated': 'できました — {rings} リング・{ec} 耐性',
      'msg.readbackOk': '読み戻し成功（{ms} ms）：{rings} リング / {ec} / {fixed} バイト訂正 / 長さコード [{widths}] / セル信頼度 {conf}%',
      'msg.readbackFail': '読み戻し失敗（{ms} ms）：{err}',
      'msg.downloaded': '{fmt} を保存しました',
      'msg.readbackSubstrate': '　（透明部分は明るい下地に合成して復号）',
      'msg.hexEven': '16 進数の長さは偶数にしてください',
      'msg.hexBad': '16 進数以外の文字が含まれています',
      'msg.capInfo': '内容 {bytes} bytes ｜ {rings} リングで収まります：データ {data} bytes ＋ 誤り訂正 {ecBytes} bytes（約 {fix} bytes の汚損を修復）｜ 読み取り点 {cells}',
      'msg.overCapacity': '内容が長すぎます（{bytes} bytes）— 現在の上限は {cap} bytes です。',
      'msg.labelVersion': 'リング数', 'msg.labelEc': '訂正', 'msg.labelFormat': 'フォーマット',
      'msg.labelDataCap': 'データ容量', 'msg.labelUsed': '使用', 'msg.labelCells': '総セル数',
      'msg.labelCode': '切り欠き長さコード', 'msg.labelIndex': 'インデックス', 'msg.labelOuter': '外枠の外半径',
      'msg.labelInner': '内枠リング外縁', 'msg.labelHole': '内孔', 'msg.labelRatio': '内外リング比',
      'msg.labelRings': '各リングのセル数',

      'spec.cols': ['リング数', '各リングのセル数', '総セル数', '内外比', 'L', 'M', 'Q', 'H', '外枠半径 u'],
      'spec.note': '単位 u = ゴマの基準長（ゴマは長辺 2u・短辺 1u）。「セル数」は書き込めるスロット数で、各セルは 5 状態（log₂5 ≈ 2.32 bit）。容量欄は Reed–Solomon 訂正バイトを除いたデータ量です。',
      'spec.html': `
        <h2>ゴマコードの構造</h2>
        <p>ゴマコードは<b>極座標の二次元コード</b>です。同心円と角度でセルを定め、データは「リング × 角度」の格子に載ります。外枠は一般的なバーコードと同じく、<b>円弧の長さ（太さ）</b>でメタデータを運びます。見た目はゴマを散らしたベーグルです。</p>
        <h3 class="h3">3 つの部位</h3>
        <ul>
          <li><b>外枠（単層リング）</b>：厚さ 2.8u のリングから <b>60°</b> を切り欠いたもの。切り口の両端は<b>カプセル状の丸い端</b>（半径 = リング厚の半分 1.4u）。</li>
          <li><b>切り欠き内の長さコード</b>：60° を 12 モジュール（各 5°）に分け、4 区間「<b>インク・空・インク・空</b>」を配置。各区間は 2・3・4 モジュール（合計は常に 12）。すべて枠と同じ太さの<b>カプセル円弧</b>で、情報は<b>円弧の長短</b>に乗ります（古典バーコードのバー幅と同じ発想）。組合せは 19 通りで、16 通りが「フォーマット版(2bit) + 訂正レベル(2bit)」、3 通りは将来用に予約。</li>
          <li><b>本体</b>：同心リング格子。k 番目の半径は r<sub>k</sub> = 9.0 + 2.8k、セル数は <b>n<sub>k</sub> = ⌊2π r<sub>k</sub> / 2.8⌋</b>。各セルにゴマ 0 個または 1 個。</li>
          <li><b>内枠（リング）</b>：外縁 6u、内孔 3.8u。バイアスのない中心とスケール基準を与えます。</li>
        </ul>
        <h3 class="h3">リング数の決まり方</h3>
        <p>バージョン番号はありません。リング数は<b>内外リングの半径比</b>で決まります。比が大きい（外枠が相対的に細い）ほどリングが増え容量も増えますが、必要な解像度も上がります。デコーダは比を測って近い順に並べ、順に試すので、どのコードも正しいリング数で読み取れます。</p>
        <h3 class="h3">ゴマ 1 粒の情報量</h3>
        <p>ゴマは 2u × 1u の楕円で向きを持ちます。接線方向に対して 0° / 45° / 90° / 135°、加えて「ゴマ無し」で <b>1 セル 5 状態</b>、log₂5 ≈ 2.32 bit。</p>
        <h3 class="h3">データの流れ</h3>
        <p>任意のバイト列 → Reed–Solomon（GF(256)、t = ec/2 バイト訂正）→ 5 進パッキング（32 バイト単位）→ 内側のリングから角度順に充填 → 端数はゼロ埋め。</p>
        <h3 class="h3">外観と印刷</h3>
        <ul>
          <li>インクと背景は自由。 <b>2 色グラデーション</b>と<b>透明</b>（透明背景・半透明インク・くり抜き穴）に対応。</li>
          <li>色を選ぶと <b>WCAG コントラスト比</b>が即時表示されます。4.5:1 以上を推奨、3:1 未満は読み取り失敗が多くなります。</li>
          <li>「図形の余白」は 0.5–8u で調整可。規格上は必須ではありませんが、印刷や見た目のために使います。</li>
        </ul>
        <h3 class="h3">読み取り要件</h3>
        <ul>
          <li>向き：<b>自由</b>。切り欠きと長さコードが方向を決め、鏡像も自動判定します。</li>
          <li>角度：大きな傾きも可（40° の透視を実測。内部でホモグラフィ補正）。</li>
          <li>背景：白でなくても可。ただしコントラストが必要（局所適応二値化でグラデーションや周辺減光に耐性）。</li>
          <li>解像度：ゴマの長辺 10 px 以上（約 5 px/単位）を推奨。限界は約 8 px（4 px/単位）。</li>
          <li>距離：40 mm のコードなら 1200 万画素のスマホで約 20–40 cm から読み取れます。</li>
        </ul>`,
      'footer': 'ゴマコード（SesameCode）は『異環』ベイグオ世界のバーコードを再解釈したものです：円・角度・ゴマの向きがデータになります。処理はすべて端末内で完結し、アップロードはありません。'
    }
  };


  /* ================= 第 8 版補充 / 改寫 ================= */
  (function () {
    const add = (code, obj) => Object.assign(dict[code], obj);

    add('zh-Hant', {
      'band': 'BAGEL · SESAMECODE · NTE · ',
      'brand.cn': '芝碼', 'brand.en': 'SesameCode',
      'nav.gen': '產生器', 'nav.scan': '掃描器', 'nav.spec': '說明',
      'brand.name': '芝碼 SesameCode',
      'gen.basic': '基本',
      'gen.advanced': '進階選項',
      'gen.size': '輸出大小',
      'gen.size.s': '小', 'gen.size.m': '中', 'gen.size.l': '大',
      'gen.size.custom': '自訂…', 'gen.size.px': '檔案邊長',
      'gen.mode.text': '打字', 'gen.mode.hex': '十六進位',
      'gen.self': '試掃看看',
      'gen.info': '技術細節',
      'gen.recent': '最近做過的芝碼',
      'style.shape': '外型',
      'style.label': '圓形-標示',
      'style.solid': '單色',
      'style.custom': '自訂顏色',
      'style.ink': '芝麻色', 'style.bg': '底色',
      'style.opacity': '芝麻不透明度', 'style.opacityBg': '底色不透明度',
      'style.margin': '圖形留白',
      'label.ringText': '異環 · 唄果 · 芝碼 · ',
      'readout.diameter.t': '輸出檔案中芝碼本身的邊長（不含留白）',
      'readout.print.t': '以 300 dpi 列印時的實際大小；每顆芝麻約 {mm} mm，太小會印壞或掃不到',
      'readout.ease': '掃描難易',
      'readout.shape': '外形','readout.shape.t': '芝碼的裁切外形（方形 / 圓形 / 圓形-標示）',
      'readout.ease.easy': '容易', 'readout.ease.ok': '可以', 'readout.ease.hard': '要靠近',
      'readout.ease.t': '依這個尺寸換算的結果；掃不到就把尺寸調大或靠近一點',
      'scan.title': '掃描器',
      'scan.hint': '把芝碼放進圓框，任何方向都可以',
      'scan.searching': '正在找芝碼…把圓圈對準它',
      'scan.req.title': '這樣拍最好掃',
      'scan.req.value': '把芝碼放進畫面中央的圓圈，佔到圓圈的三分之一以上就好。不用擺正、不用換背景，斜著拍也行。',
      'scan.fullscreen': '完全掃描器',
      'scan.open': '開啟內容',
      'scan.share': '分享',
      'scan.empty': '還沒有掃到東西 — 把芝碼放進圓框，或直接選一張圖片',
      'fs.status': '對準芝碼',
      'fs.hint': '對準圓圈，任何方向都可以',
      'fs.locked': '讀到了 · {rings} 圈',
      'fs.again': '再掃一次',
      'fs.camToggle': '切換鏡頭',
      'fs.camOff': '攝影機沒開 · 可以直接選圖片',
      'fs.fx': '掃描效果',
      'fs.fx.t': '掃到之後播放亮度環繞、芝麻波浪，並把乾淨的芝碼複製出來飛進結果',
      'cap.compact': '{bytes} / {cap} B',
      'cap.over': '太長了（上限 {cap} B）',
      'spec.title': '芝碼是怎麼運作的',
      'spec.intro': '<p><b>芝碼</b>是佈滿了芝麻的貝果形狀的條碼，源自於《異環》。</p>',
      'footer': '芝碼（SesameCode）是《異環》唄果世界的條碼玩法重現。離線可用、不上傳資料、自由使用。',
      'contrast.label': '對比',
      'spec.html': `
<p>一般條碼用黑白直線，芝碼用的是<b>圓圈、角度和芝麻的方向</b>：外圈像貝果的外皮、內圈像中間的洞，中間一圈一圈的芝麻就是資料。任何檔案都能放進去，掃的時候不用擺正，也不挑背景。</p>
<h3>三個部分</h3>
<ul>
  <li><b>外框</b>：2.8u 厚的圓環，留了一道 <b>60°</b> 的切口，兩端是圓角。切口裡排著 4 段長短不同的圓弧——像傳統條碼的寬窄條紋，這裡用<b>圓弧的長短</b>記下格式與容錯等級。</li>
  <li><b>主體</b>：一圈一圈的芝麻。第 k 圈半徑 r<sub>k</sub> = 9.0 + 2.8k，可放 ⌊2πr<sub>k</sub> / 2.8⌋ 個點，每點 5 種狀態。</li>
  <li><b>內框</b>：外緣 6u、內孔 3.8u 的圓環，用來對準圓心與比例。</li>
</ul>
<h3>圈數與容量</h3>
<p>沒有版本號。圈數由<b>內框與外框的半徑比例</b>決定：比例越大圈數越多、能放的內容也越多，4 圈約 24 bytes，24 圈約 477 bytes。「進階選項」裡可以指定圈數與容錯等級，平常交給自動就好。</p>
<h3>每顆芝麻的資訊量</h3>
<p>芝麻是 2u × 1u 的橢圓，相對於該處的切線可以轉 0° / 45° / 90° / 135°，再加上「沒有芝麻」，共 <b>5 種狀態</b>，每格 log<sub>2</sub>5 ≈ 2.32 bit。</p>
<h3>三種外形</h3>
<p>方形、圓形，以及<b>圓形-標示</b>：圓盤外圍繞著一圈同色文字，字串會跟著介面語言換（也可以自己改），適合直接當貼紙、吊飾或頭像。</p>
<h3>外觀</h3>
<p>芝麻與底色都能自選，支援漸層、透明與挖空。「快速配色」裡有現成組合與漸層範例，選色時下方會即時顯示對比度，太低就換一組。</p>
<h3>這樣拍最好掃</h3>
<ul>
  <li>方向：<b>不限</b>，鏡像會自動還原。</li>
  <li>角度：可以斜著拍，明顯的透視變形也解得開。</li>
  <li>大小：讓芝碼佔畫面寬度三分之一以上就很穩；掃不到就靠近一點，或把輸出尺寸調大。</li>
  <li>光線：避免反光蓋掉芝麻；太暗時開燈比開閃光好。</li>
</ul>`
    });

    add('zh-Hans', {
      'band': 'BAGEL · SESAMECODE · NTE · ',
      'brand.cn': '芝码', 'brand.en': 'SesameCode',
      'nav.gen': '生成器', 'nav.scan': '扫描器', 'nav.spec': '说明',
      'gen.basic': '基本',
      'gen.advanced': '高级选项',
      'gen.size': '输出大小',
      'gen.size.s': '小', 'gen.size.m': '中', 'gen.size.l': '大',
      'gen.size.custom': '自定义…', 'gen.size.px': '文件边长',
      'gen.mode.text': '打字', 'gen.mode.hex': '十六进制',
      'gen.self': '试扫看看',
      'gen.info': '技术细节',
      'gen.recent': '最近做过的芝麻码',
      'style.shape': '外形',
      'style.label': '圆形-标示',
      'style.solid': '单色',
      'style.custom': '自定义颜色',
      'style.ink': '芝麻色', 'style.bg': '底色',
      'style.opacity': '芝麻不透明度', 'style.opacityBg': '底色不透明度',
      'style.margin': '图形留白',
      'label.ringText': '异环 · 呗果 · 芝码 · ',
      'readout.diameter.t': '输出文件中芝麻码本身的边长（不含留白）',
      'readout.print.t': '以 300 dpi 打印时的实际大小；每颗芝麻约 {mm} mm，太小会印坏或扫不到',
      'readout.ease': '扫描难易',
      'readout.shape': '外形','readout.shape.t': '芝麻码的裁切外形（方形 / 圆形 / 圆形-标示）',
      'readout.ease.easy': '容易', 'readout.ease.ok': '可以', 'readout.ease.hard': '要靠近',
      'readout.ease.t': '按这个尺寸换算的结果；扫不到就把尺寸调大或靠近一点',
      'scan.title': '扫描器',
      'scan.hint': '把芝麻码放进圆框，任何方向都可以',
      'scan.searching': '正在找芝麻码…把圆圈对准它',
      'scan.req.title': '这样拍最好扫',
      'scan.req.value': '把芝麻码放进画面中央的圆圈，占到圆圈的三分之一以上就好。不用摆正、不用换背景，斜着拍也行。',
      'scan.fullscreen': '完全扫描器',
      'scan.open': '打开内容',
      'scan.share': '分享',
      'scan.empty': '还没有扫到东西 — 把芝麻码放进圆框，或直接选一张图片',
      'fs.status': '对准芝麻码',
      'fs.hint': '对准圆圈，任何方向都可以',
      'fs.locked': '读到了 · {rings} 圈',
      'fs.again': '再扫一次',
      'fs.camToggle': '切换镜头',
      'fs.camOff': '摄像头没开 · 可以直接选图片',
      'fs.fx': '扫描效果',
      'fs.fx.t': '扫到之后播放亮度环绕、芝麻波浪，并把干净的芝麻码复制出来飞进结果',
      'cap.compact': '{bytes} / {cap} B',
      'cap.over': '太长了（上限 {cap} B）',
      'spec.title': '芝麻码是怎么运作的',
      'spec.intro': '<p><b>芝麻码</b>是布满了芝麻的贝果形状的条形码，源自于《异环》。</p>',
      'footer': '芝麻码（SesameCode）是《异环》呗果世界的条形码玩法重现。离线可用、不上传数据、自由使用。',
      'contrast.label': '对比',
      'spec.html': `
<p>普通条形码用黑白直线，芝麻码用的是<b>圆圈、角度和芝麻的方向</b>：外圈像贝果的外皮、内圈像中间的洞，中间一圈一圈的芝麻就是数据。任何文件都能放进去，扫的时候不用摆正，也不挑背景。</p>
<h3>三个部分</h3>
<ul>
  <li><b>外框</b>：2.8u 厚的圆环，留了一道 <b>60°</b> 的切口，两端是圆角。切口里排着 4 段长短不同的圆弧——像传统条形码的宽窄条纹，这里用<b>圆弧的长短</b>记下格式与纠错等级。</li>
  <li><b>主体</b>：一圈一圈的芝麻。第 k 圈半径 r<sub>k</sub> = 9.0 + 2.8k，可放 ⌊2πr<sub>k</sub> / 2.8⌋ 个点，每点 5 种状态。</li>
  <li><b>内框</b>：外缘 6u、内孔 3.8u 的圆环，用来对准圆心与比例。</li>
</ul>
<h3>圈数与容量</h3>
<p>没有版本号。圈数由<b>内框与外框的半径比例</b>决定：比例越大圈数越多、能放的内容也越多，4 圈约 24 bytes，24 圈约 477 bytes。「高级选项」里可以指定圈数与纠错等级，平常交给自动就好。</p>
<h3>每颗芝麻的信息量</h3>
<p>芝麻是 2u × 1u 的椭圆，相对于该处的切线可以转 0° / 45° / 90° / 135°，再加上「没有芝麻」，共 <b>5 种状态</b>，每格 log<sub>2</sub>5 ≈ 2.32 bit。</p>
<h3>三种外形</h3>
<p>方形、圆形，以及<b>圆形-标示</b>：圆盘外围绕着一圈同色文字，字串会跟着界面语言换（也可以自己改），适合直接当贴纸、挂饰或头像。</p>
<h3>外观</h3>
<p>芝麻与底色都能自选，支持渐变、透明与挖空。「快速配色」里有现成组合与渐变示例，选色时下方会即时显示对比度，太低就换一组。</p>
<h3>这样拍最好扫</h3>
<ul>
  <li>方向：<b>不限</b>，镜像会自动还原。</li>
  <li>角度：可以斜着拍，明显的透视变形也解得开。</li>
  <li>大小：让芝麻码占画面宽度三分之一以上就很稳；扫不到就靠近一点，或把输出尺寸调大。</li>
  <li>光线：避免反光盖掉芝麻；太暗时开灯比开闪光好。</li>
</ul>`
    });

    add('en', {
      'band': 'BAGEL · SESAMECODE · NTE · ',
      'brand.cn': 'SesameCode', 'brand.en': '',
      'nav.gen': 'Make', 'nav.scan': 'Scan', 'nav.spec': 'Read me',
      'gen.basic': 'Basic',
      'gen.advanced': 'Advanced',
      'gen.size': 'Output size',
      'gen.size.s': 'Small', 'gen.size.m': 'Medium', 'gen.size.l': 'Large',
      'gen.size.custom': 'Custom…', 'gen.size.px': 'File width',
      'gen.mode.text': 'Text', 'gen.mode.hex': 'Hex',
      'gen.self': 'Try scanning it',
      'gen.info': 'Technical details',
      'gen.recent': 'Recent codes',
      'style.shape': 'Shape',
      'style.label': 'Circle + label',
      'style.solid': 'Solid',
      'style.custom': 'Custom colours',
      'style.ink': 'Sesame', 'style.bg': 'Background',
      'style.opacity': 'Sesame opacity', 'style.opacityBg': 'Background opacity',
      'style.margin': 'Quiet margin',
      'label.ringText': 'NTE · BAGEL · SESAMECODE · ',
      'readout.diameter.t': 'Width of the code itself in the exported file (margin excluded)',
      'readout.print.t': 'Real size when printed at 300 dpi; each sesame is about {mm} mm, smaller prints tend to fail',
      'readout.ease': 'Scan ease',
      'readout.shape': 'Shape','readout.shape.t': 'How the code is cropped (square, circle, circle with label)',
      'readout.ease.easy': 'Easy', 'readout.ease.ok': 'Fine', 'readout.ease.hard': 'Get closer',
      'readout.ease.t': 'Rough guide based on this size; if it will not scan, export larger or move closer',
      'scan.title': 'Scanner',
      'scan.hint': 'Put the code inside the circle — any angle works',
      'scan.searching': 'Looking for a code… aim the circle at it',
      'scan.req.title': 'How to aim',
      'scan.req.value': 'Fill about a third of the circle in the middle of the screen. No need to straighten it, no need for a plain background, tilted is fine.',
      'scan.fullscreen': 'Full scanner',
      'scan.open': 'Open content',
      'scan.share': 'Share',
      'scan.empty': 'Nothing yet — put a code in the circle, or pick a picture',
      'fs.status': 'Aim at a code',
      'fs.hint': 'Aim inside the circle — any angle works',
      'fs.locked': 'Got it · {rings} rings',
      'fs.again': 'Scan again',
      'fs.camToggle': 'Switch camera',
      'fs.camOff': 'Camera off · you can still pick a picture',
      'fs.fx': 'Scan effect',
      'fs.fx.t': 'On success: glow around the rings, a wave through the seeds, then a clean copy flies into the result',
      'cap.compact': '{bytes} / {cap} B',
      'cap.over': 'Too long (limit {cap} B)',
      'spec.title': 'How it works',
      'spec.intro': '<p><b>SesameCode</b> is a barcode shaped like a bagel covered in sesame seeds, inspired by <i>Neverness to Everness</i>.</p>',
      'footer': 'SesameCode is a fan re-creation of the bagel-world barcode from Neverness to Everness. Works offline, never uploads anything, free to use.',
      'contrast.label': 'Contrast',
      'spec.html': `
<p>A normal barcode uses black bars. SesameCode uses <b>circles, angles and the direction of each sesame seed</b>: the outer ring is the crust, the inner ring is the hole, and the rings of seeds in between are the data. Any file fits, and you never have to straighten it before scanning.</p>
<h3>Three parts</h3>
<ul>
  <li><b>Outer frame</b>: a 2.8u ring with a <b>60°</b> cut-out, rounded at both ends. Inside the cut-out sit four arcs of different lengths — like the wide and narrow bars of an old barcode, the <b>length of each arc</b> records the format and the error-correction level.</li>
  <li><b>Body</b>: rings of seeds. Ring k sits at r<sub>k</sub> = 9.0 + 2.8k and holds ⌊2πr<sub>k</sub> / 2.8⌋ slots, each with 5 states.</li>
  <li><b>Inner frame</b>: a ring from 6u to a 3.8u bore, used to find the centre and the scale.</li>
</ul>
<h3>Rings and capacity</h3>
<p>There are no version numbers. The ring count comes from the <b>radius ratio between the inner and outer frame</b>: the larger the ratio, the more rings and the more room. Four rings hold about 24 bytes, twenty-four about 477 bytes. Advanced options let you pin the ring count and the error-correction level.</p>
<h3>Bits per seed</h3>
<p>A seed is a 2u x 1u ellipse that can sit at 0°, 45°, 90° or 135° to the local tangent, plus the empty state — <b>5 states</b> per slot, log<sub>2</sub>5 ≈ 2.32 bit.</p>
<h3>Three shapes</h3>
<p>Square, circle, and <b>circle + label</b>: a ring of text in the same colour wraps the plate, translated with the interface (and editable), ready to use as a sticker, a charm or an avatar.</p>
<h3>Looks</h3>
<p>Ink and background are yours to pick, with gradients, transparency and cut-out. Quick colours holds ready-made pairs and gradient samples, and the contrast check updates as you go.</p>
<h3>Getting a good scan</h3>
<ul>
  <li>Orientation: <b>any</b>; mirrored images are corrected automatically.</li>
  <li>Angle: tilt it — even strong perspective is handled.</li>
  <li>Size: a third of the screen width is plenty. If it will not scan, move closer or export larger.</li>
  <li>Light: avoid glare on the seeds; in dim light a lamp beats a flash.</li>
</ul>`
    });

    add('ja', {
      'band': 'BAGEL · SESAMECODE · NTE · ',
      'brand.cn': '芝碼', 'brand.en': 'SesameCode',
      'nav.gen': 'つくる', 'nav.scan': 'よみとる', 'nav.spec': 'しくみ',
      'gen.basic': '基本',
      'gen.advanced': '詳細設定',
      'gen.size': '書き出しサイズ',
      'gen.size.s': '小', 'gen.size.m': '中', 'gen.size.l': '大',
      'gen.size.custom': 'カスタム…', 'gen.size.px': 'ファイルの辺',
      'gen.mode.text': '文字', 'gen.mode.hex': '16 進数',
      'gen.self': '読み取ってみる',
      'gen.info': '技術的な中身',
      'gen.recent': '最近つくったコード',
      'style.shape': 'かたち',
      'style.label': '円形＋ラベル',
      'style.solid': '単色',
      'style.custom': '色を自分で決める',
      'style.ink': 'ゴマ色', 'style.bg': '下地',
      'style.opacity': 'ゴマの不透明度', 'style.opacityBg': '下地の不透明度',
      'style.margin': '余白',
      'label.ringText': 'ネバエバ · ベーグル · ゴマコード · ',
      'readout.diameter.t': '書き出したファイル内のコード本体の大きさ（余白を除く）',
      'readout.print.t': '300 dpi で印刷したときの実寸。ゴマ一粒およそ {mm} mm、小さいと印刷でつぶれます',
      'readout.ease': '読み取りやすさ',
      'readout.shape': 'かたち','readout.shape.t': 'コードの切り取り形状（四角 / 円 / 円形＋ラベル）',
      'readout.ease.easy': 'かんたん', 'readout.ease.ok': 'ふつう', 'readout.ease.hard': '近づけて',
      'readout.ease.t': 'このサイズからの目安。読めないときは大きく書き出すか、近づいてください',
      'scan.title': '読み取り',
      'scan.hint': '円の中にコードを入れてください。向きは自由です',
      'scan.searching': 'コードを探しています…円を合わせてください',
      'scan.req.title': 'こう構えると読みやすい',
      'scan.req.value': '画面中央の円の三分の一ほどをコードで埋めれば十分です。まっすぐにしなくても、背景を替えなくても、斜めでも読めます。',
      'scan.fullscreen': '全画面スキャナ',
      'scan.open': '中身を開く',
      'scan.share': '共有',
      'scan.empty': 'まだ何も読んでいません — 円の中にコードを入れるか、画像を選んでください',
      'fs.status': 'コードを合わせてください',
      'fs.hint': '円の中に合わせてください。向きは自由です',
      'fs.locked': '読めました · {rings} リング',
      'fs.again': 'もう一度',
      'fs.camToggle': 'カメラを切り替え',
      'fs.camOff': 'カメラは停止中 · 画像を選ぶこともできます',
      'fs.fx': 'スキャン演出',
      'fs.fx.t': '読み取り時にリングの光とゴマの波を再生し、きれいなゴマコードをコピーして結果へ飛ばします',
      'cap.compact': '{bytes} / {cap} B',
      'cap.over': '長すぎます（上限 {cap} B）',
      'spec.title': '芝碼のしくみ',
      'spec.intro': '<p><b>芝碼（ゴマコード）</b>は、ゴマをびっしりまぶしたベーグル型のバーコードです。『異環（Neverness to Everness）』から生まれたものです。</p>',
      'footer': '芝碼（SesameCode）は『異環』のベーグル世界のバーコードを再現したファンメイドです。オフラインで動き、データは送信されず、自由に使えます。',
      'contrast.label': 'コントラスト',
      'spec.html': `
<p>ふつうのバーコードは黒い直線ですが、芝碼は<b>円と角度、ゴマの向き</b>を使います。外側がベーグルの皮、内側が穴、そのあいだのゴマの列がデータです。どんなファイルでも入り、読み取るときにまっすぐにする必要もありません。</p>
<h3>三つの部分</h3>
<ul>
  <li><b>外枠</b>：厚さ 2.8u のリングに <b>60°</b> の切れ目があり、両端は丸くなっています。切れ目の中には長さの違う 4 本の弧。昔のバーコードの太い線・細い線の代わりに、<b>弧の長さ</b>で形式と誤り訂正の強さを記録します。</li>
  <li><b>本体</b>：ゴマのリング。k 番目のリングは半径 r<sub>k</sub> = 9.0 + 2.8k、⌊2πr<sub>k</sub> / 2.8⌋ 個のスロット、各 5 状態。</li>
  <li><b>内枠</b>：外縁 6u・内孔 3.8u のリング。中心と縮尺の基準になります。</li>
</ul>
<h3>リング数と容量</h3>
<p>バージョン番号はありません。リング数は<b>内枠と外枠の半径比</b>で決まり、比が大きいほど多く入ります（4 リングで約 24 バイト、24 リングで約 477 バイト）。詳細設定でリング数と誤り訂正を固定できます。</p>
<h3>ゴマ一粒の情報量</h3>
<p>ゴマは 2u × 1u の楕円で、接線に対して 0° / 45° / 90° / 135° に回せます。空きも含めて <b>5 状態</b>、1 マスあたり log<sub>2</sub>5 ≈ 2.32 bit。</p>
<h3>三つのかたち</h3>
<p>四角、円、そして<b>円形＋ラベル</b>。円盤のまわりを同じ色の文字が一周します。文字は表示言語に合わせて変わり、自分で書き換えることもできます。シールやチャーム、アイコンにどうぞ。</p>
<h3>見た目</h3>
<p>ゴマと下地の色は自由。グラデーション、透明、くり抜きにも対応します。「配色プリセット」に組み合わせ例とグラデ例があり、下にコントラストの目安が出ます。</p>
<h3>きれいに読み取るコツ</h3>
<ul>
  <li>向き：<b>自由</b>。鏡像も自動で戻します。</li>
  <li>角度：斜めでも、強い遠近でも読めます。</li>
  <li>大きさ：画面幅の三分の一ほどあれば十分。読めないときは近づくか、大きく書き出してください。</li>
  <li>光：ゴマが反射しないように。暗いときはフラッシュより照明を。</li>
</ul>`
    });
  })();


  /* ──────────────────────────────────────────────────────────────
   * 第九版補充／覆寫（2026-10）：主視覺、輸出區、固定標示文字、
   * 列印估計、無跑馬燈、洋紅小標、白話說明。
   * ────────────────────────────────────────────────────────────── */
  const V9 = {
    'zh-Hant': {
      'hero.kicker': '異環 · 唄果',
      'hero.title': '芝碼',
      'hero.sub': '唄果世界裡的條碼：一圈一圈的芝麻，掃一下就讀回來。',
      'hero.lede': '把任何內容變成這個圓形圖案。印出來、貼在吊飾上，或直接拍螢幕都掃得到；不用連線、不上傳，整頁在你的瀏覽器裡完成。',
      'hero.fact1': '什麼內容都能放',
      'hero.fact2': '任何角度都掃得到',
      'hero.fact3': '離線可用 · 免安裝',
      'theme.toggle': '切換深色／淺色',
      'gen.preview': '預覽',
      'gen.output': '輸出',
      'gen.png': '導出 PNG',
      'gen.svg': '導出 SVG',
      'gen.self': '試掃看看',
      'gen.basic': '內容',
      'gen.advanced': '容錯與圈數',
      'gen.appear': '外觀',
      'gen.recent': '最近做過的芝碼',
      'gen.size.s': '小 · 螢幕用',
      'gen.size.m': '中 · 分享用',
      'gen.size.l': '大 · 列印用',
      'gen.size.custom': '自訂邊長',
      'style.shape': '外型',
      'style.label': '圓形-標示',
      'style.custom': '自訂顏色',
      'style.solid': '單色',
      'style.opacityBg': '底色透明度',
      'readout.print': '列印估計',
      'readout.print.t': '以 300 dpi 列印時的直徑。',
      'scan.fullscreen': '完全掃描器',
      'scan.req.value': '讓芝碼佔滿畫面中央的圓圈，大約畫面寬度的三分之一以上就好。不用擺正、不用挑背景，斜著拍也行。',
      'footer': '芝碼 · 唄果 · 免費離線 · 不上傳 · 芝碼產生器 ＋ 掃描器',
      'band': '芝碼 · 唄果 · SESAMECODE · 免費離線 · 不上傳 ·',
      'label.ringText': 'NTE · BAGEL',
      'spec.html': null
    },
    'zh-Hans': {
      'hero.kicker': '异环 · 呗果',
      'hero.title': '芝码',
      'hero.sub': '呗果世界里的条码：一圈一圈的芝麻，扫一下就读回来。',
      'hero.lede': '把任何内容变成这个圆形图案。印出来、贴在挂饰上，或直接拍屏幕都扫得到；不用联网、不上传，整页在你的浏览器里完成。',
      'hero.fact1': '什么内容都能放',
      'hero.fact2': '任何角度都扫得到',
      'hero.fact3': '离线可用 · 免安装',
      'theme.toggle': '切换深色／浅色',
      'gen.preview': '预览',
      'gen.output': '输出',
      'gen.png': '导出 PNG',
      'gen.svg': '导出 SVG',
      'gen.self': '试扫看看',
      'gen.basic': '内容',
      'gen.advanced': '纠错与圈数',
      'gen.appear': '外观',
      'gen.recent': '最近做过的芝码',
      'gen.size.s': '小 · 屏幕用',
      'gen.size.m': '中 · 分享用',
      'gen.size.l': '大 · 打印用',
      'gen.size.custom': '自定边长',
      'style.shape': '外形',
      'style.label': '圆形-标示',
      'style.custom': '自定义颜色',
      'style.solid': '单色',
      'style.opacityBg': '底色透明度',
      'readout.print': '打印估计',
      'readout.print.t': '以 300 dpi 打印时的直径。',
      'scan.fullscreen': '完整扫描器',
      'scan.req.value': '让芝码占满画面中央的圆圈，大约画面宽度的三分之一以上就好。不用摆正、不用挑背景，斜着拍也行。',
      'footer': '芝码 · 呗果 · 免费离线 · 不上传 · 芝码生成器 ＋ 扫描器',
      'band': '芝码 · 呗果 · SESAMECODE · 免费离线 · 不上传 ·',
      'label.ringText': 'NTE · BAGEL',
      'spec.html': null
    },
    'en': {
      'hero.kicker': 'NTE · BAGEL',
      'hero.title': 'Bagel Code',
      'hero.sub': 'The barcode of the bagel world: ring after ring of sesame seeds.',
      'hero.lede': 'Turn anything into this round pattern. Print it, stick it on a charm, or just point a camera at the screen. Nothing is uploaded and nothing needs a connection — it all runs in this page.',
      'hero.fact1': 'Any content fits',
      'hero.fact2': 'Reads at any angle',
      'hero.fact3': 'Works offline · no install',
      'theme.toggle': 'Switch light / dark',
      'gen.preview': 'Preview',
      'gen.output': 'Export',
      'gen.png': 'Export PNG',
      'gen.svg': 'Export SVG',
      'gen.self': 'Try scanning it',
      'gen.basic': 'Content',
      'gen.advanced': 'Error correction & rings',
      'gen.appear': 'Looks',
      'gen.recent': 'Recently made',
      'gen.size.s': 'Small · screen',
      'gen.size.m': 'Medium · sharing',
      'gen.size.l': 'Large · printing',
      'gen.size.custom': 'Custom size',
      'style.shape': 'Shape',
      'style.label': 'Circle + label',
      'style.custom': 'Custom colours',
      'style.solid': 'Solid',
      'style.opacityBg': 'Background opacity',
      'readout.print': 'Print size',
      'readout.print.t': 'Diameter when printed at 300 dpi.',
      'scan.fullscreen': 'Full-screen scanner',
      'scan.req.value': 'Fill the circle in the middle of the screen — about a third of the screen width is plenty. No need to straighten it, no need for a plain background, tilted is fine.',
      'footer': 'Bagel code · free offline · no uploads · generator + scanner',
      'band': 'SESAMECODE · BAGEL · FREE OFFLINE · NO UPLOADS ·',
      'label.ringText': 'NTE · BAGEL',
      'spec.html': null
    },
    'ja': {
      'hero.kicker': 'ネバエバ · ベーグル',
      'hero.title': 'ゴマコード',
      'hero.sub': 'ベーグル世界のバーコード。リング状に並んだゴマを読み取ります。',
      'hero.lede': 'どんな内容でもこの丸い模様に。印刷してチャームに貼っても、画面をそのまま撮っても読み取れます。通信もアップロードも不要で、すべてこのページの中で完結します。',
      'hero.fact1': 'どんな内容でも入る',
      'hero.fact2': 'どの角度からでも読める',
      'hero.fact3': 'オフライン可 · インストール不要',
      'theme.toggle': 'ライト／ダークを切り替え',
      'gen.preview': 'プレビュー',
      'gen.output': '書き出し',
      'gen.png': 'PNG を書き出す',
      'gen.svg': 'SVG を書き出す',
      'gen.self': '読み取ってみる',
      'gen.basic': '内容',
      'gen.advanced': '誤り訂正とリング数',
      'gen.appear': '見た目',
      'gen.recent': '最近作ったゴマコード',
      'gen.size.s': '小 · 画面用',
      'gen.size.m': '中 · 共有用',
      'gen.size.l': '大 · 印刷用',
      'gen.size.custom': 'サイズを指定',
      'style.shape': 'かたち',
      'style.label': '円形＋ラベル',
      'style.custom': '色を決める',
      'style.solid': '単色',
      'style.opacityBg': '下地の透明度',
      'readout.print': '印刷サイズ',
      'readout.print.t': '300 dpi で印刷したときの直径です。',
      'scan.fullscreen': '全画面スキャナー',
      'scan.req.value': '画面中央の円いっぱいにゴマコードを入れてください。画面幅の三分の一ほどで十分です。まっすぐにしなくても、背景を選ばなくても、斜めでも読めます。',
      'footer': 'ベーグルコード · オフライン無料 · アップロードなし · 生成＋読み取り',
      'band': 'ネバエバ · ベーグル · SESAMECODE · オフライン · アップロードなし ·',
      'label.ringText': 'NTE · BAGEL',
      'spec.html': null
    }
  };
  const SPEC_PATCH = {
    'zh-Hant': [
      ['「進階選項」裡可以指定圈數與容錯等級', '「容錯與圈數」裡可以指定圈數與容錯等級'],
      ['圓盤外圍繞著一圈同色文字，字串會跟著介面語言換（也可以自己改），適合直接當貼紙、吊飾或頭像。',
       '圓盤<b>正下方</b>有一段用底色上色的弧形文字（固定是 <code>NTE · BAGEL</code>，只出現一次、不繞圈），適合直接當貼紙、吊飾或頭像。']
    ],
    'zh-Hans': [
      ['「高级选项」里可以指定圈数与纠错等级', '「纠错与圈数」里可以指定圈数与纠错等级'],
      ['圆盘外围绕着一圈同色文字，字串会跟着界面语言换（也可以自己改），适合直接当贴纸、挂饰或头像。',
       '圆盘<b>正下方</b>有一段用底色上色的弧形文字（固定是 <code>NTE · BAGEL</code>，只出现一次、不绕圈），适合直接当贴纸、挂饰或头像。']
    ],
    'en': [
      ['Advanced options let you pin the ring count and the error-correction level.',
       'The error-correction &amp; rings panel lets you pin the ring count and the error-correction level.'],
      ['a ring of text in the same colour wraps the plate, translated with the interface (and editable), ready to use as a sticker, a charm or an avatar.',
       'a short arc of text in the background colour sits <b>directly below</b> the plate (always <code>NTE · BAGEL</code>, drawn once, never wrapped around), ready to use as a sticker, a charm or an avatar.']
    ],
    'ja': [
      ['詳細設定でリング数と誤り訂正を固定できます。', '「誤り訂正とリング数」でリング数と誤り訂正を固定できます。'],
      ['円盤のまわりを同じ色の文字が一周します。文字は表示言語に合わせて変わり、自分で書き換えることもできます。シールやチャーム、アイコンにどうぞ。',
       '円盤の<b>真下</b>に、下地と同じ色の短い弧状テキストが入ります（<code>NTE · BAGEL</code> 固定、一周はしません）。シールやチャーム、アイコンにどうぞ。']
    ]
  };
  dict['zh-Hant']['wm.words'] = '異環|唄果|芝碼';
  // 色帶：固定拉丁字樣、四個語系都一樣（不放「免費離線」那些字）
  ['zh-Hant', 'zh-Hans', 'en', 'ja'].forEach(c => { dict[c]['band'] = 'NTE · BAGEL · SESAMECODE · '; });
  // 頁尾：一句介紹（芝碼 加粗）＋ 一句小字
  dict['zh-Hant']['footer'] = '<b>芝碼</b>是佈滿了芝麻的貝果形狀的條碼，源自於《異環》。';
  dict['zh-Hans']['footer'] = '<b>芝码</b>是布满了芝麻的贝果形状的条码，源自于《异环》。';
  dict['en']['footer'] = '<b>Bagel Code</b> is a barcode shaped like a sesame-covered bagel, inspired by <i>Neverness to Everness</i>.';
  dict['ja']['footer'] = '<b>ゴマコード</b>は、ゴマを散らしたベーグル型のバーコード。『ネバエバ』から着想を得ています。';
  dict['zh-Hant']['footer.fine'] = '離線可用 · 不上傳資料 · 自由使用';
  dict['zh-Hans']['footer.fine'] = '离线可用 · 不上传数据 · 自由使用';
  dict['en']['footer.fine'] = 'Works offline · nothing uploaded · free to use';
  dict['ja']['footer.fine'] = 'オフラインで使える · アップロードなし · 自由に使える';

  dict['zh-Hans']['wm.words'] = '异环|呗果|芝码';
  dict['en']['wm.words'] = 'NTE|BAGEL|SESAMECODE';
  dict['ja']['wm.words'] = 'ネバエバ|ベーグル|ゴマコード';
  Object.keys(V9).forEach(code => {
    const add = {};
    Object.keys(V9[code]).forEach(k => { if (V9[code][k] != null) add[k] = V9[code][k]; });
    Object.assign(dict[code], add);
    (SPEC_PATCH[code] || []).forEach(([from, to]) => {
      if (dict[code]['spec.html'].indexOf(from) >= 0) dict[code]['spec.html'] = dict[code]['spec.html'].split(from).join(to);
    });
  });

  /* ── 第九輪之後：色帶固定字樣、頁尾一句介紹、色票只留配色名 ── */
  ['zh-Hant', 'zh-Hans', 'en', 'ja'].forEach(c => { dict[c]['band'] = 'NTE · BAGEL · SESAMECODE · '; });
  dict['zh-Hant']['footer'] = '<b>芝碼</b>是佈滿了芝麻的貝果形狀的條碼，源自於《異環》。';
  dict['zh-Hans']['footer'] = '<b>芝码</b>是布满了芝麻的贝果形状的条码，源自于《异环》。';
  dict['en']['footer'] = '<b>Bagel Code</b> is a barcode shaped like a sesame-covered bagel, inspired by Neverness to Everness.';
  dict['ja']['footer'] = '<b>ゴマコード</b>は、ゴマを散らしたベーグル型のバーコード。『ネバエバ』から着想を得ています。';
  dict['zh-Hant']['footer.fine'] = '離線可用 · 不上傳資料 · 自由使用';
  dict['zh-Hans']['footer.fine'] = '离线可用 · 不上传数据 · 自由使用';
  dict['en']['footer.fine'] = 'Works offline · nothing uploaded · free to use';
  dict['ja']['footer.fine'] = 'オフラインで使える · アップロードなし · 自由に使える';
  dict['zh-Hant']['msg.downloadFail'] = '導出失敗：{err}';
  dict['zh-Hans']['msg.downloadFail'] = '导出失败：{err}';
  dict['en']['msg.downloadFail'] = 'Export failed: {err}';
  dict['ja']['msg.downloadFail'] = '書き出しに失敗しました：{err}';
  // 色票名稱只留配色名（不寫出實際顏色）
  const PRESET_NAME = {
    'zh-Hant': { classic: '經典', nte: '異環', alert: '警報', sesame: '芝麻', matcha: '抹茶', midnight: '夜行', blueprint: '藍圖', rose: '玫瑰' },
    'zh-Hans': { classic: '经典', nte: '异环', alert: '警报', sesame: '芝麻', matcha: '抹茶', midnight: '夜行', blueprint: '蓝图', rose: '玫瑰' },
    'en': { classic: 'Classic', nte: 'NTE', alert: 'Alert', sesame: 'Sesame', matcha: 'Matcha', midnight: 'Nightfall', blueprint: 'Blueprint', rose: 'Rose' },
    'ja': { classic: 'クラシック', nte: 'ネバエバ', alert: 'アラート', sesame: 'ゴマ', matcha: '抹茶', midnight: 'ナイトフォール', blueprint: 'ブループリント', rose: 'ローズ' }
  };
  Object.keys(PRESET_NAME).forEach(c => {
    Object.keys(PRESET_NAME[c]).forEach(id => { dict[c]['preset.' + id] = PRESET_NAME[c][id]; });
  });

  // 漸層色票也只留配色名
  const GRAD_NAME = {
    'zh-Hant': { ntecity: '異環夜色', neon: '霓虹', alert: '警報', mint: '薄荷', ice: '冰晶', rose: '玫瑰霧', deepcity: '深夜都市', mist: '晨霧', neonfog: '霓虹霧', paper: '紙張' },
    'zh-Hans': { ntecity: '异环夜色', neon: '霓虹', alert: '警报', mint: '薄荷', ice: '冰晶', rose: '玫瑰雾', deepcity: '深夜都市', mist: '晨雾', neonfog: '霓虹雾', paper: '纸张' },
    'en': { ntecity: 'NTE Night', neon: 'Neon', alert: 'Alert', mint: 'Mint', ice: 'Ice', rose: 'Rose', deepcity: 'Deep City', mist: 'Mist', neonfog: 'Neon Fog', paper: 'Paper' },
    'ja': { ntecity: 'ネバエバ夜', neon: 'ネオン', alert: 'アラート', mint: 'ミント', ice: 'アイス', rose: 'ローズ', deepcity: 'ディープシティ', mist: 'ミスト', neonfog: 'ネオンフォグ', paper: 'ペーパー' }
  };
  Object.keys(GRAD_NAME).forEach(c => {
    Object.keys(GRAD_NAME[c]).forEach(id => { dict[c]['grad.' + id] = GRAD_NAME[c][id]; });
  });
  let lang = 'zh-Hant';
  const listeners = [];

  function normalize(code) {
    if (!code) return null;
    const c = String(code).toLowerCase();
    if (c.startsWith('zh')) {
      if (c.includes('hans') || c.includes('cn') || c.includes('sg') || c.includes('my')) return 'zh-Hans';
      return 'zh-Hant';
    }
    if (c.startsWith('ja')) return 'ja';
    if (c.startsWith('en')) return 'en';
    return null;
  }

  function t(key, params) {
    const d = dict[lang] || dict['zh-Hant'];
    let v = d[key];
    if (v == null) v = dict['en'][key];
    if (v == null) v = dict['zh-Hant'][key];
    if (v == null) return key;
    if (params && typeof v === 'string') {
      v = v.replace(/\{(\w+)\}/g, (m, k) => (params[k] == null ? m : String(params[k])));
    }
    return v;
  }

  function apply(node) {
    const root = node || (typeof document !== 'undefined' ? document : null);
    if (!root) return;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
    if (typeof document !== 'undefined') document.title = t('doc.title');
  }

  function setLang(code) {
    const n = normalize(code) || 'zh-Hant';
    lang = n;
    try { localStorage.setItem('sesame.lang', n); } catch (e) {}
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', n);
    apply();
    listeners.forEach(fn => fn(n));
    return n;
  }

  function detect() {
    let saved = null;
    try { saved = localStorage.getItem('sesame.lang'); } catch (e) {}
    if (saved && normalize(saved)) return normalize(saved);
    const nav = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || 'en';
    return normalize(nav) || 'en';
  }

  root.SesameI18N = { LANGS, dict, t, apply, setLang, detect, normalize, onChange: fn => listeners.push(fn), get lang() { return lang; } };
})(typeof window !== 'undefined' ? window : globalThis);
