// app/api/ai-generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // ✅ Works here
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert at creating Excalidraw diagrams. Generate valid Excalidraw JSON elements based on user requests. 

CRITICAL RULES:
1. Return ONLY a valid JSON array of Excalidraw elements
2. NO markdown, NO explanations, NO code blocks
3. Each element must have: type, version, versionNonce, isDeleted, id, fillStyle, strokeWidth, strokeStyle, roughness, opacity, angle, x, y, strokeColor, backgroundColor, width, height, seed, groupIds, frameId, roundness, boundElements, updated, link, locked
4. Valid types: rectangle, ellipse, diamond, line, arrow, text, freedraw
5. Use appropriate coordinates and sizes
6. For text elements, add "text" and "fontSize" fields
7. For arrows/lines, add "points" field with start and end coordinates
8. Use unique IDs for each element
9. Response must start with [ and end with ]

Example for "create a flowchart":
[
  {
    "type": "rectangle",
    "version": 1,
    "versionNonce": 1,
    "isDeleted": false,
    "id": "rect1",
    "fillStyle": "solid",
    "strokeWidth": 2,
    "strokeStyle": "solid",
    "roughness": 1,
    "opacity": 100,
    "angle": 0,
    "x": 100,
    "y": 100,
    "strokeColor": "#1971c2",
    "backgroundColor": "#a5d8ff",
    "width": 200,
    "height": 80,
    "seed": 1,
    "groupIds": [],
    "frameId": null,
    "roundness": {"type": 3},
    "boundElements": [],
    "updated": 1,
    "link": null,
    "locked": false
  },
  {
    "type": "text",
    "version": 1,
    "versionNonce": 1,
    "isDeleted": false,
    "id": "text1",
    "fillStyle": "solid",
    "strokeWidth": 2,
    "strokeStyle": "solid",
    "roughness": 1,
    "opacity": 100,
    "angle": 0,
    "x": 150,
    "y": 125,
    "strokeColor": "#1e1e1e",
    "backgroundColor": "transparent",
    "width": 100,
    "height": 25,
    "seed": 2,
    "groupIds": [],
    "frameId": null,
    "roundness": null,
    "boundElements": [],
    "updated": 1,
    "link": null,
    "locked": false,
    "fontSize": 20,
    "fontFamily": 1,
    "text": "Start",
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": null,
    "originalText": "Start",
    "lineHeight": 1.25
  }
]`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to generate diagram" },
        { status: 400 },
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    // Your cleaning/parsing logic here...
    let cleanedResponse = aiResponse
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const elements = JSON.parse(cleanedResponse);

    return NextResponse.json({ elements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
