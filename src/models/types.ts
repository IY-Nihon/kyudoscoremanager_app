export type Gender = '男子' | '女子' | '未設定';
export type Mark = '' | '○' | '×';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  grade: number;      // 0 if graduated
  isAlumni?: boolean;
  termKi?: number;    // 期
  color?: number;
  avatarUrl?: string;
  lastModified: number; // Timestamp
}

export interface Alumni {
  id: string;
  name: string;
  gender: Gender;
  graduationYear: string;
  termKi?: number; // 期
  color?: number;
  avatarUrl?: string;
  lastModified: number;
}

export interface Archer {
  id: string;
  memberId?: string;  // ID of the linked Member
  name: string;
  gender: Gender;
  grade: number;
  marks: Mark[];
  isSeparator: boolean;
  isTotalCalculator: boolean;
  isGuest: boolean;
  lockedBlocks: Record<number, boolean>;
  substitutions?: Record<number, string>;
  substitutionIds?: Record<number, string>;
  lastModified?: number;
}

export interface RecordEntry {
  memberId?: string;
  name: string;
  gender: Gender;
  grade: number;
  totalShots: number;
  hits: number;
  isGuest: boolean;
  substitutions?: Record<number, string>;
}

export interface PracticeRecord {
  id: string;
  date: number;
  entries: RecordEntry[];
  includeInStats: boolean;
  lastModified: number;
}

export interface SessionRecord {
  id: string;
  date: number;
  archers: Archer[];
  shotCount: number;
  title: string;
  note: string;
  syncStatus: string;
  includeInStats: boolean;
  lastModified: number;
}

export interface SavedData {
  currentArchers?: Archer[];
  members?: Member[];
  alumni?: Alumni[];
  history?: PracticeRecord[];
  sessions?: SessionRecord[];
  lastFiscalYearChecked?: number;
  shotsPerRound?: number;
  isFirstLaunch?: boolean;
  trash?: SessionRecord[];
}

export const newArcher = (count: number): Archer => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
  name: '',
  gender: '未設定',
  grade: 1,
  marks: Array(count).fill(''),
  isSeparator: false,
  isTotalCalculator: false,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0
});

export const newSeparator = (): Archer => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
  name: '',
  gender: '未設定',
  grade: 0,
  marks: [],
  isSeparator: true,
  isTotalCalculator: false,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0
});

export const newTotalCalculator = (count: number): Archer => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
  name: '計',
  gender: '未設定',
  grade: 0,
  marks: Array(count).fill(''),
  isSeparator: false,
  isTotalCalculator: true,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0
});
