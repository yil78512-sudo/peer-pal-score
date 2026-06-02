import { useMemo, useState } from "react";
import {
  STUDENTS,
  STAGES,
  Stage,
  saveRating,
  useRatings,
  usePortfolios,
  ratedTargets,
  stageAverage,
  stageReceivedCount,
  CLOUD_ENABLED,
} from "@/lib/peerData";
import { toast } from "@/hooks/use-toast";

const avatarMeta: Record<string, { theme: string; image: string }> = {
  刘一: {
    theme: "from-violet-100 via-purple-50 to-pink-100 border-violet-200",
    image: "liu-yi.png",
  },
  王景璇: {
    theme: "from-emerald-100 via-green-50 to-lime-100 border-emerald-200",
    image: "wang-jingxuan.png",
  },
  龙珊: {
    theme: "from-amber-100 via-yellow-50 to-orange-100 border-amber-200",
    image: "long-shan.png",
  },
  于艺萱: {
    theme: "from-lime-100 via-green-50 to-teal-100 border-lime-200",
    image: "yu-yixuan.png",
  },
  徐浩: {
    theme: "from-sky-100 via-blue-50 to-cyan-100 border-sky-200",
    image: "xu-hao.png",
  },
  肖文光: {
    theme: "from-fuchsia-100 via-purple-50 to-pink-100 border-fuchsia-200",
    image: "xiao-wenguang.png",
  },
  鲍禹尧: {
    theme: "from-green-100 via-lime-50 to-emerald-100 border-green-200",
    image: "bao-yuyao.png",
  },
  张延兵: {
    theme: "from-rose-100 via-pink-50 to-orange-100 border-rose-200",
    image: "zhang-yanbing.png",
  },
};

const avatarSrc = (filename: string) => `${import.meta.env.BASE_URL}avatars/${filename}`;

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen px-4 py-10 md:py-14"
    style={{ backgroundImage: "var(--gradient-page)" }}
  >
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1
          className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          课程作品互评系统
        </h1>
        <p className="text-muted-foreground">欣赏彼此的创意，学习彼此的成长</p>
      </div>
      {children}
    </div>
  </div>
);

const Card = ({
  icon,
  title,
  children,
  right,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <section
    className="bg-card/80 backdrop-blur rounded-2xl p-6 md:p-8 border border-border"
    style={{ boxShadow: "var(--shadow-card)" }}
  >
    <header className="flex items-center gap-3 mb-6">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </header>
    {children}
  </section>
);

const PortfolioSection = () => {
  const portfolios = usePortfolios();
  const getUrl = (s: string) => portfolios.find((p) => p.student === s)?.url ?? "";

  return (
    <Card
      icon="🖼️"
      title="作品集展示墙"
      right={
        <span className="hidden md:inline-flex px-3 py-1 rounded-full border border-border bg-background/70 text-sm text-muted-foreground">
          👥 8 位同学作品
        </span>
      }
    >
      <p className="text-sm text-muted-foreground mb-6">
        点击头像卡片进入同学的作品集，欣赏创意与成长。作品集链接由管理端统一录入。
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STUDENTS.map((s) => {
          const url = getUrl(s);
          const meta = avatarMeta[s];
          const content = (
            <div
              className={`h-full rounded-2xl border bg-gradient-to-br ${meta.theme} p-4 transition duration-200 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="rounded-xl bg-white/60 border border-white/70 h-52 md:h-56 overflow-hidden">
                <img
                  src={avatarSrc(meta.image)}
                  alt={`${s} 头像`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="pt-4 text-center">
                <div className="text-lg font-bold">{s}</div>
                <div className="my-2 text-primary/40">✦</div>
                <div
                  className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium ${
                    url ? "text-white" : "bg-background/70 text-muted-foreground border border-border"
                  }`}
                  style={url ? { backgroundImage: "var(--gradient-brand)" } : undefined}
                >
                  {url ? "进入作品集 →" : "作品集待上传"}
                </div>
              </div>
            </div>
          );

          return url ? (
            <a key={s} href={url} target="_blank" rel="noreferrer" className="block">
              {content}
            </a>
          ) : (
            <div key={s}>{content}</div>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-6">
        “每一份作品，都是思考的痕迹；每一次互评，都是成长的阶梯。”
      </p>
    </Card>
  );
};

const RatingSection = () => {
  const ratings = useRatings();
  const [rater, setRater] = useState<string>("");
  const [stage, setStage] = useState<Stage | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const targets = useMemo(() => [...STUDENTS], []);
  const rated = rater && stage ? ratedTargets(ratings, stage, rater) : [];
  const ratedSet = new Set(rated);
  const avg = rater && stage ? stageAverage(ratings, stage, rater) : null;
  const received = rater && stage ? stageReceivedCount(ratings, stage, rater) : 0;

  const submit = async (target: string) => {
    if (!rater || !stage) return;
    const raw = scores[target];
    const n = Number(raw);
    if (!raw || Number.isNaN(n) || n < 0 || n > 100) {
      toast({ title: "请输入 0-100 的有效分数" });
      return;
    }
    try {
      setSubmitting(target);
      await saveRating({ stage, rater, targetStudentId: target, score: n });
      setScores((p) => ({ ...p, [target]: "" }));
      toast({ title: `已为 ${target} 提交评分` });
    } catch (error) {
      console.error(error);
      toast({ title: "提交失败", description: "请检查 Firebase 数据库配置或网络连接。" });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Card icon="📋" title="阶段互评">
      {!CLOUD_ENABLED && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前未连接 Firebase 数据库，请检查网络或 Firestore 规则。
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
        <select
          className="md:flex-1 px-4 py-2 rounded-xl bg-background/80 border border-border outline-none"
          value={rater}
          onChange={(e) => setRater(e.target.value)}
        >
          <option value="">选择你的名字（评分人）</option>
          {STUDENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-5 py-2 rounded-xl text-sm font-medium border transition ${
                stage === s
                  ? "text-white border-transparent"
                  : "bg-background/80 border-border hover:bg-accent"
              }`}
              style={stage === s ? { backgroundImage: "var(--gradient-brand)" } : undefined}
            >
              阶段 {s}
            </button>
          ))}
        </div>
      </div>

      {!rater || !stage ? (
        <p className="text-center text-muted-foreground py-8">请先选择评分人和阶段</p>
      ) : rated.length === targets.length ? (
        <div className="py-10 text-center space-y-2">
          <div className="text-3xl">✅</div>
          <p className="text-lg font-semibold text-primary">本阶段评分已完成并提交</p>
          <p className="text-sm text-muted-foreground">
            {rater}阶段 {stage} 实时得分：
            <span className="font-semibold text-foreground">
              {avg === null ? "暂无评分" : `${avg.toFixed(1)} 分`}
            </span>
            ，已收到 {received}/{targets.length} 人评分
          </p>
          <p className="text-sm text-muted-foreground">
            为保护评分隐私，学生端不再显示该阶段的评分明细。
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            请给全部 8 名同学评分（包含你自己）。
            <span className="ml-1 font-medium text-foreground">
              {rater}阶段 {stage} 实时得分：
              {avg === null ? "暂无评分" : `${avg.toFixed(1)} 分`}，已收到 {received}/{targets.length} 人评分
            </span>
          </p>
          <div className="mb-4 text-sm text-muted-foreground">
            进度：<span className="font-semibold text-foreground">{rated.length}</span> / {targets.length}
          </div>
          <div className="space-y-3">
            {targets.map((t) => {
              const done = ratedSet.has(t);
              const isSelf = t === rater;
              return (
                <div
                  key={t}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border"
                >
                  <div className="flex-1 font-medium">
                    {t}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">（自己）</span>}
                  </div>
                  {done ? (
                    <span className="text-sm text-primary font-medium">✓ 已评分</span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0-100"
                        className="w-24 px-3 py-1.5 rounded-lg bg-background border border-border outline-none focus:ring-2 focus:ring-ring/40"
                        value={scores[t] ?? ""}
                        onChange={(e) => setScores((p) => ({ ...p, [t]: e.target.value }))}
                      />
                      <button
                        className="px-4 py-1.5 rounded-lg text-white text-sm hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundImage: "var(--gradient-brand)" }}
                        disabled={submitting === t}
                        onClick={() => void submit(t)}
                      >
                        {submitting === t ? "提交中" : "提交"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};

const Student = () => {
  return (
    <PageShell>
      <PortfolioSection />
      <RatingSection />
    </PageShell>
  );
};

export default Student;
