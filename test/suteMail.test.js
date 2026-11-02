// 使い捨てメールアドレス（src/suteMail.js・firestore.rules の disposableEmail）
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 使い捨てのドメイン, 使い捨てか } = require('../src/suteMail');

test('使い捨てのドメインとそのサブドメインは断り、ふつうのアドレスは通す', () => {
  assert.equal(使い捨てか('a@yopmail.com'), true);
  assert.equal(使い捨てか('A@MAILINATOR.COM'), true);
  assert.equal(使い捨てか('a@x.guerrillamail.com'), true);
  assert.equal(使い捨てか('a@gmail.com'), false);
  assert.equal(使い捨てか('a@icloud.com'), false);
  assert.equal(使い捨てか('a@notyopmail.com'), false, '名前の一部が同じだけのドメインは通す');
});

test('決まりの一覧と、アプリの一覧が同じ', () => {
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const 合う = 決まり.match(/function disposableEmail\(\) \{\s*return callerEmail\(\)\.lower\(\)\.matches\('\^\.\*@\(\.\+\[\.\]\)\?\(([^)]*)\)\$'\);/);
  assert.ok(合う, 'firestore.rules に disposableEmail が無い');
  const 決まりの並び = 合う[1].split('|').map((x) => x.replace(/\[\.\]/g, '.').replace(/\[-\]/g, '-'));
  assert.deepStrictEqual(決まりの並び, 使い捨てのドメイン);
  assert.ok(決まり.includes('&& !disposableEmail()'), '団体を作るところで使い捨てを見ていない');
});
