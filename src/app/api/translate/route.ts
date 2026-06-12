import { NextRequest, NextResponse } from "next/server";

const translationMap: Record<string, string> = {
  "How I built a fully functional SaaS in 3 hours using Gemini 3.5 Pro and Next.js":
    "如何使用 Gemini 3.5 Pro 和 Next.js 在 3 小时内构建一个功能齐全的 SaaS",
  "I have very little background in react, but today I wanted to test if the \"vibe coding\" hype is real.\n      \nHere is exactly what I did:\n1. I described my idea: a simplified analytics dashboard for indie hackers.\n2. I prompted Gemini 3.5 Pro to generate the nextjs setup commands.\n3. I used standard tailwind cards to make it look super modern.\n4. I hooked up the SQLite db.\n\nThe results are insane. The app compiles, writes records, and looks extremely sleek.\nHow is everyone else vibing? Are we actually entering the zero-syntax developer era?":
    "我几乎没有 React 基础，但今天我想测试一下“vibe coding”的宣传是否属实。\n\n我具体是这么做的：\n1. 我描述了我的想法：一个面向独立开发者的简易分析仪表盘。\n2. 我提示 Gemini 3.5 Pro 生成 Next.js 的安装命令。\n3. 我使用标准的 Tailwind 卡片设计让它看起来非常现代。\n4. 我连接了 SQLite 数据库。\n\n结果太不可思议了。应用成功编译，写入记录，而且外观极其流畅。\n大家最近感觉如何？我们真的要进入“零语法开发时代”了吗？",
  "This is exactly what I mean! The syntax barrier is gone. Now it's all about product thinking.":
    "这就是我所说的！语法障碍消失了。现在一切都看产品思维了。",
  "Did you encounter any hallucinations with the SQLite setup? Sometimes my agent tries to use pg-native packages which fail.":
    "你在 SQLite 配置中遇到幻觉了吗？有时我的 Agent 会尝试使用 pg-native 包，然后报错。",
  "I recommend using Prisma. It handles SQLite out of the box and is super easy to prompt the AI for queries.":
    "我推荐使用 Prisma。它开箱即用支持 SQLite，并且非常容易提示 AI 编写查询语句。",
  "Share your absolute best prompt for debugging tailwind layout alignment":
    "分享你用于调试 Tailwind 布局对齐的绝对最佳提示词",
  "We've all been there: a layout looks perfect on desktop but breaks completely on mobile or medium screen widths. Instead of digging through CSS manually, what is your go-to prompt to get the LLM to fix it?\n\nHere is mine:\n```text\nAnalyze the following CSS/Tailwind classes and layout. It has an alignment issue where elements wrap unexpectedly on md screens. Please output only the corrected code block and explain which utility class was causing the overflow.\n```\n\nLet's share prompt templates that actually save hours!":
    "大家都经历过：布局在桌面端看起来完美，但在移动端或中等屏幕宽度上完全崩塌。不用去手动翻 CSS，你首选的 prompt 是什么？\n\n这是我的：\n```text\n分析以下 CSS/Tailwind 类和布局。它在中等屏幕上存在对齐问题，元素意外折行。请仅输出修改后的代码块，并解释是哪个工具类导致了溢出。\n```\n\n让我们分享那些真正能节省时间的提示词模板！",
  "My prompt is simple: 'Explain it to me like I am 5, then fix it.' Works every time lol.":
    "我的提示词很简单：“像我 5 岁一样解释给我听，然后修复它。” 每次都行，哈哈。",
  "Agreed, keeping prompts simple is key. Overcomplicating it makes the agent hallucinate.":
    "同意，保持 prompt 简单是关键。过于复杂会让 Agent 产生幻觉。",
  "Is anyone actually making money with vibe-coded projects? Let's discuss monetization":
    "真的有人用 vibe-coded 项目赚到钱吗？我们来聊聊变现",
  "Vibe coding allows us to ship projects 10x faster. But shipping is only 10% of the battle. \n\nAre you guys integrating Stripe or Lemon Squeezy? How do you prompt the AI to setup payment webhooks without messing up the database states?\n\nLet's talk numbers and monetization strategies for AI Native developers!":
    "Vibe coding 让我们发版速度快了 10 倍。但发版只是 10% 的战斗。\n\n大家都在集成 Stripe 还是 Lemon Squeezy？你怎么写 prompt 让 AI 设置支付 webhook 而不搞乱数据库状态的？\n\n让我们来谈谈 AI 原生开发者的数字与变现策略！",
  "I'm using Stripe. I just tell the AI: 'Write a Next.js route handler for Stripe webhooks and secure it.' It gets it right 90% of the time.":
    "我用的是 Stripe。我直接告诉 AI：“写一个用于 Stripe Webhook 的 Next.js 路由处理器并保障安全。” 90% 的情况下它都能写对。",
  "We should build a boilerplate repo that has SQLite + Stripe pre-prompted.":
    "我们应该建一个开源脚手架仓库，把 SQLite + Stripe 提示词全部内置好。",
  "Showcase: My 3D Shader Generator built entirely via prompting":
    "展示：完全通过提示词构建的 3D Shader 生成器",
  "I don't know WebGL or glsl shaders at all. Yet, using Claude 3.5 Sonnet, I generated this fully responsive 3D interactive shader where you can drag mouse to alter gravity waves.\n\nTook me exactly 4 prompts!\nCheck it out, it renders 60fps on mobile. The code is 800 lines of pure math that I didn't write a single line of.\n\nWhat a time to be alive.":
    "我完全不懂 WebGL 或 glsl 编程。但使用 Claude 3.5 Sonnet，我生成了这个完全响应式的 3D 交互着色器，可以通过拖拽鼠标修改引力波。\n\n只用了 4 个提示词！\n瞧瞧这个，它在手机上跑 60 帧。代码里有 800 行纯数学计算，我自己一行没写。\n\n这时代真是太棒了。",
  "This is gorgeous. Could you share the prompt sequence you used? I want to build a similar shader.":
    "这太华丽了。你能分享一下你用的提示词序列吗？我也想写个类似的着色器。",
};

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const trimmed = text.trim();

    // Check pre-baked map
    if (translationMap[trimmed]) {
      return NextResponse.json({ translatedText: translationMap[trimmed] });
    }

    // Dynamic translation simulator
    const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    let translatedText = "";

    if (isChinese) {
      translatedText = `[Simulated English Translation]: "${trimmed}" has been automatically translated. AI agent is vibing in the background to support global builders!`;
    } else {
      translatedText = `[模拟中文翻译]: “${trimmed}” 已被自动翻译。AI 助手正在后台默默写码，支持全球创作者！`;
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate" },
      { status: 500 }
    );
  }
}
