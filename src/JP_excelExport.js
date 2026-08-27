/**
 * Excel(.xlsx) 形式での書き出し（自前実装）
 *
 * CSV では「列幅」と「フィルター（並べ替え）ボタン」を保持できないため、
 * Excelで開いた直後から並べ替えられる状態にしたい場合はこちらを使う。
 *
 * ■ なぜ自前実装か
 * xlsx の実体は ZIP + XML なので、必要な機能（オートフィルター・列幅・
 * 見出しの書式・ウィンドウ枠固定）だけなら少量のコードで生成できる。
 * exceljs を使うとバンドルが約 927KB 増えるのに対し、
 * ZIP圧縮のみ fflate に任せるこの方式なら数十KBで済む。
 *
 * ■ 生成するファイル構成（xlsx の最小セット）
 *   [Content_Types].xml
 *   _rels/.rels
 *   xl/workbook.xml
 *   xl/_rels/workbook.xml.rels
 *   xl/styles.xml
 *   xl/worksheets/sheet1.xml（シートの数だけ sheet2, sheet3 …）
 *
 * 文字列は inlineStr で書き出すため sharedStrings.xml は使わない
 * （実装が単純になり、この規模のデータでは実害がない）。
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// XML の特殊文字と、Excelが扱えない制御文字を除去・置換する
function esc(v) {
  return String(v)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 0始まりの列番号を Excel の列名（A, B, ... Z, AA ...）へ変換する
function colName(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

/** 1セル分の XML。数値はそのまま、それ以外は inlineStr で出す */
function cellXml(ref, value, styleId) {
  const st = styleId ? ` s="${styleId}"` : '';
  if (value == null || value === '') return `<c r="${ref}"${st}/>`;
  if (typeof value === 'number' && isFinite(value)) {
    return `<c r="${ref}"${st}><v>${value}</v></c>`;
  }
  return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

/**
 * 1枚ぶんのシートXMLを作る。
 *
 * @param {{headers:string[], rows:Array<Array<any>>, widths?:number[]}} 中身
 * @param {boolean} 先頭か 最初のシートだけ tabSelected を立てる
 */
function シートXML(中身, 先頭か) {
  const headers = 中身.headers || [];
  const rows = 中身.rows || [];
  const widths = 中身.widths;
  const lastCol = colName(Math.max(headers.length - 1, 0));
  const lastRow = rows.length + 1;

  const cols = headers
    .map((h, i) => {
      const w = widths && widths[i] ? widths[i] : Math.max(10, String(h).length * 2 + 2);
      return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`;
    })
    .join('');

  // 見出し行（styleId=1: 太字＋背景＋罫線＋中央揃え）
  const headerCells = headers.map((h, i) => cellXml(colName(i) + '1', h, 1)).join('');
  const headerXml = `<row r="1" ht="20" customHeight="1">${headerCells}</row>`;

  const bodyXml = rows
    .map((r, ri) => {
      const cells = (r || []).map((v, ci) => cellXml(colName(ci) + (ri + 2), v, 0)).join('');
      return `<row r="${ri + 2}">${cells}</row>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    // 見出し行を固定して、スクロールしても列名が見えるようにする
    `<sheetViews><sheetView workbookViewId="0"${先頭か ? ' tabSelected="1"' : ''}>` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${headerXml}${bodyXml}</sheetData>` +
    // 見出し行に並べ替え・絞り込みのボタンを付ける
    `<autoFilter ref="A1:${lastCol}${lastRow}"/>` +
    `</worksheet>`
  );
}

// シート名に使えない文字。Excel が開けなくなる
const 使えない字 = /[:\\/?*[\]]/g;

/**
 * xlsx の中身（ZIPに入れる各ファイル）を組み立てる。
 *
 * 画面にもブラウザにも触れない純粋な関数なので、そのまま検査できる
 * （test/excelExport.test.js）。
 *
 * @param {Array<{name:string, headers:string[], rows:Array<Array<any>>, widths?:number[]}>} シートたち
 * @returns {Object<string,string>} 道 → 中身
 */
function ブックを組む(シートたち) {
  const 束 = (Array.isArray(シートたち) ? シートたち : []).filter(Boolean);
  if (!束.length) throw new Error('シートが1枚もありません');

  // シート名は31字まで。重なると Excel が開けないので、後ろに番号を足して分ける
  const 使った = new Set();
  const 名前たち = 束.map((x, i) => {
    let n = String(x.name || '').replace(使えない字, '_').slice(0, 31);
    if (!n) n = `シート${i + 1}`;
    let 候補 = n;
    let k = 2;
    while (使った.has(候補)) 候補 = n.slice(0, 27) + '(' + k++ + ')';
    使った.add(候補);
    return 候補;
  });

  const sheetsXml = 名前たち
    .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');

  const definedNames = 束
    .map((x, i) => {
      const lastCol = colName(Math.max((x.headers || []).length - 1, 0));
      const lastRow = (x.rows || []).length + 1;
      return (
        `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">` +
        `'${esc(名前たち[i])}'!$A$1:$${lastCol}$${lastRow}</definedName>`
      );
    })
    .join('');

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>${sheetsXml}</sheets>` +
    // オートフィルターを「並べ替え範囲」としてExcelに認識させる
    `<definedNames>${definedNames}</definedNames>` +
    `</workbook>`;

  // styles.xml — 0番は既定、1番が見出し用
  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="3"><fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
    `<border><left style="thin"><color rgb="FFB0B0B0"/></left><right style="thin"><color rgb="FFB0B0B0"/></right>` +
    `<top style="thin"><color rgb="FFB0B0B0"/></top><bottom style="thin"><color rgb="FFB0B0B0"/></bottom><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">` +
    `<alignment horizontal="center" vertical="center"/></xf>` +
    `</cellXfs></styleSheet>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    束
      .map(
        (x, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
          `ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('') +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  // シートの rId を先に並べ、styles はその次の番号にする。重なると Excel が開けない
  const wbRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    束
      .map(
        (x, i) =>
          `<Relationship Id="rId${i + 1}" ` +
          `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ` +
          `Target="worksheets/sheet${i + 1}.xml"/>`
      )
      .join('') +
    `<Relationship Id="rId${束.length + 1}" ` +
    `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const 出 = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'xl/workbook.xml': workbook,
    'xl/_rels/workbook.xml.rels': wbRels,
    'xl/styles.xml': styles,
  };
  束.forEach((x, i) => {
    出[`xl/worksheets/sheet${i + 1}.xml`] = シートXML(x, i === 0);
  });
  return 出;
}

/**
 * 複数のシートを持つ xlsx を書き出す（Web専用）。
 *
 * @param {Array<{name:string, headers:string[], rows:Array<Array<any>>, widths?:number[]}>} シートたち
 * @param {string} fileName 拡張子を含むファイル名
 */
async function exportXlsxSheets(シートたち, fileName) {
  const { zipSync, strToU8 } = require('fflate');
  const { saveAs } = require('file-saver');
  const 中身 = ブックを組む(シートたち);
  const 袋 = {};
  for (const [道, 文] of Object.entries(中身)) 袋[道] = strToU8(文);
  const zipped = zipSync(袋, { level: 6 });
  saveAs(
    new Blob([zipped], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName
  );
}

/**
 * 行データを xlsx として書き出す（Web専用）。1枚だけのとき用。
 *
 * @param {string[]} headers        見出し行
 * @param {Array<Array<any>>} rows  明細行（数値はそのまま数値で渡すこと）
 * @param {string} fileName         拡張子を含むファイル名
 * @param {number[]} [widths]       列幅（文字数）
 * @param {string} [sheetName]      シート名
 */
async function exportXlsx(headers, rows, fileName, widths, sheetName) {
  await exportXlsxSheets([{ name: sheetName || '記録', headers, rows, widths }], fileName);
}

exports.exportXlsx = exportXlsx;
exports.exportXlsxSheets = exportXlsxSheets;
exports.ブックを組む = ブックを組む;
