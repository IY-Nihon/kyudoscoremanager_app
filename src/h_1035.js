/**
 * Library Bridge: h_1035.js (@google/generative-ai)
 *
 * 元はソースマップから復元された Google Generative AI SDK の実装。
 * 長らく package.json に無い「隠れ依存」だったが、
 * @google/generative-ai@^0.24.1 を正式な依存として追加したため委譲する。
 * 復元コードの19エクスポートが npm 版に全て存在することを確認済み。
 *
 * 利用箇所: JP_AIChatBot_1034（AIチャット）, JP_OCRRecordModal（立ち順のOCR読み取り）
 * 使用API : GoogleGenerativeAI
 *           → getGenerativeModel({ model, systemInstruction, generationConfig })
 *           → generateContent / startChat / sendMessage
 */
'use strict';

module.exports = require('@google/generative-ai');
