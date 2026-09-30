/**
 * Offline fallback when Workers AI is unavailable.
 * Uses chart keywords for a light, honest reading — not a full LLM reply.
 */
export function localInsight(question: string, chartSummary: string): string {
  if (!chartSummary) {
    return "请先生成命盘，我才能结合盘面回答。填好生日时辰后点「生成命盘」即可。";
  }

  const q = question.toLowerCase();
  const lines = chartSummary.split("\n");
  const five = lines.find((l) => l.includes("五行局")) ?? "";
  const soul = lines.find((l) => l.startsWith("命宫：")) ?? "";
  const career = lines.find((l) => l.includes("官禄")) ?? "";
  const wealth = lines.find((l) => l.includes("财帛")) ?? "";
  const love = lines.find((l) => l.includes("夫妻")) ?? "";

  const parts: string[] = [];
  parts.push("（本地速读模式：Cloudflare AI 尚未接通时的备用解读）");
  parts.push("");

  if (/性格|命盘|概括|自己|个性/.test(q) || q.includes("性格")) {
    parts.push(`从盘面看，${soul || "命宫信息已生成"}。`);
    parts.push(`${five}。命主气质往往与命宫主星、五行局相关，可把「命宫主星」当作性格底色来理解。`);
  } else if (/事业|工作|官禄|适合|职业/.test(q)) {
    parts.push(`事业相关可先看官禄宫：${career || "官禄宫信息见盘面"}。`);
    parts.push("若官禄有主星，通常比空宫更有明确发展方向；具体适合行业还需结合命宫与迁移宫一起看。");
  } else if (/财|钱|财运|财帛/.test(q)) {
    parts.push(`财帛宫提示：${wealth || "见盘面财帛宫"}。`);
    parts.push("财运不止看财帛，也要对照福德与田宅；把「赚钱方式」和「花钱习惯」分开理解会更准。");
  } else if (/感情|恋爱|夫妻|婚姻|桃花/.test(q)) {
    parts.push(`感情可看夫妻宫：${love || "见盘面夫妻宫"}。`);
    parts.push("夫妻宫主星偏刚或偏柔，会影响相处节奏；建议当作沟通风格参考，而不是命运判决。");
  } else {
    parts.push(`已收到问题：「${question}」。`);
    parts.push(`当前盘面要点：${five}；${soul}`);
    parts.push("你可以更具体地问：性格、事业、财运或感情，我会按对应宫位展开。");
  }

  parts.push("");
  parts.push("想要更细的对话解读，请在 Cloudflare 部署并开通 Workers AI 后刷新本页。");
  parts.push("可继续追问：某一年流年，或某个宫位的主星含义。");
  return parts.join("\n");
}
