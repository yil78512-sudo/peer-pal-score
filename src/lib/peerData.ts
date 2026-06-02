import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

export const STUDENTS = [
  "刘一",
  "王景璇",
  "龙珊",
  "于艺萱",
  "徐浩",
  "肖文光",
  "鲍禹尧",
  "张延兵",
] as const;

export type Stage = 1 | 2 | 3;
export const STAGES: Stage[] = [1, 2, 3];
export const STAGE_WEIGHTS: Record<Stage, number> = { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 };

export interface Rating {
  stage: Stage;
  rater: string;
  targetStudentId: string;
  score: number;
}

export interface Portfolio {
  student: string;
  url: string;
}

const firebaseConfig = {
  apiKey: "AIzaSyD6UXZkyDdVLJbIQMuk4TSeOY0o3WfgoPM",
  authDomain: "abcd-462ff.firebaseapp.com",
  projectId: "abcd-462ff",
  storageBucket: "abcd-462ff.firebasestorage.app",
  messagingSenderId: "973906077595",
  appId: "1:973906077595:web:e62f011fbc4810dcb9633e",
  measurementId: "G-LKN310H0Q4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const CLOUD_ENABLED = true;

const ratingId = (r: Pick<Rating, "stage" | "rater" | "targetStudentId">) =>
  `stage${r.stage}__${r.rater}__${r.targetStudentId}`;

const ratingFromDoc = (id: string, data: Record<string, unknown>): Rating => ({
  stage: Number(data.stage) as Stage,
  rater: String(data.rater ?? ""),
  targetStudentId: String(data.targetStudentId ?? data.target_student_id ?? ""),
  score: Number(data.score ?? 0),
});

const portfolioFromDoc = (id: string, data: Record<string, unknown>): Portfolio => ({
  student: String(data.student ?? id),
  url: String(data.url ?? ""),
});

export async function getRatings(): Promise<Rating[]> {
  const snapshot = await getDocs(query(collection(db, "ratings"), orderBy("stage")));
  return snapshot.docs.map((d) => ratingFromDoc(d.id, d.data()));
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const snapshot = await getDocs(collection(db, "portfolios"));
  return snapshot.docs.map((d) => portfolioFromDoc(d.id, d.data()));
}

export async function saveRating(rating: Rating) {
  await setDoc(doc(db, "ratings", ratingId(rating)), {
    stage: rating.stage,
    rater: rating.rater,
    targetStudentId: rating.targetStudentId,
    score: rating.score,
    updatedAt: new Date().toISOString(),
  });
}

export async function savePortfolio(portfolio: Portfolio) {
  await setDoc(doc(db, "portfolios", portfolio.student), {
    student: portfolio.student,
    url: portfolio.url,
    updatedAt: new Date().toISOString(),
  });
}

/** 开启新一轮课程：清空旧评分记录与提交状态。作品集链接由管理端维护，默认保留。 */
export async function clearAllData() {
  const snapshot = await getDocs(collection(db, "ratings"));
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export function useRatings(): Rating[] {
  const [val, setVal] = useState<Rating[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "ratings"), orderBy("stage")),
      (snapshot) => setVal(snapshot.docs.map((d) => ratingFromDoc(d.id, d.data()))),
      (error) => console.error("读取评分数据失败", error),
    );
    return unsubscribe;
  }, []);
  return val;
}

export function usePortfolios(): Portfolio[] {
  const [val, setVal] = useState<Portfolio[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "portfolios"),
      (snapshot) => setVal(snapshot.docs.map((d) => portfolioFromDoc(d.id, d.data()))),
      (error) => console.error("读取作品集链接失败", error),
    );
    return unsubscribe;
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

/** 某阶段某同学已收到多少名评分人的评分 */
export function stageReceivedCount(ratings: Rating[], stage: Stage, target: string): number {
  return new Set(
    ratings
      .filter((r) => r.stage === stage && r.targetStudentId === target)
      .map((r) => r.rater),
  ).size;
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
  return total / weightUsed;
}

/** 某评分人在某阶段已评过的目标列表 */
export function ratedTargets(ratings: Rating[], stage: Stage, rater: string): string[] {
  return ratings
    .filter((r) => r.stage === stage && r.rater === rater)
    .map((r) => r.targetStudentId);
}
