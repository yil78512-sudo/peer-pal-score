import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      style={{ backgroundImage: "var(--gradient-page)" }}
    >
      <h1
        className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        课程作品互评系统
      </h1>
      <p className="text-muted-foreground">请选择入口</p>
      <div className="flex gap-4">
        <Link
          to="/student"
          className="px-8 py-3 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          学生端
        </Link>
        <Link
          to="/admin"
          className="px-8 py-3 rounded-xl bg-card border border-border font-medium hover:bg-accent transition"
        >
          管理端
        </Link>
      </div>
    </div>
  );
};

export default Index;
