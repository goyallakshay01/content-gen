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
    const [saved, setSaved] = useState(false);
    const [streamText, setStreamText] = useState("");
    const [savedFiles, setSavedFiles] = useState([]);
    const [showLibrary, setShowLibrary] = useState(false);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [suggestedTopics, setSuggestedTopics] = useState(['Real Estate Trends in Saudi Arabia', 'Luxury Property Investment Strategies', 'Navigating GCC Real Estate Laws']);
    const [topicLoading, setTopicLoading] = useState(false);

    const outputRef = useRef(null);

    const wordCount = (content || streamText).split(/\s+/).filter(Boolean).length;

    // localStorage helpers
    const LS_PREFIX = "seo-content:";

    const lsGetAllKeys = () => {
        try {
            return Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
        } catch { return []; }
    };

    const lsSet = (key, value) => {
        try { localStorage.setItem(key, value); return true; }
        catch { return false; }
    };

    const lsGet = (key) => {
        try { return localStorage.getItem(key); }
        catch { return null; }
    };

    const lsDelete = (key) => {
        try { localStorage.removeItem(key); return true; }
        catch { return false; }
    };

    // Load the list of saved files from localStorage
    const fetchSavedFiles = async () => {
        setLoadingLibrary(true);
        try {
            const keys = lsGetAllKeys();
            const files = keys.map(key => {
                try {
                    const raw = lsGet(key);
                    if (raw) return { key, ...JSON.parse(raw) };
                } catch { return null; }
                return null;
            });
            setSavedFiles(files.filter(Boolean).sort((a, b) => b.savedAt - a.savedAt));
        } catch (e) {
            setSavedFiles([]);
        }
        setLoadingLibrary(false);
    };

    const saveContent = () => {
        if (!content) return;
        setSaveError("");
        const slug = topic
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50) || "content";
        const timestamp = Date.now();
        const key = `${LS_PREFIX}${slug}-${timestamp}`;
        const payload = JSON.stringify({
            topic,
            primaryKeyword,
            contentType,
            language,
            savedAt: timestamp,
            content,
            seoScore,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            filename: `${slug}-${timestamp}.md`,
        });
        const ok = lsSet(key, payload);
        if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } else {
            setSaveError("Save failed — localStorage may be full or unavailable.");
        }
    };

    const loadFile = (file) => {
        setContent(file.content);
        setTopic(file.topic);
        setPrimaryKeyword(file.primaryKeyword || "");
        setContentType(file.contentType || "Blog Post");
        setLanguage(file.language || "English");
        setSeoScore(file.seoScore || null);
        setShowLibrary(false);
    };

    const deleteFile = (key, e) => {
        e.stopPropagation();
        lsDelete(key);
        setSavedFiles(prev => prev.filter(f => f.key !== key));
    };

    const downloadMd = () => {
        if (!content) return;
        const slug = topic
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50);
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug || "content"}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const suggestTopics = async () => {
        setSuggestedTopics([]);
        setTopicLoading(true);

        const topicSuggestPrompt = `You are a senior real estate content strategist and market intelligence writer 
specializing in GCC luxury property markets. You write for a premium real estate 
media brand that covers NEW project launches, breaking investment news, and 
emerging opportunities across Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman.

Your audience is:
- Ultra-High-Net-Worth investors (local Gulf + international)
- Family offices actively allocating capital into real estate
- Institutional and private investors tracking Vision 2030 pipelines
- Expat HNW buyers watching Saudi freehold zone developments
- Real estate funds and developers scouting partnership opportunities

CORE CONTENT MISSION:
Position the brand as the #1 Arabic-Gulf real estate intelligence source for 
investors who want to be FIRST to know about:
→ New luxury project launches (off-plan & ready)
→ Government-backed mega-developments going to market
→ Emerging zones & cities being unlocked for private investment
→ Policy changes opening new doors for foreign buyers
→ Developer deals, IPOs, and funding rounds in the GCC property sector

---

Generate 25 blog topic ideas divided into the following categories:

1. NEW PROJECT LAUNCH COVERAGE (6 topics)
   → News-style articles announcing or deep-diving into brand new 
     project launches in Saudi Arabia and GCC
   → Examples of angle: first look, what's included, pricing tiers, 
     ROI projections, who should buy
   → Reference real projects like: NEOM, The Line, Sindalah Island, 
     Diriyah Gate, Red Sea Project, Qiddiya, Roshn, Emaar KSA, 
     Aldar Abu Dhabi, Lusail City Qatar

2. INVESTOR NEWS & MARKET INTELLIGENCE (5 topics)
   → Time-sensitive, data-driven news blogs for active investors
   → Covers: policy shifts, new freehold zones, mortgage regulation 
     updates, foreign ownership law changes, developer announcements
   → Tone: urgent, credible, Bloomberg-style but accessible

3. UPCOMING BUSINESS OPPORTUNITIES (5 topics)
   → Forward-looking pieces on WHERE and WHAT to invest in next
   → Focus on: pre-launch windows, early-bird pricing phases, 
     undervalued emerging districts, commercial+residential mixed plays
   → Include cities like: Riyadh North, NEOM Regions, AlUla, 
     Jeddah Waterfront, Lusail, Saadiyat Island expansion

4. ROI & INVESTMENT ANALYSIS BLOGS (5 topics)
   → Data-backed comparisons and projections for HNW decision-making
   → Examples: rental yield comparisons across GCC cities, 
     off-plan vs ready property ROI in 2025, 
     capital appreciation forecasts in Vision 2030 zones

5. THOUGHT LEADERSHIP & FUTURE OUTLOOK (4 topics)
   → Big-picture perspectives that establish brand authority
   → Topics like: the next 5 years of Saudi real estate, 
     how Vision 2030 is reshaping generational wealth, 
     why global billionaires are pivoting to Gulf property

---

FOR EACH TOPIC PROVIDE:
- Blog title (specific, not generic)
- Target keyword (for SEO)
- Content angle (1-2 lines explaining the hook)
- Funnel stage: [AWARENESS / CONSIDERATION / DECISION]
- Best format: [News Article / Deep Dive / Listicle / Opinion / Data Report]
- Urgency tag: [BREAKING / TRENDING / EVERGREEN / SEASONAL]

---

STRICT RULES:
- NO generic titles — every title must name a specific city, project, 
  policy, or number (e.g. "5 Off-Plan Projects in Riyadh Launching Q1 2025")
- Write titles that feel like premium financial media, not generic blogs
- Prioritize Saudi Arabia as the primary market, GCC as secondary
- Reflect Islamic finance sensitivity and Gulf cultural investment values
- Assume the reader manages serious capital and respects precision over hype`;

        try {
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
                            { role: "user", content: topicSuggestPrompt }
                        ]
                    })
                }
            );

            const data = await response.json();
            const text = data?.choices?.[0]?.message?.content || "";

            if (!text) {
                setSuggestedTopics("No content returned.");
                setTopicLoading(false);
                return;
            }

            const titles = [...text.matchAll(/\d+\.\s+\*\*"([^"]+)"\*\*/g)]
                .map(match => match[1])
                .filter(Boolean);

            setSuggestedTopics(titles);
            setTopicLoading(false);

        } catch (err) {
            setSuggestedTopics("Error generating Topics. Please try again.");
        }
        setTopicLoading(false);
    };

    const generateContent = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setContent("");
        setStreamText("");
        setSeoScore(null);
        setSaveError("");

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

            const kw = keywords.split(",").map(k => k.trim()).filter(Boolean);
            const kwFound = kw.filter(k => text.toLowerCase().includes(k.toLowerCase())).length;
            const kwScore = kw.length > 0 ? Math.round((kwFound / kw.length) * 40) : 30;
            const wordTarget = 600;
            const lengthScore = Math.min(30, Math.round((text.split(/\s+/).length / wordTarget) * 25));
            const score = Math.min(100, 35 + kwScore + lengthScore + (text.includes("META DESCRIPTION") ? 10 : 0));
            setSeoScore(score);
        } catch (err) {
            setContent("Error generating content. Please try again.");
        }
        setLoading(false);
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

.app * { box-sizing: border-box; }
body { margin: 0; background: #ffffff; }

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

.topicSuggestContainer {
  margin-top: 32px;
  margin-bottom: 32px;
}

.topicSuggestHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.topicSuggestHeader h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.topicSuggestList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topicSuggestItem {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
  white-space: nowrap;
}

.topicSuggestItem:hover {
  background: #000;
  color: #fff;
  border-color: #000;
}

.generate-btn.small {
  width: auto;
  padding: 8px 18px;
  font-size: 13px;
  border-radius: 999px;
}

.topicSuggestPlaceholder {
  width: 100%;
  padding: 18px;
  border: 1px dashed #e0e0e0;
  border-radius: 12px;
  text-align: center;
  font-size: 13px;
  color: #888;
  background: #fafafa;
  font-style: italic;
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

.header-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.library-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.library-btn:hover {
  background: #000;
  color: #fff;
  border-color: #000;
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

.topic-input, .kw-input {
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

.topic-input:focus, .kw-input:focus { border-color: #000; }

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

.chip:hover:not(.active) { border-color: #000; }

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

.generate-btn:hover:not(:disabled) { opacity: 0.85; }
.generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
  flex-wrap: wrap;
  gap: 10px;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.word-badge, .seo-badge {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.copy-btn, .save-btn, .download-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #000;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-btn:hover, .download-btn:hover {
  background: #000;
  color: #fff;
}

.save-btn {
  background: #000;
  color: #fff;
  border-color: #000;
}

.save-btn:hover { opacity: 0.8; }
.save-btn.saved { background: #00d68f; border-color: #00d68f; }

.save-error {
  font-size: 11px;
  color: #ff4d6d;
  margin-top: 4px;
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

/* Library Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover { background: #f5f5f5; color: #000; }

.modal-body {
  overflow-y: auto;
  padding: 16px 24px;
  flex: 1;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-card {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.file-card:hover {
  border-color: #000;
  background: #fafafa;
}

.file-info { flex: 1; min-width: 0; }

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.file-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.load-btn {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.delete-btn {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #ff4d6d;
  transition: all 0.2s;
}

.delete-btn:hover { background: #ff4d6d; color: #fff; border-color: #ff4d6d; }

.empty-library {
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 14px;
}

.empty-library .icon { font-size: 32px; margin-bottom: 12px; }
`}</style>

            <div className="app">
                <div className="container">
                    <div className="header">
                        <div className="badge">✦ AI-Powered</div>
                        <h1>Wasalt Content<br />Studio</h1>
                        <p>Generate search-optimized content for any topic, instantly.</p>
                        <div className="header-actions">
                            <button
                                className="library-btn"
                                onClick={() => { setShowLibrary(true); fetchSavedFiles(); }}
                            >
                                📂 Saved Content Library
                            </button>
                        </div>
                    </div>

                    <div className="topicSuggestContainer">
                        <div className="topicSuggestHeader">
                            <h3>Suggested Topics</h3>
                            <button
                                className="generate-btn small"
                                style={{ width: "auto", padding: "8px 16px", marginTop: 0 }}
                                onClick={suggestTopics}
                                disabled={topicLoading}
                            >
                                {topicLoading ? "Generating..." : "✦ Generate New"}
                            </button>
                        </div>

                        <div className="topicSuggestList">

                            {topicLoading && (
                                <div className="topicSuggestPlaceholder">
                                    Generating elite topic ideas...
                                </div>
                            )}

                            {!topicLoading && (!suggestedTopics || suggestedTopics.length === 0) && (
                                <div className="topicSuggestPlaceholder">
                                    ✦ Tap “Generate New” to unlock premium real estate content ideas.
                                </div>
                            )}

                            {!topicLoading && Array.isArray(suggestedTopics) && suggestedTopics.length > 0 &&
                                suggestedTopics.map((item, index) => (
                                    <div
                                        key={index}
                                        className="topicSuggestItem"
                                        onClick={() => setTopic(item)}
                                    >
                                        {item}
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="grid">
                        {/* Controls */}
                        <div className="panel">
                            <div className="panel-title">⚙ Configure</div>

                            <div className="field">
                                <label className="label">Language</label>
                                <div className="chips">
                                    {LANGUAGES.map(lang => (
                                        <div key={lang} className={`chip ${language === lang ? "active" : ""}`} onClick={() => setLanguage(lang)}>
                                            {lang}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Topic / Title</label>
                                <textarea className="topic-input" placeholder="e.g. Best practices for remote team management..." value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>

                            <div className="field">
                                <label className="label">Primary Keyword</label>
                                <input className="kw-input" placeholder="Main keyword..." value={primaryKeyword} onChange={e => setPrimaryKeyword(e.target.value)} />
                            </div>

                            <div className="field">
                                <label className="label">Secondary Keywords</label>
                                <input className="kw-input" placeholder="keyword1, keyword2, keyword3" value={secondaryKeywords} onChange={e => setSecondaryKeywords(e.target.value)} />
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
                                        <div key={a} className={`chip ${targetAudience === a ? "active" : ""}`} onClick={() => setTargetAudience(a)}>{a}</div>
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
                                <input className="kw-input" placeholder="e.g. Saudi Arabia" value={country} onChange={e => setCountry(e.target.value)} />
                            </div>

                            <button className="generate-btn" onClick={generateContent} disabled={loading || !topic.trim()}>
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
                                    <div>Crafting content...</div>
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
                                        <div className="action-buttons">
                                            <button className="copy-btn" onClick={copyContent}>
                                                {copied ? "✓ Copied!" : "Copy"}
                                            </button>
                                            <button
                                                className={`save-btn ${saved ? "saved" : ""}`}
                                                onClick={saveContent}
                                            >
                                                {saved ? "✓ Saved!" : "💾 Save as MD"}
                                            </button>
                                            <button className="download-btn" onClick={downloadMd}>
                                                ⬇ Download MD
                                            </button>
                                        </div>
                                    </div>
                                    {saveError && <div className="save-error">{saveError}</div>}
                                    <div className="divider" />
                                    <div className="content-body">
                                        <MarkdownRenderer content={content} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Library Modal */}
            {showLibrary && (
                <div className="modal-overlay" onClick={() => setShowLibrary(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📂 Saved Content Library</h2>
                            <button className="modal-close" onClick={() => setShowLibrary(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {loadingLibrary ? (
                                <div className="empty-library">
                                    <div className="loader" style={{ margin: "0 auto 12px" }} />
                                    <div>Loading saved files...</div>
                                </div>
                            ) : savedFiles.length === 0 ? (
                                <div className="empty-library">
                                    <div className="icon">📄</div>
                                    <div>No saved content yet.</div>
                                    <div style={{ marginTop: 6, fontSize: 12 }}>Generate content and click "Save as MD" to store it here.</div>
                                </div>
                            ) : (
                                <div className="file-list">
                                    {savedFiles.map(file => (
                                        <div key={file.key} className="file-card">
                                            <div className="file-info">
                                                <div className="file-name">{file.topic || "Untitled"}</div>
                                                <div className="file-meta">
                                                    <span>🗂 {file.contentType}</span>
                                                    <span>📝 {file.wordCount} words</span>
                                                    {file.seoScore && <span style={{ color: file.seoScore >= 80 ? "#00d68f" : file.seoScore >= 60 ? "#ffaa00" : "#ff4d6d" }}>SEO {file.seoScore}/100</span>}
                                                    <span>🕐 {new Date(file.savedAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="file-meta" style={{ marginTop: 2 }}>
                                                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa" }}>{file.filename}</span>
                                                </div>
                                            </div>
                                            <div className="file-actions">
                                                <button className="load-btn" onClick={() => loadFile(file)}>Load</button>
                                                <button className="download-btn" onClick={(e) => { e.stopPropagation(); const blob = new Blob([file.content], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.filename || "content.md"; a.click(); URL.revokeObjectURL(url); }}>⬇</button>
                                                <button className="delete-btn" onClick={(e) => deleteFile(file.key, e)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}