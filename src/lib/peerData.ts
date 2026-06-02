import { useEffect, useState } from "react";

export const STUDENTS = [
  "刘一",
  "王景璇",
  "龙珊",
  "鲍禹尧",
  "肖文光",
  "于艺萱",
  "张延兵",
  "徐浩",
] as const;

export type Stage = 1 | 2 | 3;
export const STAGES: Stage[] = [1, 2, 3];
export const STAGE_WEIGHTS: Record<Stage, number> = { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 };

export interface Rating {
  stage: Stage;
  rater: string;          // 评分人
  targetStudentId: string; // 被评分人
  score: number;          // 0-100
}

export interface Portfolio {
  student: string;
  url: string;
}

const RATINGS_KEY = "peer-art-hub:ratings";
const PORTFOLIOS_KEY = "peer-art-hub:portfolios";
const EVENT = "peer-art-hub:update";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event(EVENT));
}

export function getRatings(): Rating[] {
  return read<Rating[]>(RATINGS_KEY, []);
}

/** 开启新一轮课程：清空所有评分记录、提交状态与作品集数据 */
export function clearAllData() {
  localStorage.removeItem(RATINGS_KEY);
  localStorage.removeItem(PORTFOLIOS_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function getPortfolios(): Portfolio[] {
  return read<Portfolio[]>(PORTFOLIOS_KEY, []);
}

export function saveRating(r: Rating) {
  const all = getRatings().filter(
    (x) =>
      !(x.stage === r.stage && x.rater === r.rater && x.targetStudentId === r.targetStudentId),
  );
  all.push(r);
  write(RATINGS_KEY, all);
}

export function savePortfolio(p: Portfolio) {
  const all = getPortfolios().filter((x) => x.student !== p.student);
  all.push(p);
  write(PORTFOLIOS_KEY, all);
}

export function useRatings(): Rating[] {
  const [val, setVal] = useState<Rating[]>(() => getRatings());
  useEffect(() => {
    const sync = () => setVal(getRatings());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return val;
}

export function usePortfolios(): Portfolio[] {
  const [val, setVal] = useState<Portfolio[]>(() => getPortfolios());
  useEffect(() => {
    const sync = () => setVal(getPortfolios());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return val;
}

/** 某阶段某同学收到的平均分 */
export function stageAverage(ratings: Rating[], stage: Stage, target: string): number | null {
  const arr = ratings.filter((r) => r.stage === stage && r.targetStudentId === target);
  if (arr.length === 0) return null;
  const sum = arr.reduce((s, r) => s + r.score, 0);
  return sum / arr.length;
}

/** 最终加权成绩 */
export function finalScore(ratings: Rating[], target: string): number {
  let total = 0;
  let weightUsed = 0;
  for (const s of STAGES) {
    const avg = stageAverage(ratings, s, target);
    if (avg !== null) {
      total += avg * STAGE_WEIGHTS[s];
      weightUsed += STAGE_WEIGHTS[s];
    }
  }
  if (weightUsed === 0) return 0;
  // 如果某些阶段未评，按已评阶段加权再归一
  return total / weightUsed;
}

/** 某评分人在某阶段已评过的目标列表 */
export function ratedTargets(ratings: Rating[], stage: Stage, rater: string): string[] {
  return ratings
    .filter((r) => r.stage === stage && r.rater === rater)
    .map((r) => r.targetStudentId);
}