'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { 半角にする, 字をそろえる, IDを整える, メールを整える } = require('../src/totonoeru');

test('全角の英数字と記号を半角にする。漢字・かなは触らない', () => {
  assert.equal(半角にする('１２３４５６'), '123456');
  assert.equal(半角にする('ＡＢｃ＠ｘ．ｊｐ'), 'ABc@x.jp');
  assert.equal(半角にする('弓道１'), '弓道1');
  assert.equal(半角にする(null), '');
  assert.equal(半角にする(undefined), '');
});

test('見えない空白（全角の空白・幅の無い空白・つなぎの字・BOM・改行）を除く。大文字小文字はそのまま', () => {
  assert.equal(字をそろえる(' 9f86d081\uFEFF '), '9f86d081');
  assert.equal(字をそろえる('12\u200B34\n56'), '123456');
  assert.equal(字をそろえる('ab\u200Ccd\u200Def\u2060'), 'abcdef');
  assert.equal(字をそろえる('aB3dE'), 'aB3dE');
});

test('団体ID・個人ID：全角と空白を直して大文字に', () => {
  assert.equal(IDを整える(' １２３４５６\u3000'), '123456');
  assert.equal(IDを整える('abc123'), 'ABC123');
  assert.equal(IDを整える(undefined), '');
});

test('メール：全角と空白を直して小文字に（認証と決まりは小文字で比べる）', () => {
  assert.equal(メールを整える(' Tanaka@Example.COM '), 'tanaka@example.com');
  assert.equal(メールを整える('ｔａｎａｋａ＠ｅｘａｍｐｌｅ．ｃｏｍ'), 'tanaka@example.com');
  assert.equal(メールを整える('a\u200B@b.jp'), 'a@b.jp');
});
