import type { Frame } from './frameExtractor'

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/chat/completions'

export interface AiResult {
  css: string
  description: string
  raw: string
}

function buildPrompt(frameCount: number, timestamps: number[], duration: number): string {
  const timeline = timestamps.map((t, i) => 'Frame ' + (i + 1) + ': ' + t + 'ms').join('; ')

  const p = 'You are an expert CSS animation engineer. You are given ' + frameCount + ' sequential frames from a screen recording.\n\n'
    + 'ANALYSIS STEPS:\n'
    + '1. Element identification: What elements are visible?\n'
    + '2. Motion tracking per element: translateX/Y, scale, rotate, opacity, color, blur, shadow, size changes\n'
    + '3. Timing: total duration ~' + duration + 'ms. Calculate exact keyframe percentages from timestamps.\n'
    + '4. Easing: infer from spacing between frame positions.\n\n'
    + 'FRAME TIMELINE: ' + timeline + '\n\n'
    + 'OUTPUT RULES:\n'
    + '- Output ONLY valid CSS inside a single ```css code block\n'
    + '- Use descriptive animation names\n'
    + '- Provide both @keyframes and element selector with animation property\n'
    + '- Timing percentages must match frame timestamps\n'
    + '- Distinguish looping vs one-shot animations\n\n'
    + 'Analyze the frames and output the CSS.'
  return p
}

export async function analyzeFrames(
  frames: Frame[],
  apiKey: string,
  model: string = 'agnes-2.0-flash'
): Promise<AiResult> {
  const timestamps = frames.map((f) => f.timestamp)
  const duration = timestamps[timestamps.length - 1] - timestamps[0]
  const prompt = buildPrompt(frames.length, timestamps, duration)

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
        {
          role: 'system',
          content: 'You are a precise CSS animation engineer. Output only valid CSS code.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageMessages,
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 6000,
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
