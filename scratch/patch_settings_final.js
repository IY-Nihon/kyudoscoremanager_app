const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_SettingsScreen_1023.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. デストラクション部分の置換
const destTarget = 'const{currentFreshmanTerm:e=1,alumni:t=[],trash:I=[],shotsPerRound:w=8,updateCurrentFreshmanTerm:v,showSyncErrorPopups:A=!0,setShowSyncErrorPopups:k,syncStatus:z="IDLE",lastSyncTime:P,isFirebaseConnected:R=!0,syncAllToCloud:W,activeGroupId:L,activeGroupName:$,updateGroupName:_,activeRole:V,myMemberId:M,myMemberName:H,members:O=[],setAuth:N,isAdminMode:G,setAdminMode:Y,verifyGroupPassword:J,tagTemplates:q=[],addTagTemplate:U,removeTagTemplate:Q,autoPromotionEnabled:K=!0,setAutoPromotionEnabled:X}=(0,y.useScoreStore)()';
const destReplacement = 'const{currentFreshmanTerm:e=1,alumni:t=[],trash:I=[],shotsPerRound:w=8,updateCurrentFreshmanTerm:v,showSyncErrorPopups:A=!0,setShowSyncErrorPopups:k,syncStatus:z="IDLE",lastSyncTime:P,isFirebaseConnected:R=!0,syncAllToCloud:W,activeGroupId:L,activeGroupName:$,updateGroupName:_,activeRole:V,myMemberId:M,myMemberName:H,members:O=[],setAuth:N,isAdminMode:G,setAdminMode:Y,verifyGroupPassword:J,tagTemplates:q=[],addTagTemplate:U,removeTagTemplate:Q,autoPromotionEnabled:K=!0,setAutoPromotionEnabled:X,enableArrowLocation,arrowTargetType,setEnableArrowLocation,setArrowTargetType}=(0,y.useScoreStore)()';

if (!code.includes(destTarget)) {
  console.error("Error: destTarget not found in code!");
  process.exit(1);
}
code = code.replace(destTarget, destReplacement);

// 2. セクションUIの置換
// 「'member'!==V&&Ye('\\u7ba1\\u7406\\u8005\\u8a2d\\u5b9a'」の直前に「矢所の記録」UIを挿入します
// Unicode表記での「管理設定」または「管理者設定」など、エスケープのされ方を考慮
const sectionTarget = ",'member'!==V&&Ye('\\u7ba1\\u7406\\u8005\\u8a2d\\u5b9a'";

// 的選択肢は kasumi36, hoshi36, hoshi24 の3つ。一般メンバー（V='member'）でも表示されるように制御を外す。
const sectionReplacement = ",Ye('\\u77e2\\u6240\\u306e\\u8a18\\u9332',(0,T.jsxs)(T.Fragment,{children:[(0,T.jsxs)(o.default,{style:D.item,children:[(0,T.jsxs)(o.default,{style:[D.itemLeft,{flex:1}],children:[(0,T.jsx)(p.Ionicons,{name:\"location-outline\",size:22,color:\"#34C759\",style:D.itemIcon}),(0,T.jsxs)(o.default,{style:{flex:1,paddingRight:8},children:[(0,T.jsx)(n.default,{style:D.itemText,children:\"\\u77e2\\u6240\\u306e\\u8a18\\u9332\\u6a5f\\u80fd\\u3092\\u6709\\u52b9\\u5316\"}),(0,T.jsx)(n.default,{style:{fontSize:11,color:'#8E8E93',marginTop:2},children:\"\\u8a18\\u9332\\u6642\\u306b\\u77e2\\u6240\\u3082\\u8a18\\u9332\\u3067\\u304d\\u308b\\u3088\\u3046\\u306b\\u3057\\u307e\\u3059\"})]})]}),(0,T.jsx)(c.default,{value:enableArrowLocation,onValueChange:setEnableArrowLocation,trackColor:{false:'#D1D1D6',true:'#34C759'}})]}),enableArrowLocation&&(0,T.jsxs)(o.default,{style:[D.item,{flexDirection:'column',alignItems:'stretch'}],children:[(0,T.jsxs)(o.default,{style:[D.itemLeft,{marginBottom:8}],children:[(0,T.jsx)(p.Ionicons,{name:\"disc-outline\",size:22,color:\"#34C759\",style:D.itemIcon}),(0,T.jsx)(n.default,{style:D.itemText,children:\"\\u4f7f\\u7528\\u3059\\u308b\\u7684\\u306e\\u7a2e\\u985e\"})]}),(0,T.jsxs)(o.default,{style:D.flexRow,children:[(0,T.jsx)(d.default,{onPress:()=>setArrowTargetType('kasumi36'),style:[D.radioBtn,'kasumi36'===arrowTargetType&&D.radioBtnActive],children:(0,T.jsx)(n.default,{style:[D.radioBtnText,'kasumi36'===arrowTargetType&&D.radioBtnTextActive],children:\"\\u971e\\u7684\"})}),(0,T.jsx)(d.default,{onPress:()=>setArrowTargetType('hoshi36'),style:[D.radioBtn,'hoshi36'===arrowTargetType&&D.radioBtnActive],children:(0,T.jsx)(n.default,{style:[D.radioBtnText,'hoshi36'===arrowTargetType&&D.radioBtnTextActive],children:\"\\u661f\\u7684\"})}),(0,T.jsx)(d.default,{onPress:()=>setArrowTargetType('hoshi24'),style:[D.radioBtn,'hoshi24'===arrowTargetType&&D.radioBtnActive],children:(0,T.jsx)(n.default,{style:[D.radioBtnText,'hoshi24'===arrowTargetType&&D.radioBtnTextActive],children:\"\\u661f\\u7684(\\u516b\\u5bf8)\"})})]})]})]})),'member'!==V&&Ye('\\u7ba1\\u7406\\u8005\\u8a2d\\u5b9a'";

if (!code.includes(sectionTarget)) {
  console.error("Error: sectionTarget not found in code!");
  process.exit(1);
}
code = code.replace(sectionTarget, sectionReplacement);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Settings screen patched with 3 target options successfully!");
