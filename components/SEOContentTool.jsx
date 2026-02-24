"use client";
import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";

const TONES = ["Professional", "Conversational", "Authoritative", "Friendly"];
const CONTENT_TYPES = ["Blog Post", "Product Description", "Landing Page", "Social Media", "Meta Description"];
const LENGTHS = ["Short (~300 words)", "Medium (~600 words)", "Long (~1200 words)"];

const SEARCH_INTENTS = ["Informational", "Commercial", "Transactional", "Navigational"];
const LANGUAGES = ["English", "Arabic"];
const AUDIENCES = [
    "General Consumers",
    "Business Owners",
    "Marketing Professionals",
    "Enterprise Decision Makers",
    "Corporate Decision Makers",
    "Real Estate Professionals",
    "Developers & Builders",
    "Investors",
    "High Net Worth Individuals",
    "Property Seekers",
    "Financial Professionals"
];

export default function SEOContentTool() {
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("Professional");
    const [contentType, setContentType] = useState("Blog Post");
    const [length, setLength] = useState("Medium (~600 words)");

    const [language, setLanguage] = useState("English");
    const [searchIntent, setSearchIntent] = useState("Informational");
    const [primaryKeyword, setPrimaryKeyword] = useState("");
    const [secondaryKeywords, setSecondaryKeywords] = useState("");
    const [targetAudience, setTargetAudience] = useState("Business Owners");
    const [country, setCountry] = useState("");

    const [keywords, setKeywords] = useState("");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [seoScore, setSeoScore] = useState(null);
    const [copied, setCopied] = useState(false);
    const [streamText, setStreamText] = useState("");
    const outputRef = useRef(null);

    const wordCount = (content || streamText).split(/\s+/).filter(Boolean).length;

    const generateContent = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setContent("");
        setStreamText("");
        setSeoScore(null);

        // const wordTarget = length.includes("300") ? "~300" : length.includes("600") ? "~600" : "~1200";
        const wordTarget = length.includes("300") ? 300 :
            length.includes("600") ? 600 :
                1200;
        // const keywordList = keywords.trim() ? `Target keywords to naturally include: ${keywords}` : "";

        //         const prompt = `You are an expert SEO content writer. Write high-quality, SEO-optimized ${contentType} content about: "${topic}"
        // Tone: ${tone}
        // Length: ${wordTarget} words
        // ${keywordList}

        // Requirements:
        // - Include a compelling H1 title
        // - Use H2/H3 subheadings (mark them with ## and ###)
        // - Write naturally with target keywords woven in organically
        // - Include a meta description at the end (label it "META DESCRIPTION:")
        // - Optimize for search intent and readability
        // - Add a clear call-to-action

        // Write the full content now:`;

        // Intent-based length logic
        const intentLengthMap = {
            Informational: "1,800 to 3,000 words",
            Commercial: "1,500 to 2,500 words",
            Transactional: "800 to 1,500 words",
            Navigational: "500 to 1,000 words"
        };

        const lengthGuide = intentLengthMap[searchIntent];

        const prompt = `
You are a senior SEO strategist, expert content writer, and conversion-focused marketing professional.

Write a high-quality, search-intent optimized, authoritative blog post that reads naturally for humans while following SEO best practices.

INPUT VARIABLES
Topic: ${topic}
Language: ${language}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords}
Search Intent: ${searchIntent}
SEO-optimized: ${contentType} content
Target Audience: ${targetAudience}
Country Target: ${country || "Not specified"}

CONTENT LENGTH:
${lengthGuide}

STRUCTURE:
- Compelling H1 including primary keyword
- Engaging introduction (first 150 words)
- Table of Contents
- Use Clear Subheading H2, H3
- Short readable paragraphs
- Bullet points & lists
- Key Takeaways section before conclusion
- At least 5 FAQs

At the end include:
- META TITLE (max 60 characters)
- META DESCRIPTION (max 155 characters)
- Suggested URL slug
- 5 ALT texts
- 5 People Also Ask questions
- FAQ schema in JSON-LD format

Final Objective:
Produce content that builds authority, aligns with search intent, and converts.
`;

        try {
            // const response = await fetch("https://api.anthropic.com/v1/messages", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({
            //     model: "claude-sonnet-4-20250514",
            //     max_tokens: 2000,
            //     messages: [{ role: "user", content: prompt }],
            //   }),
            // });

            const response = await fetch(
                "https://api.mistral.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_MYSTRAL_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "mistral-small-latest",
                        temperature: 0.3,
                        messages: [
                            { role: "user", content: prompt }
                        ]
                    })
                }
            );

            const data = await response.json();

            const text = data?.choices?.[0]?.message?.content || "";

            if (!text) {
                setContent("No content returned.");
                setLoading(false);
                return;
            }

            setContent(text);

            // Generate fake SEO score for fun
            // const kw = keywords.split(",").map(k => k.trim()).filter(Boolean);
            // const kwFound = kw.filter(k => text.toLowerCase().includes(k.toLowerCase())).length;
            // const kwScore = kw.length > 0 ? Math.round((kwFound / kw.length) * 40) : 30;
            // const lengthScore = Math.min(30, Math.round((text.split(/\s+/).length / parseInt(wordTarget)) * 25));
            // const score = Math.min(100, 35 + kwScore + lengthScore + (text.includes("META DESCRIPTION") ? 10 : 0));
            // setSeoScore(score);

            // Generate fake SEO score for fun
            const kw = keywords.split(",").map(k => k.trim()).filter(Boolean);

            const kwFound = kw.filter(k =>
                text.toLowerCase().includes(k.toLowerCase())
            ).length;

            const kwScore =
                kw.length > 0 ? Math.round((kwFound / kw.length) * 40) : 30;

            const lengthScore = Math.min(
                30,
                Math.round((text.split(/\s+/).length / parseInt(wordTarget)) * 25)
            );

            const score = Math.min(
                100,
                35 + kwScore + lengthScore +
                (text.includes("META DESCRIPTION") ? 10 : 0)
            );

            setSeoScore(score);
        } catch (err) {
            setContent("Error generating content. Please try again.");
        }
        setLoading(false);
    };

    const formatContent = (text) => {
        if (!text) return null;
        return text.split("\n").map((line, i) => {
            if (line.startsWith("### ")) return <h3 key={i} className="sub-heading">{line.slice(4)}</h3>;
            if (line.startsWith("## ")) return <h2 key={i} className="section-heading">{line.slice(3)}</h2>;
            if (line.startsWith("# ")) return <h1 key={i} className="content-title">{line.slice(2)}</h1>;
            if (line.startsWith("**META DESCRIPTION:**") || line.startsWith("META DESCRIPTION:")) {
                return <div key={i} className="meta-box"><span className="meta-label">META</span>{line.replace("**META DESCRIPTION:**", "").replace("META DESCRIPTION:", "")}</div>;
            }
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`)}</p>;
        });
    };

    const copyContent = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scoreColor = seoScore >= 80 ? "#00d68f" : seoScore >= 60 ? "#ffaa00" : "#ff4d6d";

    return (
        <>
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.app * {
  box-sizing: border-box;
}

body {
  margin: 0;
}

body {
  background: #ffffff;
}

.app {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', sans-serif;
  color: #000000;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
}

.header {
  text-align: center;
  margin-bottom: 48px;
}

.badge {
  display: inline-block;
  background: #f3f3f3;
  border: 1px solid #e5e5e5;
  color: #555;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.header h1 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.2;
  color: #000;
}

.header p {
  font-size: 16px;
  color: #666;
  margin-top: 10px;
}

.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 800px) {
  .grid { grid-template-columns: 1fr; }
}

.panel {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.field { margin-bottom: 20px; }

.label {
  font-size: 12px;
  color: #555;
  margin-bottom: 6px;
  display: block;
}

.topic-input,
.kw-input {
  width: 100%;
  background: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  color: #000;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.topic-input:focus,
.kw-input:focus {
  border-color: #000;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
}

.chip.active {
  background: #000;
  color: #fff;
  border-color: #000;
}

.chip:hover:not(.active) {
  border-color: #000;
}

.generate-btn {
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  background: #000;
  border: none;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.output-panel {
  min-height: 500px;
  max-width: 648px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #888;
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 20px;
}

.loader {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e5e5;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.word-badge,
.seo-badge {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  color: #333;
}

.copy-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #000;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #000;
  color: #fff;
}

.content-body {
  line-height: 1.7;
}

.content-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #000;
}

.section-heading {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 10px;
  color: #000;
}

.sub-heading {
  font-size: 16px;
  font-weight: 600;
  margin: 18px 0 8px;
  color: #000;
}

.content-body p {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.meta-box {
  background: #f9f9f9;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  margin-top: 20px;
  font-size: 13px;
  color: #333;
}

.divider {
  height: 1px;
  background: #e5e5e5;
  margin: 20px 0;
}
`}</style>

            <div className="app">
                <div className="bg-glow" />
                <div className="bg-glow2" />

                <div className="container">
                    <div className="header">
                        <div className="badge">✦ AI-Powered</div>
                        <h1>Wasalt Content<br />Studio</h1>
                        <p>Generate search-optimized content for any topic, instantly.</p>
                    </div>

                    <div className="grid">
                        {/* Controls */}
                        <div className="panel">
                            <div className="panel-title">⚙ Configure</div>

                            <div className="field">
                                <label className="label">Language</label>
                                <div className="chips">
                                    {LANGUAGES.map(lang => (
                                        <div
                                            key={lang}
                                            className={`chip ${language === lang ? "active" : ""}`}
                                            onClick={() => setLanguage(lang)}
                                        >
                                            {lang}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Topic / Title</label>
                                <textarea
                                    className="topic-input"
                                    placeholder="e.g. Best practices for remote team management..."
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label className="label">Primary Keyword</label>
                                <input
                                    className="kw-input"
                                    placeholder="Main keyword..."
                                    value={primaryKeyword}
                                    onChange={e => setPrimaryKeyword(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label className="label">Secondary Keywords</label>
                                <input
                                    className="kw-input"
                                    placeholder="keyword1, keyword2, keyword3"
                                    value={secondaryKeywords}
                                    onChange={e => setSecondaryKeywords(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label className="label">Content Type</label>
                                <div className="chips">
                                    {CONTENT_TYPES.map(t => (
                                        <div key={t} className={`chip ${contentType === t ? "active" : ""}`} onClick={() => setContentType(t)}>{t}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Target Audience</label>
                                <div className="chips">
                                    {AUDIENCES.map(a => (
                                        <div
                                            key={a}
                                            className={`chip ${targetAudience === a ? "active" : ""}`}
                                            onClick={() => setTargetAudience(a)}
                                        >
                                            {a}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Search Intent Type</label>
                                <div className="chips">
                                    {SEARCH_INTENTS.map(t => (
                                        <div key={t} className={`chip ${searchIntent === t ? "active" : ""}`} onClick={() => setSearchIntent(t)}>{t}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Tone</label>
                                <div className="chips">
                                    {TONES.map(t => (
                                        <div key={t} className={`chip ${tone === t ? "active" : ""}`} onClick={() => setTone(t)}>{t}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Country Target (Optional)</label>
                                <input
                                    className="kw-input"
                                    placeholder="e.g. Saudi Arabia"
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                />
                            </div>

                            {/* <div className="field">
                                <label className="label">Length</label>
                                <div className="chips">
                                    {LENGTHS.map(l => (
                                        <div key={l} className={`chip ${length === l ? "active" : ""}`} onClick={() => setLength(l)}>{l}</div>
                                    ))}
                                </div>
                            </div> */}

                            {/* <div className="field">
                                <label className="label">Target Keywords (comma-separated)</label>
                                <input
                                    className="kw-input"
                                    placeholder="e.g. remote work, team productivity, collaboration"
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                />
                            </div> */}

                            <button
                                className="generate-btn"
                                onClick={generateContent}
                                disabled={loading || !topic.trim()}
                            >
                                {loading ? "Generating..." : "✦ Generate Content"}
                            </button>
                        </div>

                        {/* Output */}
                        <div className="panel output-panel" ref={outputRef}>
                            {!loading && !content && (
                                <div className="empty-state">
                                    <div className="empty-icon">✦</div>
                                    <p>Configure your settings and hit generate<br />to create SEO-optimized content.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="loading-state">
                                    <div className="loader" />
                                    <div className="loading-text">Crafting content<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></div>
                                </div>
                            )}

                            {content && !loading && (
                                <>
                                    <div className="content-header">
                                        <div className="content-meta">
                                            <span className="word-badge">📝 {wordCount} words</span>
                                            {seoScore && (
                                                <span className="seo-badge" style={{ color: scoreColor, borderColor: scoreColor, background: `${scoreColor}15` }}>
                                                    SEO {seoScore}/100
                                                </span>
                                            )}
                                        </div>
                                        <button className="copy-btn" onClick={copyContent}>
                                            {copied ? "✓ Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <div className="divider" />
                                    <div className="content-body">
                                        <MarkdownRenderer content={content} />
                                        {/* {formatContent(content)} */}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}