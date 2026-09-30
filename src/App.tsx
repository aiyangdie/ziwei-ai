import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { astro } from "iztro";
import type { IFunctionalAstrolabe } from "iztro/lib/astro/FunctionalAstrolabe";
import type { IFunctionalPalace } from "iztro/lib/astro/FunctionalPalace";
import type { IFunctionalStar } from "iztro/lib/star/FunctionalStar";
import { localInsight } from "./localInsight";

const TIME_OPTIONS = [
  { value: 0, label: "早子 00:00–01:00" },
  { value: 1, label: "丑时 01:00–03:00" },
  { value: 2, label: "寅时 03:00–05:00" },
  { value: 3, label: "卯时 05:00–07:00" },
  { value: 4, label: "辰时 07:00–09:00" },
  { value: 5, label: "巳时 09:00–11:00" },
  { value: 6, label: "午时 11:00–13:00" },
  { value: 7, label: "未时 13:00–15:00" },
  { value: 8, label: "申时 15:00–17:00" },
  { value: 9, label: "酉时 17:00–19:00" },
  { value: 10, label: "戌时 19:00–21:00" },
  { value: 11, label: "亥时 21:00–23:00" },
  { value: 12, label: "晚子 23:00–00:00" },
];

const QUICK_ASKS = [
  "请概括我的命盘性格特点",
  "事业宫怎么看？适合做什么？",
  "财帛与财运有哪些提示？",
  "感情与夫妻宫如何理解？",
];

type Gender = "男" | "女";
type ChatMsg = { role: "user" | "assistant"; content: string };

type PalaceView = {
  name: string;
  earthlyBranch: string;
  isSoulPalace: boolean;
  isBodyPalace: boolean;
  majorStars: string[];
  minorStars: string[];
  mutagens: string[];
};

function summarizeChart(astrolabe: IFunctionalAstrolabe): string {
  const soul = astrolabe.palace("命宫");
  const body = astrolabe.palace("身宫");
  const lines = [
    `阳历：${astrolabe.solarDate}`,
    `农历：${astrolabe.lunarDate}`,
    `四柱：${astrolabe.chineseDate}`,
    `时辰：${astrolabe.time}（${astrolabe.timeRange}）`,
    `生肖：${astrolabe.zodiac}；星座：${astrolabe.sign}`,
    `五行局：${astrolabe.fiveElementsClass}`,
    `命宫：${soul?.name ?? "命宫"}（${astrolabe.earthlyBranchOfSoulPalace}）主星：${
      soul?.majorStars?.map((s: IFunctionalStar) => s.name).join("、") || "无"
    }`,
    `身宫：${body?.name ?? "身宫"}（${astrolabe.earthlyBranchOfBodyPalace}）`,
  ];

  for (const p of astrolabe.palaces as IFunctionalPalace[]) {
    const majors = p.majorStars.map((s: IFunctionalStar) => {
      const m = s.mutagen ? `[${s.mutagen}]` : "";
      return `${s.name}${m}`;
    });
    const minors = p.minorStars.map((s: IFunctionalStar) => s.name);
    lines.push(
      `${p.name}(${p.earthlyBranch}) 主星:${majors.join("、") || "无"} 辅星:${
        minors.slice(0, 6).join("、") || "无"
      }`,
    );
  }
  return lines.join("\n");
}

function toPalaceViews(astrolabe: IFunctionalAstrolabe): PalaceView[] {
  return (astrolabe.palaces as IFunctionalPalace[]).map((p) => ({
    name: p.name,
    earthlyBranch: p.earthlyBranch,
    isSoulPalace: p.name === "命宫",
    isBodyPalace: p.name === "身宫",
    majorStars: p.majorStars.map(
      (s: IFunctionalStar) => s.name + (s.mutagen ? `·${s.mutagen}` : ""),
    ),
    minorStars: p.minorStars.map((s: IFunctionalStar) => s.name).slice(0, 4),
    mutagens: p.majorStars
      .filter((s: IFunctionalStar) => Boolean(s.mutagen))
      .map((s: IFunctionalStar) => String(s.mutagen)),
  }));
}

export default function App() {
  const [solarDate, setSolarDate] = useState("1995-02-23");
  const [timeIndex, setTimeIndex] = useState(9);
  const [gender, setGender] = useState<Gender>("女");
  const [astrolabe, setAstrolabe] = useState<IFunctionalAstrolabe | null>(null);
  const [chartError, setChartError] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "你好，我是星言。先填写生日与时辰生成命盘，再问我性格、事业、财运或感情即可。",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  const palaces = useMemo(
    () => (astrolabe ? toPalaceViews(astrolabe) : []),
    [astrolabe],
  );
  const chartSummary = useMemo(
    () => (astrolabe ? summarizeChart(astrolabe) : ""),
    [astrolabe],
  );

  function buildChart(e?: FormEvent) {
    e?.preventDefault();
    setChartError("");
    try {
      const result = astro.bySolar(solarDate, timeIndex, gender, true, "zh-CN");
      setAstrolabe(result);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `已为你排盘：${result.solarDate} ${result.time}，五行局「${result.fiveElementsClass}」，命宫在${result.earthlyBranchOfSoulPalace}。想从性格、事业还是感情开始？`,
        },
      ]);
    } catch (err) {
      setAstrolabe(null);
      setChartError(err instanceof Error ? err.message : "排盘失败，请检查生日格式");
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setChatError("");
    setInput("");
    const nextHistory = [...messages, { role: "user" as const, content: q }];
    setMessages(nextHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          chartSummary: chartSummary || undefined,
          history: nextHistory.slice(0, -1).slice(-8),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || "AI 请求失败");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络异常";
      setChatError(msg);
      const fallback = localInsight(q, chartSummary);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1 className="brand">
          星言<span>·</span>紫微 AI
        </h1>
        <p className="tagline">
          基于开源库 iztro 精准排盘，再由 AI 助手用通俗中文帮你解读命盘——适合自用，也方便帮朋友看盘问答。
        </p>
      </header>

      <div className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>排盘</h2>
            <button className="btn ghost" type="button" onClick={() => buildChart()}>
              重新生成
            </button>
          </div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={buildChart}>
              <div className="field">
                <label htmlFor="solarDate">阳历生日</label>
                <input
                  id="solarDate"
                  type="date"
                  value={solarDate}
                  onChange={(e) => setSolarDate(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="timeIndex">出生时辰</label>
                <select
                  id="timeIndex"
                  value={timeIndex}
                  onChange={(e) => setTimeIndex(Number(e.target.value))}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="gender">性别</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="女">女</option>
                  <option value="男">男</option>
                </select>
              </div>
              <div className="field" style={{ alignSelf: "end" }}>
                <button className="btn" type="submit">
                  生成命盘
                </button>
              </div>
            </form>

            {chartError ? <p className="error">{chartError}</p> : null}

            {astrolabe ? (
              <>
                <div className="meta-row">
                  <span className="chip">
                    农历 <strong>{astrolabe.lunarDate}</strong>
                  </span>
                  <span className="chip">
                    四柱 <strong>{astrolabe.chineseDate}</strong>
                  </span>
                  <span className="chip">
                    时辰 <strong>{astrolabe.time}</strong>
                  </span>
                  <span className="chip">
                    生肖 <strong>{astrolabe.zodiac}</strong>
                  </span>
                  <span className="chip">
                    五行局 <strong>{astrolabe.fiveElementsClass}</strong>
                  </span>
                </div>

                <div className="palace-grid">
                  {palaces.map((p) => (
                    <article
                      key={`${p.name}-${p.earthlyBranch}`}
                      className={`palace${p.isSoulPalace ? " is-soul" : ""}`}
                    >
                      <div className="palace-name">
                        <span>{p.name}</span>
                        <em>{p.earthlyBranch}</em>
                      </div>
                      <div className="stars">
                        {p.majorStars.map((s) => (
                          <span
                            key={s}
                            className={`star major${s.includes("·") ? " mutagen" : ""}`}
                          >
                            {s}
                          </span>
                        ))}
                        {p.minorStars.map((s) => (
                          <span key={s} className="star">
                            {s}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="hint">填写信息后点「生成命盘」，十二宫与主星会显示在这里。</p>
            )}
          </div>
        </section>

        <section className="panel chat">
          <div className="panel-head">
            <h2>AI 助手</h2>
            <span className="chip">Cloudflare Workers AI</span>
          </div>
          <div className="messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
          </div>
          <div className="quick-asks">
            {QUICK_ASKS.map((q) => (
              <button key={q} type="button" disabled={busy} onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={astrolabe ? "问问性格、事业、财运、感情…" : "建议先排盘，再提问效果更好"}
              disabled={busy}
            />
            <button className="btn" type="submit" disabled={busy || !input.trim()}>
              {busy ? "思考中" : "发送"}
            </button>
          </form>
          {chatError ? <p className="error" style={{ padding: "0 1.15rem 1rem" }}>{chatError}</p> : null}
        </section>
      </div>

      <p className="footer-note">
        排盘引擎：iztro · 仅供文化娱乐与自我认知参考 · 部署于 Cloudflare Pages
      </p>
    </div>
  );
}
