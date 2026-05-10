import { create } from 'zustand';
import { Archer, Member, SessionRecord, Mark, Gender, PracticeRecord, Alumni, SavedData } from '../models/types';
import { db, rtdb } from '../services/firebase';
import { 
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, limit, writeBatch 
} from 'firebase/firestore';
import { 
  ref, set as rtdb_set, onValue, off, get as rtdb_get, push, update, serverTimestamp, remove 
} from 'firebase/database';
import { Platform, Alert } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = '未同期' | '同期中' | '同期済み' | '同期エラー';

/**
 * Firebase RTDB から取得したデータが配列またはオブジェクト形式で届いた場合に
 * 正しい長さの配列として復元するヘルパー（空文字補填付き）
 */
const getFirebaseArray = (data: any, expectedLength?: number): any[] => {
  if (!data) return expectedLength ? Array(expectedLength).fill('') : [];
  
  if (Array.isArray(data)) {
    const result = data.map(v => (v === null || v === undefined) ? '' : v);
    if (expectedLength && result.length < expectedLength) {
      return [...result, ...Array(expectedLength - result.length).fill('')];
    }
    return result;
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    const isNumericIdx = keys.length > 0 && keys.every(k => !isNaN(Number(k)));
    if (isNumericIdx) {
      const maxIdx = Math.max(...keys.map(Number));
      const len = expectedLength ? Math.max(expectedLength, maxIdx + 1) : maxIdx + 1;
      const arr = Array(len).fill('');
      keys.forEach(k => {
        const idx = Number(k);
        arr[idx] = data[k] === null || data[k] === undefined ? '' : data[k];
      });
      return arr;
    }
    return Object.values(data);
  }
  return [];
};

/**
 * Firebase RTDBから受信したarcherデータを正しく復元する
 * （Firebase は false / '' / null / 0 などを保存しないため、デフォルト値を補填する）
 */
const reconstructArcher = (data: any, shotsPerRound: number): any => {
  if (!data || typeof data !== 'object') return null;
  return {
    id: data.id || '',
    name: data.name || '',
    gender: data.gender || '未設定',
    grade: typeof data.grade === 'number' ? data.grade : 1,
    marks: getFirebaseArray(data.marks, data.isSeparator ? 0 : shotsPerRound),
    isSeparator: data.isSeparator === true,
    isTotalCalculator: data.isTotalCalculator === true,
    isGuest: data.isGuest === true,
    memberId: data.memberId || undefined,
    lockedBlocks: data.lockedBlocks || {},
    substitutions: data.substitutions || {},
    substitutionIds: data.substitutionIds || {},
    lastModified: data.lastModified || 0,
  };
};

/**
 * ライブ同期用にarcherデータをRTDB書き込み可能な形式に変換
 * （marks は marks_by_id に分離して保存するため、この関数ではマークを含めない）
 */
const cleanArchersForRTDB = (archers: any[], _shotsPerRound?: number) => {
  return JSON.parse(JSON.stringify(
    archers.map(a => ({
      id: a.id,
      name: a.name || '',
      gender: a.gender || '未設定',
      grade: a.grade || 0,
      isSeparator: a.isSeparator || false,
      isTotalCalculator: a.isTotalCalculator || false,
      isGuest: a.isGuest || false,
      memberId: a.memberId || null,
      lockedBlocks: a.lockedBlocks || {},
      substitutions: a.substitutions || {},
      lastModified: a.lastModified || 0,
      substitutionIds: a.substitutionIds || {},
    }))
  ));
};

/**
 * 2つのコレクション（ローカルとクラウド）をIDベースでマージする
 * lastModified が新しい方を優先する
 */
const mergeCollections = <T extends { id: string; lastModified?: number }>(
  local: T[],
  cloud: T[]
): T[] => {
  const map = new Map<string, T>();
  
  // まずローカルをすべて入れる
  (local || []).forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  
  // クラウドデータで上書きまたは追加
  (cloud || []).forEach(cloudItem => {
    if (!cloudItem || !cloudItem.id) return;
    
    const localItem = map.get(cloudItem.id);
    if (!localItem) {
      // ローカルになければ追加
      map.set(cloudItem.id, cloudItem);
    } else {
      // 両方にある場合は lastModified が新しい方を採用
      const localTime = localItem.lastModified || 0;
      const cloudTime = cloudItem.lastModified || 0;
      
      if (cloudTime >= localTime) {
        map.set(cloudItem.id, cloudItem);
      }
    }
  });
  
  return Array.from(map.values());
};

/**
 * ライブ同期: 構造変更時に全archer配列をRTDBに一括送信
 * マークは marks_by_id/ に携帯，アーチャー構造は archers/ に保存
 */
const pushLiveAll = (
  liveSessionName: string,
  archers: any[],
  shotsPerRound: number
): void => {
  const now = Date.now();
  const liveRef = ref(rtdb, `live_sessions/${liveSessionName}/state`);
  const structArchers = cleanArchersForRTDB(archers, shotsPerRound);
  const archerTimestamps: Record<string, number> = {};
  archers.forEach(a => {
    if (a && a.id) archerTimestamps[a.id] = a.lastModified || 0;
  });
  
  const markMap: Record<string, any> = {};
  archers.forEach(a => {
    if (a && a.id && !a.isSeparator) markMap[a.id] = a.marks || [];
  });
  
  const updateData: any = {
    archers: structArchers,
    marks_by_id: markMap,
    archer_timestamps: archerTimestamps,
    shotsPerRound,
    timestamp: now,
    status: 'active'
    // reset_at: null を削除。リセット時刻を保持することで、
    // 参加者がどのタイミングでメッセージを受け取ってもリセット通知を出せるようにする。
  };
  // ホストの自爆（自分の送信による再レンダラグ）を防ぐためのフラグ更新
  useScoreStore.getState().updateState({ lastPushedTimestamp: now });
  
  update(liveRef, updateData).catch(e => console.error('pushLiveAll Error:', e));
};



/**
 * ライブ同期: マーク単体のアトミック更新（競合安全）
 * update()を使い、他のアーチャーのデータを上書きしない
 */
const pushLiveMark = (
  liveSessionName: string,
  archerId: string,
  shotIndex: number,
  mark: string,
  archerLastModified: number
): void => {
  const now = Date.now();
  const liveRef = ref(rtdb, `live_sessions/${liveSessionName}/state`);
  const updateData = {
    [`marks_by_id/${archerId}/${shotIndex}`]: mark,
    [`archer_timestamps/${archerId}`]: archerLastModified,
    timestamp: now
  };
  useScoreStore.getState().updateState({ lastPushedTimestamp: now });
  update(liveRef, updateData).catch(e => console.error('pushLiveMark Error:', e));
};

/**
 * 受信したRTDBデータからarcher配列を再構築（構造 + マークを合体）
 */
const reconstructArchersFromRTDB = (data: any): { archers: any[], shotsPerRound: number } => {
  const shots = (typeof data.shotsPerRound === 'number') ? data.shotsPerRound : 8;
  const rawArchers = getFirebaseArray(data.archers);
  const marksByid: Record<string, any> = data.marks_by_id || {};
  // archer_timestamps: 各アーチャーの最終更新時刻（pushLiveMarkで更新される）
  const archerTimestamps: Record<string, number> = data.archer_timestamps || {};

  const archers = rawArchers
    .map((a: any) => {
      if (!a) return null;
      const reconstructed = reconstructArcher(a, shots);
      if (!reconstructed) return null;
      if (!a.isSeparator && marksByid[a.id]) {
        reconstructed.marks = getFirebaseArray(marksByid[a.id], shots);
        // archer_timestampsがあれば lastModified をそこから取る（pushLiveMark履歴専用）
        reconstructed.lastModified = Math.max(
          reconstructed.lastModified || 0,
          archerTimestamps[a.id] || 0
        );
      }
      return reconstructed;
    })
    .filter(Boolean);

  return { archers, shotsPerRound: shots };
};


interface ScoreState {
  archers: Archer[];
  members: Member[];
  alumni: Alumni[];
  history: PracticeRecord[];
  sessions: SessionRecord[];
  trash: SessionRecord[];
  
  shotsPerRound: number;
  activeSessionID: string | null;
  historyStack: Archer[][];
  redoStack: Archer[][];
  viewScale: number;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  lastLocalChange: number;
  lastResetHandled: number;
  lastPushedTimestamp: number;
  isFirebaseConnected: boolean;
  showSyncErrorPopups: boolean;
  
  historyViewMode: 'list' | 'detail';
  selectedHistorySessionId: string | null;
  isAdminMode: boolean;
  isAdminModePending: boolean;
  isLiveActive: boolean;
  isHost: boolean;
  liveSessionName: string | null;
  isIncomingLiveSync: boolean;
  liveSessionsList: string[];
  includeInStats: boolean;
  isHydrated: boolean;
  showTrash: boolean;
  showAlumniInAnalysis: boolean;
  showAlumniInPicker: boolean;
  currentFreshmanTerm: number;

  // Actions
  setIncludeInStats: (include: boolean) => void;
  addArcher: (index?: number, gender?: Gender) => void;
  addSeparator: (index?: number) => void;
  addTotalCalculator: (index?: number) => void;
  deleteArcher: (id: string) => void;
  toggleMark: (archerId: string, shotIndex: number) => void;
  updateMark: (archerId: string, shotIndex: number, mark: Mark) => void;
  clearArcherMarks: (archerId: string) => void;
  toggleLock: (archerId: string, blockIdx: number) => void;
  setArcherMember: (archerId: string, member: Member | null) => void;
  setArcherGuestName: (archerId: string, name: string) => void;
  setArcherGender: (archerId: string, gender: Gender) => void;
  undo: () => void;
  redo: () => void;
  addMember: (name: string, gender: Gender, grade: number, termKi?: number) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  saveSession: (title: string, note: string, includeInStats: boolean) => Promise<void>;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteMultipleSessions: (sessionIds: string[]) => Promise<void>;
  restoreSession: (sessionId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  deleteTrashItems: (trashIds: string[]) => Promise<void>;
  restoreTrashItems: (trashIds: string[]) => Promise<void>;
  setShotsPerRound: (num: number) => void;
  loadData: () => void;
  clearAllData: () => void;
  importData: (data: SavedData) => Promise<void>;
  setAdminMode: (admin: boolean) => void;
  setIsAdminModePending: (pending: boolean) => void;
  setHistoryViewMode: (mode: 'list' | 'detail') => void;
  setSelectedHistorySessionId: (id: string | null) => void;
  setViewScale: (scale: number) => void;
  setIsLiveActive: (active: boolean) => void;
  startLiveSync: (sessionName: string) => Promise<boolean>;
  joinLiveSync: (sessionName: string) => void;
  stopLiveSync: (skipReset?: boolean) => void;
  fetchActiveLiveSessions: () => Promise<void>;
  listenToLiveSessions: () => () => void;
  setShowSyncErrorPopups: (show: boolean) => void;
  syncSessions: () => Promise<void>;
  syncAllToCloud: () => Promise<void>;
  setShowAlumniInAnalysis: (show: boolean) => void;
  setShowAlumniInPicker: (show: boolean) => void;
  updateCurrentFreshmanTerm: (term: number) => Promise<void>;
  updateState: (partial: Partial<ScoreState> | ((state: ScoreState) => Partial<ScoreState>)) => void;
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      archers: [],
      members: [],
      alumni: [],
      history: [],
      sessions: [],
      trash: [],
      
      shotsPerRound: 8,
      activeSessionID: null,
      historyStack: [],
      redoStack: [],
      viewScale: 1.0,
      syncStatus: '未同期',
      lastSyncTime: null,
      isFirebaseConnected: true,
      showSyncErrorPopups: true,
      includeInStats: true,
      isHydrated: false,
      lastLocalChange: 0,
      lastResetHandled: 0,
      lastPushedTimestamp: 0,
      showTrash: false,
      showAlumniInAnalysis: false,
      showAlumniInPicker: false,
      currentFreshmanTerm: 70, // Default value, user can change in settings

      setShowAlumniInAnalysis: (show: boolean) => set({ showAlumniInAnalysis: show }),
      setShowAlumniInPicker: (show: boolean) => set({ showAlumniInPicker: show }),

      setIncludeInStats: (include) => set({ includeInStats: include }),
      
      historyViewMode: 'list',
      selectedHistorySessionId: null,
      isAdminMode: false,
      isAdminModePending: false,
      isLiveActive: false,
      isHost: false,
      liveSessionName: null,
      isIncomingLiveSync: false,
      liveSessionsList: [],
      showTrash: false,

      addArcher: (index, gender) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const newArcher: Archer = {
          id: Math.random().toString(36).substring(2, 11),
          name: '',
          marks: Array(get().shotsPerRound || 8).fill('') as Mark[],
          gender: (gender as Gender) || '未設定',
          grade: 1,
          isGuest: false,
          isSeparator: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };
        const next = (typeof index === 'number' && !isNaN(index)) ? [...currentArchers] : [...currentArchers, newArcher];
        if (typeof index === 'number' && !isNaN(index)) {
            const safeIndex = Math.max(0, Math.min(index, next.length));
            next.splice(safeIndex, 0, newArcher);
        }
        set({ 
          archers: next,
          historyStack: [...get().historyStack, currentArchers],
          redoStack: [],
          lastLocalChange: Date.now()
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, next, shotsPerRound);
      },

      addSeparator: (index) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const newSep: Archer = {
          id: 'sep-' + Math.random().toString(36).substring(2, 11),
          name: '---',
          marks: [],
          isSeparator: true,
          gender: '未設定',
          grade: 0,
          isGuest: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };
        const next = typeof index === 'number' ? [...currentArchers] : [...currentArchers, newSep];
        if (typeof index === 'number') next.splice(index, 0, newSep);

        set({ 
          archers: next,
          historyStack: [...get().historyStack, currentArchers],
          redoStack: [],
          lastLocalChange: Date.now()
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, next, shotsPerRound);
      },

      addTotalCalculator: (index) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const newTotal: Archer = {
          id: 'total-' + Math.random().toString(36).substring(2, 11),
          name: '計',
          marks: Array(get().shotsPerRound || 8).fill('') as Mark[],
          isTotalCalculator: true,
          gender: '未設定',
          grade: 0,
          isGuest: false,
          isSeparator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };
        const next = typeof index === 'number' ? [...currentArchers] : [...currentArchers, newTotal];
        if (typeof index === 'number') next.splice(index, 0, newTotal);

        set({ 
          archers: next,
          historyStack: [...get().historyStack, currentArchers],
          redoStack: [],
          lastLocalChange: Date.now()
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, next, shotsPerRound);
      },

      deleteArcher: (id) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const next = currentArchers.filter((a) => a && a.id !== id);
        const now = Date.now();
        set({
          historyStack: [...get().historyStack, currentArchers],
          redoStack: [],
          archers: next,
          lastLocalChange: now
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, next, shotsPerRound);
      },

      updateMark: (archerId, index, mark) => {
        const { archers, isLiveActive, liveSessionName } = get();
        const now = Date.now();
        const updatedArchers = (archers || []).map(a => {
          if (a.id === archerId) {
            const newMarks = [...(a.marks || [])];
            newMarks[index] = mark;
            return { ...a, marks: newMarks, lastModified: now };
          }
          return a;
        });
        set({ archers: updatedArchers, lastLocalChange: now });
        // マークはアトミックな部分更新（競合安全） + archer_timestampsで衝突解決基準を記録
        if (isLiveActive && liveSessionName) {
          pushLiveMark(liveSessionName, archerId, index, mark, now);
        }
      },

      toggleMark: (archerId, index) => {
        const { archers, isLiveActive, liveSessionName } = get();
        const now = Date.now();
        let nextMark = '';
        const updatedArchers = (archers || []).map(a => {
          if (a.id === archerId) {
            const newMarks = [...(a.marks || [])];
            const current = newMarks[index];
            const next = current === '' ? '○' : (current === '○' ? '×' : '');
            newMarks[index] = next;
            nextMark = next;
            return { ...a, marks: newMarks, lastModified: now };
          }
          return a;
        });
        set({ archers: updatedArchers, lastLocalChange: now });
        // マークはアトミックな部分更新（競合安全） + archer_timestampsで衝突解決基準を記録
        if (isLiveActive && liveSessionName) {
          pushLiveMark(liveSessionName, archerId, index, nextMark, now);
        }
      },

      clearArcherMarks: (archerId) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const now = Date.now();
        const updatedArchers = currentArchers.map((a) =>
          (a && a.id === archerId) ? { ...a, marks: Array(get().shotsPerRound).fill('') as Mark[], lastModified: now } : a
        );
        set({
          historyStack: [...get().historyStack, currentArchers],
          redoStack: [],
          lastLocalChange: now,
          archers: updatedArchers,
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, updatedArchers, shotsPerRound);
      },

      toggleLock: (archerId, blockIdx) => {
        const { archers } = get();
        const archersArr = Array.isArray(archers) ? archers : [];
        const targetIdx = archersArr.findIndex(a => a && a.id === archerId);
        if (targetIdx === -1) return;
        
        const targetArcher = archersArr[targetIdx];
        const newLockState = !(targetArcher.lockedBlocks?.[blockIdx]);
        
        let startIdx = targetIdx;
        while (startIdx > 0 && archersArr[startIdx - 1] && !archersArr[startIdx - 1].isSeparator && !archersArr[startIdx - 1].isTotalCalculator) {
          startIdx--;
        }
        const now = Date.now();
        const updatedArchers = archersArr.map((a, idx) => {
          if (a && idx >= startIdx && idx <= targetIdx) {
            const newLocked = { ...(a.lockedBlocks || {}) };
            newLocked[blockIdx] = newLockState;
            // lastModifiedを更新して他端末に変化を通知
            return { ...a, lockedBlocks: newLocked, lastModified: now };
          }
          return a;
        });
        
        set({
          lastLocalChange: now,
          archers: updatedArchers,
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, updatedArchers, shotsPerRound);
      },

      setArcherMember: (archerId, member) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const updatedArchers = currentArchers.map((a) =>
          (a && a.id === archerId)
            ? {
                ...a,
                name: member ? member.name : '',
                gender: member ? member.gender : '未設定',
                grade: member ? member.grade : 1,
                memberId: member ? member.id : undefined,
                isGuest: false,
                lastModified: Date.now(),
              }
            : a
        );
        set({
          lastLocalChange: Date.now(),
          archers: updatedArchers,
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, updatedArchers, shotsPerRound);
      },

      setArcherGuestName: (archerId, name) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const updatedArchers = currentArchers.map((a) =>
          (a && a.id === archerId)
            ? {
                ...a,
                name,
                isGuest: true,
                // ゲストに変更時はgender・ memberIdをリセット（性別アイコン残存バグ修正）
                gender: '未設定' as Gender,
                memberId: undefined,
                lastModified: Date.now(),
              }
            : a
        );
        set({ lastLocalChange: Date.now(), archers: updatedArchers });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, updatedArchers, shotsPerRound);
      },

      setArcherGender: (archerId, gender) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const updatedArchers = currentArchers.map((a) =>
          (a && a.id === archerId) ? { ...a, gender, lastModified: Date.now() } : a
        );
        set({ lastLocalChange: Date.now(), archers: updatedArchers });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, updatedArchers, shotsPerRound);
      },

      undo: () => {
        const { historyStack, archers } = get();
        if (historyStack.length === 0) return;
        const previous = historyStack[historyStack.length - 1];
        set({
          historyStack: historyStack.slice(0, -1),
          redoStack: [...get().redoStack, archers],
          archers: previous,
          lastLocalChange: Date.now(),
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, previous, shotsPerRound);
      },

      redo: () => {
        const { redoStack, archers } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        set({
          redoStack: redoStack.slice(0, -1),
          historyStack: [...get().historyStack, archers],
          archers: next,
          lastLocalChange: Date.now(),
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, next, shotsPerRound);
      },

      addMember: (name, gender, grade, termKi) => {
        const newM: Member = {
          id: Math.random().toString(36).substring(2, 11),
          name,
          gender,
          grade,
          termKi,
          lastModified: Date.now(),
        };
        set({ 
          members: [...get().members, newM],
          lastLocalChange: Date.now() 
        });
        setDoc(doc(db, 'members', newM.id), newM).catch(e => console.error('Add Member Sync Error:', e));
      },

      updateMember: (id, updates) => {
        const updatedMembers = get().members.map((m) =>
          m.id === id ? { ...m, ...updates, lastModified: Date.now() } : m
        );
        set({ 
          members: updatedMembers,
          lastLocalChange: Date.now()
        });
        const updated = updatedMembers.find(m => m.id === id);
        if (updated) {
          setDoc(doc(db, 'members', id), updated).catch(e => console.error('Update Member Sync Error:', e));
        }
      },

      deleteMember: (id) => {
        set({ 
          members: get().members.filter((m) => m.id !== id),
          lastLocalChange: Date.now()
        });
        deleteDoc(doc(db, 'members', id)).catch(e => console.error('Delete Member Sync Error:', e));
      },

      saveSession: async (title, note, includeInStats) => {
        const id = get().activeSessionID || Math.random().toString(36).substring(2, 11);
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        
        const newSession: SessionRecord & { archerNames: string[] } = {
          id,
          date: Date.now(),
          title,
          note,
          archers: currentArchers,
          archerNames: Array.from(new Set(currentArchers.map(a => a ? (a.name || '') : '').filter(Boolean))),
          shotCount: get().shotsPerRound || 8,
          includeInStats,
          syncStatus: '未同期', // 初期状態は未同期
          lastModified: Date.now(),
        };

        // まずローカルに保存
        set({ 
          sessions: [newSession, ...get().sessions.filter(s => s.id !== id)], 
          activeSessionID: id,
          lastLocalChange: Date.now()
        });

        try {
          if (get().liveSessionName) {
            const liveRef = ref(rtdb, `live_sessions/${get().liveSessionName}`);
            await update(ref(rtdb, `live_sessions/${get().liveSessionName}/state`), {
              status: 'finished',
              timestamp: Date.now()
            });
            setTimeout(async () => {
              try { await remove(liveRef); } catch (e) { /* ignore */ }
            }, 2000);
          }
          get().stopLiveSync(true);
          set({ isLiveActive: false, isHost: false, liveSessionName: null });
          
          const safeSession = JSON.parse(JSON.stringify(newSession));
          // クラウドに送信する際は同期済みにマーク
          safeSession.syncStatus = '同期済み';
          await setDoc(doc(db, 'sessions', id), safeSession);
          
          // 送信成功したらローカルの状態も更新
          const updatedSessions = get().sessions.map(s => s.id === id ? { ...s, syncStatus: '同期済み' as const } : s);
          set({ 
            sessions: updatedSessions,
            syncStatus: '同期済み', 
            lastSyncTime: Date.now() 
          });
        } catch (e) {
          console.error('Save Session Error:', e);
          // 失敗してもローカルには '未同期' として残っている
          set({ syncStatus: '同期エラー' });
          if (get().showSyncErrorPopups) {
            const message = 'クラウドへの保存に失敗しました。オフラインデータとして保存されました。';
            if (Platform.OS === 'web') {
              window.alert(`同期エラー: ${message}`);
            } else {
              Alert.alert('同期エラー', message);
            }
          }
        }
      },

      loadSession: (sessionId) => {
        const sessions = Array.isArray(get().sessions) ? get().sessions : [];
        const session = sessions.find((s) => s && s.id === sessionId);
        if (session) {
          set({
            archers: session.archers,
            shotsPerRound: session.shotCount,
            activeSessionID: session.id,
            historyStack: [],
            redoStack: [],
          });
        }
      },

      deleteSession: async (sessionId) => {
        const currentSessions = Array.isArray(get().sessions) ? get().sessions : [];
        const session = currentSessions.find(s => s && s.id === sessionId);
        const newSessions = currentSessions.filter((s) => s && s.id !== sessionId);
        if (session) {
          set({ sessions: newSessions, trash: [...get().trash, { ...session, syncStatus: 'trashed' }] });
        } else {
          set({ sessions: newSessions });
        }
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'sessions', sessionId));
          if (session) {
            const safeTrash = JSON.parse(JSON.stringify({ ...session, syncStatus: 'trashed' }));
            batch.set(doc(db, 'trash', sessionId), safeTrash);
          }
          await batch.commit();
        } catch (e) {
          console.error('Delete Session Error:', e);
        }
      },

      emptyTrash: async () => {
        const { trash } = get();
        const ids = (trash || []).map(s => s.id);
        get().deleteTrashItems(ids);
      },

      deleteTrashItems: async (trashIds: string[]) => {
        try {
          const { trash, isFirebaseConnected } = get();
          
          set({ trash: (trash || []).filter(s => !trashIds.includes(s.id)) });

          if (isFirebaseConnected && trashIds.length > 0) {
            const batch = writeBatch(db);
            trashIds.forEach(id => {
              batch.delete(doc(db, 'trash', id));
            });
            await batch.commit();
          }
        } catch (e) {
          console.error('Delete trash items error:', e);
        }
      },

      deleteMultipleSessions: async (sessionIds) => {
        const toTrash = get().sessions.filter(s => sessionIds.includes(s.id));
        const remaining = get().sessions.filter(s => !sessionIds.includes(s.id));
        set({ sessions: remaining, trash: [...get().trash, ...toTrash.map(s => ({ ...s, syncStatus: 'trashed' }))] });
        try {
          const batch = writeBatch(db);
          sessionIds.forEach(id => batch.delete(doc(db, 'sessions', id)));
          toTrash.forEach(s => {
            const safeTrash = JSON.parse(JSON.stringify({ ...s, syncStatus: 'trashed' }));
            batch.set(doc(db, 'trash', s.id), safeTrash);
          });
          await batch.commit();
        } catch (e) {
          console.error('Batch Delete Error:', e);
        }
      },

      restoreSession: async (sessionId: string) => {
        const trash = Array.isArray(get().trash) ? get().trash : [];
        const session = trash.find(s => s && s.id === sessionId);
        if (!session) return;
        const restored = { ...session, syncStatus: 'synced' };
        const sessions = Array.isArray(get().sessions) ? get().sessions : [];
        set({
          trash: trash.filter(s => s && s.id !== sessionId),
          sessions: [restored as SessionRecord, ...sessions]
        });
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'trash', sessionId));
          const safeRestored = JSON.parse(JSON.stringify(restored));
          batch.set(doc(db, 'sessions', sessionId), safeRestored);
          await batch.commit();
        } catch (e) {
          console.error('Restore Session Error:', e);
        }
      },

      restoreTrashItems: async (trashIds: string[]) => {
        if (!trashIds || trashIds.length === 0) return;
        const currentTrash = get().trash || [];
        const toRestore = currentTrash.filter(t => trashIds.includes(t.id));
        const remaining = currentTrash.filter(t => !trashIds.includes(t.id));
        
        const restoredSessions = toRestore.map(s => ({ ...s, syncStatus: 'synced' }));
        set({ trash: remaining, sessions: [...restoredSessions, ...get().sessions] });
        
        try {
          const batch = writeBatch(db);
          trashIds.forEach(id => batch.delete(doc(db, 'trash', id)));
          restoredSessions.forEach(s => batch.set(doc(db, 'sessions', s.id), JSON.parse(JSON.stringify(s))));
          await batch.commit();
        } catch (e) {
          console.error('Restore Trash Items Error:', e);
        }
      },

      resetCurrentSession: (syncToLive = true) => {
        const { isLiveActive, liveSessionName } = get();
        const now = Date.now();
        
        const newState: any = {
          archers: [],
          historyStack: [],
          redoStack: [],
          activeSessionID: null,
          lastLocalChange: now,
        };

        // 明示的なリセット (syncToLive=true) の場合のみ RTDB にリセットシグナルを送る
        if (syncToLive && isLiveActive && liveSessionName) {
          const liveRef = ref(rtdb, `live_sessions/${liveSessionName}/state`);
          // 自分自身の送信を確実にスキップし、通知の二重発生を防ぐため
          // 同期前に timestamp と lastResetHandled を自分でも更新しておく
          newState.lastPushedTimestamp = now;
          newState.lastResetHandled = now;

          // アトミックにステートを更新
          set(newState);

          update(liveRef, {
            reset_at: now,
            timestamp: now,
            archers: null,
            marks_by_id: null,
            archer_timestamps: null,
          }).catch(e => console.error('Reset Live Sync Error:', e));
        } else {
          set(newState);
        }
      },
      updateState: (partial) => set(partial as any),
      updateSession: async (sessionId: string, updates: Partial<SessionRecord>) => {
        const oldSessions = Array.isArray(get().sessions) ? get().sessions : [];
        const updatedSessions = oldSessions.map(s => 
          (s && s.id === sessionId) ? { ...s, ...updates, lastModified: Date.now() } : s
        );
        set({ sessions: updatedSessions });
        try {
          const updated = updatedSessions.find(s => s && s.id === sessionId);
          if (updated) {
            const safeSession = JSON.parse(JSON.stringify(updated));
            await setDoc(doc(db, 'sessions', sessionId), safeSession);
          }
        } catch (e) {
          console.error('Update Session Sync Error:', e);
        }
      },
      
      setSubstitution: (archerId, shotIdx, memberName, memberId) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const nextArchers = currentArchers.map(a => {
            if (a && a.id === archerId) {
                const subs = { ...(a.substitutions || {}) };
                if (memberName === '') {
                  delete subs[shotIdx];
                  // IDもあれば消す
                  if (a.substitutionIds) {
                    const nextIds = { ...a.substitutionIds };
                    delete nextIds[shotIdx];
                    return { ...a, substitutions: subs, substitutionIds: nextIds, lastModified: Date.now() };
                  }
                } else {
                  subs[shotIdx] = memberName;
                  const nextIds = { ...(a.substitutionIds || {}) };
                  if (memberId) nextIds[shotIdx] = memberId;
                  else delete nextIds[shotIdx];
                  return { ...a, substitutions: subs, substitutionIds: nextIds, lastModified: Date.now() };
                }
                return { ...a, substitutions: subs, lastModified: Date.now() };
            }
            return a;
        });
        set({ 
            archers: nextArchers,
            lastLocalChange: Date.now()
        });
        const { isLiveActive, liveSessionName, shotsPerRound } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, nextArchers, shotsPerRound);
      },


      setShotsPerRound: (num) => {
        const currentArchers = Array.isArray(get().archers) ? get().archers : [];
        const newArchers = currentArchers.map((a) => {
          if (!a || a.isSeparator) return a;
          const currentMarks = Array.isArray(a.marks) ? a.marks : [];
          const newMarks = [...currentMarks];
          if (num > currentMarks.length) {
            newMarks.push(...(Array(num - currentMarks.length).fill('') as Mark[]));
          } else {
            newMarks.splice(num);
          }
          return { ...a, marks: newMarks, lastModified: Date.now() };
        });
        set({ 
          shotsPerRound: num, 
          archers: newArchers,
          lastLocalChange: Date.now()
        });
        const { isLiveActive, liveSessionName } = get();
        if (isLiveActive && liveSessionName) pushLiveAll(liveSessionName, newArchers, num);
      },

      loadData: () => {
        get().syncSessions();
      },

      clearAllData: () => set({
        sessions: [],
        members: [],
        history: [],
        alumni: [],
        trash: [],
        archers: [],
        activeSessionID: null,
      }),

      importData: async (data) => {
        set({
          sessions: data?.sessions || get().sessions || [],
          members: data?.members || get().members || [],
          history: data?.history || get().history || [],
          alumni: data?.alumni || get().alumni || [],
          trash: data?.trash || get().trash || [],
          shotsPerRound: data?.shotsPerRound || get().shotsPerRound || 8,
        });
      },

      setAdminMode: (admin) => set({ isAdminMode: admin, isAdminModePending: false }),
      setIsAdminModePending: (pending) => set({ isAdminModePending: pending }),
      setHistoryViewMode: (mode) => set({ historyViewMode: mode }),
      setSelectedHistorySessionId: (id) => set({ selectedHistorySessionId: id }),
      setViewScale: (scale) => set({ viewScale: Math.max(0.5, Math.min(2.0, scale)) }),
      setIsLiveActive: (active) => {
        set({ isLiveActive: active });
        if (active) {
          const sessionId = get().activeSessionID || 'live-current';
          const sessionName = get().liveSessionName || sessionId;
          const archerRows = get().archers || [];
          rtdb_set(ref(rtdb, `live_sessions/${sessionName}/state`), JSON.parse(JSON.stringify({
            archers: Array.isArray(archerRows) ? archerRows : [],
            shotsPerRound: get().shotsPerRound,
            timestamp: Date.now()
          }))).catch(e => console.error('Live Sync Error:', e));
        }
      },
      setShowSyncErrorPopups: (show) => set({ showSyncErrorPopups: show }),

      syncSessions: async () => {
        set({ syncStatus: '同期中' });
        try {
          // Sessions
          const sQ = query(collection(db, 'sessions'), orderBy('date', 'desc'), limit(100));
          const sSnap = await getDocs(sQ);
          const cloudSessions: SessionRecord[] = [];
          sSnap.forEach(docSnap => cloudSessions.push(docSnap.data() as SessionRecord));
          
          // Members
          const mSnap = await getDocs(collection(db, 'members'));
          const cloudMembers: Member[] = [];
          mSnap.forEach(d => cloudMembers.push(d.data() as Member));

          // Trash
          const trashSnap = await getDocs(collection(db, 'trash'));
          const cloudTrash: SessionRecord[] = [];
          trashSnap.forEach(doc => {
            cloudTrash.push({ id: doc.id, ...doc.data() } as SessionRecord);
          });

          // マージ処理
          const mergedSessions = mergeCollections(get().sessions, cloudSessions);
          const mergedMembers = mergeCollections(get().members, cloudMembers);
          const mergedTrash = mergeCollections(get().trash, cloudTrash);

          // 設定情報を取得してマージ
          let mergedTerm = get().currentFreshmanTerm;
          try {
            const configSnap = await getDoc(doc(db, 'config', 'app_settings'));
            if (configSnap.exists()) {
              const configData = configSnap.data();
              if (configData && configData.currentFreshmanTerm !== undefined) {
                // クラウド優先（設定は単一値なので）
                mergedTerm = configData.currentFreshmanTerm;
              }
            }
          } catch (configErr) {
            console.warn('[syncSessions] config fetch failed, using local term:', configErr);
          }

          set({ 
            sessions: mergedSessions, 
            members: mergedMembers,
            trash: mergedTrash, 
            currentFreshmanTerm: mergedTerm,
            syncStatus: '同期済み', 
            lastSyncTime: Date.now() 
          });
          console.log('[syncSessions] Periodic sync completed successfully');

          // 未同期データがあればバックグラウンドでプッシュを試みる
          const pendingSessions = mergedSessions.filter(s => s.syncStatus === '未同期');
          if (pendingSessions.length > 0) {
            console.log(`Found ${pendingSessions.length} pending sessions. Syncing...`);
            const batch = writeBatch(db);
            pendingSessions.forEach(s => {
              const safeS = JSON.parse(JSON.stringify({ ...s, syncStatus: '同期済み' }));
              batch.set(doc(db, 'sessions', s.id), safeS);
            });
            await batch.commit();
            // 成功したらステートを更新
            const finalSessions = get().sessions.map(s => 
              pendingSessions.find(p => p.id === s.id) ? { ...s, syncStatus: '同期済み' as const } : s
            );
            set({ sessions: finalSessions });
          }
        } catch (e) {
          console.error('Periodic Sync Error:', e);
          set({ syncStatus: '同期エラー' });
        }
      },

      syncAllToCloud: async () => {
        set({ syncStatus: '同期中' });
        try {
          // Firestore のバッチは最大500オペレーションまで
          // 全てのオペレーションを配列にまとめてからバッチ分割する
          const operations: Array<{ type: 'set' | 'delete'; ref: any; data?: any }> = [];

          const cleanData = (obj: any) => JSON.parse(JSON.stringify(obj));

          get().members.forEach(m => {
            if (m && m.id) operations.push({ type: 'set', ref: doc(db, 'members', m.id), data: cleanData(m) });
          });
          get().alumni.forEach(a => {
            if (a && a.id) operations.push({ type: 'set', ref: doc(db, 'alumni', a.id), data: cleanData(a) });
          });
          
          // 全セッションを同期済みとしてプッシュ
          get().sessions.forEach(s => {
            if (s && s.id) {
              const safeS = cleanData({ ...s, syncStatus: '同期済み' });
              operations.push({ type: 'set', ref: doc(db, 'sessions', s.id), data: safeS });
            }
          });

          // ゴミ箱も同期
          get().trash.forEach(t => {
            if (t && t.id) {
              operations.push({ type: 'set', ref: doc(db, 'trash', t.id), data: cleanData(t) });
            }
          });

          // 設定情報 (現在の期) も同期
          operations.push({ 
            type: 'set', 
            ref: doc(db, 'config', 'app_settings'), 
            data: { currentFreshmanTerm: get().currentFreshmanTerm, lastModified: Date.now() } 
          });

          // バッチを最大400件ずつに分割して実行（安全マージンを持たせる）
          const BATCH_LIMIT = 400;
          for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
            const chunk = operations.slice(i, i + BATCH_LIMIT);
            const batch = writeBatch(db);
            chunk.forEach(op => {
              if (op.type === 'set') batch.set(op.ref, op.data);
              else if (op.type === 'delete') batch.delete(op.ref);
            });
            await batch.commit();
            console.log(`[syncAllToCloud] Batch ${Math.floor(i / BATCH_LIMIT) + 1} committed (${chunk.length} ops)`);
          }

          // ローカルステートを同期済みに更新
          const updatedSessions = get().sessions.map(s => ({ ...s, syncStatus: '同期済み' as const }));
          set({ 
            sessions: updatedSessions,
            syncStatus: '同期済み', 
            lastSyncTime: Date.now() 
          });
          console.log('[syncAllToCloud] Full sync completed successfully');
        } catch (e: any) {
          console.error('Full Sync Error:', e?.message || e, e?.code || '');
          set({ syncStatus: '同期エラー' });
        }
      },

      fetchAndOverwriteFromCloud: async () => {
        set({ syncStatus: '同期中' });
        try {
          const mSnap = await getDocs(collection(db, 'members'));
          let cloudMembers: Member[] = [];
          mSnap.forEach(d => cloudMembers.push(d.data() as Member));

          const sSnap = await getDocs(collection(db, 'sessions'));
          let cloudSessions: SessionRecord[] = [];
          sSnap.forEach(d => cloudSessions.push(d.data() as SessionRecord));

          if (cloudSessions.length === 0 && cloudMembers.length === 0) {
            try {
              const rtdbSnap = await rtdb_get(ref(rtdb, 'appData'));
              if (rtdbSnap.exists()) {
                const rtdbData = rtdbSnap.val();
                if (rtdbData) {
                  const rawMembers = Array.isArray(rtdbData.members) ? rtdbData.members.filter(Boolean) : Object.values(rtdbData.members || {});
                  const rawSessions = Array.isArray(rtdbData.sessions) ? rtdbData.sessions.filter(Boolean) : Object.values(rtdbData.sessions || {});
                  const rawHistory = Array.isArray(rtdbData.history) ? rtdbData.history.filter(Boolean) : Object.values(rtdbData.history || {});
                  const rawAlumni = Array.isArray(rtdbData.alumni) ? rtdbData.alumni.filter(Boolean) : Object.values(rtdbData.alumni || {});
                  const rawTrash = Array.isArray(rtdbData.trash) ? rtdbData.trash.filter(Boolean) : Object.values(rtdbData.trash || {});
                  
                  cloudMembers = rawMembers as Member[];
                  cloudSessions = rawSessions as SessionRecord[];
                  
                  const cleanData = (obj: any) => JSON.parse(JSON.stringify(obj));

                  const batch = writeBatch(db);
                  cloudMembers.forEach(m => { if(m && m.id) batch.set(doc(db, 'members', m.id), cleanData(m)); });
                  cloudSessions.forEach(s => { if(s && s.id) batch.set(doc(db, 'sessions', s.id), cleanData(s)); });
                  await batch.commit();

                  set({ 
                    history: rawHistory as PracticeRecord[], 
                    alumni: rawAlumni as Alumni[],
                    trash: rawTrash as SessionRecord[],
                    shotsPerRound: rtdbData.shotsPerRound || 8
                  });
                  console.log("Migrated successfully from RTDB (Swift dataset)!");
                }
              } else if (typeof localStorage !== 'undefined') {
                const localStr = localStorage.getItem('archery-score-storage');
                if (localStr) {
                  const parsed = JSON.parse(localStr);
                  const localState = parsed.state;
                  if (localState) {
                    cloudMembers = localState.members || [];
                    cloudSessions = localState.sessions || [];
                    const archers = localState.archers || [];
                    const activeSessionID = localState.activeSessionID || null;
                    const shotsPerRound = localState.shotsPerRound || 8;
                    const history = localState.history || [];
                    const trash = localState.trash || [];
                    const alumni = localState.alumni || [];
                    
                    const batch = writeBatch(db);
                    cloudMembers.forEach(m => { if(m && m.id) batch.set(doc(db, 'members', m.id), m); });
                    cloudSessions.forEach(s => { if(s && s.id) batch.set(doc(db, 'sessions', s.id), s); });
                    await batch.commit();
                    
                    set({ archers, activeSessionID, shotsPerRound, history, trash, alumni });
                    console.log("Migrated successfully from localStorage!");
                  }
                }
              }
            } catch(err) {
              console.error("Data salvage migration failed", err);
            }
          }

          const tSnap = await getDocs(collection(db, 'trash'));
          let cloudTrash: SessionRecord[] = [];
          tSnap.forEach(d => cloudTrash.push(d.data() as SessionRecord));

          const aSnap = await getDocs(collection(db, 'alumni'));
          let cloudAlumni: Alumni[] = [];
          aSnap.forEach(d => cloudAlumni.push(d.data() as Alumni));

          // 設定情報 (現在の期) を取得
          const configSnap = await getDoc(doc(db, 'config', 'app_settings'));
          let cloudTerm = get().currentFreshmanTerm;
          if (configSnap.exists()) {
            const configData = configSnap.data();
            if (configData && configData.currentFreshmanTerm !== undefined) {
              cloudTerm = configData.currentFreshmanTerm;
            }
          }

          // マージ処理を実行
          const mergedSessions = mergeCollections(get().sessions, cloudSessions);
          const mergedMembers = mergeCollections(get().members, cloudMembers);
          const mergedTrash = mergeCollections(get().trash, cloudTrash);

          set({ 
            members: mergedMembers, 
            sessions: mergedSessions, 
            trash: mergedTrash, 
            alumni: mergeCollections(get().alumni, cloudAlumni),
            currentFreshmanTerm: cloudTerm,
            syncStatus: '同期済み', 
            lastSyncTime: Date.now() 
          });
        } catch (e) {
          console.error('Fetch Overwrite Error:', e);
          set({ syncStatus: '同期エラー' });
        }
      },

      startLiveSync: async (sessionName: string) => {
        try {
          const checkRef = ref(rtdb, `live_sessions/${sessionName}`);
          const snapshot = await rtdb_get(checkRef);
          if (snapshot.exists()) {
            return false;
          }
        } catch (e) {
          console.error('Session Name Check Error:', e);
        }

        get().stopLiveSync(true); // Unsubscribe but keep local data
        set({ isLiveActive: true, isHost: true, liveSessionName: sessionName, isIncomingLiveSync: false, lastLocalChange: Date.now() });
        const state = get();
        const liveRef = ref(rtdb, `live_sessions/${sessionName}/state`);
        const archerRows = Array.isArray(state.archers) ? state.archers : [];
        

        try {
          pushLiveAll(sessionName, archerRows, state.shotsPerRound);

          if (Platform.OS === 'web') console.log('ライブを開始しました: ' + sessionName);
          
          onValue(liveRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
              const currentName = get().liveSessionName;
              if (currentName) off(ref(rtdb, `live_sessions/${currentName}/state`));
              set({ isLiveActive: false, isHost: false, liveSessionName: null });
              return;
            }

            // ホスト自身による更新（timestampが一致）ならマージをスキップ
            if (data.timestamp === get().lastPushedTimestamp) {
              return;
            }
            
            if (data.status === 'finished') {
              const currentName = get().liveSessionName;
              if (currentName) off(ref(rtdb, `live_sessions/${currentName}/state`));
              set({ isLiveActive: false, isHost: false, liveSessionName: null });
              // ホスト自身はローカル状態を持続（保存UIに移行）
              return;
            }

            // リセットシグナル
            if (data.reset_at && data.reset_at > (get().lastResetHandled || 0)) {
                set({ lastResetHandled: data.reset_at });
                get().resetCurrentSession();
                return;
            }

            if (data.archers || Array.isArray(data.archers)) {
                const { archers: rtdbArchers, shotsPerRound: shots } = reconstructArchersFromRTDB(data);
                const localArchers = get().archers;
                const localMap = new Map(localArchers.map((a: any) => [a.id, a]));
                let hasChange = rtdbArchers.length !== localArchers.length || shots !== get().shotsPerRound;
                
                const mergedArchers = rtdbArchers.map((rtdbA: any) => {
                  const local = localMap.get(rtdbA.id);
                  if (!local) { hasChange = true; return rtdbA; }
                  
                  const useRTDB = (rtdbA.lastModified || 0) >= (local.lastModified || 0);
                  const marks = useRTDB ? rtdbA.marks : local.marks;
                  const locked = useRTDB ? (rtdbA.lockedBlocks || {}) : (local.lockedBlocks || {});

                  if (!hasChange && useRTDB) {
                    // 以前よりも厳密な構造変化検知（名前・性別・計・間隔・ロックなど）
                    if (rtdbA.name !== local.name ||
                        rtdbA.gender !== local.gender ||
                        rtdbA.grade !== local.grade ||
                        rtdbA.isSeparator !== local.isSeparator ||
                        rtdbA.isTotalCalculator !== local.isTotalCalculator ||
                        rtdbA.isGuest !== local.isGuest ||
                        rtdbA.memberId !== local.memberId ||
                        JSON.stringify(locked) !== JSON.stringify(local.lockedBlocks || {}) ||
                        JSON.stringify(rtdbA.substitutions || {}) !== JSON.stringify(local.substitutions || {}) ||
                        marks.some((m: string, i: number) => m !== (local.marks[i] ?? ''))) {
                      hasChange = true;
                    }
                  }
                  return { ...rtdbA, marks, lockedBlocks: locked, substitutions: rtdbA.substitutions || {} };
                });
                if (hasChange) set({ archers: mergedArchers, shotsPerRound: shots });
            }
          });
          return true;
        } catch (e) {
          console.error('Start Live Sync Error:', e);
          return false;
        }
      },

      joinLiveSync: (sessionName: string) => {
        get().stopLiveSync(true); 
        set({ isLiveActive: true, isHost: false, liveSessionName: sessionName, isIncomingLiveSync: false, lastLocalChange: 0 });
        const liveRef = ref(rtdb, `live_sessions/${sessionName}/state`);
        onValue(liveRef, (snapshot) => {
          const data = snapshot.val();
          // data === null はセッションが削除された場合（安全フォールバック）
          if (!data) {
            // セッション唤除（ホストが2秒後にremove）を検知，レコードを消さずにsyncフラグのみリセット
            const currentName = get().liveSessionName;
            if (currentName) off(ref(rtdb, `live_sessions/${currentName}/state`));
            set({ isLiveActive: false, isHost: false, liveSessionName: null });
            return;
          }
          if (data.status === 'finished') {
            const currentName = get().liveSessionName;
            if (currentName) off(ref(rtdb, `live_sessions/${currentName}/state`));
            get().resetCurrentSession();
            set({ isLiveActive: false, isHost: false, liveSessionName: null });
            return;
          }
          // リセットシグナル
          // リセット判定
          if (data.reset_at && data.reset_at > (get().lastResetHandled || 0)) {
            const isInitialJoin = (get().lastResetHandled === 0);
            set({ lastResetHandled: data.reset_at });
            // 参加時の初回データに含まれる古いリセット信号では通知（RecordScreenのEffect）を出さないように
            // timestamp も更新しておく。
            if (isInitialJoin) {
              set({ lastPushedTimestamp: data.timestamp || 0 });
            }
            get().resetCurrentSession(false);
            // return を削除: リセット直後に送られた archers データがあれば、この後のブロックで処理・反映させる。
          }

          if (data.archers || Array.isArray(data.archers)) {
            const { archers: rtdbArchers, shotsPerRound: shots } = reconstructArchersFromRTDB(data);
            const localArchers = get().archers;
            const localMap = new Map(localArchers.map((a: any) => [a.id, a]));
            let hasChange = rtdbArchers.length !== localArchers.length || shots !== get().shotsPerRound;
            
            const mergedArchers = rtdbArchers.map((rtdbA: any) => {
              const local = localMap.get(rtdbA.id);
              if (!local) { hasChange = true; return rtdbA; }
              
              const useRTDB = (rtdbA.lastModified || 0) >= (local.lastModified || 0);
              const marks = useRTDB ? rtdbA.marks : local.marks;
              const locked = useRTDB ? (rtdbA.lockedBlocks || {}) : (local.lockedBlocks || {});

              if (!hasChange && useRTDB) {
                // ロック状態等の変更検知
                if (rtdbA.name !== local.name ||
                    rtdbA.gender !== local.gender ||
                    rtdbA.grade !== local.grade ||
                    rtdbA.isSeparator !== local.isSeparator ||
                    rtdbA.isTotalCalculator !== local.isTotalCalculator ||
                    rtdbA.isGuest !== local.isGuest ||
                    rtdbA.memberId !== local.memberId ||
                    JSON.stringify(locked) !== JSON.stringify(local.lockedBlocks || {}) ||
                    JSON.stringify(rtdbA.substitutions || {}) !== JSON.stringify(local.substitutions || {}) ||
                    marks.some((m: string, i: number) => m !== (local.marks[i] ?? ''))) {
                  hasChange = true;
                }
              }
              return { ...rtdbA, marks, lockedBlocks: locked, substitutions: rtdbA.substitutions || {} };
            });
            if (hasChange) set({ archers: mergedArchers, shotsPerRound: shots });
          }
        });
        if (Platform.OS === 'web') console.log('ライブに参加しました: ' + sessionName);
      },

      stopLiveSync: (skipReset = false) => {
        const state = get();
        if (state.liveSessionName) {
          off(ref(rtdb, `live_sessions/${state.liveSessionName}/state`));
        }
        if (!skipReset) {
            // 他人のセッションを壊さないよう、退出時は同期なし (syncToLive=false) でリセットする
            get().resetCurrentSession(false);
        }
        set({ isLiveActive: false, isHost: false, liveSessionName: null });
      },

      fetchActiveLiveSessions: async () => {
        const activeSessionsRef = ref(rtdb, 'live_sessions');
        try {
          const snapshot = await rtdb_get(activeSessionsRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data) {
              const activeKeys = Object.keys(data).filter(key => data[key] && data[key].state);
              set({ liveSessionsList: activeKeys });
            } else {
              set({ liveSessionsList: [] });
            }
          } else {
            set({ liveSessionsList: [] });
          }
        } catch (e) {
          console.error('Fetch live sessions error:', e);
        }
      },

      listenToLiveSessions: () => {
        const activeSessionsRef = ref(rtdb, 'live_sessions');
        const unsubscribe = onValue(activeSessionsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data) {
              const activeKeys = Object.keys(data).filter(key => data[key] && data[key].state);
              set({ liveSessionsList: activeKeys });
            } else {
              set({ liveSessionsList: [] });
            }
          } else {
            set({ liveSessionsList: [] });
          }
        }, (error) => {
          console.error('Listen to live sessions error:', error);
        });
        return unsubscribe;
      },

      deleteLiveSession: async (sessionName: string) => {
        try {
          const liveRef = ref(rtdb, `live_sessions/${sessionName}`);
          await rtdb_set(liveRef, null);
          set({ liveSessionsList: get().liveSessionsList.filter(s => s !== sessionName) });
        } catch (e) {
          console.error('Delete live session error:', e);
        }
      },

      startPeriodicSync: () => {
        // Implementation here if needed
      },

      incrementAllGrades: async () => {
        const curMembers = get().members;
        const curAlumni = get().alumni;
        const now = Date.now();
        const year = new Date().getFullYear();

        const updatedMembers: Member[] = [];
        const newAlumniFromMembers: Alumni[] = [];

        curMembers.forEach(m => {
          if (m.grade >= 4) {
            // 卒業生へ
            const alumni: Alumni = {
              id: m.id,
              name: m.name,
              gender: m.gender,
              graduationYear: `${year}年度`,
              termKi: m.termKi,
              color: m.color,
              avatarUrl: m.avatarUrl,
              lastModified: now,
            };
            newAlumniFromMembers.push(alumni);
          } else {
            // 進級
            updatedMembers.push({
              ...m,
              grade: m.grade + 1,
              lastModified: now,
            });
          }
        });

        const finalAlumni = [...curAlumni, ...newAlumniFromMembers];
        
        const nextFreshmanTerm = get().currentFreshmanTerm + 1;
        
        set({
          members: updatedMembers,
          alumni: finalAlumni,
          currentFreshmanTerm: nextFreshmanTerm,
          lastLocalChange: now,
        });

        // クラウド同期を試みる
        if (get().isFirebaseConnected) {
          try {
            const batch = writeBatch(db);
            // 削除された部員（卒業生になった人）をクラウドからも消す
            // 注意: 卒業生コレクションに移動するので一旦消す
            newAlumniFromMembers.forEach(a => {
              batch.delete(doc(db, 'members', a.id));
              batch.set(doc(db, 'alumni', a.id), a);
            });
            // 更新された部員を保存
            updatedMembers.forEach(m => {
              batch.set(doc(db, 'members', m.id), m);
            });
            // 設定情報も更新
            batch.set(doc(db, 'config', 'app_settings'), {
              currentFreshmanTerm: nextFreshmanTerm,
              lastModified: Date.now()
            });
            await batch.commit();
            set({ syncStatus: '同期済み', lastSyncTime: Date.now() });
          } catch (e) {
            console.error('Increment Grades Sync Error:', e);
            set({ syncStatus: '同期エラー' });
          }
        }
      },

      updateCurrentFreshmanTerm: async (term: number) => {
        set({ currentFreshmanTerm: term, lastLocalChange: Date.now() });
        if (get().isFirebaseConnected) {
          try {
            await setDoc(doc(db, 'config', 'app_settings'), {
              currentFreshmanTerm: term,
              lastModified: Date.now()
            });
            set({ syncStatus: '同期済み', lastSyncTime: Date.now() });
          } catch (e) {
            console.error('Update Term Sync Error:', e);
            set({ syncStatus: '同期エラー' });
          }
        }
      }
    }),
    {
      name: 'archery-score-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          if (Platform.OS === 'web' && typeof window === 'undefined') return null;
          return AsyncStorage.getItem(name);
        },
        setItem: async (name: string, value: string) => {
          if (Platform.OS === 'web' && typeof window === 'undefined') return;
          return AsyncStorage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          if (Platform.OS === 'web' && typeof window === 'undefined') return;
          return AsyncStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        archers: state.archers,
        members: state.members,
        history: state.history,
        alumni: state.alumni,
        trash: state.trash,
        shotsPerRound: state.shotsPerRound,
        activeSessionID: state.activeSessionID,
        viewScale: state.viewScale,
        includeInStats: state.includeInStats,
        currentFreshmanTerm: state.currentFreshmanTerm,
      }),
      onRehydrateStorage: () => {
        console.log('[Store] Hydration starting...');
        return (state, error) => {
          if (error) {
            console.error('[Store] Hydration error:', error);
          } else if (state) {
            console.log('[Store] Hydration finished successfully');
            state.updateState({ isHydrated: true });
          } else {
            console.log('[Store] Hydration yielded empty state');
          }
        };
      },
    }
  )
);
