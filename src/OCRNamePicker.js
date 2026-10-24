'use strict';

const { 色 } = require('./iro.js');
const React = require('react');
const { Text, StyleSheet, TextInput, View, TouchableOpacity, Modal, ScrollView } = require('./rn');
const { Ionicons } = require('@expo/vector-icons');
// 見た目の決まりは読み取りの窓と同じ
const { styles } = require('./ocrStyles');

/**
 * 写真から記録を読み取る窓の中の「名前を割り当てる」窓（2026-10-05 に OCRRecordModal.js から切り出した。動きは変えていない）。
 * 名前で探す・学年と期で開け閉めする・ゲストとして入れる。状態と処理は読み取りの窓が持ち、ここは描くだけ
 */
const 名前を割り当てる窓 = ({
  setPickerTarget,
  pickerSearch,
  setPickerSearch,
  閉じた組,
  expandedTerms,
  isEnteringGuest,
  setIsEnteringGuest,
  guestNameInput,
  setGuestNameInput,
  selectedMemberIds,
  activeGroups,
  alumniByTerm,
  toggleActiveGrade,
  toggleTerm,
  pickAssign,
  pickAssignGuest,
  submitGuest,
}) => {
  /** 人の行（メンバーも卒業生も同じ形）。男女で字の色を分け、選んである人は薄く「選択済」 */
  const 人の行 = (人, 添え書き = '') => {
    const isSelected = selectedMemberIds.has(人.id);
    const textColor = 人.gender === '男子' ? 色.青 : 人.gender === '女子' ? 色.桃 : 色.文字;
    return (
      <TouchableOpacity
        key={人.id}
        style={[styles.pickerRowIndent, isSelected && { backgroundColor: 色.地_F0F0F5, opacity: 0.8 }]}
        onPress={() => pickAssign(人)}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.pickerRowText, { color: textColor }, isSelected && { opacity: 0.5 }]}>
            {人.name}
            {添え書き}
          </Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>選択済</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setPickerTarget(null)}>
      <View style={styles.pickerOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setPickerTarget(null)}
        />
        <View style={styles.pickerBox}>
          <Text style={styles.pickerTitle}>メンバーを選択</Text>

          {/* ゲスト登録切り替えエリア */}
          {isEnteringGuest ? (
            <View style={styles.guestInputRow}>
              <TextInput
                aria-label="ゲスト名"
                style={styles.guestInput}
                placeholder="ゲスト名を入力"
                value={guestNameInput}
                onChangeText={setGuestNameInput}
                autoFocus
                onSubmitEditing={submitGuest}
              />
              <TouchableOpacity onPress={submitGuest} style={styles.guestSubmitBtn}>
                <Text style={styles.guestSubmitBtnText}>決定</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsEnteringGuest(false);
                  setGuestNameInput('');
                }}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close" size={24} color={色.灰} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerToolbarRow}>
              <TextInput
                aria-label="名前で検索"
                style={[styles.pickerSearchInput, { flex: 1, marginBottom: 0 }]}
                placeholder="名前で検索"
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
              <TouchableOpacity style={styles.guestToggleBtn} onPress={() => setIsEnteringGuest(true)}>
                <Ionicons name="person-add-outline" size={18} color={色.藍} />
                <Text style={styles.guestToggleBtnText}>ゲスト</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.pickerList}>
            <TouchableOpacity style={styles.pickerRow} onPress={() => pickAssign(null)}>
              <Text style={styles.pickerRowTextMuted}>（空欄にする）</Text>
            </TouchableOpacity>

            {/* 現役生グループアコーディオン */}
            {activeGroups.map((group) => {
              const gStr = group.grade.toString();
              // 検索中（要確認セルからの自動絞り込み含む）は、折りたたみ状態に関わらず候補を表示する
              const isOpen = pickerSearch.trim() ? true : !閉じた組.has(gStr);
              return (
                <React.Fragment key={`grade-${gStr}`}>
                  <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleActiveGrade(gStr)}>
                    <Text style={styles.accordionTitle}>
                      {group.title} ({group.members.length}人)
                    </Text>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={色.灰} />
                  </TouchableOpacity>
                  {isOpen &&
                    group.members.map((部員) => 人の行(部員, 部員.termKi ? ` (${部員.termKi}期)` : ''))}
                </React.Fragment>
              );
            })}

            {/* 卒業生グループ期別アコーディオン */}
            {alumniByTerm.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionDividerText}>卒業生</Text>
                {alumniByTerm.map((group) => {
                  const tStr = group.term.toString();
                  const isOpen = pickerSearch.trim() ? true : expandedTerms.has(tStr);
                  return (
                    <React.Fragment key={`term-${tStr}`}>
                      <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleTerm(tStr)}>
                        <Text style={styles.accordionTitle}>
                          {tStr === '999' ? '期生不明' : `${tStr}期`} ({group.members.length}人)
                        </Text>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={色.灰} />
                      </TouchableOpacity>
                      {isOpen && group.members.map((卒業生) => 人の行(卒業生))}
                    </React.Fragment>
                  );
                })}
              </View>
            )}

            {!!pickerSearch.trim() && (
              <TouchableOpacity style={styles.pickerRow} onPress={() => pickAssignGuest(pickerSearch.trim())}>
                <Text style={styles.pickerRowTextGuest}>「{pickerSearch.trim()}」をゲストとして登録</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setPickerTarget(null)}>
            <Text style={styles.pickerCloseBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

module.exports = { 名前を割り当てる窓 };
