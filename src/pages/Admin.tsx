import { useMemo, useState } from "react";
import {
  STUDENTS,
  STAGES,
  Stage,
  finalScore,
  stageAverage,
  useRatings,
  usePortfolios,
  getPortfolios,
  getRatings,
  clearAllData,
} from "@/lib/peerData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2));

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
      <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
      {right && <div className="ml-auto">{right}</div>}
    </header>
    {children}
  </section>
);

const Ranking = () => {
  const ratings = useRatings();
  const portfolios = usePortfolios();

  const rows = useMemo(() => {
    return STUDENTS.map((s) => ({
      name: s,
      score: finalScore(ratings, s),
      url: portfolios.find((p) => p.student === s)?.url,
    }))
      .sort((a, b) => b.score - a.score);
  }, [ratings, portfolios]);

  return (
    <Card icon="🏆" title="实时排名">
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-background/60 border border-border"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                i === 0
                  ? "text-white"
                  : i < 3
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              style={i === 0 ? { backgroundImage: "var(--gradient-brand)" } : undefined}
            >
              {i + 1}
            </div>
            <div className="font-medium">{r.name}</div>
            <div className="ml-auto flex items-center gap-4">
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  ↗ 查看作品
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">暂未提交作品集</span>
              )}
              <div className="w-16 text-right font-semibold tabular-nums">
                {r.score.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const StageOverview = () => {
  const ratings = useRatings();
  return (
    <Card icon="📊" title="阶段成绩总览">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-3 font-medium">学生</th>
              {STAGES.map((s) => (
                <th key={s} className="text-center py-3 font-medium">
                  阶段{s}
                </th>
              ))}
              <th className="text-right py-3 font-medium">最终成绩</th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s) => (
              <tr key={s} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium">{s}</td>
                {STAGES.map((st) => (
                  <td key={st} className="text-center py-3 tabular-nums">
                    {fmt(stageAverage(ratings, st, s))}
                  </td>
                ))}
                <td className="text-right py-3 font-semibold tabular-nums text-primary">
                  {finalScore(ratings, s).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const Completion = () => {
  const ratings = useRatings();
  const [stage, setStage] = useState<Stage>(1);

  return (
    <Card
      icon="✅"
      title="评分完成情况"
      right={
        <div className="flex gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-4 py-1.5 rounded-lg text-sm border transition ${
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
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        {STUDENTS.map((rater) => {
          // 每位评分人需对全部 8 名同学评分（包含自己）
          const targets = [...STUDENTS];
          // 评分人在当前阶段的评分记录
          const myRatings = ratings.filter(
            (r) => r.stage === stage && r.rater === rater,
          );
          const ratedMap = new Map(
            myRatings.map((r) => [r.targetStudentId, r.score]),
          );
          const done = targets.filter((t) => ratedMap.has(t));
          const pending = targets.filter((t) => !ratedMap.has(t));
          const complete = pending.length === 0;

          return (
            <div
              key={rater}
              className="p-4 rounded-xl bg-background/60 border border-border"
            >
              <div className="flex items-center mb-3">
                <div className="font-semibold">{rater}</div>
                <div
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    complete
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done.length}/{targets.length} 已评
                </div>
              </div>
              <div className="text-sm space-y-1.5">
                <div>
                  <span className="text-muted-foreground">已评分：</span>
                  {done.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span>
                      {done.map((t, i) => (
                        <span key={t}>
                          {i > 0 && "、"}
                          {t}
                          {t === rater && (
                            <span className="text-muted-foreground">（自己）</span>
                          )}{" "}
                          <span className="text-primary font-medium tabular-nums">
                            {ratedMap.get(t)!.toFixed(0)}分
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">未评分：</span>
                  {pending.length === 0 ? (
                    <span className="text-primary">全部完成</span>
                  ) : (
                    <span>
                      {pending.map((t, i) => (
                        <span key={t}>
                          {i > 0 && "、"}
                          {t}
                          {t === rater && (
                            <span className="text-muted-foreground">（自己）</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const exportAll = () => {
  const data = {
    exportedAt: new Date().toISOString(),
    students: STUDENTS,
    portfolios: getPortfolios(),
    ratings: getRatings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `peer-art-hub-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const DataManagement = () => {
  const handleReset = () => {
    clearAllData();
    toast({ title: "已开启新一轮课程", description: "旧评分记录与提交状态已清空。" });
  };

  return (
    <Card icon="🗑️" title="数据管理">
      <p className="text-sm text-muted-foreground mb-5">
        仅用于正式测试前或开启新一轮课程前清空旧数据，学生端不可见。
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-md hover:opacity-90"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            开启新一轮课程
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开启新一轮课程？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清空所有旧的评分记录、提交状态与作品集数据，且无法恢复。确认要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>确认清空</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const Admin = () => {
  return (
    <div
      className="min-h-screen px-4 py-10 md:py-14"
      style={{ backgroundImage: "var(--gradient-page)" }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center">
          <button
            onClick={exportAll}
            className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md hover:opacity-90 flex items-center gap-2"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            ↓ 导出所有数据
          </button>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          课程作品管理中心
        </h1>
        <Ranking />
        <StageOverview />
        <Completion />
        <DataManagement />
      </div>
    </div>
  );
};

export default Admin;
