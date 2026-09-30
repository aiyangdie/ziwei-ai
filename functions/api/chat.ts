interface Env {
  AI: Ai;
}

type ChatBody = {
  message?: string;
  chartSummary?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

const SYSTEM = `你是「星言」，一位温和、专业的紫微斗数 AI 助手。
你会根据用户提供的命盘摘要来回答问题。
规则：
1. 用简洁自然的中文，少用堆砌术语；必要时解释术语。
2. 解读要基于给定盘面信息，不要编造不存在的星曜或宫位。
3. 语气鼓励、务实，避免恐吓或绝对化断言。
4. 结尾可给 1 个可继续追问的方向。
5. 这是文化趣味与自我认知参考，不是医疗、法律或投资建议。`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as ChatBody;
    const message = (body.message || "").trim();
    if (!message) {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    const history = (body.history || []).slice(-8);
    const chart = body.chartSummary || "（用户尚未排盘，可先引导填写生日时辰）";

    const messages = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content: `当前命盘摘要：\n${chart}`,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const result = await context.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        messages,
        max_tokens: 900,
        temperature: 0.7,
      },
    );

    const reply =
      typeof result === "object" && result && "response" in result
        ? String((result as { response: string }).response || "").trim()
        : String(result || "").trim();

    if (!reply) {
      return Response.json({ error: "AI 暂无回复，请稍后重试" }, { status: 502 });
    }

    return Response.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "服务异常";
    return Response.json({ error: msg }, { status: 500 });
  }
};
