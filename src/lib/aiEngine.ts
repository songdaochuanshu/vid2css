import type { Frame } from './frameExtractor'

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/chat/completions'

export interface AiResult {
  css: string
  description: string
  raw: string
}

function buildPrompt(frameCount: number, timestamps: number[], duration: number): string {
  const timeline = timestamps
    .map((t, i) => 'Frame ' + (i + 1) + ' (' + t + 'ms)')
    .join('\n  ')

  return [
    'You are an expert CSS animation engineer. You are given ' + frameCount + ' sequential frames extracted from a screen recording of a web animation.',
    '',
    '## Your task',
    'Analyze EVERY frame carefully and produce pixel-accurate CSS @keyframes that reproduce the exact same visual animation.',
    '',
    '## Step-by-step analysis (do this internally, then output only the final CSS)',
    '1. **Element identification**: What elements are visible? (buttons, text, shapes, backgrounds, icons, etc.)',
    '2. **Motion tracking**: For each element, what changes between consecutive frames? Track:',
    '   - Position (translateX, translateY) — estimate pixels',
    '   - Scale (scaleX, scaleY) — estimate ratio',
    '   - Rotation (rotate) — estimate degrees',
    '   - Opacity — estimate value 0-1',
    '   - Color changes — estimate hex values',
    '   - Blur, shadow, or other filter effects',
    '   - Width/height changes',
    '   - Border-radius changes',
    '3. **Timing calculation**: Total animation duration is ~' + duration + 'ms. Calculate the exact percentage for each keyframe based on its timestamp.',
    '4. **Easing inference**: Look at the spacing between frame positions. If motion accelerates, use ease-in. If it decelerates, use ease-out. If it speeds up then slows, use ease-in-out or cubic-bezier.',
    '',
    '## Frame timeline',
    '  ' + timeline,
    '',
    '## Output rules',
    '- Output ONLY valid CSS code inside a single ```css code block',
    '- Use descriptive animation names (e.g., button-pop, fade-slide-in, shimmer)',
    '- For each animated element, provide: the @keyframes AND the element selector with animation property',
    '- Use the most specific selector you can infer from the frame context',
    '- All timing values must be precise percentages based on the timestamps above',n    '- If elements appear/disappear (opacity 0 to 1), include that in the keyframes',n    '- If the animation loops, add infinite; if it plays once, do not add infinite',n    '- Use CSS custom properties only if the values repeat across animations',n    '',n    '## Example output quality',n    'BAD: animation: slide 1s ease infinite;',n    'GOOD: animation: card-enter 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;',n    '',n    'Now analyze the frames and output the CSS.'
  ].join('\n')
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
          content: 'You are a precise CSS animation engineer. You analyze frame-by-frame video captures and produce exact CSS @keyframes code. You are meticulous about timing, easing curves, and pixel-level accuracy. Output only valid CSS code, nothing else.',
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

  // 提取 CSS 代码块
  const cssMatch = content.match(/```css\n([\s\S]*?)```/)
  const css = cssMatch ? cssMatch[1].trim() : content

  // 提取描述（代码块之前的内容）
  const descMatch = content.match(/^(?!```)[\s\S]*?(?=```css|$)/)
  const description = descMatch ? descMatch[0].trim() : ''

  return { css, description, raw: content }
}
