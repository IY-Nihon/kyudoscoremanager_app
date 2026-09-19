// 正規練習日（groups/{団体}/officialPracticeDays）を読む。
//
// 出欠画面は onSnapshot で見張っているが、AI チャットは聞かれたときに一度読めばよい。
// 同じ団体なら 5 分は控えを使う（練習日は日に何度も変わらない。読み出しの回数を増やさない）
'use strict';

const 控え = { 団体: null, 時刻: 0, 練習日: {} };
const 控えの寿命 = 5 * 60 * 1000;

/**
 * @param {string|null} 団体ID activeGroupId。無ければ空（個人モード）
 * @param {{読む?: (団体ID:string) => Promise<Object<string, any>>, 今?: number}} [道具] 検査で差し替える
 * @returns {Promise<Object<string, any>>} { 'YYYY-MM-DD': { date, created } }
 */
async function 練習日を読む(団体ID, 道具 = {}) {
  if (!団体ID) return {};
  const 今 = 道具.今 || Date.now();
  if (控え.団体 === 団体ID && 今 - 控え.時刻 < 控えの寿命) return 控え.練習日;
  const 読む = 道具.読む || Firestoreから読む;
  const 練習日 = await 読む(団体ID);
  控え.団体 = 団体ID;
  控え.時刻 = 今;
  控え.練習日 = 練習日;
  return 練習日;
}

async function Firestoreから読む(団体ID) {
  const { db } = require('./db');
  const firestore = require('firebase/firestore');
  const snap = await firestore.getDocs(firestore.collection(db, `groups/${団体ID}/officialPracticeDays`));
  const 練習日 = {};
  snap.forEach((doc) => {
    練習日[doc.id] = doc.data();
  });
  return 練習日;
}

/** 検査用。控えを空にする */
function 控えを捨てる() {
  控え.団体 = null;
  控え.時刻 = 0;
  控え.練習日 = {};
}

module.exports = { 練習日を読む, 控えを捨てる };
