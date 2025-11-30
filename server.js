// app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * API CHAT
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a MedStaff assistant in a hospital, answer briefly, clearly, politely, in English.",
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I don't have a suitable answer yet.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * API AI GENERATE SCHEDULE
 */
app.post("/api/ai-generate-schedule", async (req, res) => {
  try {
    const { doctors, weekStart, currentShifts } = req.body;

    if (!Array.isArray(doctors)) {
      return res.status(400).json({ error: "doctors must be an array" });
    }

    const userPayload = {
      doctors,
      weekStart,
      currentShifts,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are an AI scheduling assistant in a hospital.
Your job is to generate a weekly schedule for doctors.

Return ONLY valid JSON (no explanation) in the format:
{
  "schedule": [
    {
      "staffId": number,
      "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun",
      "shiftType": "morning" | "evening" | "night"
    }
  ]
}

Rules:
- Try to distribute shifts fairly between selected doctors.
- Max about 40 hours per doctor per week.
- Avoid Night followed immediately by Morning on the next day.
- You may keep or modify existing shifts from currentShifts.
          `.trim(),
          },
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI schedule error:", text);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let schedule = [];
    try {
      const parsed = JSON.parse(content || "{}");
      schedule = parsed.schedule || [];
    } catch (e) {
      console.error("JSON parse error:", e, content);
      return res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }

    res.json({ schedule });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ❗ KHÔNG app.listen ở đây
module.exports = app;
