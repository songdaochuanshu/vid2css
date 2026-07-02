import type { Frame } from './frameExtractor'

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1/chat/completions'

export interface AiResult {
  code: string
  description: string
  raw: string
}

function buildPrompt(frameCount: number, timestamps: number[], duration: number): string {
  const timeline = timestamps.map((t, i) => 'Frame ' + (i + 1) + ': ' + t + 'ms').join('; ')

  return 'You are a Three.js animation engineer. You are given ' + frameCount + ' sequential frames from a screen recording of a Three.js WebGL scene.\n\n'
    + 'Your task: analyze the visual content and generate a complete Three.js animation that recreates what you see.\n\n'
    + 'ANALYSIS STEPS:\n'
    + '1. Scene structure: What 3D objects are visible? (geometries, materials, lights, camera setup)\n'
    + '2. Animation: What moves? Track position, rotation, scale, color, opacity, morphing\n'
    + '3. Timing: Total duration ~' + duration + 'ms. Use the frame timestamps to set keyframe timing.\n'
    + '4. Camera: What perspective does the viewer see from?\n'
    + '5. Post-processing: Any glow, blur, color grading, particles?\n\n'
    + 'FRAME TIMELINE: ' + timeline + '\n\n'
    + 'OUTPUT RULES:\n'
    + '- Output a SINGLE complete HTML file with inline <script>\n'
    + '- Use Three.js r152 via CDN: <script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>\n'
    + '- THREE is available as a global variable (window.THREE)\n'
    + '- The HTML must have: <!DOCTYPE html>, <html>, <head>, <body>\n'
    + '- Style body and canvas to fill viewport (margin:0, overflow:hidden, width:100vw, height:100vh)\n'
    + '- Use window.addEventListener("resize", ...) for responsive resize\n'
    + '- Put all code inside a single <script> tag at the end of <body>\n'
    + '- Use requestAnimationFrame for the animation loop\n'
    + '- Do NOT use ES6 import/export, do NOT use import maps\n'
    + '- Output the complete HTML inside a ```html code block\n\n'
    + 'Analyze the frames and generate the complete Three.js scene.'
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
          content: 'You are a Three.js animation expert. Output a complete HTML file with inline Three.js code. No ES modules, no import maps.',
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
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('AI API error: ' + response.status + ' - ' + error)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  const htmlMatch = content.match(/```html\n([\s\S]*?)```/)
  const code = htmlMatch ? htmlMatch[1].trim() : content

  const descMatch = content.match(/^(?!```)[\s\S]*?(?=```html|$)/)
  const description = descMatch ? descMatch[0].trim() : ''

  return { code, description, raw: content }
}
