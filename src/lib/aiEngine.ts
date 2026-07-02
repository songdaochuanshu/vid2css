import type { Frame } from './frameExtractor'

const AGNES_API_URL = 'https://agnes-ai.com/v1/chat/completions'

export interface AiResult {
  css: string
  description: string
  raw: string
}

function buildPrompt(frameCount: number, timestamps: number[]): string {
  const timeline = timestamps
    .map((t, i) => 'Frame ' + (i + 1) + ': ' + t + 'ms')
    .join(', ')

  const codeBlock = '```css\n/* Description of the animation */\n@keyframes animation-name {\n  0% { ... }\n  50% { ... }\n  100% { ... }\n}\n\n.element-selector {\n  animation: animation-name 1s ease-in-out infinite;\n}\n```'

  return 'You are a CSS animation expert. The user has uploaded ' + frameCount + ' keyframes from an animation.\n\nFrame timeline: ' + timeline + '\n\nAnalyze the motion between frames and generate CSS @keyframes animation code.\n\nRequirements:\n1. Identify the animated elements and their properties (translate, rotate, scale, opacity, color, etc.)\n2. Calculate precise timing percentages for each keyframe\n3. Use appropriate CSS easing functions (ease, ease-in-out, cubic-bezier, etc.)\n4. Output complete, ready-to-use CSS code\n5. If multiple elements animate independently, generate separate @keyframes for each\n6. Include the element selectors in your output\n\nOutput format:\n- First, a brief description of what you observe in the animation\n- Then the complete CSS code block\n\nUse this exact format:\n' + codeBlock + '\n\nIMPORTANT: Only output valid CSS. No explanations outside the code block.'
}

export async function analyzeFrames(
  frames: Frame[],
  apiKey: string,
  model: string = 'agnes-2.0-flash'
): Promise<AiResult> {
  const timestamps = frames.map((f) => f.timestamp)
  const prompt = buildPrompt(frames.length, timestamps)

  const imageMessages = frames.map((frame) => ({
    type: 'image_url' as const,
    image_url: { url: frame.dataUrl },
  }))

  const response = await fetch(AGNES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
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
    throw new Error('AI API error: ' + response.status + ' - ' + error)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  const cssMatch = content.match(/```css\n([\s\S]*?)```/)
  const css = cssMatch ? cssMatch[1].trim() : content

  const descMatch = content.match(/^(?!```)[\s\S]*?(?=```css|$)/)
  const description = descMatch ? descMatch[0].trim() : ''

  return { css, description, raw: content }
}
