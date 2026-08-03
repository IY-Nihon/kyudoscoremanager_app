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
 *   xl/worksheets/sheet1.xml
 *
 * 文字列は inlineStr で書き出すため sharedStrings.xml は使わない
 * （実装が単純になり、この規模のデータでは実害がない）。
 */
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

// XML の特殊文字と、Excelが扱えない制御文字を除去・置換する
function esc(v) {
  return String(v)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 0始まりの列番号を Excel の列名（A, B, ... Z, AA ...）へ変換する
function colName(index) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

/** 1セル分の XML。数値はそのまま、それ以外は inlineStr で出す */
function cellXml(ref, value, styleId) {
  const st = styleId ? ` s="${styleId}"` : "";
  if (value == null || value === "") return `<c r="${ref}"${st}/>`;
  if (typeof value === "number" && isFinite(value)) {
    return `<c r="${ref}"${st}><v>${value}</v></c>`;
  }
  return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

/**
 * 行データを xlsx として書き出す（Web専用）。
 *
 * @param {string[]} headers        見出し行
 * @param {Array<Array<any>>} rows  明細行（数値はそのまま数値で渡すこと）
 * @param {string} fileName         拡張子を含むファイル名
 * @param {number[]} [widths]       列幅（文字数）
 * @param {string} [sheetName]      シート名
 */
async function exportXlsx(headers, rows, fileName, widths, sheetName) {
  const { zipSync, strToU8 } = require("fflate");
  const { saveAs } = require("file-saver");

  const lastCol = colName(headers.length - 1);
  const lastRow = rows.length + 1;

  // 列幅
  const cols = headers
    .map((h, i) => {
      const w = widths && widths[i] ? widths[i] : Math.max(10, String(h).length * 2 + 2);
      return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`;
    })
    .join("");

  // 見出し行（styleId=1: 太字＋背景＋罫線＋中央揃え）
  const headerCells = headers.map((h, i) => cellXml(colName(i) + "1", h, 1)).join("");
  const headerXml = `<row r="1" ht="20" customHeight="1">${headerCells}</row>`;

  // 明細行
  const bodyXml = rows
    .map((r, ri) => {
      const cells = r.map((v, ci) => cellXml(colName(ci) + (ri + 2), v, 0)).join("");
      return `<row r="${ri + 2}">${cells}</row>`;
    })
    .join("");

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    // 見出し行を固定して、スクロールしても列名が見えるようにする
    `<sheetViews><sheetView workbookViewId="0" tabSelected="1">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${headerXml}${bodyXml}</sheetData>` +
    // 見出し行に並べ替え・絞り込みのボタンを付ける
    `<autoFilter ref="A1:${lastCol}${lastRow}"/>` +
    `</worksheet>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${esc(sheetName || "記録")}" sheetId="1" r:id="rId1"/></sheets>` +
    // オートフィルターを「並べ替え範囲」としてExcelに認識させる
    `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">` +
    `'${esc(sheetName || "記録")}'!$A$1:$${lastCol}$${lastRow}</definedName></definedNames>` +
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
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const wbRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const zipped = zipSync(
    {
      "[Content_Types].xml": strToU8(contentTypes),
      "_rels/.rels": strToU8(rels),
      "xl/workbook.xml": strToU8(workbook),
      "xl/_rels/workbook.xml.rels": strToU8(wbRels),
      "xl/styles.xml": strToU8(styles),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    },
    { level: 6 }
  );

  saveAs(
    new Blob([zipped], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
}

exports.exportXlsx = exportXlsx;
