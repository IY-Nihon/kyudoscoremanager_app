const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'JP_SettingsScreen_1023.js');
let content = fs.readFileSync(filepath, 'utf-8');

// Helper to define Japanese strings dynamically to avoid any encoding issue in the patch script file itself
const getJpString = (key) => {
  const map = {
    inquiry: String.fromCharCode(0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b), // お問い合わせ
    sub: String.fromCharCode(0x958b, 0x767a, 0x8005, 0x3078, 0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b, 0x3092, 0x9001, 0x4fe1, 0x3057, 0x307e, 0x3059), // 開発者へお問い合わせを送信します
    emailPlaceholder: String.fromCharCode(0x30e1, 0x30fc, 0x30eb, 0x30a2, 0x30c9, 0x30ec, 0x30b9), // メールアドレス
    contentPlaceholder: String.fromCharCode(0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b, 0x5185, 0x5bb9), // お問い合わせ内容
    cancel: String.fromCharCode(0x30ad, 0x30e3, 0x30f3, 0x30bb, 0x30eb), // キャンセル
    invalidEmail: String.fromCharCode(0x6709, 0x52b9, 0x306a, 0x30e1, 0x30fc, 0x30eb, 0x30a2, 0x30c9, 0x30ec, 0x30b9, 0x3092, 0x5165, 0x529b, 0x3057, 0x3066, 0x304f, 0x3060, 0x3055, 0x3044), // 有効なメールアドレスを入力してください
    errorTitle: String.fromCharCode(0x30a8, 0x30e9, 0x30fc), // エラー
    emptyContent: String.fromCharCode(0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b, 0x5185, 0x5bb9, 0x3092, 0x5165, 0x529b, 0x3057, 0x3066, 0x304f, 0x3060, 0x3055, 0x3044), // お問い合わせ内容を入力してください
    subject: String.fromCharCode(0x3010, 0x5f13, 0x9053, 0x30b9, 0x30b3, 0x30a2, 0x7ba1, 0x7406, 0x3011, 0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b, 0x304c, 0x3042, 0x308a, 0x307e, 0x3057, 0x305f), // 【弓道スコア管理】お問い合わせがありました
    sender: String.fromCharCode(0x9001, 0x4fe1, 0x5143, 0x3a), // 送信元:
    bodyContent: String.fromCharCode(0x5185, 0x5bb9, 0x3a), // 内容:
    successMsg: String.fromCharCode(0x304a, 0x554f, 0x3044, 0x5408, 0x308f, 0x305b, 0x3092, 0x9001, 0x4fe1, 0x3057, 0x307e, 0x3057, 0x305f), // お問い合わせを送信しました
    successTitle: String.fromCharCode(0x5b8c, 0x4e86), // 完了
    failMsg: String.fromCharCode(0x9001, 0x4fe1, 0x306b, 0x5931, 0x6557, 0x3057, 0x307e, 0x3057, 0x305f, 0x3002, 0x518d, 0x5ea6, 0x304a, 0x8a66, 0x3057, 0x304f, 0x3060, 0x3055, 0x3044, 0x3002), // 送信に失敗しました。再度お試しください。
    sending: String.fromCharCode(0x9001, 0x4fe1, 0x4e2d, 0x2e, 0x2e, 0x2e), // 送信中...
    send: String.fromCharCode(0x9001, 0x4fe1) // 送信
  };
  return map[key];
};

// 1. Add Firestore import
const importTarget = 'T=require("./module_427")';
if (!content.includes(importTarget)) {
  console.error("Error: Import target not found");
  process.exit(1);
}
content = content.replace(importTarget, 'T=require("./module_427"),_F=require("./JP_f_189")');
console.log("Change 1: Import added");

// 2. Add state variables
const stateTarget = '[selectedMembers,setSelectedMembers]=l.default.useState([])';
if (!content.includes(stateTarget)) {
  console.error("Error: State target not found");
  process.exit(1);
}
content = content.replace(stateTarget, '[selectedMembers,setSelectedMembers]=l.default.useState([]),[inquiryVisible,setInquiryVisible]=l.default.useState(!1),[inquiryEmail,setInquiryEmail]=l.default.useState(""),[inquiryContent,setInquiryContent]=l.default.useState(""),[inquirySending,setInquirySending]=l.default.useState(!1)');
console.log("Change 2: States added");

// 3. Add menu item before cloud-upload-outline row
const cloudIdx = content.indexOf('cloud-upload-outline');
if (cloudIdx === -1) {
  console.error("Error: cloud-upload-outline not found");
  process.exit(1);
}
const btnStart = content.lastIndexOf('(0,T.jsxs)(h.default,', cloudIdx);
if (btnStart === -1) {
  console.error("Error: cloud button start not found");
  process.exit(1);
}
const inquiryItemCode = "Je('mail-outline', " + JSON.stringify(getJpString('inquiry')) + ", () => setInquiryVisible(true), '#FF9500'),";
content = content.substring(0, btnStart) + inquiryItemCode + content.substring(btnStart);
console.log("Change 3: Menu item added");

// 4. Add Inquiry Modal JSX after CustomCalendarModal
const calIdx = content.lastIndexOf('CustomCalendarModal');
if (calIdx === -1) {
  console.error("Error: CustomCalendarModal not found");
  process.exit(1);
}
const closePattern = "})";
const searchOffset = content.indexOf(closePattern, calIdx);
if (searchOffset === -1) {
  console.error("Error: CustomCalendarModal close pattern not found");
  process.exit(1);
}
const insertPoint = searchOffset + closePattern.length;

const modalCode = `, (0,T.jsx)(f.default,{
  visible: inquiryVisible,
  transparent: true,
  animationType: "fade",
  onRequestClose: () => !inquirySending && setInquiryVisible(false),
  children: (0,T.jsxs)(o.default, {
    style: D.modalBackdrop,
    children: [
      (0,T.jsx)(d.default, {
        style: a.default.absoluteFill,
        activeOpacity: 1,
        onPress: () => !inquirySending && setInquiryVisible(false)
      }),
      (0,T.jsxs)(o.default, {
        style: D.modalContent,
        children: [
          (0,T.jsx)(n.default, {
            style: D.modalTitle,
            children: ${JSON.stringify(getJpString('inquiry'))}
          }),
          (0,T.jsx)(n.default, {
            style: { fontSize: 13, color: '#8E8E93', marginBottom: 12, textAlign: 'center' },
            children: ${JSON.stringify(getJpString('sub'))}
          }),
          (0,T.jsx)(m.default, {
            style: [D.filterInput, { width: '100%', marginBottom: 10 }],
            placeholder: ${JSON.stringify(getJpString('emailPlaceholder'))},
            value: inquiryEmail,
            onChangeText: e => setInquiryEmail(e),
            keyboardType: "email-address",
            autoCapitalize: "none",
            editable: !inquirySending
          }),
          (0,T.jsx)(m.default, {
            style: [D.filterInput, { width: '100%', marginBottom: 15, height: 120, textAlignVertical: 'top' }],
            placeholder: ${JSON.stringify(getJpString('contentPlaceholder'))},
            value: inquiryContent,
            onChangeText: e => setInquiryContent(e),
            multiline: true,
            editable: !inquirySending
          }),
          (0,T.jsxs)(o.default, {
            style: D.modalButtonsRow,
            children: [
              (0,T.jsx)(h.default, {
                style: ({ hovered: e }) => [D.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }, e && { backgroundColor: '#E5E5EA' }, x.IS_WEB && { cursor: 'pointer' }],
                onPress: () => {
                  setInquiryVisible(false);
                  setInquiryEmail('');
                  setInquiryContent('');
                },
                disabled: inquirySending,
                children: (0,T.jsx)(n.default, {
                  style: [D.modalBtnText, { color: '#007AFF' }],
                  children: ${JSON.stringify(getJpString('cancel'))}
                })
              }),
              (0,T.jsx)(h.default, {
                style: ({ hovered: e }) => [D.modalBtn, { backgroundColor: '#FF9500', flex: 1, marginLeft: 5 }, e && { backgroundColor: '#E68A00' }, x.IS_WEB && { cursor: 'pointer' }],
                onPress: async () => {
                  const emailVal = inquiryEmail;
                  const contentVal = inquiryContent;
                  if (!emailVal || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailVal)) {
                    const msg = ${JSON.stringify(getJpString('invalidEmail'))};
                    x.IS_WEB ? window.alert(msg) : u.default.alert(${JSON.stringify(getJpString('errorTitle'))}, msg);
                    return;
                  }
                  if (!contentVal.trim()) {
                    const msg = ${JSON.stringify(getJpString('emptyContent'))};
                    x.IS_WEB ? window.alert(msg) : u.default.alert(${JSON.stringify(getJpString('errorTitle'))}, msg);
                    return;
                  }
                  setInquirySending(true);
                  try {
                    await _F.addDoc(_F.collection(E.db, 'inquiries'), {
                      to: "ishi.yuuto0206@gmail.com",
                      replyTo: emailVal,
                      message: {
                        subject: ${JSON.stringify(getJpString('subject'))},
                        html: '<p><strong>' + ${JSON.stringify(getJpString('sender'))} + ' </strong>' + emailVal + '</p><p><strong>' + ${JSON.stringify(getJpString('bodyContent'))} + '</strong></p><p>' + contentVal.replace(/\\n/g, '<br>') + '</p>'
                      },
                      email: emailVal,
                      content: contentVal,
                      createdAt: new Date()
                    });
                    const msg = ${JSON.stringify(getJpString('successMsg'))};
                    x.IS_WEB ? window.alert(msg) : u.default.alert(${JSON.stringify(getJpString('successTitle'))}, msg);
                    setInquiryVisible(false);
                    setInquiryEmail('');
                    setInquiryContent('');
                  } catch (err) {
                    console.error('Inquiry send error:', err);
                    const msg = ${JSON.stringify(getJpString('failMsg'))};
                    x.IS_WEB ? window.alert(msg) : u.default.alert(${JSON.stringify(getJpString('errorTitle'))}, msg);
                  } finally {
                    setInquirySending(false);
                  }
                },
                disabled: inquirySending,
                children: (0,T.jsx)(n.default, {
                  style: [D.modalBtnText, { color: '#FFF' }],
                  children: inquirySending ? ${JSON.stringify(getJpString('sending'))} : ${JSON.stringify(getJpString('send'))}
                })
              })
            ]
          })
        ]
      })
    ]
  })
})`;

content = content.substring(0, insertPoint) + modalCode + content.substring(insertPoint);
console.log("Change 4: Modal added");

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Settings screen patched successfully!");
