'use strict';

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
  expandedActiveGrades,
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
  return (
    <>
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
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
                  autoFocus={true}
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
                  <Ionicons name="close" size={24} color="#8E8E93" />
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
                  autoFocus={true}
                />
                <TouchableOpacity style={styles.guestToggleBtn} onPress={() => setIsEnteringGuest(true)}>
                  <Ionicons name="person-add-outline" size={18} color="#5856D6" />
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
                const isOpen = pickerSearch.trim() ? true : expandedActiveGrades.has(gStr);
                return (
                  <React.Fragment key={`grade-${gStr}`}>
                    <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleActiveGrade(gStr)}>
                      <Text style={styles.accordionTitle}>
                        {group.title} ({group.members.length}人)
                      </Text>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                    </TouchableOpacity>
                    {isOpen &&
                      group.members.map((部員) => {
                        const isSelected = selectedMemberIds.has(部員.id);
                        const isMale = 部員.gender === '男子';
                        const isFemale = 部員.gender === '女子';
                        const textColor = isMale ? '#007AFF' : isFemale ? '#FF2D55' : '#1C1C1E';
                        return (
                          <TouchableOpacity
                            key={部員.id}
                            style={[
                              styles.pickerRowIndent,
                              isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                            ]}
                            onPress={() => pickAssign(部員)}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                              }}
                            >
                              <Text
                                style={[
                                  styles.pickerRowText,
                                  { color: textColor },
                                  isSelected && { opacity: 0.5 },
                                ]}
                              >
                                {部員.name}
                                {部員.termKi ? ` (${部員.termKi}期)` : ''}
                              </Text>
                              {isSelected && (
                                <View style={styles.selectedBadge}>
                                  <Text style={styles.selectedBadgeText}>選択済</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
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
                          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                        </TouchableOpacity>
                        {isOpen &&
                          group.members.map((卒業生) => {
                            const isSelected = selectedMemberIds.has(卒業生.id);
                            const isMale = 卒業生.gender === '男子';
                            const isFemale = 卒業生.gender === '女子';
                            const textColor = isMale ? '#007AFF' : isFemale ? '#FF2D55' : '#1C1C1E';
                            return (
                              <TouchableOpacity
                                key={卒業生.id}
                                style={[
                                  styles.pickerRowIndent,
                                  isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                ]}
                                onPress={() => pickAssign(卒業生)}
                              >
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.pickerRowText,
                                      { color: textColor },
                                      isSelected && { opacity: 0.5 },
                                    ]}
                                  >
                                    {卒業生.name}
                                  </Text>
                                  {isSelected && (
                                    <View style={styles.selectedBadge}>
                                      <Text style={styles.selectedBadgeText}>選択済</Text>
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}

              {!!pickerSearch.trim() && (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => pickAssignGuest(pickerSearch.trim())}
                >
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
    </>
  );
};

module.exports = { 名前を割り当てる窓 };
