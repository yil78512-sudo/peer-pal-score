import { useMemo, useState } from "react";
import {
  STUDENTS,
  STAGES,
  Stage,
  saveRating,
  savePortfolio,
  useRatings,
  usePortfolios,
  ratedTargets,
} from "@/lib/peerData";
import { toast } from "@/hooks/use-toast";

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen px-4 py-10 md:py-14"
    style={{ backgroundImage: "var(--gradient-page)" }}
  >
    <div className="max-w-4xl mx-auto space-y-8">
      <h1
        className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        课程作品互评系统
      </h1>
      {children}
    </div>
  </div>
);

const Card = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
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
      <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
    </header>
    {children}
  </section>
);

const PortfolioSection = () => {
  const portfolios = usePortfolios();
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const getUrl = (s: string) => portfolios.find((p) => p.student === s)?.url ?? "";

  return (
    <Card icon="🔗" title="提交作品集链接">
      <p className="text-sm text-muted-foreground mb-5">
        每位同学在自己姓名右侧填写作品集链接并提交。再次提交将覆盖原链接。
      </p>
      <div className="space-y-3">
        {STUDENTS.map((s) => {
          const existing = getUrl(s);
          const val = inputs[s] ?? "";
          return (
            <div key={s} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="w-20 shrink-0 font-medium">{s}</div>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 px-4 py-2 rounded-xl bg-background/80 border border-border outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder={existing || "粘贴作品集链接 (如 https://...)"}
                  value={val}
                  onChange={(e) => setInputs((p) => ({ ...p, [s]: e.target.value }))}
                />
                <button
                  className="px-5 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
                  style={{ backgroundImage: "var(--gradient-brand)" }}
                  onClick={() => {
                    if (!val.trim()) {
                      toast({ title: "请输入链接" });
                      return;
                    }
                    savePortfolio({ student: s, url: val.trim() });
                    setInputs((p) => ({ ...p, [s]: "" }));
                    toast({ title: `${s} 的作品已${existing ? "更新" : "提交"}` });
                  }}
                >
                  {existing ? "更新" : "提交"}
                </button>
              </div>
              {existing && (
                <div className="md:basis-full md:pl-24 text-xs text-muted-foreground truncate">
                  查看作品：
                  <a
                    href={existing}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {existing}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const RatingSection = () => {
  const ratings = useRatings();
  const [rater, setRater] = useState<string>("");
  const [stage, setStage] = useState<Stage | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});

  // 8 人互评，含自评：每位同学都要给全部 8 名同学评分（包含自己）
  const targets = useMemo(() => [...STUDENTS], []);

  const rated = rater && stage ? ratedTargets(ratings, stage, rater) : [];
  const ratedSet = new Set(rated);

  const submit = (target: string) => {
    if (!rater || !stage) return;
    const raw = scores[target];
    const n = Number(raw);
    if (!raw || Number.isNaN(n) || n < 0 || n > 100) {
      toast({ title: "请输入 0-100 的有效分数" });
      return;
    }
    saveRating({ stage, rater, targetStudentId: target, score: n });
    setScores((p) => ({ ...p, [target]: "" }));
    toast({ title: `已为 ${target} 提交评分` });
  };

  return (
    <Card icon="📋" title="阶段互评">
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
        // 该评分人本阶段已全部提交完成：隐藏所有评分明细，仅显示已完成状态
        <div className="py-10 text-center space-y-2">
          <div className="text-3xl">✅</div>
          <p className="text-lg font-semibold text-primary">本阶段评分已完成并提交</p>
          <p className="text-sm text-muted-foreground">
            为保护评分隐私，学生端不再显示该阶段的评分明细。
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            请给全部 8 名同学评分（包含你自己）。
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
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">（自己）</span>
                    )}
                  </div>
                  {done ? (
                    // 隐私：完成后不显示具体分数，仅显示完成状态
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
                        onChange={(e) =>
                          setScores((p) => ({ ...p, [t]: e.target.value }))
                        }
                      />
                      <button
                        className="px-4 py-1.5 rounded-lg text-white text-sm hover:opacity-90"
                        style={{ backgroundImage: "var(--gradient-brand)" }}
                        onClick={() => submit(t)}
                      >
                        提交
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
