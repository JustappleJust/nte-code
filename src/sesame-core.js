/* ============================================================================
 * 芝碼 Sesame Code — 核心編解碼模組  (v1.0)
 *
 * 設計摘要（完整規格見 README.md）
 *   · 三層結構：外框 / 主體 / 內框
 *   · 內框 = 實心圓，提供中心與尺度基準
 *   · 外框 = 厚環，外緣 1.3u 為實心「邊緣環」，內側 2.2u 為「分段層」
 *            分段層在 300° 為實心，在 60°「標記區」切成 15 格 × 4°
 *            標記區前 16° 為整厚度缺口(Notch) → 唯一方向基準
 *   · 主體 = 同心環狀極座標格陣列。第 k 圈半徑 r_k、格數 n_k = ⌊2πr_k / p⌋
 *            每一格可放 0 或 1 顆芝麻；芝麻為 2u × 1u 橢圓，具方向性
 *            → 每格 5 種狀態 {無, 0°, 45°, 90°, 135°}
 *   · 資料：Reed–Solomon(GF(256)) 保護後，以 5 進位打包進格陣列
 *
 * 座標系：一律使用螢幕座標 (y 向下)，角度 = atan2(dy, dx)，單位 u = 芝麻基準格
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Sesame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ------------------------------------------------------------ 幾何常數 */
  /* 單位 u：芝麻長邊 = 2u、短邊 = 1u。全部尺寸皆為 u 的整數倍。 */
  /* ── 標示用圓體字外框：Quicksand Bold（SIL Open Font License 1.1，見 LICENSE-FONT.txt）
     · 只保留 N T E B A G L S M C O D 與分隔點，已轉為輪廓資料，執行期不需字型檔 ── */
  const LABEL_FONT={upem:1000,data:"N735:641,688 645,684 649,680 652,676 654,671 656,666 658,661 659,656 660,650 660,644 660,61 660,55 659,49 658,43 656,37 653,32 650,27 647,22 642,18 638,13 633,10 628,7 623,4 617,2 611,1 605,0 599,0 596,0 592,0 589,1 586,1 583,2 579,3 576,3 572,4 569,6 566,7 563,8 561,10 558,11 556,13 554,15 552,17 159,516 185,532 185,56 185,50 184,44 183,39 181,34 179,29 176,24 173,20 170,16 165,12 161,9 157,6 152,4 146,2 141,1 135,0 129,0 123,0 118,1 112,2 107,4 103,6 98,9 94,12 90,16 86,20 83,24 81,29 79,34 77,39 76,44 75,50 75,56 75,639 75,645 76,651 77,657 79,663 82,668 85,673 88,678 92,682 97,687 102,690 107,693 112,696 118,698 124,699 130,700 136,700 140,700 143,700 147,699 150,699 154,698 158,697 161,696 165,694 169,693 172,691 175,690 178,688 181,685 183,683 185,681 187,678 568,192 551,180 551,644 551,650 552,656 553,661 555,666 557,671 559,676 562,680 566,684 570,688 574,691 579,694 584,696 589,698 594,699 600,700 606,700 606,700 612,700 617,699 623,698 628,696 632,694 637,691;T626:305,0 299,1 292,2 286,4 281,7 276,10 271,13 266,18 262,22 258,27 255,32 252,37 251,43 249,49 248,55 248,61 248,641 378,641 378,61 378,55 377,49 375,43 373,37 371,32 368,27 364,22 360,18 355,13 350,10 344,7 338,4 332,2 326,1 319,0|30,643 30,649 31,655 32,661 34,666 37,671 40,676 43,680 48,684 52,688 57,691 62,694 67,696 73,698 79,699 85,700 91,700 535,700 541,700 547,699 553,698 559,696 564,694 569,691 574,688 578,684 583,680 586,675 589,671 592,666 594,660 595,654 596,648 596,642 596,636 595,630 594,624 592,619 589,614 586,609 583,605 578,600 574,597 569,594 564,591 559,589 553,587 547,586 541,585 535,585 91,585 85,585 79,586 73,587 67,589 62,591 57,594 52,597 48,601 43,605 40,610 37,614 34,620 32,625 31,631 30,637;E572:505,9 500,6 495,4 489,2 483,1 477,0 471,0 136,0 130,0 124,1 118,2 112,4 107,7 102,10 97,13 92,18 88,22 85,27 82,32 79,37 77,43 76,49 75,55 75,61 75,639 75,645 76,651 77,657 79,663 82,668 85,673 88,678 92,682 97,687 102,690 107,693 112,696 118,698 124,699 130,700 136,700 136,700 471,700 477,700 483,699 489,698 495,696 500,694 505,691 510,687 514,684 519,679 522,675 525,670 528,665 530,659 531,653 532,647 532,641 532,635 531,629 530,624 528,618 525,613 522,609 519,605 514,600 510,597 505,594 500,591 495,589 489,587 483,586 477,585 471,585 191,585 200,602 200,407 192,415 426,415 432,415 438,414 444,413 450,411 455,409 460,406 465,402 470,398 474,394 477,390 480,385 483,380 485,374 486,368 487,362 487,356 487,350 486,344 485,339 483,333 480,328 477,324 474,320 470,316 465,312 460,309 455,306 450,304 444,302 438,301 432,300 426,300 195,300 200,308 200,106 192,115 471,115 477,115 483,114 489,113 495,111 500,108 505,105 510,102 514,98 519,93 522,88 525,84 528,79 530,73 531,68 532,63 532,57 532,51 531,45 530,40 528,34 525,29 522,25 519,20 514,16 510,12;B655:537,40 528,34 519,29 510,25 501,21 491,17 482,14 472,11 462,8 452,7 442,5 432,3 423,2 413,1 404,1 394,0 385,0 136,0 130,0 124,1 118,2 112,4 107,7 102,10 97,13 92,18 88,22 85,27 82,32 79,37 77,43 76,49 75,55 75,61 75,639 75,645 76,651 77,657 79,663 82,668 85,673 88,678 92,682 97,687 102,690 107,693 112,696 118,698 124,699 130,700 136,700 388,700 411,699 433,697 453,694 472,689 489,682 504,675 518,666 531,655 542,643 552,630 560,615 566,599 571,582 575,563 577,543 578,522 578,510 577,499 575,488 572,478 569,468 565,458 560,449 555,440 549,431 542,423 535,415 526,408 518,401 508,395 498,390 487,384 475,380 463,376 450,373 437,370 423,368 408,366 392,365 376,365 380,410 388,410 396,409 405,409 413,408 422,407 432,405 441,403 451,402 461,399 471,396 481,393 490,390 500,386 510,381 519,377 528,372 538,366 546,360 555,353 563,346 570,338 577,330 584,321 590,312 596,302 601,291 605,280 609,268 612,255 613,242 615,228 615,213 615,197 614,182 612,167 610,153 607,140 603,128 599,116 594,105 588,95 582,85 575,76 569,68 561,60 554,53 546,46|192,582 205,598 205,417 193,426 373,426 380,426 387,427 394,429 400,431 407,433 413,437 419,441 425,445 430,450 435,456 439,462 442,468 445,475 447,483 448,491 448,500 448,510 447,520 445,529 443,537 440,545 436,551 432,557 426,562 421,567 415,571 408,574 402,577 394,579 387,581 379,582 370,582 370,582|195,115 385,115 396,115 407,117 417,118 426,121 435,125 443,129 451,134 458,140 464,146 470,153 474,161 478,170 481,180 483,190 485,201 485,213 485,224 484,234 482,243 480,252 478,259 475,266 471,273 467,278 462,283 458,287 453,291 447,294 442,297 436,300 430,302 424,303 418,304 412,305 406,306 400,307 394,307 389,308 383,308 378,308 378,308 196,308 205,316 205,105;A639:40,-1 35,1 30,3 26,6 23,10 20,14 17,18 15,22 13,27 12,31 11,36 10,42 10,47 10,49 10,52 10,54 11,56 11,59 12,61 12,64 13,66 262,664 264,669 267,673 269,678 272,682 275,685 279,689 283,692 286,695 291,698 295,700 299,701 304,703 308,704 313,704 317,704 322,704 326,704 331,703 335,703 339,701 344,700 348,698 352,696 356,694 359,691 363,688 366,684 369,681 372,677 374,673 376,669 378,664 624,78 625,75 626,72 627,69 628,66 628,63 629,60 629,57 629,54 629,47 628,41 627,35 625,30 622,25 619,20 616,15 612,11 607,7 603,4 598,1 593,-1 588,-3 583,-4 578,-5 573,-5 569,-5 564,-4 560,-3 556,-2 552,-1 548,1 544,3 540,6 537,9 534,12 531,15 528,19 525,23 522,27 520,31 518,36 303,537 332,543 116,35 114,30 112,26 110,22 107,18 104,15 101,11 98,8 94,6 91,3 87,1 83,-1 79,-2 75,-4 71,-4 67,-5 63,-5 56,-5 50,-4 45,-3|147,157 202,272 472,272 491,157;G696:187,639 201,649 216,658 231,667 247,675 263,682 280,689 297,694 314,699 332,703 349,706 368,708 386,710 405,710 417,710 428,709 440,709 451,708 463,706 474,704 485,702 496,700 507,697 518,694 528,691 538,688 548,684 558,679 568,675 577,670 581,668 584,666 587,663 590,661 593,658 595,655 598,652 600,648 601,645 603,642 604,638 605,635 606,631 607,628 607,624 607,621 607,615 606,609 605,604 603,598 601,593 598,588 595,583 591,578 587,574 582,570 578,566 573,564 567,562 562,560 556,559 550,559 548,559 546,559 544,559 542,560 540,560 538,560 536,561 534,561 531,562 529,562 527,563 525,564 523,564 521,565 519,566 517,567 511,570 504,572 498,575 491,577 485,579 478,581 471,582 464,584 457,585 450,587 443,588 435,588 428,589 420,590 413,590 405,590 389,589 373,588 358,585 343,582 328,577 314,572 300,565 286,558 273,549 261,540 249,530 238,520 228,508 219,496 210,484 202,470 194,457 188,443 182,428 178,413 174,398 172,382 170,366 170,350 170,334 172,318 174,303 178,288 182,273 188,258 194,244 202,230 210,217 219,204 228,192 238,181 249,170 261,160 273,151 286,142 300,135 314,128 328,123 343,118 358,115 373,112 389,111 405,110 413,110 420,110 428,111 436,112 445,112 453,113 462,115 471,116 480,118 488,119 496,121 504,123 511,125 518,127 524,130 530,132 521,102 521,273 538,258 427,258 421,258 415,259 409,260 403,262 398,265 393,268 388,271 384,275 379,279 376,284 373,289 370,294 368,300 367,306 366,312 366,318 366,324 367,330 368,336 370,342 373,347 376,352 379,357 384,361 388,365 393,368 398,371 403,374 409,376 415,377 421,378 427,378 591,378 597,378 603,377 609,376 615,374 620,371 625,368 630,365 634,360 638,356 641,351 644,346 647,341 649,335 650,329 651,323 651,317 651,105 651,100 650,95 650,91 649,87 647,83 646,79 644,75 642,72 639,69 637,66 634,63 631,60 629,58 626,55 623,53 620,51 608,44 596,38 584,32 572,26 559,20 546,15 533,11 520,6 506,3 492,-1 478,-4 464,-6 449,-8 435,-9 420,-10 405,-10 405,-10 386,-10 368,-8 349,-6 332,-3 314,1 297,6 280,11 263,18 247,25 231,33 216,42 201,51 187,61 173,72 160,83 147,96 135,108 123,121 113,135 102,149 93,163 84,178 76,194 68,210 62,226 56,243 51,260 47,278 44,295 42,313 40,331 40,350 40,369 42,387 44,405 47,422 51,440 56,457 62,474 68,490 76,506 84,522 93,537 102,551 113,565 123,579 135,592 147,604 160,617 173,628;L562:495,9 490,6 485,4 479,2 473,1 467,0 461,0 136,0 130,0 124,1 118,2 112,4 107,7 102,10 97,13 92,18 88,22 85,27 82,32 79,37 77,43 76,49 75,55 75,61 75,639 75,645 76,651 78,657 80,663 82,668 85,673 89,678 93,682 98,687 103,690 108,693 114,696 119,698 126,699 132,700 139,700 145,700 151,699 156,698 162,696 167,693 172,690 177,687 182,682 186,678 190,673 193,668 195,663 197,657 199,651 200,645 200,639 200,100 178,117 461,117 467,117 473,116 479,115 485,113 490,111 495,108 500,104 504,100 509,96 512,92 515,87 518,82 520,76 521,70 522,64 522,58 522,52 521,46 520,40 518,35 515,30 512,25 509,21 504,16 500,13;S597:133,24 119,32 106,40 93,49 80,58 67,69 64,72 61,75 58,78 56,81 53,84 51,87 49,91 47,94 45,98 44,101 43,104 42,108 41,112 40,115 40,118 40,122 40,128 41,133 42,138 44,144 46,149 49,153 53,158 56,162 61,167 65,170 70,173 75,176 80,178 86,179 92,180 98,180 103,180 107,179 112,178 116,177 120,175 124,173 128,171 132,168 141,160 151,153 160,147 170,141 179,135 189,130 198,125 208,121 217,117 227,114 238,111 249,109 261,107 274,106 287,105 300,105 309,105 318,106 327,107 336,108 344,109 352,111 360,114 368,116 376,120 383,123 390,126 396,130 402,134 408,138 413,143 418,148 422,152 426,158 430,163 432,168 434,174 436,180 437,186 437,192 437,199 436,206 434,213 432,220 430,226 427,232 423,238 419,243 414,248 409,253 403,258 396,262 389,267 381,271 373,275 364,278 354,282 344,285 333,288 322,291 310,294 297,297 284,299 270,301 257,303 244,306 231,308 219,311 208,314 196,318 185,322 175,326 165,330 155,334 146,339 137,344 129,350 121,355 114,361 106,368 100,374 94,381 88,388 82,395 77,403 73,411 69,419 65,428 62,436 59,445 56,455 54,464 53,474 52,484 51,494 51,505 52,521 53,536 56,551 59,565 64,579 70,592 77,604 84,616 93,627 103,638 113,647 124,656 136,665 148,673 161,680 175,686 189,692 204,696 219,701 235,704 251,707 267,708 284,710 301,710 317,710 333,709 348,707 364,705 379,702 393,699 407,695 422,690 435,685 448,680 460,674 472,668 483,662 493,655 503,648 512,641 519,635 525,629 530,623 534,616 537,610 539,603 541,595 541,588 541,583 540,577 539,572 537,567 534,562 531,557 528,553 524,548 520,544 515,540 510,537 506,534 500,533 495,531 490,530 484,530 480,530 477,531 473,531 470,532 466,534 463,535 460,537 457,539 453,542 448,546 443,549 438,553 433,556 427,559 421,562 414,566 407,569 400,572 393,574 386,577 379,580 372,582 364,584 357,586 350,588 342,590 335,592 328,593 321,594 314,594 308,595 301,595 290,595 280,594 271,593 261,592 253,591 244,589 236,587 228,584 221,581 215,578 208,575 203,571 197,567 192,563 188,559 184,554 180,549 177,544 175,539 173,534 171,528 170,522 169,516 169,510 169,503 170,496 171,489 173,483 176,477 179,471 182,466 186,460 191,456 196,451 202,447 208,443 214,439 221,436 229,432 237,430 245,427 254,424 264,421 273,419 283,416 294,414 305,411 316,409 331,406 345,403 359,400 372,397 385,394 398,390 410,387 422,383 433,379 443,375 453,371 463,366 472,361 481,356 489,350 497,344 504,338 511,332 517,325 523,318 529,310 534,302 538,294 542,286 546,276 549,267 551,257 553,246 555,235 556,224 557,212 557,199 556,183 555,168 552,153 548,138 543,125 537,112 529,99 521,87 512,76 502,65 491,55 479,46 467,37 454,29 441,22 426,15 412,9 397,4 381,0 366,-4 350,-6 333,-8 317,-10 300,-10 300,-10 283,-10 266,-9 249,-8 234,-6 218,-3 203,0 188,3 174,8 160,12 146,18;M819:725,684 729,680 733,675 737,670 739,664 741,659 743,653 744,647 744,640 744,61 744,55 743,49 742,43 740,37 737,32 734,27 731,22 727,18 723,13 718,10 713,7 707,4 701,2 695,1 689,0 682,0 675,0 669,1 662,2 657,4 651,7 646,10 641,13 636,18 632,22 629,27 626,32 623,37 621,43 620,49 619,55 619,61 619,532 658,523 454,212 452,209 449,207 447,204 444,202 441,199 438,197 435,195 432,193 428,191 425,190 421,188 418,187 414,187 411,186 407,186 404,186 401,186 397,186 394,187 391,187 388,188 384,190 381,191 378,193 374,195 371,197 368,199 365,202 362,204 360,207 357,209 355,212 164,514 190,567 190,61 190,55 189,49 188,43 186,37 184,32 181,27 178,22 174,18 170,13 165,10 161,7 156,4 150,2 144,1 138,0 132,0 126,0 120,1 115,2 109,4 104,7 100,10 95,13 91,18 87,22 84,27 81,32 79,37 77,43 76,49 75,55 75,61 75,640 75,646 76,652 78,658 80,663 82,669 85,674 89,678 94,683 98,687 103,691 108,694 114,696 120,698 125,700 132,701 138,701 138,701 142,701 145,701 149,700 152,699 156,698 160,697 164,695 168,694 171,692 175,689 178,687 181,685 184,682 187,680 189,677 191,674 434,300 384,302 633,674 638,680 643,686 649,690 655,694 661,697 668,699 675,701 682,701 688,701 694,700 699,699 705,697 710,694 715,691 720,688;C627:571,663 577,659 581,654 586,649 589,644 592,638 594,632 596,625 596,618 596,611 596,605 594,598 592,592 589,586 585,580 581,574 578,570 574,566 570,563 566,560 562,558 557,556 553,555 548,554 542,554 537,554 532,554 527,555 522,556 516,558 511,560 506,562 500,565 494,567 488,570 481,572 475,574 469,576 462,577 456,579 449,580 442,582 435,583 428,584 421,584 414,585 407,585 400,585 387,585 374,584 361,583 349,581 337,578 325,575 314,572 304,568 293,564 283,559 273,553 264,547 255,541 247,534 239,527 231,520 224,511 217,503 211,494 205,485 199,476 194,466 190,456 186,445 182,434 179,423 176,411 174,400 172,388 171,375 170,363 170,350 170,335 171,320 172,306 174,293 177,280 180,268 183,256 188,244 192,233 197,222 203,212 208,203 215,194 221,185 228,177 236,169 244,162 252,155 261,149 270,143 279,138 289,133 299,128 309,124 320,121 330,118 341,116 353,114 364,112 376,111 388,110 400,110 407,110 414,110 420,111 427,111 434,112 440,113 447,114 454,115 461,116 467,118 474,120 480,122 487,124 493,127 500,130 506,133 511,135 516,137 522,139 527,140 532,140 537,141 542,141 548,140 553,139 557,138 562,136 566,133 571,130 575,127 578,123 582,119 587,113 590,106 593,100 596,94 597,87 598,81 597,74 596,68 595,61 593,55 590,50 586,45 582,40 577,36 572,32 566,29 559,26 553,23 546,20 540,17 533,15 526,12 519,10 512,8 506,5 499,4 492,2 485,0 478,-2 471,-3 464,-4 457,-6 450,-7 443,-7 436,-8 429,-9 422,-9 414,-10 407,-10 400,-10 382,-10 364,-9 347,-7 330,-4 313,-1 296,3 280,8 264,13 248,19 232,26 217,33 202,42 188,50 175,60 161,70 148,81 136,93 125,105 114,118 103,132 94,146 85,161 77,177 69,194 62,211 56,229 51,247 47,266 44,286 42,307 40,328 40,350 40,369 42,388 44,406 47,424 50,442 55,459 60,476 66,492 73,508 81,523 89,538 98,553 108,566 119,580 130,592 142,604 154,616 167,627 180,637 194,647 209,656 224,664 240,672 256,678 273,685 290,690 307,695 325,698 343,701 362,703 381,705 400,705 411,705 422,704 433,704 444,702 454,701 465,699 475,697 486,695 496,692 507,689 517,686 527,683 537,679 546,675 556,671 565,666 565,666;O759:433,-6 415,-8 397,-10 379,-10 361,-10 343,-8 325,-6 308,-3 291,1 275,6 259,11 243,18 228,25 213,33 199,42 185,51 172,61 159,72 147,83 136,96 124,108 114,121 104,135 95,149 87,163 79,178 72,194 65,210 59,226 54,243 50,260 46,278 44,295 42,313 40,331 40,350 40,369 42,387 44,405 46,422 50,440 54,457 59,474 65,490 72,506 79,522 87,537 95,551 104,565 114,579 124,592 136,604 147,617 159,628 172,639 185,649 199,658 213,667 228,675 243,682 259,689 275,694 291,699 308,703 325,706 343,708 361,710 379,710 397,710 415,708 433,706 450,703 467,699 484,694 500,689 516,682 531,675 546,667 560,658 574,649 587,639 600,628 612,617 624,604 635,592 645,579 655,565 664,551 672,537 680,522 687,506 694,490 700,474 705,457 709,440 713,422 715,405 717,387 719,369 719,350 719,350 719,331 717,313 715,295 713,278 709,260 705,243 700,226 694,210 687,194 680,178 672,163 664,149 655,135 645,121 635,108 624,96 612,83 600,72 587,61 574,51 560,42 546,33 531,25 516,18 500,11 484,6 467,1 450,-3|379,590 364,590 349,588 335,586 321,582 307,578 294,572 282,566 270,558 259,550 248,541 238,531 228,520 219,509 211,498 203,485 196,472 190,458 185,444 180,430 177,414 174,399 172,383 170,367 170,350 170,333 172,317 174,302 177,286 180,271 185,257 190,242 196,228 203,215 211,203 219,191 228,180 238,169 248,159 259,150 270,142 282,134 294,128 307,122 321,118 335,114 349,112 364,110 379,110 394,110 409,112 423,114 437,118 451,122 464,128 476,134 488,142 499,150 510,159 520,169 530,180 539,191 547,203 555,215 562,228 568,242 574,257 578,271 582,286 585,302 587,317 589,333 589,350 589,350 589,367 587,383 585,398 582,414 578,429 574,443 568,458 562,472 555,485 547,497 539,509 530,520 520,531 510,541 499,550 488,558 476,566 464,572 451,578 437,582 423,586 409,588 394,590;D715:538,47 521,36 503,26 484,18 464,12 443,7 422,3 399,1 375,0 136,0 130,0 124,1 118,2 112,4 107,7 102,10 97,13 92,18 88,22 85,27 82,32 79,37 77,43 76,49 75,55 75,61 75,639 75,645 76,651 77,657 79,663 82,668 85,673 88,678 92,682 97,687 102,690 107,693 112,696 118,698 124,699 130,700 136,700 375,700 393,700 410,698 427,696 443,693 459,689 474,685 489,679 503,673 517,666 530,658 543,650 555,641 566,631 577,620 588,609 598,598 607,585 616,572 624,559 631,545 638,531 645,516 650,501 656,486 660,469 664,453 667,437 670,420 672,403 674,385 675,368 675,350 674,326 673,303 670,280 666,257 661,236 655,214 648,194 640,174 631,154 621,136 609,118 597,102 584,87 570,73 555,59|446,566 437,570 428,574 419,578 409,580 398,582 388,584 377,585 365,585 190,585 200,594 200,104 194,115 365,115 380,116 395,117 409,120 422,123 435,128 447,133 458,140 468,148 478,156 487,165 495,175 503,185 510,196 516,208 522,220 526,234 531,247 535,261 538,275 540,289 542,304 544,319 545,334 545,350 545,362 544,373 544,385 542,396 541,407 539,418 537,429 534,440 532,450 529,460 525,470 521,480 517,489 512,498 507,506 502,514 496,522 490,530 484,537 477,544 470,550 462,556 454,561;·222:60,254 56,258 53,262 50,267 48,272 46,278 45,284 44,291 44,298 44,315 44,322 45,329 46,335 48,341 50,346 53,351 56,355 60,360 64,363 68,366 73,369 78,371 84,373 90,374 97,375 104,375 117,375 124,375 131,374 137,373 143,371 148,369 153,366 157,363 162,360 165,355 168,351 171,346 173,341 175,335 176,329 177,322 177,315 177,298 177,291 176,284 175,278 173,272 171,267 168,262 165,258 162,254 157,250 153,247 148,244 143,242 137,240 131,239 124,238 117,238 104,238 97,238 90,239 84,240 78,242 73,244 68,247 64,250"};
  const LF = (() => {
    const g = {};
    for (const part of LABEL_FONT.data.split(';')) {
      const k = part.indexOf(':');
      if (k < 0) continue;
      const head = part.slice(0, k), body = part.slice(k + 1);
      const contours = [];
      if (body) for (const c of body.split('|')) {
        const pts = [];
        for (const seg of c.split(' ')) { if (!seg) continue; const q = seg.split(','); pts.push(+q[0], +q[1]); }
        if (pts.length >= 6) contours.push(pts);
      }
      g[head[0]] = { adv: +head.slice(1), contours };
    }
    return { upem: LABEL_FONT.upem, cap: 700, g };
  })();

  /** 標示文字幾何：字輪廓沿半徑 rBase 的圓弧彎曲（正下方、字頭朝圓心）。
   *  回傳的座標為單位座標（圓心在原點、y 向下），PNG 與 SVG 共用同一份。 */
  const labelGeometry = (str, plateR, gh0) => {
    const chars = Array.from(String(str == null ? 'NTE · BAGEL' : str).toUpperCase());
    if (!chars.length) return null;
    const TRACK = 0.16;                                 // 字距（以字高為單位）
    const advOf = (ch) => (LF.g[ch] || LF.g['.'] || { adv: 400 }).adv;
    const measure = (gh) => {
      const sc = gh / LF.cap;
      let w = 0;
      for (const ch of chars) w += advOf(ch) * sc;
      return w + Math.max(0, chars.length - 1) * gh * TRACK;
    };
    let gh = gh0;
    while (gh > 0.9 && measure(gh) / (plateR + gh * 0.5 + 0.9) > 1.95) gh *= 0.96;   // 最多約 112°
    const sc = gh / LF.cap;
    const rC = plateR + gh * 0.5 + 0.9;
    const rBase = rC + gh * 0.5;
    let penU = -measure(gh) / 2;
    const glyphs = [];
    for (const ch of chars) {
      if (ch === ' ') { penU += gh * 0.55; continue; }
      const g = LF.g[ch] || LF.g['.'] || { adv: 300, contours: [] };
      const contours = [];
      for (const c of g.contours) {
        const out = new Float64Array(c.length);
        for (let i = 0; i < c.length; i += 2) {
          const su = c[i] * sc + penU, nu = c[i + 1] * sc;
          const r = rBase - nu, phi = su / rBase;
          out[i] = r * Math.sin(phi);
          out[i + 1] = r * Math.cos(phi);
        }
        contours.push(out);
      }
      glyphs.push({ ch, contours });
      penU += g.adv * sc + gh * TRACK;
    }
    return { gh, rC, rBase, glyphs };
  };

  const GEO = {
    RI: 6.0,            // 內框（圓環）外緣半徑
    INNER_T: 2.2,       // 內框環厚 → 內孔半徑 RI-INNER_T = 3.8
    BODY_GAP: 1.6,      // 內框 → 主體 間距
    RING_PITCH: 2.8,    // 相鄰圈半徑差
    CELL_PITCH: 2.8,    // 同圈相鄰格心的弧長
    SA: 1.0,            // 芝麻半長軸
    SB: 0.5,            // 芝麻半短軸
    FRAME_GAP: 1.6,     // 主體 → 外框 間距
    FRAME_T: 2.8,       // 外框單層環厚（= 端帽直徑，比舊版的 3.5 細）
    HEADER_DEG: 60,     // 外框被切掉的角度（缺口）
    META_MODULES: 12,   // 缺口切成 12 格（每格 5°）
    META_ELEMS: 4,      // 缺口內 4 段：[墨][空][墨][空]
    META_MINW: 2,       // 每段長度 ∈ {2,3,4} 格
    META_MAXW: 4,
    MIN_VERSION: 4,     // 支援的圈數（格數由內外環比例自動決定，非版本號）
    MAX_VERSION: 16     // 上限受「內外緣半徑比」的可分辨度限制（相鄰圈數差距約 0.0024）
  };
  GEO.INNER_RI = GEO.RI - GEO.INNER_T;
  GEO.CAP_R = GEO.FRAME_T / 2;                          // 端帽半徑 1.4
  GEO.R0 = GEO.RI + GEO.BODY_GAP + GEO.RING_PITCH / 2;  // 9.0 第一圈半徑

  const LOG2_5 = Math.log2(5);
  const TAU = Math.PI * 2;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  const ringRadius = k => GEO.R0 + k * GEO.RING_PITCH;
  const ringCells = k => Math.floor(TAU * ringRadius(k) / GEO.CELL_PITCH);
  const bodyOuter = v => ringRadius(v - 1) + GEO.RING_PITCH / 2;
  const frameInner = v => bodyOuter(v) + GEO.FRAME_GAP;
  const frameOuter = v => frameInner(v) + GEO.FRAME_T;
  const metaMid = v => (frameInner(v) + frameOuter(v)) / 2;   // 外框環中心線半徑

  /** 端帽（半徑 capR 的半圓）在模型半徑 r 處造成的角展（度）：
   *  墨跡在該半徑上會比設計值兩端各多出這麼多角度。r 取環中心線時 = ψ。 */
  function capShadowDeg(r, rMid, capR) {
    const c = (r * r + rMid * rMid - capR * capR) / (2 * r * rMid);
    return Math.acos(c > 1 ? 1 : (c < -1 ? -1 : c)) * R2D;
  }
  const metaPsi = v => capShadowDeg(metaMid(v), metaMid(v), GEO.CAP_R);
  const metaModuleDeg = () => GEO.HEADER_DEG / GEO.META_MODULES;   // 5°

  function wrapVersion(v) { return Math.max(GEO.MIN_VERSION, Math.min(GEO.MAX_VERSION, v | 0)); }

  const _cells = [], _cap = [];
  function totalCells(v) {
    v = wrapVersion(v);
    if (_cells[v] == null) { let s = 0; for (let k = 0; k < v; k++) s += ringCells(k); _cells[v] = s; }
    return _cells[v];
  }
  /** 第 i 個資料格（依序：內圈→外圈，同圈依角度）落在哪一圈/第幾格 */
  function cellAt(v, i) {
    for (let k = 0; k < v; k++) { const n = ringCells(k); if (i < n) return { ring: k, j: i, n }; i -= n; }
    return null;
  }

  /* --------------------------------------------------- 資料打包（5 進位） */
  const CHUNK_BYTES = 32;
  const digitsForBytes = b => Math.ceil(b * 8 / LOG2_5);
  function packCost(cBytes) {
    let total = 0, rem = cBytes;
    while (rem > 0) { const b = Math.min(CHUNK_BYTES, rem); total += digitsForBytes(b); rem -= b; }
    return total;
  }
  function capacityBytes(v) {
    v = wrapVersion(v);
    if (_cap[v] == null) {
      let c = Math.floor(totalCells(v) * LOG2_5 / 8);
      while (c > 1 && packCost(c) > totalCells(v)) c--;
      _cap[v] = c;
    }
    return _cap[v];
  }
  function packBytes(bytes, M) {
    const digits = new Uint8Array(M);
    let pos = 0, idx = 0;
    while (idx < bytes.length) {
      const b = Math.min(CHUNK_BYTES, bytes.length - idx);
      let x = 0n;
      for (let i = 0; i < b; i++) x = (x << 8n) | BigInt(bytes[idx + i]);
      const nd = digitsForBytes(b);
      for (let i = 0; i < nd; i++) { digits[pos + i] = Number(x % 5n); x /= 5n; }
      pos += nd; idx += b;
    }
    return digits;
  }
  function unpackBytes(digits, cBytes) {
    const out = new Uint8Array(cBytes);
    let pos = 0, idx = 0;
    while (idx < cBytes) {
      const b = Math.min(CHUNK_BYTES, cBytes - idx);
      const nd = digitsForBytes(b);
      let x = 0n;
      for (let i = nd - 1; i >= 0; i--) x = x * 5n + BigInt(digits[pos + i] | 0);
      for (let i = b - 1; i >= 0; i--) { out[idx + i] = Number(x & 0xffn); x >>= 8n; }
      pos += nd; idx += b;
    }
    return out;
  }

  /* -------------------------------------------------- Reed–Solomon GF(256) */
  const GF_EXP = new Uint8Array(512), GF_LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();
  const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  const gfInv = a => GF_EXP[255 - GF_LOG[a]];

  const GEN_CACHE = {};
  function rsGenPoly(nsym) {
    if (GEN_CACHE[nsym]) return GEN_CACHE[nsym];
    let g = [1];
    for (let i = 0; i < nsym; i++) {
      const c = GF_EXP[i];                      // 根 = α^i, i = 0..nsym-1
      const ng = new Array(g.length + 1).fill(0);
      for (let j = 0; j <= g.length; j++) {
        let v = 0;
        if (j < g.length) v ^= g[j];
        if (j > 0) v ^= gfMul(c, g[j - 1]);
        ng[j] = v;
      }
      g = ng;
    }
    GEN_CACHE[nsym] = g;
    return g;
  }
  /** 系統化編碼：回傳 [data..., parity...]（高次項在前） */
  function rsEncode(data, nsym) {
    const g = rsGenPoly(nsym);
    const rem = new Uint8Array(nsym);
    for (let di = 0; di < data.length; di++) {
      const factor = data[di] ^ rem[0];
      rem.copyWithin(0, 1); rem[nsym - 1] = 0;
      if (factor !== 0) for (let i = 0; i < nsym; i++) rem[i] ^= gfMul(g[i + 1], factor);
    }
    const out = new Uint8Array(data.length + nsym);
    out.set(data, 0); out.set(rem, data.length);
    return out;
  }
  function rsSyndromes(msg, nsym) {
    const S = new Uint8Array(nsym);
    for (let i = 0; i < nsym; i++) {
      let v = 0;
      for (let j = 0; j < msg.length; j++) v = gfMul(v, GF_EXP[i]) ^ msg[j];
      S[i] = v;
    }
    return S;
  }
  function rsDecode(msgIn, nsym) {
    const msg = Uint8Array.from(msgIn);
    const n = msg.length;
    const S = rsSyndromes(msg, nsym);
    let nonzero = 0; for (let i = 0; i < nsym; i++) nonzero |= S[i];
    if (nonzero === 0) return { ok: true, msg, errors: 0 };
    // Berlekamp–Massey
    const C = new Uint8Array(nsym + 2), B = new Uint8Array(nsym + 2);
    C[0] = 1; B[0] = 1;
    let L = 0, m = 1, b = 1;
    for (let nn = 0; nn < nsym; nn++) {
      let d = S[nn];
      for (let i = 1; i <= L; i++) d ^= gfMul(C[i], S[nn - i]);
      if (d === 0) { m++; continue; }
      const coef = gfMul(d, gfInv(b));
      const T = C.slice();
      for (let i = 0; i < B.length; i++) if (B[i] && i + m < C.length) C[i + m] ^= gfMul(coef, B[i]);
      if (2 * L <= nn) { L = nn + 1 - L; B.set(T); b = d; m = 1; } else m++;
    }
    if (L === 0 || L > (nsym >> 1)) return { ok: false, reason: 'too-many-errors' };
    // Ω(x) = S(x)·Λ(x) mod x^nsym
    const omega = new Uint8Array(nsym);
    for (let i = 0; i < nsym; i++) { let acc = 0; for (let j = 0; j <= i; j++) acc ^= gfMul(C[j], S[i - j]); omega[i] = acc; }
    // 巡根 + Forney
    let cnt = 0;
    for (let j = 0; j < n; j++) {
      const e = (n - 1 - j) % 255;                 // msg[j] 對應 X = α^e
      const X = GF_EXP[e], Xi = GF_EXP[(255 - e) % 255];
      let lam = 0; for (let i = L; i >= 0; i--) lam = gfMul(lam, Xi) ^ C[i];
      if (lam !== 0) continue;
      let num = 0; for (let i = nsym - 1; i >= 0; i--) num = gfMul(num, Xi) ^ omega[i];
      let den = 0;                                  // Λ'(Xi)（特徵 2）
      for (let i = 1; i <= L; i += 2) den ^= gfMul(C[i], gfPow(Xi, i - 1));
      if (den === 0) return { ok: false, reason: 'forney-fail' };
      msg[j] ^= gfMul(gfMul(num, X), gfInv(den));
      cnt++;
    }
    if (cnt !== L) return { ok: false, reason: 'roots-mismatch' };
    const S2 = rsSyndromes(msg, nsym);
    let nz = 0; for (let i = 0; i < nsym; i++) nz |= S2[i];
    if (nz !== 0) return { ok: false, reason: 'syndrome-left' };
    return { ok: true, msg, errors: L };
  }
  function gfPow(a, e) { return e === 0 ? 1 : GF_EXP[(GF_LOG[a] * e) % 255]; }

  /* --------------------------------------------------------------- 糾錯等級 */
  const EC_LEVELS = [
    { key: 'L', name: 'L (低)', frac: 0.25 },
    { key: 'M', name: 'M (中)', frac: 0.35 },
    { key: 'Q', name: 'Q (高)', frac: 0.45 },
    { key: 'H', name: 'H (極高)', frac: 0.55 }
  ];
  function ecPlan(v, ecIdx) {
    const cap = capacityBytes(v);
    const lvl = EC_LEVELS[ecIdx & 3];
    const frac = lvl.frac;
    let ec = 2 * Math.round(cap * frac / 2);
    if (ec < 2) ec = 2;
    if (ec > cap - 1) ec = cap - 1 - ((cap - 1) % 2);
    return { cap, ec, data: cap - ec, t: ec >> 1, key: lvl.key, name: lvl.name };
  }

  /* ------------------------------------------- 缺口長度碼（膠囊弧長度調變） */
  /*  缺口 [0°, 60°] 內安排 4 段： [墨][空][墨][空]，長度皆 ∈ {2,3,4} 格（1 格 = 5°）
   *  總和恰為 12 格 = 60°（因此每一段都與相鄰段無縫相接）
   *  → 19 種組合；前 16 種 = [格式版本 2bit][糾錯等級 2bit]，後 3 種保留給未來格式。
   *  墨段的兩端是圓滑膠囊端帽 → 在影像上「墨」比設計值多 2ψ、「空」少 2ψ，
   *  解碼時以幾何常數 ψ 修正（見 capShadowDeg）。第一位墨段與外框切口相連（護欄段）。*/
  const META_PATTERNS = (function () {
    const out = [], lo = GEO.META_MINW, hi = GEO.META_MAXW;
    for (let a = lo; a <= hi; a++) for (let b = lo; b <= hi; b++) for (let c = lo; c <= hi; c++) for (let d = lo; d <= hi; d++) {
      if (a + b + c + d === GEO.META_MODULES) out.push([a, b, c, d]);
    }
    return out;                                  // 19 組（字典序）
  })();
  function headerEncode(fmt, ecIdx) {
    const index = ((fmt & 3) << 2) | (ecIdx & 3);
    if (index >= 16) return null;
    return { index, fmt: fmt & 3, ecIdx: ecIdx & 3, widths: META_PATTERNS[index].slice(), reserved: false };
  }
  /** widths：實測（已修正端帽）的 4 段長度，單位 = 格 */
  function headerDecode(widths) {
    let best = -1, bestErr = 1e9;
    for (let i = 0; i < META_PATTERNS.length; i++) {
      const p = META_PATTERNS[i];
      let e = 0;
      for (let k = 0; k < 4; k++) { const d = widths[k] - p[k]; e += d * d; }
      if (e < bestErr) { bestErr = e; best = i; }
    }
    if (best < 0) return { ok: false };
    const p = META_PATTERNS[best];
    let exact = true;
    for (let k = 0; k < 4; k++) if (Math.abs(widths[k] - p[k]) > 0.45) exact = false;
    return {
      ok: true, index: best, fmt: best >> 2, ecIdx: best & 3,
      reserved: best >= 16, exact, err: bestErr, widths: p.slice()
    };
  }

  /* ------------------------------------------------ 顏色 / 對比度工具（WCAG） */
  function srgbToLin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function relLum(rgb) { return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]); }
  function contrastRatio(a, b) {
    const l1 = relLum(a), l2 = relLum(b);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  /** 樣式規格 → 色停集合（純色 1 個、漸層 2 個）。spec 可為 [r,g,b] 或 {from,to,alpha} */
  function styleStops(spec, fallback) {
    if (!spec) return [fallback];
    if (Array.isArray(spec)) return [spec];
    if (spec.from && spec.to) return [spec.from, spec.to];
    if (spec.from) return [spec.from];
    return [fallback];
  }
  function styleAlpha(spec, def) {
    if (!spec) return def == null ? 1 : def;
    if (Array.isArray(spec)) return 1;
    return spec.alpha == null ? 1 : spec.alpha;
  }
  /** 最差情況對比（漸層時取兩端的所有配對） */
  function styleContrast(inkSpec, bgSpec, defInk, defBg) {
    const di = defInk || [28, 28, 28], db = defBg || [246, 246, 246];
    const iS = styleStops(inkSpec, di), bS = styleStops(bgSpec, db);
    let worst = null;
    for (const ic of iS) for (const bc of bS) {
      const r = contrastRatio(ic, bc);
      if (!worst || r < worst.ratio) worst = { ratio: r, ink: ic, bg: bc };
    }
    const inkAlpha = styleAlpha(inkSpec, 1), bgAlpha = styleAlpha(bgSpec, 1);
    const cutout = !!(inkSpec && !Array.isArray(inkSpec) && inkSpec.cutout);
    const effective = cutout ? 0 : (inkAlpha < 1 || bgAlpha < 1 ? worst.ratio * Math.min(inkAlpha, 1) : worst.ratio);
    return {
      ratio: worst.ratio, ink: worst.ink, bg: worst.bg, inkAlpha, bgAlpha, cutout,
      transparent: cutout || inkAlpha < 1 || bgAlpha < 1,
      ok: effective >= 4.5, weak: effective >= 3 && effective < 4.5, bad: effective < 3
    };
  }
  /** 把 [r,g,b] 轉 #rrggbb */
  function rgbHex(rgb) { return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }

  const FORMAT = 1;          // 格式版本（保留欄位，目前都是 1）

  /* --------------------------------------------------------------- 編碼器 */
  function toU8(x) {
    if (x instanceof Uint8Array) return x;
    if (Array.isArray(x)) return Uint8Array.from(x);
    if (typeof x === 'string') return utf8Encode(x);
    if (x && x.buffer) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
    throw new Error('不支援的輸入型別');
  }
  function utf8Encode(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    const out = []; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out.push(c & 0xff); } return Uint8Array.from(out);
  }
  function trimZeros(b) { let n = b.length; while (n > 0 && b[n - 1] === 0) n--; return b.subarray(0, n); }
  function utf8Decode(b) {
    try {
      if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8', { fatal: true }).decode(b);
      return decodeURIComponent(b.reduce((s, c) => s + '%' + c.toString(16).padStart(2, '0'), ''));
    } catch (e) { return null; }
  }

  function encode(input, opts) {
    opts = opts || {};
    const bytes = toU8(input);
    const ecIdx = opts.ecLevel == null ? 1 : (opts.ecLevel | 0);
    let v = opts.version ? wrapVersion(opts.version) : 0;
    if (!v) { for (v = GEO.MIN_VERSION; v <= GEO.MAX_VERSION; v++) if (ecPlan(v, ecIdx).data >= bytes.length) break; }
    if (v > GEO.MAX_VERSION) return { ok: false, error: '資料長度超過芝碼最大容量（' + GEO.MAX_VERSION + ' 圈 ' + EC_LEVELS[ecIdx & 3].key + ' 級為 ' + ecPlan(GEO.MAX_VERSION, ecIdx).data + ' bytes）' };
    const plan = ecPlan(v, ecIdx);
    if (bytes.length > plan.data) return { ok: false, error: 'V' + v + ' ' + EC_LEVELS[ecIdx].key + ' 只能存 ' + plan.data + ' bytes' };
    const payload = new Uint8Array(plan.data); payload.set(bytes);
    const codeword = rsEncode(payload, plan.ec);
    const M = totalCells(v);
    const digits = packBytes(codeword, M);
    const cells = [];
    let idx = 0;
    for (let k = 0; k < v; k++) {
      const r = ringRadius(k), n = ringCells(k);
      for (let j = 0; j < n; j++) {
        cells.push({ ring: k, j, n, r, deg: (j + 0.5) * 360 / n, state: digits[idx] });
        idx++;
      }
    }
    const meta = headerEncode(FORMAT, ecIdx);
    return {
      ok: true, format: FORMAT, version: v, rings: v, ecLevel: ecIdx, ecKey: EC_LEVELS[ecIdx].key,
      ecBytes: plan.ec, dataBytes: plan.data, capBytes: plan.cap,
      corrected: plan.t, totalCells: M, usedDigits: packCost(codeword.length),
      cells, digits, codeword, bytes, meta,
      radiusOuter: frameOuter(v), radiusInner: GEO.RI,
      radiusInnerHole: GEO.INNER_RI
    };
  }

  /* ===============================================================
   *                            解碼器
   * =============================================================*/
  const PARAM = {
    maxDim: 1280,
    bins: 720,
    winU: 1.36,            // 取樣窗半徑（單位 u）
    darkRatio: 0.115,      // 判定「有芝麻」的覆蓋率門檻
    minDarkRatio: 0.055,
    thresholdC: 13,
    despeckle: true
  };

  function toGray(img) {
    let { width: w, height: h } = img;
    let g;
    if (img.gray) g = img.gray;
    else {
      const d = img.data;
      g = new Uint8Array(w * h);
      if (d.length >= w * h * 4) for (let i = 0, j = 0; i < w * h; i++, j += 4) g[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
      else if (d.length >= w * h * 3) for (let i = 0, j = 0; i < w * h; i++, j += 3) g[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
      else g = Uint8Array.from(d.slice(0, w * h));
    }
    return { g, w, h };
  }
  function downscale(src, maxDim) {
    const { w, h } = src;
    const m = Math.max(w, h);
    if (m <= maxDim) return src;
    const s = maxDim / m;
    const nw = Math.max(8, Math.round(w * s)), nh = Math.max(8, Math.round(h * s));
    const out = new Uint8Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      const y0 = Math.floor(y * h / nh), y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / nh));
      for (let x = 0; x < nw; x++) {
        const x0 = Math.floor(x * w / nw), x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / nw));
        let s2 = 0, c = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { s2 += src.g[yy * w + xx]; c++; }
        out[y * nw + x] = s2 / c;
      }
    }
    return { g: out, w: nw, h: nh, scale: s };
  }

  function integral(g, w, h) {
    const ii = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) { row += g[y * w + x]; ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + row; }
    }
    return ii;
  }
  function rectSum(ii, w, x0, y0, x1, y1) {
    return ii[(y1) * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0] + ii[y0 * (w + 1) + x0];
  }

  function binarize(src, pol, C, winFactor) {
    const { g, w, h } = src;
    const ii = integral(g, w, h);
    let win = Math.round(Math.min(w, h) * (winFactor == null ? 0.22 : winFactor)); win = Math.max(25, win | 1);
    const r = win >> 1;
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const area = (x1 - x0) * (y1 - y0);
        const m = rectSum(ii, w, x0, y0, x1, y1) / area;
        const v = g[y * w + x];
        mask[y * w + x] = pol === 0 ? (v < m - C ? 1 : 0) : (v > m + C ? 1 : 0);
      }
    }
    return despeckle(mask, w, h);
  }
  function despeckle(mask, w, h) {
    const out = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const s = mask[i - w - 1] + mask[i - w] + mask[i - w + 1] + mask[i - 1] + mask[i] + mask[i + 1] + mask[i + w - 1] + mask[i + w] + mask[i + w + 1];
        out[i] = s >= 5 ? 1 : 0;
      }
    }
    return out;
  }

  /* ---- 連通元件 ---- */
  function labelComponents(mask, w, h, maxLabel) {
    const lab = new Int32Array(w * h);
    const parent = new Int32Array(maxLabel);
    for (let i = 0; i < maxLabel; i++) parent[i] = i;
    function find(a) {
      let r = a;
      for (;;) { const p = parent[r]; if (p === r) break; r = p; }
      while (parent[a] !== r) { const n = parent[a]; parent[a] = r; a = n; }
      return r;
    }
    let _best = 0, _rb = -1;
    function merge(t) {
      if (t > 0 && t !== _best) {
        if (_rb < 0) _rb = find(_best);
        const rt = find(t);
        if (rt !== _rb) parent[rt] = _rb;
      }
    }
    let next = 1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        if (!mask[i]) continue;
        let best = x > 0 ? lab[i - 1] : 0;
        let up = 0;
        if (y > 0) {
          up = lab[i - w];
          if (up > 0 && (best === 0 || up < best)) best = up;
        }
        if (best === 0 && y > 0) {
          if (x > 0) { const ul = lab[i - w - 1]; if (ul > 0) best = ul; }
          if (best === 0 && x < w - 1) { const ur = lab[i - w + 1]; if (ur > 0) best = ur; }
        }
        if (best === 0) {
          if (next >= maxLabel) return null;
          lab[i] = next++;
          continue;
        }
        lab[i] = best;
        if ((x > 0 && lab[i - 1] !== best) || (up !== 0 && up !== best)) {
          _best = best; _rb = -1;
          if (x > 0) merge(lab[i - 1]);
          if (up > 0) merge(up);
          if (x > 0 && y > 0) merge(lab[i - w - 1]);
          if (x < w - 1 && y > 0) merge(lab[i - w + 1]);
        }
      }
    }
    // 壓縮標籤 + 統計
    const map = new Int32Array(next).fill(-1);
    let n = 0;
    for (let l = 1; l < next; l++) { const r = find(l); if (map[r] < 0) map[r] = n++; }
    const stats = [];
    for (let i = 0; i < n; i++) stats.push({ area: 0, sx: 0, sy: 0, minx: 1e9, miny: 1e9, maxx: -1e9, maxy: -1e9 });
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        if (!mask[i]) { lab[i] = -1; continue; }
        const l = map[find(lab[i])]; lab[i] = l; const s = stats[l];
        s.area++; s.sx += x; s.sy += y;
        if (x < s.minx) s.minx = x; if (x > s.maxx) s.maxx = x;
        if (y < s.miny) s.miny = y; if (y > s.maxy) s.maxy = y;
      }
    }
    return { lab, stats, count: n };
  }

  function pickCandidates(cc, w, h) {
    const out = [];
    const imgArea = w * h;
    for (let l = 0; l < cc.count; l++) {
      const s = cc.stats[l];
      const bw = s.maxx - s.minx + 1, bh = s.maxy - s.miny + 1;
      if (bw < 24 || bh < 24) continue;
      if (bw * bh < imgArea * 0.02) continue;
      const asp = bw / bh;
      if (asp < 0.42 || asp > 2.4) continue;
      const fill = s.area / (bw * bh);
      if (fill < 0.04 || fill > 0.62) continue;
      const score = s.area * (1 - Math.min(0.9, Math.abs(Math.log(asp)) * 1.5)) * (fill > 0.35 ? 0.7 : 1);
      out.push({ label: l, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  function collectPixels(cc, w, h, label) {
    const s = cc.stats[label];
    const cap = s.area;
    const px = new Int32Array(cap);
    let n = 0;
    for (let y = s.miny; y <= s.maxy; y++) for (let x = s.minx; x <= s.maxx; x++) {
      const i = y * w + x; if (cc.lab[i] === label) px[n++] = i;
    }
    return px.subarray(0, n);
  }

  /* ---- 邊界包絡 + 傅立葉環形擬合 ---- */
  /** 每個角度格取「最大半徑像素」；回傳含實際角度 */
  function envelope(px, w, bins, cx, cy) {
    const br = new Float64Array(bins).fill(-1);
    const bx = new Int32Array(bins), by = new Int32Array(bins), bt = new Float64Array(bins);
    for (let i = 0; i < px.length; i++) {
      const p = px[i], x = p % w, y = (p / w) | 0;
      const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy;
      let a = Math.atan2(dy, dx); if (a < 0) a += TAU;
      const b = Math.min(bins - 1, (a / TAU * bins) | 0);
      if (r2 > br[b]) { br[b] = r2; bx[b] = x; by[b] = y; bt[b] = a; }
    }
    const out = [];
    for (let b = 0; b < bins; b++) if (br[b] >= 0) out.push({ b, x: bx[b], y: by[b], r: Math.sqrt(br[b]), th: bt[b] });
    return out;
  }

  /** 高斯消去法解 N×N（N ≤ 8） */
  function solveN(A, b) {
    const n = b.length;
    const m = A.map(r => Array.prototype.slice.call(r));
    const v = Array.prototype.slice.call(b);
    for (let i = 0; i < n; i++) {
      let piv = i;
      for (let k = i + 1; k < n; k++) if (Math.abs(m[k][i]) > Math.abs(m[piv][i])) piv = k;
      if (Math.abs(m[piv][i]) < 1e-12) return null;
      const t1 = m[i]; m[i] = m[piv]; m[piv] = t1;
      const t2 = v[i]; v[i] = v[piv]; v[piv] = t2;
      for (let k = i + 1; k < n; k++) {
        const f = m[k][i] / m[i][i];
        if (f === 0) continue;
        for (let j = i; j < n; j++) m[k][j] -= f * m[i][j];
        v[k] -= f * v[i];
      }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = v[i];
      for (let j = i + 1; j < n; j++) s -= m[i][j] * x[j];
      x[i] = s / m[i][i];
    }
    return x;
  }

  /**
   * 環外緣傅立葉擬合：r(θ) = c0 + a1·cosθ + b1·sinθ + a2·cos2θ + b2·sin2θ
   *   一次諧波 (a1,b1) = 圓心偏移；二次諧波 (a2,b2) ⇒ 橢圓半軸差與方位
   */
  function fitRing(pts, fixedCenter) {
    const useFirst = !fixedCenter;
    const nT = useFirst ? 5 : 3;
    const M = [], V = [];
    for (let i = 0; i < nT; i++) { M.push(new Float64Array(nT)); V.push(0); }
    let n = 0;
    for (const p of pts) {
      const c1 = Math.cos(p.th), s1 = Math.sin(p.th), c2 = Math.cos(2 * p.th), s2 = Math.sin(2 * p.th);
      const row = useFirst ? [1, c1, s1, c2, s2] : [1, c2, s2];
      for (let i = 0; i < nT; i++) {
        for (let j = 0; j < nT; j++) M[i][j] += row[i] * row[j];
        V[i] += row[i] * p.r;
      }
      n++;
    }
    if (n < 40) return null;
    const x = solveN(M, V);
    if (!x) return null;
    if (n < 40) return null;
    const c0 = x[0];
    const a1 = useFirst ? x[1] : 0, b1 = useFirst ? x[2] : 0;
    const a2 = useFirst ? x[3] : x[1], b2 = useFirst ? x[4] : x[2];
    const amp = Math.hypot(a2, b2);
    const A = c0 + amp, B = c0 - amp;
    const phi = 0.5 * Math.atan2(b2, a2);
    if (!(B > 4) || amp > c0 * 0.6) return null;
    // 殘差（判斷是否真的接近橢圓）
    let ss = 0;
    for (const p of pts) {
      const pred = useFirst ? (c0 + a1 * Math.cos(p.th) + b1 * Math.sin(p.th) + a2 * Math.cos(2 * p.th) + b2 * Math.sin(2 * p.th))
        : (c0 + a2 * Math.cos(2 * p.th) + b2 * Math.sin(2 * p.th));
      const e = p.r - pred; ss += e * e;
    }
    const resid = Math.sqrt(ss / n);
    return { c0, a1, b1, rMean: c0, A, B, phi, n, resid };
  }

  /* ---- 取樣工具 ---- */
  let _uvCache = null;
  function unitVectors(bins) {
    if (!_uvCache || _uvCache.n !== bins) {
      const c = new Float64Array(bins), sn = new Float64Array(bins);
      for (let b = 0; b < bins; b++) { const t = (b + 0.5) / bins * TAU; c[b] = Math.cos(t); sn[b] = Math.sin(t); }
      _uvCache = { n: bins, c, s: sn };
    }
    return _uvCache;
  }

  function makeMapper(cx, cy, A, B, phi) {
    const cp = Math.cos(phi), sp = Math.sin(phi);
    const m = {
      cx, cy, A, B, phi,
      // 模型直角座標 (u,v) → 影像像素
      toImageUV(ux, uy) {
        const x = A * ux, y = B * uy;
        return { x: cx + cp * x - sp * y, y: cy + sp * x + cp * y };
      },
      // 模型極座標 → 影像像素
      toImage(rho, t) { return this.toImageUV(rho * Math.cos(t), rho * Math.sin(t)); },
      // 影像像素 → 模型座標
      fromImage(x, y) {
        const dx = x - cx, dy = y - cy;
        const rx = cp * dx + sp * dy, ry = -sp * dx + cp * dy;
        return { u: rx / A, v: ry / B };
      },
      scaled(s) { return makeMapper(cx, cy, A * s, B * s, phi); },
      unitScale(u) { return (A + B) / 2 / u; },
      kind: 'ellipse'
    };
    return m;
  }

  /** 一般仿射：image = M·model + t */
  function makeAffineMapper(M, t) {
    const [a, b, c, d] = M;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-9) return null;
    const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
    return {
      M, t, det,
      toImageUV(ux, uy) { return { x: a * ux + b * uy + t[0], y: c * ux + d * uy + t[1] }; },
      toImage(rho, tt) { return this.toImageUV(rho * Math.cos(tt), rho * Math.sin(tt)); },
      fromImage(x, y) {
        const px = x - t[0], py = y - t[1];
        return { u: ia * px + ib * py, v: ic * px + id * py };
      },
      scaled(s) { return makeAffineMapper([a * s, b * s, c * s, d * s], t); },
      unitScale(u) { return Math.sqrt(Math.abs(det)) / u; },
      kind: 'affine'
    };
  }

  /** 每個角度格的最大/最小半徑與其像素座標 */
  function boundaryProfiles(px, w, bins, cx, cy) {
    const p = {
      maxR: new Float64Array(bins).fill(-1), maxX: new Int32Array(bins), maxY: new Int32Array(bins),
      minR: new Float64Array(bins).fill(Infinity), minX: new Int32Array(bins), minY: new Int32Array(bins)
    };
    for (let i = 0; i < px.length; i++) {
      const q = px[i], x = q % w, y = (q / w) | 0;
      const dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy);
      let a = Math.atan2(dy, dx); if (a < 0) a += TAU;
      const b = Math.min(bins - 1, (a / TAU * bins) | 0);
      if (r > p.maxR[b]) { p.maxR[b] = r; p.maxX[b] = x; p.maxY[b] = y; }
      if (r < p.minR[b]) { p.minR[b] = r; p.minX[b] = x; p.minY[b] = y; }
    }
    return p;
  }

  /** 從外緣（最大半徑）剖面尋找缺口：回傳影像空間角度 [startDeg, endDeg) */
  function findBoundaryGap(prof, bins) {
    const vals = [];
    for (let b = 0; b < bins; b++) if (prof.maxR[b] > 0) vals.push(prof.maxR[b]);
    if (vals.length < bins * 0.5) return null;
    vals.sort((a, b) => a - b);
    const med = vals[vals.length >> 1];
    const bad = new Uint8Array(bins);
    for (let b = 0; b < bins; b++) bad[b] = (prof.maxR[b] > 0 && prof.maxR[b] < med * 0.9) ? 1 : (!(prof.maxR[b] > 0) ? 1 : 0);
    // 環狀最長連續段
    let start0 = 0; while (start0 < bins && bad[start0]) start0++;
    if (start0 === bins) return null;
    let best = null, run = 0;
    for (let k = 0; k <= bins; k++) {
      const idx = (start0 + k) % bins;
      const isBad = k < bins ? bad[idx] : 0;
      if (isBad) run++;
      else {
        if (run > 0) {
          const endIdx = (start0 + k - 1 + bins) % bins;
          const startIdx = (start0 + k - run + bins * 2) % bins;
          const deg = run / bins * 360;
          if (deg > 4 && deg < 40 && (!best || run > best.len)) best = { start: startIdx, end: endIdx, len: run, startDeg: startIdx / bins * 360, endDeg: (endIdx + 1) / bins * 360 };
        }
        run = 0;
      }
    }
    return best;
  }

  /**
   * 以「同心模型圓」擬合平面單應矩陣（可精確處理透視）。
   * 殘差 = 邊界點投影回模型座標後的相對徑向誤差 (|q| - R) / R，用 LM 迭代求解。
   * 同心多圓（外框外緣／外框內緣／內框）可固定所有自由度（僅剩模型自身旋轉，
   * 該自由度由後續「缺口方向」搜尋決定）。
   */
  function fitHomographyFromProfiles(sets, H0, iters) {
    // ---- 收集點 ----
    const px2 = [], py2 = [], RR = [];
    for (const st of sets) {
      const p = st.profile;
      for (let b = 0; b < st.bins; b++) {
        const r = st.which === 'max' ? p.maxR[b] : p.minR[b];
        if (!(r > 0) || !isFinite(r)) continue;
        px2.push(st.which === 'max' ? p.maxX[b] : p.minX[b]);
        py2.push(st.which === 'max' ? p.maxY[b] : p.minY[b]);
        RR.push(st.radius);
      }
    }
    const N = px2.length;
    if (N < 40) return null;

    // ---- Hartley 正規化（穩定 DLT/LM 的關鍵） ----
    let mx = 0, my = 0;
    for (let i = 0; i < N; i++) { mx += px2[i]; my += py2[i]; }
    mx /= N; my /= N;
    let dsum = 0;
    for (let i = 0; i < N; i++) dsum += Math.hypot(px2[i] - mx, py2[i] - my);
    const sc = Math.max(1e-6, dsum / N / Math.SQRT2);
    const xs = new Float64Array(N), ys = new Float64Array(N), Rs = new Float64Array(N);
    for (let i = 0; i < N; i++) { xs[i] = (px2[i] - mx) / sc; ys[i] = (py2[i] - my) / sc; Rs[i] = RR[i]; }

    // H_n = T · H0，T = 正規化矩陣
    const T = [1 / sc, 0, -mx / sc, 0, 1 / sc, -my / sc, 0, 0, 1];
    const h0n = mul3(T, H0);
    if (!h0n) return null;
    let hy = Float64Array.from(h0n);

    const residVec = (h, out) => {
      const m = invert3h(h);
      if (!m) return false;
      let ss = 0;
      for (let i = 0; i < N; i++) {
        const w = m[6] * xs[i] + m[7] * ys[i] + m[8];
        if (Math.abs(w) < 1e-9) { out[i] = 5; ss += 25; continue; }
        const u = (m[0] * xs[i] + m[1] * ys[i] + m[2]) / w;
        const v = (m[3] * xs[i] + m[4] * ys[i] + m[5]) / w;
        const r = (Math.hypot(u, v) - Rs[i]) / Rs[i];
        out[i] = r; ss += r * r;
      }
      return true;
    };
    const rin = new Float64Array(N), rtmp = new Float64Array(N), wt = new Float64Array(N);
    if (!residVec(hy, rin)) return null;
    let cost = 0; for (let i = 0; i < N; i++) { wt[i] = 1; cost += rin[i] * rin[i]; }
    let lambda = 1e-3;
    let resid = Math.sqrt(cost / N);
    const hTry = new Float64Array(9);
    let accepted = 0;
    for (let iter = 0; iter < iters; iter++) {
      // 穩健權重（Tukey biweight，以中位數絕對偏差為尺度）
      const absr = Array.from(rin, Math.abs).sort((a, b) => a - b);
      const med = absr[absr.length >> 1] || 1e-6;
      const sigma = Math.max(1e-5, med * 4.685 * 1.4826 / 1.4826);
      for (let i = 0; i < N; i++) {
        const u = rin[i] / sigma;
        wt[i] = Math.abs(u) < 1 ? (1 - u * u) * (1 - u * u) : 0;
        if (wt[i] < 1e-4) wt[i] = 1e-4;
      }
      // 數值 Jacobian
      const J = [];
      for (let i = 0; i < N; i++) J.push(new Float64Array(8));
      for (let k = 0; k < 8; k++) {
        const step = Math.max(1e-7, Math.abs(hy[k]) * 1e-6);
        for (let i = 0; i < 9; i++) hTry[i] = hy[i];
        hTry[k] += step;
        if (!residVec(hTry, rtmp)) return null;
        for (let i = 0; i < N; i++) J[i][k] = (rtmp[i] - rin[i]) / step;
      }
      const A = [], g = new Float64Array(8);
      for (let i = 0; i < 8; i++) A.push(new Float64Array(8));
      for (let i = 0; i < N; i++) {
        const Ji = J[i], w2 = wt[i];
        for (let a2 = 0; a2 < 8; a2++) {
          if (Ji[a2] === 0) continue;
          for (let b2 = a2; b2 < 8; b2++) A[a2][b2] += w2 * Ji[a2] * Ji[b2];
          g[a2] += w2 * Ji[a2] * rin[i];
        }
      }
      for (let a2 = 0; a2 < 8; a2++) for (let b2 = 0; b2 < a2; b2++) A[a2][b2] = A[b2][a2];
      // Marquardt 尺度：以對角線縮放
      let acc2 = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        const Ad = A.map(r => Float64Array.from(r));
        for (let a2 = 0; a2 < 8; a2++) Ad[a2][a2] += lambda * (A[a2][a2] + 1e-9);
        const gneg = new Float64Array(8);
        for (let i = 0; i < 8; i++) gneg[i] = -g[i];
        const delta = solveN(Ad, gneg);
        if (!delta) { lambda *= 10; continue; }
        for (let i = 0; i < 9; i++) hTry[i] = hy[i];
        for (let i = 0; i < 8; i++) hTry[i] += delta[i];
        let cost2 = 0;
        if (residVec(hTry, rtmp)) { for (let i = 0; i < N; i++) cost2 += wt[i] * rtmp[i] * rtmp[i]; }
        else cost2 = Infinity;
        if (cost2 < cost) {
          cost = cost2; hy.set(hTry); rin.set(rtmp);
          lambda = Math.max(1e-9, lambda * 0.4);
          resid = Math.sqrt(cost / N);
          accepted++;
          acc2 = true;
          break;
        }
        lambda *= 10;
      }
      if (!acc2) break;
      if (resid < 1e-4 || accepted > iters) break;
    }
    // 轉回原座標：H = T⁻¹ · H_n
    const Tinv = [sc, 0, mx, 0, sc, my, 0, 0, 1];
    const H = mul3(Tinv, Array.from(hy));
    if (!H) return null;
    const m = invert3h(H);
    if (!m) return null;
    // 像素殘差
    let ss2 = 0, n2 = 0, inliers = 0;
    for (let i = 0; i < N; i++) {
      const w = m[6] * px2[i] + m[7] * py2[i] + m[8];
      if (Math.abs(w) < 1e-9) continue;
      const u = (m[0] * px2[i] + m[1] * py2[i] + m[2]) / w;
      const v = (m[3] * px2[i] + m[4] * py2[i] + m[5]) / w;
      const rr = (Math.hypot(u, v) - RR[i]) / RR[i];
      if (Math.abs(rr) < 0.05) inliers++;
      ss2 += rr * rr; n2++;
    }
    if (!n2) return null;
    const relResid = Math.sqrt(ss2 / n2);
    const mapT = makeHomographyMapper(H);
    const pxResid = mapT ? relResid * sets[0].radius * (mapT.unitScale(1) * 1) : Infinity;
    return { H, resid: relResid, pxResid, points: N, inlierRatio: inliers / n2 };
  }

  /** 3×3 矩陣相乘（列優先、最後一個元素為 1 的齊次矩陣） */
  function mul3(A, B) {
    const C = new Float64Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j];
        C[i * 3 + j] = s;
      }
    }
    if (Math.abs(C[8]) < 1e-12) return null;
    const z = C[8];
    for (let i = 0; i < 9; i++) C[i] /= z;
    return Array.from(C);
  }

  function invert3h(h) { return invert3(h); }

  function invert3(h) {
    const [a, b, c, d, e, f, g2, i, j] = h;
    const det = a * (e * j - f * i) - b * (d * j - f * g2) + c * (d * i - e * g2);
    if (!isFinite(det) || Math.abs(det) < 1e-12) return null;
    return [
      (e * j - f * i) / det, -(b * j - c * i) / det, (b * f - c * e) / det,
      -(d * j - f * g2) / det, (a * j - c * g2) / det, -(a * f - c * d) / det,
      (d * i - e * g2) / det, -(a * i - b * g2) / det, (a * e - b * d) / det
    ];
  }

  /** 橢圓/仿射 mapper → 3×3 單應矩陣 */
  function mapperToH(map) {
    if (map.kind === 'ellipse') {
      const cp = Math.cos(map.phi), sp = Math.sin(map.phi);
      return [map.A * cp, -map.B * sp, map.cx, map.A * sp, map.B * cp, map.cy, 0, 0, 1];
    }
    if (map.kind === 'affine') {
      const [a, b, c, d] = map.M;
      return [a, b, map.t[0], c, d, map.t[1], 0, 0, 1];
    }
    if (map.kind === 'homography') return map.H.slice();
    return null;
  }

  /** 由 3×3 單應矩陣建立 mapper */
  function makeHomographyMapper(H) {
    const [a, b, c, d, e, f, g, i, j] = H;   // 最後一個為 1
    const det3 = a * (e * j - f * i) - b * (d * j - f * g) + c * (d * i - e * g);
    if (!isFinite(det3) || Math.abs(det3) < 1e-12) return null;
    // 反矩陣
    const m = [
      (e * j - f * i), -(b * j - c * i), (b * f - c * e),
      -(d * j - f * g), (a * j - c * g), -(a * f - c * d),
      (d * i - e * g), -(a * i - b * g), (a * e - b * d)
    ].map(v => v / det3);
    return {
      kind: 'homography', H,
      toImageUV(u, v) {
        const w = g * u + i * v + j;
        return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
      },
      toImage(rho, t) { return this.toImageUV(rho * Math.cos(t), rho * Math.sin(t)); },
      fromImage(x, y) {
        const w = m[6] * x + m[7] * y + m[8];
        return { u: (m[0] * x + m[1] * y + m[2]) / w, v: (m[3] * x + m[4] * y + m[5]) / w };
      },
      scaled(s) { return this; },   // 單應矩陣不可任意縮放（尺度已由模型座標定義）
      unitScale(u) {
        // 模型座標為「正規化」（1.0 = 外框外緣）；u 為外框外緣的碼元半徑
        const p0 = this.toImageUV(0, 0), p1 = this.toImageUV(0.05, 0), p2 = this.toImageUV(0, 0.05);
        const s = (Math.hypot(p1.x - p0.x, p1.y - p0.y) + Math.hypot(p2.x - p0.x, p2.y - p0.y)) / (2 * 0.05);
        return s / u;
      }
    };
  }

  /** 以邊界包絡點對「單位圓 → 外緣橢圓」做仿射最小平方擬合（可吸收剪切/透視） */
  function refineAffine(px, w, bins, cx, cy, map0, keepPts) {
    let map = map0;
    let M = [map.A * Math.cos(map.phi), -map.B * Math.sin(map.phi), map.A * Math.sin(map.phi), map.B * Math.cos(map.phi)];
    let t = [cx, cy];
    for (let iter = 0; iter < 3; iter++) {
      const am = makeAffineMapper(M, t);
      if (!am) return null;
      const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], Tx = [0, 0, 0], Ty = [0, 0, 0];
      let cnt = 0;
      for (const p of keepPts) {
        const q = am.fromImage(p.x, p.y);
        const nrm = Math.hypot(q.u, q.v);
        if (!(nrm > 1e-6)) continue;
        if (Math.abs(nrm - 1) > 0.22) continue;          // 只取外緣附近的點
        const qx = q.u / nrm, qy = q.v / nrm;
        const xs = [qx, qy, 1];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) S[i][j] += xs[i] * xs[j];
          Tx[i] += xs[i] * p.x; Ty[i] += xs[i] * p.y;
        }
        cnt++;
      }
      if (cnt < 60) return null;
      const sx = solveN(S, Tx), sy = solveN(S, Ty);
      if (!sx || !sy) return null;
      M = [sx[0], sx[1], sy[0], sy[1]];
      t = [sx[2], sy[2]];
      // 合理性檢查
      const det = M[0] * M[3] - M[1] * M[2];
      if (!isFinite(det) || Math.abs(det) < 1e-6) return null;
      const ratio = (Math.hypot(M[0], M[2]) + Math.hypot(M[1], M[3])) / (2 * Math.sqrt(Math.abs(det)));
      if (ratio > 1.6) return null;
    }
    return { M, t };
  }

  function sampleMask(mask, w, h, x, y) {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= w || yi >= h) return 0;
    return mask[yi * w + xi];
  }

  /* ---- 主解碼流程 ---- */
  function decodeImage(img, optsIn) {
    const opts = Object.assign({}, PARAM, optsIn || {});
    if (opts.debug) {
      opts._dbg = opts._dbg || [];
      opts._dbgLast = opts._dbgLast || {};
      if (optsIn) { optsIn._dbg = opts._dbg; optsIn._dbgLast = opts._dbgLast; }
    }
    const t0 = nowMs();
    const gray = toGray(img);
    const notes = [];
    const srcCache = new Map();
    const srcAt = (md) => { if (!srcCache.has(md)) srcCache.set(md, downscale(gray, md)); return srcCache.get(md); };

    /* 嘗試清單（第一段固定為「快」的組合）：
     *  1. 兩種自適應視窗 × 兩種極性 —— 預設 0.22×短邊可容忍漸層，但「貼在亮背景上
     *     的深色底盤」會在邊緣產生厚假環，此時 0.10×短邊可讓真紋樣浮出。
     *  2. （可選）放大重試：原圖比 maxDim 大時，用更高解析度再掃一次 ——
     *     高圈數芝碼的格點很小，這一步往往是成功關鍵。
     *  3. （可選）門檻掃描：thresholdC ±5，處理低對比或逆光。
     * 動態掃描（攝影機）請設 ladder:false，只跑第 1 段以維持即時性。 */
    const attempts = [];
    for (const wf of [0.22, 0.10]) for (const pol of [0, 1]) attempts.push({ wf, pol, md: opts.maxDim, C: opts.thresholdC });
    if (opts.ladder !== false) {
      const native = Math.max(img.width || 0, img.height || 0);
      const big = Math.min(opts.ladderMax || 2048, native);
      if (big > opts.maxDim) for (const wf of [0.22, 0.10]) for (const pol of [0, 1]) attempts.push({ wf, pol, md: big, C: opts.thresholdC });
      for (const dC of [-5, 5]) for (const pol of [0, 1]) attempts.push({ wf: 0.22, pol, md: Math.max(opts.maxDim, big), C: opts.thresholdC + dC });
    }
    let n = 0;
    for (const at of attempts) {
      if (n > 0 && opts.timeBudget && nowMs() - t0 > opts.timeBudget) { notes.push('time-budget'); break; }
      n++;
      const src = srcAt(at.md);
      const mask = binarize(src, at.pol, at.C, at.wf);
      const r = decodeMask(mask, src, at.pol, opts);
      if (r.ok) { r.stats.ms = nowMs() - t0; r.stats.win = at.wf; r.stats.attempt = n; r.stats.maxDim = at.md; return r; }
      if (opts._dbg) opts._dbg.push({ win: at.wf, pol: at.pol, C: at.C, maxDim: at.md, reason: r.reason });
      notes.push(r.reason || 'unknown');
    }
    const o = { ok: false, error: '無法解析：' + notes.slice(0, 6).join(' / '), stats: { ms: nowMs() - t0, attempts: n } };
    if (opts._dbg) { o.reasons = opts._dbg; o.notes = notes; }
    return o;
  }

  function decodeMask(mask, src, pol, opts) {
    const { w, h } = src;
    const cc = labelComponents(mask, w, h, 300000);
    if (!cc) return { ok: false, reason: '元件過多' };
    const cands = pickCandidates(cc, w, h);
    if (!cands.length) return { ok: false, reason: '找不到外框環' };
    for (let ci = 0; ci < Math.min(cands.length, 5); ci++) {
      const res = tryCandidate(mask, src, cc, cands[ci].label, pol, opts);
      if (res.ok) return res;
    }
    return { ok: false, reason: '外框找到但無法解出(' + cands.length + '候選)' };
  }

  /** 環狀暗段（跨接縫合併）：回傳 [{start, len}]，單位 = 格 */
  function cyclicRuns(seq, n) {
    const out = [];
    let s0 = -1;
    for (let i = 0; i < n; i++) {
      if (seq[i]) { if (s0 < 0) s0 = i; }
      else if (s0 >= 0) { out.push({ start: s0, len: i - s0 }); s0 = -1; }
    }
    if (s0 >= 0) {
      if (out.length && out[0].start === 0) { out[0].start = s0; out[0].len += n - s0; }
      else out.push({ start: s0, len: n - s0 });
    }
    return out;
  }

  function tryCandidate(mask, src, cc, label, pol, opts) {
    const { w, h } = src;
    const st = cc.stats[label];
    const px = collectPixels(cc, w, h, label);
    if (px.length < 400) return { ok: false, reason: 'blob-too-small' };

    /* ---- 迭代求圓心 + 外緣橢圓擬合（傅立葉諧波） ---- */
    let cx = (st.minx + st.maxx) / 2, cy = (st.miny + st.maxy) / 2;
    let fit = null, keep = null;
    for (let it = 0; it < 6; it++) {
      const pts = envelope(px, w, opts.bins, cx, cy);
      if (pts.length < 60) return { ok: false, reason: 'envelope-fail' };
      const rs = pts.map(p => p.r).sort((a, b) => a - b);
      const med = rs[rs.length >> 1];
      keep = pts.filter(p => p.r > med * 0.9 && p.r < med * 1.25);
      if (keep.length < 40) return { ok: false, reason: 'envelope-unstable' };
      fit = fitRing(keep, false);
      if (!fit) return { ok: false, reason: 'ellipse-fit-fail' };
      cx += fit.a1; cy += fit.b1;
      if (Math.hypot(fit.a1, fit.b1) < 0.25) break;
    }
    let { A, B, phi, rMean } = fit;
    if (!(A > 10 && B > 10)) return { ok: false, reason: 'too-small' };
    if (A / B > 1.9 || B / A > 1.9) return { ok: false, reason: 'too-skewed' };
    if (fit.resid > fit.c0 * 0.10) return { ok: false, reason: 'not-ring-like' };

    /* ---- 縮放/傾斜不變特徵：逐角度「環內緣/環外緣」半徑比 ---- */
    const ptsF = envelope(px, w, opts.bins, cx, cy);
    const minR = new Float64Array(opts.bins).fill(Infinity);
    for (let i = 0; i < px.length; i++) {
      const p = px[i], x = p % w, y = (p / w) | 0;
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
      let a = Math.atan2(dy, dx); if (a < 0) a += TAU;
      const b = Math.min(opts.bins - 1, (a / TAU * opts.bins) | 0);
      if (r < minR[b]) minR[b] = r;
    }
    const maxR = new Float64Array(opts.bins).fill(0);
    for (const p of ptsF) { const b = p.b; if (p.r > maxR[b]) maxR[b] = p.r; }
    const ratios = [];
    for (let b = 0; b < opts.bins; b++) if (isFinite(minR[b]) && maxR[b] > 0) ratios.push(minR[b] / maxR[b]);
    if (ratios.length < 40) return { ok: false, reason: 'no-inner-edge' };
    ratios.sort((a, b) => a - b);
    const rimRatio = ratios[ratios.length >> 1];       // ≈ frameInner/frameOuter

    /* ---- 內框圓環（同軸；其圓心為無偏估計，外半徑 = RI） ---- */
    const KIN = GEO.INNER_RI / GEO.RI;                 // 內孔/外緣半徑比（固定常數）
    let inR = null, inCx = null, inCy = null, inLabel = -1, inArea = 0;
    for (let l = 0; l < cc.count; l++) {
      if (l === label) continue;
      const s2 = cc.stats[l];
      if (s2.area < 40) continue;
      const bw = s2.maxx - s2.minx + 1, bh = s2.maxy - s2.miny + 1;
      const fill = s2.area / (bw * bh);
      if (fill < 0.26 || fill > 0.72) continue;        // 環形 ≈ 0.47；實心圓 ≈ 0.78
      const sx = s2.sx / s2.area, sy = s2.sy / s2.area;
      if (Math.hypot(sx - cx, sy - cy) > rMean * 0.32) continue;
      const ro = Math.sqrt(s2.area / (Math.PI * (1 - KIN * KIN)));   // 由面積反推外半徑
      if (ro > rMean * 0.55 || ro < rMean * 0.05) continue;
      const af = s2.area / (rMean * rMean);
      if (af < 0.02 || af > 0.20) continue;
      if (inR === null || s2.area > inArea) { inR = ro; inCx = sx; inCy = sy; inLabel = l; inArea = s2.area; }
    }
    let inPx = null;
    if (inR) {
      inPx = collectPixels(cc, w, h, inLabel);
      cx = inCx; cy = inCy;                             // 內框圓心更可信
      const pts2 = envelope(px, w, opts.bins, cx, cy);
      const rs2 = pts2.map(p => p.r).sort((a, b) => a - b);
      const med2 = rs2[rs2.length >> 1];
      const kp = pts2.filter(p => p.r > med2 * 0.9 && p.r < med2 * 1.25);
      const f2 = fitRing(kp, true);
      if (f2 && f2.A > 10 && f2.A / f2.B < 1.95 && f2.B / f2.A < 1.95) {
        fit = f2; keep = kp; A = f2.A; B = f2.B; phi = f2.phi; rMean = f2.rMean;
      }
    }

    /* ---- 圈數候選：由「內緣/外緣比」排序（與縮放、傾斜無關，非版本號）
     * 兩個獨立的無尺度估計：外框環的 minR/maxR，以及內框外緣半徑 / 外框半徑。
     * 兩者合併可降低低解析度下的二值化偏差，讓圈數排序更穩（高圈數時差距僅 ~0.0026）。 */
    const inRatio = (inR && rMean > 0) ? inR / rMean : null;
    const ringOrder = [];
    for (let v = GEO.MIN_VERSION; v <= GEO.MAX_VERSION; v++) {
      const e1 = Math.abs(rimRatio - frameInner(v) / frameOuter(v));
      const e2 = inRatio != null ? Math.abs(inRatio - GEO.RI / frameOuter(v)) : 0;
      ringOrder.push({ v, err: e1 + 0.6 * e2, e1, e2 });
    }
    ringOrder.sort((a, b) => a.err - b.err);
    const v0 = ringOrder[0].v;
    if (opts._dbg) opts._dbg.push({
      stage: 'rings', rimRatio: +rimRatio.toFixed(4), rMean: +rMean.toFixed(1),
      inR: inR && +inR.toFixed(1), order: ringOrder.map(o => 'r' + o.v + ':' + o.err.toFixed(3)).join(' ')
    });
    /* 低解析度下「內外緣比」會有系統偏差（實測偏差可達 0.02），因此不硬篩選，
     * 只依可能性排序；裁切窗口隨「候選間距」自適應，最多試 6 個圈數 ——
     * 高圈數時相鄰圈數的比值只差 ~0.0026，太多候選只會拖慢而無助於正確率。*/
    const gap01 = ringOrder.length > 1 ? Math.abs(ringOrder[1].err - ringOrder[0].err) : 0.01;
    const cut = Math.min(0.026, Math.min(0.020, ringOrder[0].err + Math.max(0.005, Math.min(0.013, 2.5 * gap01))));
    let tryVersions = ringOrder.filter(o => o.err <= cut).map(o => o.v).slice(0, 6);
    for (const dv of [0, -1, 1]) {
      const vv = v0 + dv;
      if (vv >= GEO.MIN_VERSION && vv <= GEO.MAX_VERSION && tryVersions.indexOf(vv) < 0) tryVersions.push(vv);
    }
    tryVersions = tryVersions.slice(0, 7);
    if (!tryVersions.length) tryVersions.push(v0);
    const allRings = ringOrder.map(o => o.v);

    const uScale = rMean / frameOuter(v0);
    const dbgInfo = {
      inR, rMean, A, B, phi, cx, cy, label, pol, uScale, v0, rimRatio,
      inCx, inCy, els: keep.length, fitResid: fit.resid / fit.c0
    };
    if (!(uScale > 1.5)) return { ok: false, reason: 'scale-too-small' };

    const map0 = makeMapper(cx, cy, A, B, phi);

    /* ---- 第一輪：橢圓模型（含角度微調與尺度微調） ---- */
    let lastReason = 'no-hypothesis';
    const search = (map, mirrorList, scaleList, ringList) => {
      const sl = scaleList || [1, 0.985, 1.015];
      for (const v of (ringList || allRings)) {
        for (const dg of [0, -0.5, 0.5, -1.0, 1.0, -1.6, 1.6]) {
          for (const sc of sl) {
            for (const mir of mirrorList) {
              const res = tryHypothesis(mask, src, map, cx, cy, dg * (mir ? -1 : 1), mir, v, opts, dbgInfo, sc);
              if (res.ok) return res;
              lastReason = res.reason || lastReason;
            }
          }
        }
      }
      return null;
    };
    let res = search(map0, [false]);
    if (res) return res;

    /* ---- 第二輪：單應（透視）精修（逐圈數擬合，因外框內緣半徑依賴圈數） ---- */
    if (opts.refine !== false) {
      const profFrame = boundaryProfiles(px, w, opts.bins, cx, cy);
      const profIn = inPx ? boundaryProfiles(inPx, w, opts.bins, cx, cy) : null;
      const rotM = (deg) => { const t = deg * D2R, c = Math.cos(t), sn = Math.sin(t); return [c, -sn, 0, sn, c, 0, 0, 0, 1]; };
      const flipM = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
      const gap = findBoundaryGap(profFrame, opts.bins);
      if (gap && opts._dbg) opts._dbg.push({ stage: 'gap', startDeg: +gap.startDeg.toFixed(1), endDeg: +gap.endDeg.toFixed(1), len: gap.len });
      const uEst = (A + B) / 2;                    // px / 正規化半徑
      const gate = Math.max(12, 0.045 * rMean);
      const tried = [];
      const ordered = tryVersions.concat(allRings.filter(v => tryVersions.indexOf(v) < 0));
      for (const vC of ordered) {
        const R6v = frameOuter(vC);
        const sets = [
          { profile: profFrame, which: 'max', radius: 1, bins: opts.bins },
          { profile: profFrame, which: 'min', radius: frameInner(vC) / R6v, bins: opts.bins }
        ];
        if (profIn) sets.push({ profile: profIn, which: 'max', radius: GEO.RI / R6v, bins: opts.bins });
        const h0s = [];
        if (inR) { const ud = inR / (GEO.RI / R6v); h0s.push([ud, 0, cx, 0, ud, cy, 0, 0, 1]); }
        h0s.push([uEst, 0, cx, 0, uEst, cy, 0, 0, 1]);
        let best = null;
        for (const h0 of h0s) {
          const fh = fitHomographyFromProfiles(sets, h0, 26);
          if (fh && (!best || fh.pxResid < best.pxResid)) best = fh;
          if (best && best.pxResid < 1.0) break;
        }
        tried.push('r' + vC + ':' + (best ? best.pxResid.toFixed(1) + '/' + best.inlierRatio.toFixed(2) : 'x'));
        if (!best || best.pxResid > gate || best.inlierRatio < 0.75) continue;
        const mapH0 = makeHomographyMapper(best.H);
        if (!mapH0) continue;
        const cands = [];
        if (gap) {
          const Hstart = mul3(best.H, rotM(gap.startDeg));
          const Hend = mul3(best.H, rotM(gap.endDeg));
          if (Hstart) { const m = makeHomographyMapper(Hstart); if (m) cands.push(m); }
          if (Hend) { const Hm = mul3(Hend, flipM); if (Hm) { const m = makeHomographyMapper(Hm); if (m) cands.push(m); } }
        }
        cands.push(mapH0);
        for (const mapH of cands) {
          for (const vC2 of [vC, vC - 1, vC + 1]) {
            if (vC2 < GEO.MIN_VERSION || vC2 > GEO.MAX_VERSION) continue;
            for (const dg of [0, -0.6, 0.6, -1.2, 1.2]) {
              const r = tryHypothesis(mask, src, mapH, cx, cy, dg, false, vC2, opts, dbgInfo, 1);
              if (r.ok) { r.refined = 'homography'; r.fitPx = best.pxResid; r.fitRings = vC; return r; }
              lastReason = r.reason || lastReason;
            }
          }
        }
      }
      if (opts._dbg) opts._dbg.push({ stage: 'fit-tries', tried: tried.join(' ') });
    }

    /* ---- 第三輪：仿射精修 ---- */
    if (opts.refine !== false && keep) {
      const af = refineAffine(px, w, opts.bins, cx, cy, map0, keep);
      const am = af ? makeAffineMapper(af.M, af.t) : null;
      if (am) {
        for (const mir of [false]) {
          for (const v of tryVersions) {
            for (const dg of [0, -0.5, 0.5, -1.0, 1.0]) {
              for (const sc of [1, 0.985, 1.015]) {
                const rr = tryHypothesis(mask, src, am, cx, cy, dg * (mir ? -1 : 1), mir, v, opts, dbgInfo, sc);
                if (rr.ok) { rr.refined = 'affine'; return rr; }
              }
            }
          }
        }
      }
    }

    /* ---- 第四輪：鏡像（翻面/鏡頭反向） ---- */
    res = search(map0, [true]);
    if (res) return res;

    return { ok: false, reason: lastReason };
  }

  function tryHypothesis(mask, src, mapIn, cx, cy, dbg, mirror, v, opts, dbgInfo, sc) {
    const { w, h } = src;
    const map = (sc && sc !== 1) ? mapIn.scaled(sc) : mapIn;
    const R6u = frameOuter(v);
    const uScale = map.unitScale(R6u);          // px / u（平均）
    const R_ = (msg) => { if (opts._dbg) opts._dbg.push({ rings: v, dbg: +dbg.toFixed(2), mirror, sc, reason: msg }); return { ok: false, reason: msg }; };
    if (!(uScale > 2)) return R_('unit-too-small');

    /* ---- 尺度自我一致性：內框外半徑（由面積反推）應等於 RI ---- */
    if (dbgInfo.inR != null) {
      const rr = dbgInfo.inR / (GEO.RI * uScale);        // 期望 ≈ 1
      if (rr < 0.66 || rr > 1.44) return R_('inner-scale(' + rr.toFixed(2) + ')');
    }
    if (dbgInfo.rimRatio != null && dbgInfo.rimRatio > 0 && map.kind !== 'homography') {
      const exp = frameInner(v) / frameOuter(v);
      if (Math.abs(dbgInfo.rimRatio - exp) > 0.028) return R_('ring-ratio(' + dbgInfo.rimRatio.toFixed(3) + 'vs' + exp.toFixed(3) + ')');
    }

    /* ---- 讀外框環：取樣環帶 → 環狀暗段 → 解析長度碼 ---- */
    const bins = opts.bins;
    const rhoMid = metaMid(v) / R6u;
    const halfB = (GEO.CAP_R - 0.35) / R6u;
    const uv = unitVectors(bins);
    const dark = new Uint8Array(bins);
    for (let b = 0; b < bins; b++) {
      const ct = uv.c[b], st = uv.s[b];
      let s2 = 0;
      for (const kk of [-0.7, 0, 0.7]) {
        const rr = rhoMid + kk * halfB;
        const p = map.toImageUV(rr * ct, rr * st);
        s2 += sampleMask(mask, w, h, p.x, p.y);
      }
      dark[b] = s2 * 2 >= 3 ? 1 : 0;
    }
    const runs = cyclicRuns(dark, bins);
    if (runs.length < 2) return R_('frame-runs' + runs.length);
    let big = runs[0];
    for (const r of runs) if (r.len > big.len) big = r;

    const N = (x) => ((x % bins) + bins) % bins;
    const psiB = metaPsi(v) * bins / 360;                        // 端帽角展（格）
    const moduleB = GEO.HEADER_DEG / GEO.META_MODULES * bins / 360;  // 1 格 = 5°
    const notchB = GEO.HEADER_DEG * bins / 360;                  // 60°
    const endBig = N(big.start + big.len);

    /* 缺口內的墨段（應恰好一段，取最大者） */
    const x0 = endBig;                                           // 墨段側起點（護欄段末端）
    const x1 = big.start;                                        // 缺口另一端（外框本體起點）
    const spanEmpty = N(x1 - x0);
    let meta = null;
    for (const r of runs) {
      if (r === big) continue;
      const p = N(r.start - x0);
      if (p <= 0 || p + r.len >= spanEmpty) continue;             // 必須整個落在缺口內
      if (!meta || r.len > meta.len) meta = r;
    }
    if (!meta) return R_('no-meta-ink');

    let baseBins, a, bW, cW, dW;
    if (!mirror) {
      baseBins = N(big.start + psiB - notchB);                    // 設計 0°
      a = (N(endBig - baseBins) - psiB) / moduleB;
      bW = (N(meta.start - baseBins) + psiB) / moduleB - a;
      cW = (meta.len - 2 * psiB) / moduleB;
      dW = (N(big.start - (meta.start + meta.len)) + 2 * psiB) / moduleB;
    } else {
      baseBins = N(endBig + notchB);                              // 設計 0°
      a = (N(baseBins - big.start) - psiB) / moduleB;
      dW = (N(meta.start - endBig) + psiB) / moduleB;
      cW = (meta.len - 2 * psiB) / moduleB;
      bW = (N(big.start - (meta.start + meta.len)) + 2 * psiB) / moduleB;
    }
    /* 端帽（及二值化）造成的系統性膨脹 ε：實測值 = 真值 + [−ε, +2ε, −2ε, +2ε]。
     * 令 ε 為自由參數掃描，並以「總和必須等於 12 格」自行修正。 */
    const w0 = [a, bW, cW, dW];
    let hdr = null, widths = w0;
    const epsList = [0, (w0[0] + w0[1] + w0[2] + w0[3]) - GEO.META_MODULES, 0.06, -0.06, 0.12, -0.12, 0.2, -0.2];
    for (const eps of epsList) {
      const w = [w0[0] + eps, w0[1] - 2 * eps, w0[2] + 2 * eps, w0[3] - 2 * eps];
      const h = headerDecode(w);
      if (h.ok && h.exact && (!hdr || h.err < hdr.err)) { hdr = h; widths = w; }
      if (hdr && hdr.err < 0.04) break;
    }
    if (!hdr) return R_('meta-inexact(' + w0.map(x => x.toFixed(1)).join(',') + ')');
    if (hdr.reserved) return R_('meta-reserved(' + widths.map(x => x.toFixed(1)).join(',') + ')');
    if (hdr.fmt !== FORMAT) return R_('fmt-' + hdr.fmt);
    const ecIdx = hdr.ecIdx;
    const plan = ecPlan(v, ecIdx);

    const baseRad = (N(baseBins) / bins * 360 + dbg) * D2R;
    const dir = mirror ? -1 : 1;

    /* ---- 讀主體：每個格子的「有沒有芝麻」與「芝麻角度」 ---- */
    const M = totalCells(v);
    const digits = new Uint8Array(M);
    const cells = [];
    const winModel = opts.winU / R6u;
    const w2 = winModel * winModel;
    let idx = 0;
    for (let k = 0; k < v; k++) {
      const rk = ringRadius(k), n = ringCells(k), rho = rk / R6u;
      for (let j = 0; j < n; j++) {
        const t = baseRad + dir * (j + 0.5) * TAU / n;
        const er = Math.cos(t), ei = Math.sin(t);
        const cu = rho * er, cv = rho * ei;
        let x0q = 1e9, y0q = 1e9, x1q = -1e9, y1q = -1e9;
        for (let aq = 0; aq < 8; aq++) {
          const aa = aq / 8 * TAU;
          const p = map.toImageUV(cu + winModel * Math.cos(aa), cv + winModel * Math.sin(aa));
          if (p.x < x0q) x0q = p.x; if (p.x > x1q) x1q = p.x;
          if (p.y < y0q) y0q = p.y; if (p.y > y1q) y1q = p.y;
        }
        const ix0 = Math.max(0, Math.floor(x0q)), ix1 = Math.min(w - 1, Math.ceil(x1q));
        const iy0 = Math.max(0, Math.floor(y0q)), iy1 = Math.min(h - 1, Math.ceil(y1q));
        if (ix1 < ix0 || iy1 < iy0) return R_('cell-out-of-image');
        const spanPx = Math.max(ix1 - ix0 + 1, iy1 - iy0 + 1);
        const stride = Math.max(1, Math.round(spanPx / 14));
        // 高斯加權：越靠格心的像素權重越高 → 低解析度時較不受鄰格芝麻干擾
        const sg2 = 2 * winModel * winModel * 0.3025;      // σ = 0.55·win
        let acc = 0, nacc = 0, sr = 0, stq = 0, srr = 0, stt = 0, srt = 0;
        for (let y = iy0; y <= iy1; y += stride) {
          for (let x = ix0; x <= ix1; x += stride) {
            const q = map.fromImage(x + 0.5, y + 0.5);
            const du = q.u - cu, dv = q.v - cv;
            const d2 = du * du + dv * dv;
            if (d2 > w2) continue;
            const wt = Math.exp(-d2 / sg2);
            nacc += wt;
            const wdr = du * er + dv * ei, wdt = -du * ei + dv * er;
            if (mask[y * w + x]) {
              acc += wt; sr += wt * wdr; stq += wt * wdt;
              srr += wt * wdr * wdr; stt += wt * wdt * wdt; srt += wt * wdr * wdt;
            }
          }
        }
        const ratio = nacc ? acc / nacc : 0;
        let state = 0, conf = 0;
        if (acc >= 1.2 && ratio >= opts.darkRatio) {
          const mr = sr / acc, mt = stq / acc;
          const vr = srr / acc - mr * mr, vt = stt / acc - mt * mt, vrt = srt / acc - mr * mt;
          let alpha = 0.5 * Math.atan2(2 * vrt, vr - vt);
          if (mirror) alpha = -alpha;
          const aDeg = alpha * R2D;
          let o = Math.round(aDeg / 45); o = ((o % 4) + 4) % 4;
          const resid = Math.abs(aDeg - o * 45);
          state = o + 1;
          conf = Math.max(0, 1 - Math.abs(resid) / 30);
        } else if (ratio >= opts.minDarkRatio) {
          conf = 0.25;
        }
        digits[idx] = state;
        cells.push({
          ring: k, j, n, r: rk, modelDeg: ((t - baseRad) * dir * R2D + 360) % 360,
          state, ratio, conf
        });
        idx++;
      }
    }

    /* ---- 反打包 + RS 糾錯 ---- */
    const raw = unpackBytes(digits, plan.cap);
    const rs = rsDecode(raw, plan.ec);
    if (!rs.ok) {
      const f = R_('RS:' + rs.reason + '(' + widths.map(x => x.toFixed(1)).join(',') + ')');
      if (opts._dbgLast) { opts._dbgLast.cells = cells; opts._dbgLast.digits = digits; opts._dbgLast.v = v; opts._dbgLast.raw = Array.from(raw); }
      return f;
    }
    const payload = rs.msg.slice(0, plan.data);
    const cellErrs = cells.filter(c => c.conf > 0 && c.conf < 0.5).length;
    return {
      ok: true, bytes: payload, format: FORMAT, version: v, rings: v, ecLevel: ecIdx, ecKey: EC_LEVELS[ecIdx].key,
      ecBytes: plan.ec, dataBytes: plan.data, correctedBytes: rs.errors,
      text: utf8Decode(trimZeros(payload)), cells, digits,
      meta: { fmt: hdr.fmt, ecIdx, index: hdr.index, widths: hdr.widths, measured: widths.map(x => +x.toFixed(2)) },
      mirror: !!mirror, metaErrors: hdr.err,
      geometry: {
        cx, cy, mirror, baseDeg: baseBins / bins * 360, notchStartDeg: baseBins / bins * 360, notchEndDeg: (baseBins / bins * 360 + GEO.HEADER_DEG) % 360,
        A: dbgInfo.A, B: dbgInfo.B, phi: dbgInfo.phi,
        inR: dbgInfo.inR, uScale, R6u, pxPerUnit: uScale
      },
      quality: {
        lowConfidenceCells: cellErrs,
        meanConfidence: cells.reduce((a, c) => a + c.conf, 0) / cells.length
      },
      stats: {}
    };
  }

  function findNotch(patSeq, rimSeq, bins) {
    // 找 patSeq==0 且 rimSeq==0 的連續段（環狀）
    const bad = new Uint8Array(bins);
    for (let i = 0; i < bins; i++) bad[i] = (patSeq[i] === 0 && rimSeq[i] === 0) ? 1 : 0;
    let best = null;
    let i = 0;
    // 從第一個非 bad 的位置開始，避免跨環接縫
    let start0 = 0; while (start0 < bins && bad[start0]) start0++;
    if (start0 === bins) return null;
    let run = 0;
    for (let k = 0; k < bins; k++) {
      const idx = (start0 + k) % bins;
      if (bad[idx]) run++;
      else {
        if (run > 0) {
          const endIdx = (start0 + k - 1 + bins) % bins;
          const deg = run / bins * 360;
          const cand = { start: (idx - run + bins * 2) % bins, end: endIdx, len: run, deg };
          if (deg > 6 && deg < 30) { if (!best || run > best.len) best = cand; }
        }
        run = 0;
      }
    }
    if (run > 0) {
      const deg = run / bins * 360;
      if (deg > 6 && deg < 30) {
        const endIdx = (start0 + bins - 1) % bins;
        const cand = { start: (start0 + bins - run) % bins, end: endIdx, len: run, deg };
        if (!best || run > best.len) best = cand;
      }
    }
    return best;
  }

  function nowMs() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  /* =====================================================================
   *                          軟體光柵化 / 測試影像
   * ===================================================================*/
  function renderCode(geom, o) {
    o = o || {};
    if (!geom.ok) throw new Error('geom 無效');
    const ppu = o.pxPerUnit || 16;
    const rot = (o.rotDeg || 0) * D2R;
    const ss = o.subsamples || 3;
    const margin = o.marginU == null ? 2.5 : o.marginU;
    const R6 = frameOuter(geom.version);
    const labelShape = o.shape === 'label';
    const circleShape = o.shape === 'circle' || labelShape;
    // 圓形 / 圓形-標示：外圍留透明邊（標示型要留給外圈文字）
    const padU = labelShape ? (o.padU == null ? 4.9 : o.padU)
      : (circleShape ? (o.padU == null ? 0.5 : o.padU) : 0);
    const halfU = R6 + margin + padU;
    const W = Math.ceil(halfU * 2 * ppu), H = W;
    const cov = new Float32Array(W * H);
    const textCov = o.shape === 'label' ? new Float32Array(W * H) : null;   // 標示文字獨立上色（用底色）
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const ox = halfU * ppu, oy = halfU * ppu;
    const inv = 1 / (ss * ss);
    const edgeT = 1.2 / ppu;
    const mapPt = (ux, uy) => ({ x: ox + (ux * cr - uy * sr) * ppu, y: oy + (ux * sr + uy * cr) * ppu });

    /** 以大量形狀疊加覆蓋率；sdf 提供近似有號距離（正值在內部）以加速 */
    let tgt = cov;                                  // 目前寫入的覆蓋率緩衝（文字時切到 textCov）
    const addShape = (cxu, cyu, bbU, test, sdf) => {
      const c = mapPt(cxu, cyu);
      const rx = (bbU + 1) * ppu;
      const xi0 = Math.max(0, Math.floor(c.x - rx)), xi1 = Math.min(W - 1, Math.ceil(c.x + rx));
      const yi0 = Math.max(0, Math.floor(c.y - rx)), yi1 = Math.min(H - 1, Math.ceil(c.y + rx));
      for (let y = yi0; y <= yi1; y++) {
        for (let x = xi0; x <= xi1; x++) {
          const px = x + 0.5, py = y + 0.5;
          const dx = (px - ox) * cr + (py - oy) * sr;
          const dy = -(px - ox) * sr + (py - oy) * cr;
          const ux = dx / ppu, uy = dy / ppu;
          if (sdf) {
            const d = sdf(ux, uy);
            if (d > edgeT) { tgt[y * W + x] = 1; continue; }
            if (d < -edgeT) continue;
          }
          let hit = 0;
          for (let sy = 0; sy < ss; sy++) {
            for (let sx = 0; sx < ss; sx++) {
              const qx = x + (sx + 0.5) / ss, qy = y + (sy + 0.5) / ss;
              const ex = (qx - ox) * cr + (qy - oy) * sr;
              const ey = -(qx - ox) * sr + (qy - oy) * cr;
              if (test(ex / ppu, ey / ppu)) hit++;
            }
          }
          if (hit) { const i = y * W + x; const v = tgt[i] + hit * inv; tgt[i] = v > 1 ? 1 : v; }
        }
      }
    };

    const disk = (cxu, cyu, r) => addShape(cxu, cyu, r,
      (ux, uy) => { const dx = ux - cxu, dy = uy - cyu; return dx * dx + dy * dy <= r * r; },
      (ux, uy) => r - Math.hypot(ux - cxu, uy - cyu));

    /** 環形扇區（deg0→deg1，順時針；sweep ≥ 360 表示整圈） */
    const annulus = (cxu, cyu, r0, r1, deg0, deg1) => {
      const norm = v => ((v % 360) + 360) % 360;
      const sweep = deg1 - deg0;
      const full = sweep >= 360;
      const s = norm(deg0), span = full ? 360 : sweep;
      const a0 = s * D2R, a1 = (s + span) * D2R;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const narrow = span <= 180;
      const test = (ux, uy) => {
        const dx = ux - cxu, dy = uy - cyu;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r < r0 || r > r1) return false;
        if (full) return true;
        const k0 = c0 * dy - s0 * dx;      // <0 ⇒ 位於起始邊界的外側
        const k1 = c1 * dy - s1 * dx;      // >0 ⇒ 位於結束邊界的外側
        return narrow ? (k0 >= 0 && k1 <= 0) : !(k0 < 0 && k1 > 0);
      };
      const sdf = (ux, uy) => {
        const dx = ux - cxu, dy = uy - cyu;
        const r = Math.sqrt(dx * dx + dy * dy);
        const drIn = Math.min(r - r0, r1 - r);
        if (full) return drIn;
        const k0 = c0 * dy - s0 * dx, k1 = c1 * dy - s1 * dx;
        const inside = narrow ? (k0 >= 0 && k1 <= 0) : !(k0 < 0 && k1 > 0);
        const dAng = Math.min(Math.abs(k0), Math.abs(k1));
        return (drIn > 0 && inside) ? Math.min(drIn, dAng) : -Math.min(Math.abs(drIn), dAng);
      };
      addShape(cxu, cyu, r1, test, sdf);
    };

    const ellipse = (cxu, cyu, a, b, ang) => {
      const c = Math.cos(ang), sn = Math.sin(ang);
      const q = (ux, uy) => {
        const px = ux - cxu, py = uy - cyu;
        return [(px * c + py * sn) / a, (-px * sn + py * c) / b];
      };
      addShape(cxu, cyu, Math.max(a, b),
        (ux, uy) => { const [qx, qy] = q(ux, uy); return qx * qx + qy * qy <= 1; },
        (ux, uy) => { const [qx, qy] = q(ux, uy); return (1 - Math.hypot(qx, qy)) * Math.min(a, b); });
    };

    // --- 膠囊弧：沿中心線 rMid 的半徑帶，端點為半圓端帽 ---
    const capArc = (rMid, a0, a1) => {
      annulus(0, 0, rMid - GEO.CAP_R, rMid + GEO.CAP_R, a0, a1);
      const p0 = [rMid * Math.cos(a0 * D2R), rMid * Math.sin(a0 * D2R)];
      const p1 = [rMid * Math.cos(a1 * D2R), rMid * Math.sin(a1 * D2R)];
      disk(p0[0], p0[1], GEO.CAP_R);
      if (Math.abs(a1 - a0) < 359.9) disk(p1[0], p1[1], GEO.CAP_R);
    };

    /* ---------- 圓體筆畫字形（只用圓端線段，PNG / SVG 一致、不依賴字型） ----------
     * 座標：x ∈ [0,4]、y ∈ [0,8]（y 向下），線寬 SW。 */
    const SW = 0.82;                          // 筆畫粗細（grid 單位）
    const GLYPHS = {
      N: [[0, 8, 0, 0], [0, 0.4, 4, 7.6], [4, 0, 4, 8]],
      T: [[0, 0, 4, 0], [2, 0, 2, 8]],
      E: [[4, 0, 0, 0], [0, 0, 0, 8], [0, 4, 3, 4], [0, 8, 4, 8]],
      B: [[0, 0, 0, 8], [0, 0, 3, 0], [3, 0, 4, 1.6], [4, 1.6, 3, 4], [3, 4, 0, 4],
          [3, 4, 4, 6.2], [4, 6.2, 3, 8], [3, 8, 0, 8]],
      A: [[0.2, 8, 2, 0], [2, 0, 3.8, 8], [0.9, 5, 3.1, 5]],
      G: [[4, 2.2, 2.6, 0], [2.6, 0, 1.2, 1.2], [1.2, 1.2, 1.2, 6.8], [1.2, 6.8, 2.6, 8],
          [2.6, 8, 4, 6.6], [4, 6.6, 4, 4.4], [4, 4.4, 2.6, 4.4]],
      L: [[0, 0, 0, 8], [0, 8, 4, 8]],
      S: [[4, 1.4, 2.4, 0], [2.4, 0, 1, 1.1], [1, 1.1, 1.6, 3.4], [1.6, 3.4, 2.6, 4.1],
          [2.6, 4.1, 3.3, 5], [3.3, 5, 3, 7], [3, 7, 1.6, 8], [1.6, 8, 0, 6.9]],
      M: [[0, 8, 0, 0], [0, 0, 2, 4.6], [2, 4.6, 4, 0], [4, 0, 4, 8]],
      C: [[4, 2.2, 2.6, 0], [2.6, 0, 1.2, 1.4], [1.2, 1.4, 1.2, 6.6], [1.2, 6.6, 2.6, 8], [2.6, 8, 4, 5.8]],
      O: [[2.6, 0, 1.4, 0], [1.4, 0, 0.3, 1.6], [0.3, 1.6, 0.3, 6.4], [0.3, 6.4, 1.4, 8],
          [1.4, 8, 2.6, 8], [2.6, 8, 3.7, 6.4], [3.7, 6.4, 3.7, 1.6], [3.7, 1.6, 2.6, 0]],
      D: [[0, 0, 0, 8], [0, 0, 2.2, 0], [2.2, 0, 3.8, 1.8], [3.8, 1.8, 3.8, 6.2],
          [3.8, 6.2, 2.2, 8], [2.2, 8, 0, 8]],
      '.': [[2, 7.2, 2, 8]]                       // 間隔點
    };
    const segDist = (ux, uy, x0, y0, x1, y1) => {
      const dx = x1 - x0, dy = y1 - y0;
      const L2 = dx * dx + dy * dy;
      let t = L2 ? ((ux - x0) * dx + (uy - y0) * dy) / L2 : 0;
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      return Math.hypot(ux - (x0 + t * dx), uy - (y0 + t * dy));
    };
    /** 把標示文字光柵化進 textCov（非零繞數 + 4 條子掃描線反鋸齒） */
    const arcText = (str, plateR, gh0) => {
      if (!textCov) return;
      const geo = labelGeometry(str, plateR, gh0);
      if (!geo) return;
      const EDGES = [];
      for (const g of geo.glyphs) {
        for (const c of g.contours) {
          const n = c.length >> 1, ex = new Float64Array(n), ey = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            const p = mapPt(c[i * 2], c[i * 2 + 1]);
            ex[i] = p.x; ey[i] = p.y;
          }
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            EDGES.push(ex[i], ey[i], ex[j], ey[j]);
          }
        }
      }
      if (!EDGES.length) return;
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      for (let e = 0; e < EDGES.length; e += 4) {
        minX = Math.min(minX, EDGES[e], EDGES[e + 2]); maxX = Math.max(maxX, EDGES[e], EDGES[e + 2]);
        minY = Math.min(minY, EDGES[e + 1], EDGES[e + 3]); maxY = Math.max(maxY, EDGES[e + 1], EDGES[e + 3]);
      }
      const bx0 = Math.max(0, Math.floor(minX)), bx1 = Math.min(W - 1, Math.ceil(maxX));
      const by0 = Math.max(0, Math.floor(minY)), by1 = Math.min(H - 1, Math.ceil(maxY));
      if (bx1 < bx0 || by1 < by0) return;
      const SS = 4, acc = new Float32Array(bx1 - bx0 + 2), xs = [];
      for (let y = by0; y <= by1; y++) {
        acc.fill(0);
        for (let k = 0; k < SS; k++) {
          const sy = y + (k + 0.5) / SS;
          xs.length = 0;
          for (let e = 0; e < EDGES.length; e += 4) {
            const ax = EDGES[e], ay = EDGES[e + 1], cx2 = EDGES[e + 2], cy2 = EDGES[e + 3];
            if ((ay <= sy && cy2 > sy) || (cy2 <= sy && ay > sy)) {
              xs.push([ax + (sy - ay) / (cy2 - ay) * (cx2 - ax), cy2 > ay ? 1 : -1]);
            }
          }
          if (xs.length < 2) continue;
          xs.sort((a, b) => a[0] - b[0]);
          let wind = 0, spanA = 0;
          for (let m = 0; m < xs.length; m++) {
            const prev = wind;
            wind += xs[m][1];
            if (prev === 0 && wind !== 0) spanA = xs[m][0];
            else if (prev !== 0 && wind === 0) {
              let sxa = Math.max(spanA, bx0), sxb = Math.min(xs[m][0], bx1 + 1);
              if (sxb <= sxa) continue;
              const ia = Math.floor(sxa), ib = Math.floor(sxb);
              if (ia === ib) { acc[ia - bx0] += sxb - sxa; continue; }
              acc[ia - bx0] += ia + 1 - sxa;
              for (let t = ia + 1; t < ib; t++) acc[t - bx0] += 1;
              if (ib <= bx1) acc[ib - bx0] += sxb - ib;
            }
          }
        }
        const row = y * W;
        for (let x = bx0; x <= bx1; x++) {
          const v = acc[x - bx0] / SS;
          if (v <= 0.001) continue;
          const i = row + x, cur = textCov[i];
          textCov[i] = v + cur > 1 ? 1 : v + cur;
        }
      }
    };

    // --- 內框：圓環（挖空中心） ---
    annulus(0, 0, GEO.INNER_RI, GEO.RI, 0, 360);
    // --- 外框：單層圓環，切掉 60°，切口兩端圓滑 ---
    const rMid = metaMid(geom.version);
    capArc(rMid, GEO.HEADER_DEG, 360);
    // --- 缺口內：長度碼（墨段 = 與外框同厚、同樣圓滑端帽的膠囊弧） ---
    {
      const mDeg = GEO.HEADER_DEG / GEO.META_MODULES;
      let acc = 0;
      for (let i = 0; i < geom.meta.widths.length; i++) {
        const span = geom.meta.widths[i] * mDeg;
        if (i % 2 === 0) capArc(rMid, acc, acc + span);      // 第 1、3 段是墨
        acc += span;
      }
    }
    // --- 主體：芝麻 ---
    for (const cell of geom.cells) {
      if (!cell.state) continue;
      const aRad = cell.deg * D2R;
      const alpha = (cell.state - 1) * 45 * D2R;
      ellipse(cell.r * Math.cos(aRad), cell.r * Math.sin(aRad), GEO.SA, GEO.SB, aRad + alpha);
    }
    // --- 圓形-標示：底盤正下方一段弧形文字（用底色上色） ---
    if (labelShape) {
      tgt = textCov;                                   // 文字畫到獨立緩衝
      arcText(o.ringText || 'NTE · BAGEL', R6 + margin, o.labelTextU == null ? 2.8 : o.labelTextU);
      tgt = cov;
    }

    // --- 影像合成（支援純色 / 線性漸層 / 透明；未指定樣式時維持原本灰階路徑） ---
    const ink = o.ink == null ? 28 : o.ink;
    if (o.blur > 0) blurCoverage(cov, W, H, o.blur);
    const out = new Uint8ClampedArray(W * H * 4);
    const rnd = mulberry32(o.seed == null ? 12345 : o.seed);
    const noiseSd = o.noise || 0;
    const gradAmp = o.lightGradient || 0, vg = o.vignette || 0;

    const inkSpec = o.inkStyle || (o.inkRGB ? { from: o.inkRGB } : null);
    const bgSpec = o.bgStyle || (o.bgRGB ? { from: o.bgRGB } : null);
    const styled = !!(inkSpec || bgSpec);
    // 外形：square（預設）或 circle（圓形底盤，圓外透明）
    const circle = circleShape;
    const plateU = o.plateU == null ? (R6 + margin) : o.plateU;   // 底盤半徑（單位 u）
    const plateR = plateU * ppu;
    // 漸層取樣：t = 0.5 + 0.5·(投影/半徑)，角度 0° = 由左至右
    const gradT = (ang) => {
      const a = (ang == null ? 135 : ang) * D2R, ca = Math.cos(a), sa = Math.sin(a);
      const half = 0.5 * (Math.abs(ca) * W + Math.abs(sa) * H);
      return (x, y) => {
        const proj = (x + 0.5 - W / 2) * ca + (y + 0.5 - H / 2) * sa;
        const t = 0.5 + 0.5 * proj / (half || 1);
        return t < 0 ? 0 : (t > 1 ? 1 : t);
      };
    };
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const samplerFor = (spec) => (spec && !Array.isArray(spec)) ? gradT(spec.angle == null ? 135 : spec.angle) : null;
    const colorAt = (spec, defRGB, samp, x, y) => {
      if (!spec) return [defRGB[0], defRGB[1], defRGB[2], 1];
      if (Array.isArray(spec)) return [spec[0], spec[1], spec[2], 1];
      const from = spec.from || defRGB, to = spec.to || spec.from || defRGB;
      const t = samp ? samp(x, y) : 0.5;
      const rgb = t <= 0 ? from : (t >= 1 ? to : mix(from, to, t));
      return [rgb[0], rgb[1], rgb[2], spec.alpha == null ? 1 : spec.alpha];
    };
    const sampInk = styled ? samplerFor(inkSpec) : null;
    const sampBg = styled ? samplerFor(bgSpec) : null;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const c = cov[i];
        const cx2 = (x / W - 0.5), cy2 = (y / H - 0.5);
        let v;
        const outside = circle && Math.hypot(x + 0.5 - W / 2, y + 0.5 - H / 2) > plateR;
        if (!styled) {
          if (outside) { out[i * 4 + 3] = 0; continue; }      // 樸素灰階 + 圓形 → 圓外透明
        } else if (outside && c < 0.001) {
          out[i * 4 + 3] = 0;                                  // 圓外不留底色
          continue;
        }
        if (!styled) {
          let bgV = 246 - gradAmp * (cx2 * 0.6 + cy2 * 0.4) * 255;
          if (vg) bgV -= vg * 255 * (cx2 * cx2 + cy2 * cy2) * 0.5;
          let inkV = ink;
          if (vg) inkV += vg * 255 * (cx2 * cx2 + cy2 * cy2) * 0.35;
          v = bgV * (1 - c) + inkV * c;
          out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v;
          out[i * 4 + 3] = 255;
          continue;
        }
        const ik = colorAt(inkSpec, [ink, ink, ink], sampInk, x, y);
        const bg = colorAt(bgSpec, [246, 246, 246], sampBg, x, y);
        // 挖空模式：墨不是「畫上顏色」而是「把背景挖掉」（透明洞）
        if (inkSpec && inkSpec.cutout) {
          const k = c * (inkSpec.alpha == null ? 1 : inkSpec.alpha);
          if (noiseSd) { /* 挖空時不加雜訊，保持洞的乾淨 */ }
          out[i * 4] = bg[0]; out[i * 4 + 1] = bg[1]; out[i * 4 + 2] = bg[2];
          out[i * 4 + 3] = 255 * bg[3] * (1 - k);
          continue;
        }
        const sa = ik[3] * c, da = bg[3];
        const oa = sa + da * (1 - sa);
        let rr, gg, bb;
        if (oa > 1e-6) {
          rr = (ik[0] * sa + bg[0] * da * (1 - sa)) / oa;
          gg = (ik[1] * sa + bg[1] * da * (1 - sa)) / oa;
          bb = (ik[2] * sa + bg[2] * da * (1 - sa)) / oa;
        } else { rr = bg[0]; gg = bg[1]; bb = bg[2]; }
        if (noiseSd) { const nz = gauss(rnd) * noiseSd; rr += nz; gg += nz; bb += nz; }
        out[i * 4] = rr < 0 ? 0 : (rr > 255 ? 255 : rr);
        out[i * 4 + 1] = gg < 0 ? 0 : (gg > 255 ? 255 : gg);
        out[i * 4 + 2] = bb < 0 ? 0 : (bb > 255 ? 255 : bb);
        out[i * 4 + 3] = oa * 255;
      }
    }
    // --- 標示文字：以「底色」上色（與底盤同色；放在透明區，看不看得見取決於底材） ---
    if (textCov) {
      const bgFallback = [246, 246, 246];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const tc = textCov[i];
          if (tc < 0.002) continue;
          const bg = styled ? colorAt(bgSpec, bgFallback, sampBg, x, y) : [246, 246, 246, 1];
          const sa = tc * bg[3];
          if (sa <= 0) continue;
          const da = out[i * 4 + 3] / 255;
          const oa = sa + da * (1 - sa);
          if (oa <= 1e-6) continue;
          out[i * 4] = (bg[0] * sa + out[i * 4] * da * (1 - sa)) / oa;
          out[i * 4 + 1] = (bg[1] * sa + out[i * 4 + 1] * da * (1 - sa)) / oa;
          out[i * 4 + 2] = (bg[2] * sa + out[i * 4 + 2] * da * (1 - sa)) / oa;
          out[i * 4 + 3] = oa * 255;
        }
      }
    }
    return { data: out, width: W, height: H, pxPerUnit: ppu };
  }

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  let gaussSpare = null;
  function gauss(rnd) {
    if (gaussSpare != null) { const v = gaussSpare; gaussSpare = null; return v; }
    let u = 0, v = 0, s = 0;
    do { u = rnd() * 2 - 1; v = rnd() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const m = Math.sqrt(-2 * Math.log(s) / s);
    gaussSpare = v * m; return u * m;
  }
  function blurCoverage(cov, w, h, sigma) {
    const r = Math.max(1, Math.ceil(sigma * 3));
    const k = new Float32Array(2 * r + 1);
    let sum = 0;
    for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-i * i / (2 * sigma * sigma)); sum += k[i + r]; }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    const tmp = new Float32Array(cov.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) { const xx = Math.min(w - 1, Math.max(0, x + i)); s += cov[y * w + xx] * k[i + r]; }
      tmp[y * w + x] = s;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) { const yy = Math.min(h - 1, Math.max(0, y + i)); s += tmp[yy * w + x] * k[i + r]; }
      cov[y * w + x] = s;
    }
  }

  /* =============================================================== SVG */
  function toSVG(geom, o) {
    o = o || {};
    const R6 = frameOuter(geom.version);
    const margin = o.marginU == null ? 2 : o.marginU;
    const labelShape = o.shape === 'label';
    const circleShape = o.shape === 'circle' || labelShape;
    const padU = labelShape ? (o.padU == null ? 4.9 : o.padU)
      : (circleShape ? (o.padU == null ? 0.5 : o.padU) : 0);
    const S = R6 + margin + padU;
    const n = v => (+v).toFixed(3);
    // 標示字形輪廓用較多小數：viewBox 以 u 為單位，0.0001u 在 4K 導出下仍遠小於 1 像素
    const n2 = v => (+v).toFixed(4);
    const px = (r, deg) => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
    // viewBox 與所有路徑座標都使用「單位 u」；v2 是畫布的「全寬」（2 × 半寬），
    // 不可再乘上縮放係數，否則內容只佔畫布的 1/32，導出後會出現巨大留白。
    const v2 = 2 * S;

    /** 膠囊弧（含半圓端帽）的 SVG path */
    const capArcPath = (rMid, a0, a1) => {
      const c = GEO.CAP_R, rO = rMid + c, rI = rMid - c;
      const sweep = Math.abs(a1 - a0);
      const large = sweep > 180 ? 1 : 0;
      const [x1, y1] = px(rO, a0), [x2, y2] = px(rO, a1);
      const [x3, y3] = px(rI, a1), [x4, y4] = px(rI, a0);
      return `M${n(x1)} ${n(y1)}A${n(rO)} ${n(rO)} 0 ${large} 1 ${n(x2)} ${n(y2)}`
        + `A${n(c)} ${n(c)} 0 0 1 ${n(x3)} ${n(y3)}`
        + `A${n(rI)} ${n(rI)} 0 ${large} 0 ${n(x4)} ${n(y4)}`
        + `A${n(c)} ${n(c)} 0 0 1 ${n(x1)} ${n(y1)}Z`;
    };
    const annulusPath = (rO, rI) => {
      return `M${n(-rO)} 0A${n(rO)} ${n(rO)} 0 1 0 ${n(rO)} 0A${n(rO)} ${n(rO)} 0 1 0 ${n(-rO)} 0Z`
        + `M${n(-rI)} 0A${n(rI)} ${n(rI)} 0 1 1 ${n(rI)} 0A${n(rI)} ${n(rI)} 0 1 1 ${n(-rI)} 0Z`;
    };

    /* ---- 樣式：純色 / 線性漸層 / 透明 ---- */
    const inkSpec = o.inkStyle || (o.inkRGB ? { from: o.inkRGB } : null);
    const bgSpec = o.bgStyle || (o.bgRGB ? { from: o.bgRGB } : null);
    const defs = [];
    let gradSeq = 0;
    const paintOf = (spec, defRGB, tag) => {
      if (!spec) return { attr: `fill="${rgbHex(defRGB)}"` };
      const from = spec.from || defRGB, to = spec.to || spec.from || defRGB;
      const alpha = spec.alpha == null ? 1 : spec.alpha;
      if (!Array.isArray(spec) && spec.to) {
        const id = `${tag}g${gradSeq++}`;
        const ang = (spec.angle == null ? 135 : spec.angle) * D2R;
        const half = 0.5 * (Math.abs(Math.cos(ang)) * v2 + Math.abs(Math.sin(ang)) * v2);
        const x1 = -half * Math.cos(ang), y1 = -half * Math.sin(ang);
        const x2 = half * Math.cos(ang), y2 = half * Math.sin(ang);
        defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">`
          + `<stop offset="0" stop-color="${rgbHex(from)}"/><stop offset="1" stop-color="${rgbHex(to)}"/></linearGradient>`);
        return { attr: `fill="url(#${id})"` + (alpha < 1 ? ` fill-opacity="${n(alpha)}"` : '') };
      }
      const rgb = Array.isArray(spec) ? spec : from;
      return { attr: `fill="${rgbHex(rgb)}"` + (alpha < 1 ? ` fill-opacity="${n(alpha)}"` : '') };
    };
    const inkPaint = paintOf(inkSpec, [17, 17, 17], 'ink').attr;
    const bgAlpha = styleAlpha(bgSpec, 1);
    const bgPaint = paintOf(bgSpec, [255, 255, 255], 'bg').attr;

    const shapes = [];
    // 內框：圓環
    shapes.push(`<path @INK@ fill-rule="evenodd" d="${annulusPath(GEO.RI, GEO.INNER_RI)}"/>`);
    // 外框：切掉 60° 的圓環（兩端圓滑）
    const rMid = metaMid(geom.version);
    shapes.push(`<path @INK@ d="${capArcPath(rMid, GEO.HEADER_DEG, 360)}"/>`);
    // 缺口長度碼
    {
      const mDeg = GEO.HEADER_DEG / GEO.META_MODULES;
      let acc = 0;
      for (let i = 0; i < geom.meta.widths.length; i++) {
        const span = geom.meta.widths[i] * mDeg;
        if (i % 2 === 0) shapes.push(`<path @INK@ d="${capArcPath(rMid, acc, acc + span)}"/>`);
        acc += span;
      }
    }
    // 主體：芝麻
    for (const cell of geom.cells) {
      if (!cell.state) continue;
      const [cx, cy] = px(cell.r, cell.deg);
      const ang = cell.deg + (cell.state - 1) * 45;
      shapes.push(`<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(GEO.SA)}" ry="${n(GEO.SB)}" @INK@ transform="rotate(${n(ang)} ${n(cx)} ${n(cy)})"/>`);
    }
    const cutout = !!(inkSpec && inkSpec.cutout);
    const body = shapes.map(sh => sh.replace('@INK@', inkPaint)).join('');
    const box = `${n(-v2 / 2)} ${n(-v2 / 2)} ${n(v2)} ${n(v2)}`;
    // 圓形底盤：以 clipPath 把底盤裁成圓（圓外透明）
    const circle = o.shape === 'circle';
    const plateR = (o.plateU == null ? (R6 + margin) : o.plateU);   // 單位 u（與 viewBox 相同座標系）
    let plateAttr = '';
    if (circle) {
      defs.push(`<clipPath id="plate"><circle cx="0" cy="0" r="${n(plateR)}"/></clipPath>`);
      plateAttr = ' clip-path="url(#plate)"';
    }
    let bgRect = '';
    if (bgAlpha > 0) {
      if (cutout) {
        // 挖空：以 mask 把紋樣從背景中挖掉（紋樣 = 黑色 → 完全穿透）
        const maskShapes = shapes.map(sh => sh.replace('@INK@', 'fill="#000"')).join('');
        defs.push(`<mask id="cutm" maskUnits="userSpaceOnUse" x="${n(-v2 / 2)}" y="${n(-v2 / 2)}" width="${n(v2)}" height="${n(v2)}">`
          + `<rect x="${n(-v2 / 2)}" y="${n(-v2 / 2)}" width="${n(v2)}" height="${n(v2)}" fill="#fff"/>${maskShapes}</mask>`);
        bgRect = `<rect x="${n(-v2 / 2)}" y="${n(-v2 / 2)}" width="${n(v2)}" height="${n(v2)}" ${bgPaint} mask="url(#cutm)"${plateAttr}/>`;
      } else {
        bgRect = `<rect x="${n(-v2 / 2)}" y="${n(-v2 / 2)}" width="${n(v2)}" height="${n(v2)}" ${bgPaint}${plateAttr}/>`;
      }
    }
    /* 圓形-標示：底盤正下方一段弧形文字；直接用內嵌字型的輪廓畫成路徑，
       顏色＝底色，PNG 與 SVG 完全一致（不依賴使用者端字型）。 */
    let labelTextSvg = '';
    if (labelShape) {
      const geo = labelGeometry(o.ringText, R6 + margin, o.labelTextU == null ? 2.8 : o.labelTextU);
      if (geo) {
        let d = '';
        for (const g of geo.glyphs) {
          for (const c of g.contours) {
            const n = c.length >> 1;
            for (let i = 0; i < n; i++) {
              d += (i ? 'L' : 'M') + n2(c[i * 2]) + ' ' + n2(c[i * 2 + 1]);
            }
            d += 'Z';
          }
        }
        if (d) labelTextSvg = `<path ${bgPaint} fill-rule="nonzero" d="${d}"/>`;
      }
    }
    const defsBlock = defs.length ? `<defs>${defs.join('')}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" width="${o.px || 512}" height="${o.px || 512}">${defsBlock}${bgRect}${cutout ? '' : body}${labelTextSvg}</svg>`;
  }

  /* =============================================================== PNG
   * 無依賴 RGBA 編碼（color type 6）。瀏覽器 toDataURL 在大圖／data: URL
   * 下載時常被擋；這個輸出可直接做成 Blob 觸發下載，並保留透明通道。 */
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function adler32(buf) {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) { a = (a + buf[i]) % 65521; b = (b + a) % 65521; }
    return ((b << 16) | a) >>> 0;
  }
  function u32be(n) {
    return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  }
  function concatU8(parts) {
    let n = 0;
    for (let i = 0; i < parts.length; i++) n += parts[i].length;
    const o = new Uint8Array(n);
    let p = 0;
    for (let i = 0; i < parts.length; i++) { o.set(parts[i], p); p += parts[i].length; }
    return o;
  }
  function pngChunk(type, data) {
    const typ = new Uint8Array([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)]);
    const td = concatU8([typ, data]);
    return concatU8([u32be(data.length), td, u32be(crc32(td))]);
  }
  /** rgba: Uint8Array|Uint8ClampedArray (w*h*4) → PNG Uint8Array（RGBA，保留 alpha） */
  function encodePNG(rgba, w, h) {
    w = w | 0; h = h | 0;
    if (w <= 0 || h <= 0) throw new Error('encodePNG: 尺寸無效');
    const stride = 1 + w * 4;
    const raw = new Uint8Array(h * stride);
    for (let y = 0; y < h; y++) {
      raw[y * stride] = 0;
      const src = y * w * 4;
      raw.set(rgba.subarray(src, src + w * 4), y * stride + 1);
    }
    const zparts = [new Uint8Array([0x78, 0x01])];
    let off = 0;
    while (off < raw.length) {
      const len = Math.min(65535, raw.length - off);
      const last = (off + len >= raw.length) ? 1 : 0;
      const hdr = new Uint8Array(5);
      hdr[0] = last;
      hdr[1] = len & 255; hdr[2] = (len >>> 8) & 255;
      hdr[3] = (~len) & 255; hdr[4] = ((~len) >>> 8) & 255;
      zparts.push(hdr, raw.subarray(off, off + len));
      off += len;
    }
    zparts.push(u32be(adler32(raw)));
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(w), 0);
    ihdr.set(u32be(h), 4);
    ihdr[8] = 8; ihdr[9] = 6;
    return concatU8([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', concatU8(zparts)),
      pngChunk('IEND', new Uint8Array(0))
    ]);
  }

  /* ------------------------------------------------------------ 輸出 API */
  return {
    GEO, EC_LEVELS, PARAM,
    EC_KEY: ['L', 'M', 'Q', 'H'],
    ringRadius, ringCells, totalCells, cellAt, bodyOuter, frameInner, frameOuter, metaMid, metaPsi, metaModuleDeg, capShadowDeg, META_PATTERNS,
    capacityBytes, packCost, digitsForBytes, packBytes, unpackBytes,
    rsEncode, rsDecode, rsGenPoly,
    headerEncode, headerDecode, ecPlan, wrapVersion,
    encode, decodeImage, renderCode, toSVG, encodePNG, utf8Decode, utf8Encode, toU8, trimZeros,
    contrastRatio, relLum, styleContrast, styleStops, styleAlpha, rgbHex,
    _internal: { toGray, downscale, binarize, labelComponents, pickCandidates, envelope, fitRing, solveN, refineAffine, makeMapper, makeAffineMapper, makeHomographyMapper, mapperToH, invert3, mul3, boundaryProfiles, findBoundaryGap, fitHomographyFromProfiles, cyclicRuns, collectPixels, tryHypothesis, headerDecode, capacityBytes }
  };
});
