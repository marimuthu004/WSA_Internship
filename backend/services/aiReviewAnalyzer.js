const axios = require("axios");

exports.analyzeReviewsWithAI = async (reviews) => {
  try {
    const reviewTexts = reviews.map(
      (review) => review.Comment
    );

    const prompt = `
Analyze all restaurant reviews together.

Return a JSON object with this structure:

{
  "sentiment":"positive",
  "summaryBullets":[
    "point1",
    "point2",
    "point3"
  ],
  "topMentions":[
    "word1",
    "word2",
    "word3"
  ]
}

Reviews:
${reviewTexts.join("\n")}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,

        response_format: {
          type: "json_object",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content =
      response.data.choices[0].message.content;

    console.log("AI RESPONSE:");
    console.log(content);

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.log(
        "JSON Parse Failed:",
        parseError.message
      );

      return {
        sentiment: "mixed",
        summaryBullets: [
          "AI summary unavailable",
        ],
        topMentions: [],
      };
    }
  } catch (error) {
    console.error(
      "AI Review Analysis Error:",
      error.response?.data || error.message
    );

    return {
      sentiment: "mixed",
      summaryBullets: [
        "AI analysis failed",
      ],
      topMentions: [],
    };
  }
};