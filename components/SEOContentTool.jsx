"use client";
import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";

const TONES = ["Professional", "Conversational", "Authoritative", "Friendly"];
const CONTENT_TYPES = ["Blog Post", "Product Description", "Landing Page", "Social Media", "Meta Description"];
const LENGTHS = ["Short (~300 words)", "Medium (~600 words)", "Long (~1200 words)"];

const SEARCH_INTENTS = ["Informational", "Commercial", "Transactional", "Navigational"];
const LANGUAGES = ["English", "Arabic"];
const AUDIENCES = [
    "Beginners",
    "Business Owners",
    "Marketing Professionals",
    "Enterprise Decision Makers",
    "General Consumers"
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
- H2 marked as ##
- H3 marked as ###
- Short readable paragraphs
- Bullet points & lists
- Key Takeaways section before conclusion
- At least 5 FAQs

SAUDI MARKET CONTEXT:
If relevant to Saudi Arabia, include regional insights, Vision 2030 context, Riyadh/Jeddah/Dammam references.

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
                        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #080b14; }

        .app {
          min-height: 100vh;
          background: #080b14;
          font-family: 'Syne', sans-serif;
          color: #e8e6f0;
          position: relative;
          overflow-x: hidden;
        }

        .bg-glow {
          position: fixed; top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,52,255,0.15) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .bg-glow2 {
          position: fixed; bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0,214,143,0.08) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .container {
          max-width: 1100px; margin: 0 auto; padding: 40px 24px;
          position: relative; z-index: 1;
        }

        .header { text-align: center; margin-bottom: 48px; }
        .badge {
          display: inline-block;
          background: rgba(99,52,255,0.15);
          border: 1px solid rgba(99,52,255,0.4);
          color: #a78bfa; font-size: 11px; letter-spacing: 3px;
          text-transform: uppercase; padding: 6px 16px; border-radius: 100px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: clamp(36px, 6vw, 64px); font-weight: 800;
          line-height: 1.1; letter-spacing: -2px;
          background: linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #60a5fa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .header p {
          font-family: 'Instrument Serif', serif; font-style: italic;
          color: #7c7a9a; font-size: 18px; margin-top: 12px;
        }

        .grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }

        .panel {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 28px;
          backdrop-filter: blur(10px);
        }

        .panel-title {
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: #5a5870; margin-bottom: 24px;
        }

        .field { margin-bottom: 20px; }
        .label { font-size: 12px; color: #7c7a9a; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; display: block; }

        .topic-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          color: #e8e6f0; font-family: 'Syne', sans-serif; font-size: 15px;
          padding: 14px 16px; resize: vertical; min-height: 80px; outline: none;
          transition: border-color 0.2s;
        }
        .topic-input:focus { border-color: rgba(99,52,255,0.5); }
        .topic-input::placeholder { color: #3d3b55; }

        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 7px 14px; font-size: 13px;
          cursor: pointer; transition: all 0.2s; color: #9997b8;
        }
        .chip.active {
          background: rgba(99,52,255,0.2); border-color: rgba(99,52,255,0.5);
          color: #c4b5fd;
        }
        .chip:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: #e8e6f0; }

        .kw-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          color: #e8e6f0; font-family: 'Syne', sans-serif; font-size: 13px;
          padding: 10px 14px; outline: none; transition: border-color 0.2s;
        }
        .kw-input:focus { border-color: rgba(99,52,255,0.5); }
        .kw-input::placeholder { color: #3d3b55; }

        .generate-btn {
          width: 100%; padding: 16px; border-radius: 12px;
          background: linear-gradient(135deg, #6334ff, #4f46e5);
          border: none; color: white; font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 1px;
          cursor: pointer; transition: all 0.25s; margin-top: 8px;
          position: relative; overflow: hidden;
        }
        .generate-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,52,255,0.4); }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .output-panel { min-height: 500px; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 400px; color: #3d3b55; text-align: center;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-state p { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 18px; }

        .loading-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 400px; gap: 20px;
        }
        .loader {
          width: 48px; height: 48px; border: 2px solid rgba(99,52,255,0.2);
          border-top-color: #6334ff; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #5a5870; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
        .loading-dots span { animation: blink 1.2s infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }

        .content-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: gap;
        }
        .content-meta { display: flex; gap: 16px; align-items: center; }
        .word-badge {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 5px 14px; font-size: 12px; color: #7c7a9a;
        }
        .seo-badge {
          border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 700;
          border: 1px solid;
        }
        .copy-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #9997b8; border-radius: 8px; padding: 8px 16px;
          font-family: 'Syne', sans-serif; font-size: 12px; cursor: pointer;
          transition: all 0.2s;
        }
        .copy-btn:hover { background: rgba(255,255,255,0.1); color: white; }

        .content-body { line-height: 1.8; }
        .content-title {
          font-size: 26px; font-weight: 800; letter-spacing: -0.5px;
          margin: 0 0 20px; color: #ffffff;
        }
        .section-heading {
          font-size: 19px; font-weight: 700; margin: 28px 0 12px;
          color: #c4b5fd;
        }
        .sub-heading {
          font-size: 16px; font-weight: 600; margin: 20px 0 8px; color: #a5f3fc;
        }
        .content-body p { color: #b0aec8; font-size: 15px; margin-bottom: 12px; }
        .meta-box {
          background: rgba(99,52,255,0.1); border: 1px solid rgba(99,52,255,0.3);
          border-radius: 10px; padding: 14px 16px; margin-top: 24px;
          font-size: 13px; color: #c4b5fd; line-height: 1.6;
        }
        .meta-label {
          display: inline-block; background: rgba(99,52,255,0.4);
          color: #e9d5ff; font-size: 10px; letter-spacing: 2px;
          padding: 2px 8px; border-radius: 4px; margin-right: 8px; font-weight: 700;
        }

        .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
      `}</style>

            <div className="app">
                <div className="bg-glow" />
                <div className="bg-glow2" />

                <div className="container">
                    <div className="header">
                        <div className="badge">✦ AI-Powered</div>
                        <h1>SEO Content<br />Studio</h1>
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

                            <div className="field">
                                <label className="label">Length</label>
                                <div className="chips">
                                    {LENGTHS.map(l => (
                                        <div key={l} className={`chip ${length === l ? "active" : ""}`} onClick={() => setLength(l)}>{l}</div>
                                    ))}
                                </div>
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