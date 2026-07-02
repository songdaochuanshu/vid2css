import type { Frame } from './frameExtractor'

const AGNES_API_URL = 'https://agnes-ai.com/v1/chat/completions'

export interface AiResult {
  css: string
  description: string
  raw: string
}

function buildPrompt(frameCount: number, timestamps: number[]): string {
  const timeline = timestamps
    .map((t, i) => `Frame ${i + 1}: ${t}ms`)
    .join(', ')

  return `You are a CSS animation expert. The user has uploaded ${frameCount} keyframes from an animation.

Frame timeline: ${timeline}

Analyze the motion between frames and generate CSS @keyframes animation code.

Requirements:
1. Identify the animated elements and their properties (translate, rotate, scale, opacity, color, etc.)
2. Calculate precise timing percentages for each keyframe
3. Use appropriate CSS easing functions (ease, ease-in-out, cubic-bezier, etc.)
4. Output complete, ready-to-use CSS code
5. If multiple elements animate independently, generate separate @keyframes for each
6. Include the element selectors in your output

Output format:
- First, a brief description of what you observe in the animation
- Then the complete CSS code block

Use this exact format:
```css
/* Description of the animation */
@keyframes animation-name {
  0% { ... }
  50% { ... }
  100% { ... }
}

.element-selector {
  animation: animation-name 1s ease-in-out infinite;
}
``` `

IMPORTANT: Only output valid CSS. No explanations outside the code block.`
}

export async function analyzeFrames(
  frames: Frame[],
  apiKey: string,
  model: string = 'agnes-2.0-flash'
): Promise<AiResult> {
  const timestamps = frames.map((f) => f.timestamp)
  const prompt = buildPrompt(frames.length, timestamps)

  // 构建 messages：system + 用户消息（含图片）
  const imageMessages = frames.map((frame) => ({
    type: 'image_url' as const,
    image_url: { url: frame.dataUrl },
  }))

  const response = await fetch(AGNES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a CSS animation expert. Output only valid CSS.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageMessages,
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // 提取 CSS 代码块
  const cssMatch = content.match(/```css\n([\s\S]*?)```/)
  const css = cssMatch ? cssMatch[1].trim() : content

  // 提取描述（代码块之前的内容）
  const descMatch = content.match(/^(?!```)[\s\S]*?(?=```css|$)/)
  const description = descMatch ? descMatch[0].trim() : ''

  return { css, description, raw: content }
}
