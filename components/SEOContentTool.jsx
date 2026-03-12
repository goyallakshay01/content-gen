"use client";
import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";
import "../components/styles/SEOContentTool.css";

const TONES = ["Professional", "Conversational", "Authoritative", "Friendly"];
const CONTENT_TYPES = ["Blog Post", "Product Description", "Landing Page", "Social Media", "Meta Description"];
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
const BRAND_CACHE_PREFIX = "seo-brand-context:";

export default function SEOContentTool() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [contentType, setContentType] = useState("Blog Post");

  const [language, setLanguage] = useState("English");
  const [searchIntent, setSearchIntent] = useState("Informational");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("Business Owners");
  const [country, setCountry] = useState("");

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
  const [suggestedTopics, setSuggestedTopics] = useState([
    "D’Mansions by DarGlobal: Redefining Ultra-Luxury Living",
    "Amaya Jeddah Plots: Investing in the Greenest Community in Saudi Arabia",
    "Inside AIDA Muscat: A Coastal Luxury Lifestyle Destination",
    "Exploring DarGlobal’s Landmark Projects in Dubai",
    "The Astera: Aston Martin Designed Beachfront Residences in Ras Al Khaimah"
  ]);
  const [topicLoading, setTopicLoading] = useState(false);

  const [selectedOption, setSelectedOption] = useState("");

  const outputRef = useRef(null);
  const wordCount = (content || streamText).split(/\s+/).filter(Boolean).length;

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

  const getCachedBrandContext = (brand) => {
    try {
      const key = `${BRAND_CACHE_PREFIX}${brand}`;
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached);

      // cache expires after 7 days
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (Date.now() - parsed.savedAt > sevenDays) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.context;

    } catch {
      return null;
    }
  };

  const setCachedBrandContext = (brand, context) => {
    try {
      const key = `${BRAND_CACHE_PREFIX}${brand}`;

      localStorage.setItem(
        key,
        JSON.stringify({
          context,
          savedAt: Date.now()
        })
      );
    } catch { }
  };

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

  const generateBrandContext = async (brandName) => {
    const cached = getCachedBrandContext(brandName);

    if (cached) {
      console.log("Using cached brand context");
      return cached;
    }

    console.log("Fetching new brand context from AI");

    const brandPrompt = `
You are a real estate market intelligence analyst and real estate content strategist.

Create a structured intelligence profile and blog topic dataset focused on the company's NEW PROPERTY PROJECTS, DEVELOPMENTS, and INVESTMENT OPPORTUNITIES.

Brand Name: ${brandName}

Focus strongly on:
- New property launches
- Ongoing real estate developments
- Luxury projects
- Land and plot developments
- Strategic partnerships and investment deals
- Emerging markets where the company is building projects

Return structured data.

BRAND PROFILE
Brand Overview
Headquarters
Primary Markets
Business Model

KEY PROPERTY PROJECTS
(List 5–8 notable or recent developments by the company)

PROJECT INSIGHTS
(Brief description of each project including location, property type, and investment appeal)

BLOG TOPIC IDEAS (10)
Create blog-friendly titles focused on:
- New project launches
- Luxury property developments
- Investment opportunities
- Regional real estate growth
- Project design and lifestyle features

TARGET BUYERS
CORE PROPERTY TYPES
REAL ESTATE MARKETS

SEO KEYWORDS (15)
Focus on project-based and investment-related real estate keywords.

COMPETITORS (5)

CONTENT POSITIONING
How the company positions its developments in the luxury or investment real estate market.

Keep the response structured, concise, and blog-ready.
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
            messages: [{ role: "user", content: brandPrompt }]
          })
        }
      );

      const data = await response.json();
      const context = data?.choices?.[0]?.message?.content || "";

      // store in cache
      setCachedBrandContext(brandName, context);

      return context;

    } catch {
      return "";
    }
  };

  const suggestTopics = async () => {

    if (!selectedOption) {
      alert("Please select a brand first.");
      return;
    }

    setSuggestedTopics([]);
    setTopicLoading(true);

    const brandName =
      selectedOption === "option1"
        ? "DarGlobal"
        : selectedOption === "option2"
          ? "Wasalt"
          : "";

    const brandContext = await generateBrandContext(brandName);

    const topicSuggestPrompt = `
You are a senior real estate content strategist and SEO expert.

Below is the brand intelligence profile.

----------------------------------
${brandContext}
----------------------------------

Using the brand intelligence above, generate **high-value blog topics**
that align with the company's business model, audience, and markets.

Your audience may include:
• Real estate investors
• Property buyers
• Developers
• High-net-worth individuals
• Institutional investors

---

Generate 25 blog topic ideas divided into the following categories:

1. NEW PROJECT LAUNCH COVERAGE (6 topics)

2. INVESTOR NEWS & MARKET INTELLIGENCE (5 topics)

3. UPCOMING BUSINESS OPPORTUNITIES (5 topics)

4. ROI & INVESTMENT ANALYSIS BLOGS (5 topics)

5. THOUGHT LEADERSHIP & FUTURE OUTLOOK (4 topics)

---

FOR EACH TOPIC PROVIDE:

- Blog title
- Target keyword
- Content angle (1–2 lines)
- Funnel stage: [AWARENESS / CONSIDERATION / DECISION]
- Best format: [News Article / Deep Dive / Listicle / Opinion / Data Report]
- Urgency tag: [BREAKING / TRENDING / EVERGREEN / SEASONAL]

---

STRICT RULES

• Titles must feel like premium financial media
• Avoid generic blog titles
• Use specific locations, numbers, or developments
• Align topics with the brand's market focus
• Prioritize real estate investment intelligence
• Assume the reader manages serious capital

Return topics in structured markdown format.
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
            messages: [{ role: "user", content: topicSuggestPrompt }]
          })
        }
      );

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";

      const matches = [...text.matchAll(/\*\*\d+\.\s*"([^"]+)"\*\*/g)];
      const titles = matches.map(m => m[1]);

      setSuggestedTopics(titles);

    } catch {
      setSuggestedTopics("Error generating topics.");
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
You are an elite SEO strategist and long-form content writer trained to produce 
high-ranking, search-optimized content similar to the quality produced by professional SEO tools.

Your goal is to create a comprehensive article designed to rank on Google by matching search intent,
covering semantic topics, and providing genuine value to readers.


--------------------------------------------------

IMAGE GENERATION RULES

For every H2 section in the article:

1. Immediately after the H2 heading, insert a markdown image.
2. Use this exact format:

![ALT TEXT](IMAGE_GENERATION_PROMPT)

3. The ALT TEXT must describe the image clearly for SEO.
4. The IMAGE_GENERATION_PROMPT must be a cinematic, ultra-realistic image description.
5. Images should relate directly to the section topic.
6. Use a 16:9 composition.
7. Maximum 6 images in the article.

Example:

## Why Dubai Luxury Real Estate?

![Luxury Dubai skyline with Burj Khalifa](luxury dubai skyline sunset aerial view ultra realistic 16:9 real estate cityscape)

Then continue writing the section content.

--------------------------------------------------

INPUT VARIABLES

Topic: ${topic}
Language: ${language}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords}
Search Intent: ${searchIntent}
Content Type: ${contentType}
Target Audience: ${targetAudience}
Country Target: ${country || "Global"}
Target Word Count: ${lengthGuide}

--------------------------------------------------

STEP 1 — SEARCH INTENT ANALYSIS (internal thinking)

Before writing, determine:
• The main search intent behind "${primaryKeyword}"
• What users want to learn, compare, or solve
• The most likely subtopics covered by top ranking pages

Use this to guide the article structure.

Do NOT show this analysis in the output.

--------------------------------------------------

STEP 2 — ARTICLE STRUCTURE

Write a complete SEO article using this format.

# H1 Title
Create a compelling title that includes the primary keyword
and clearly communicates value.

---

## Introduction (150–200 words)

• Start with an engaging hook
• Explain the reader's problem or curiosity
• Show why this topic matters
• Briefly preview what the article will teach
• Naturally include the primary keyword within the first 100 words

---

## Table of Contents
Generate a clickable table of contents using the H2 headings.

---

## Main Sections

Write **6–8 comprehensive H2 sections** covering the topic fully.

Each section should:
• Start with a clear explanation
• Include helpful examples, lists, or insights
• Use H3 subheadings when needed
• Naturally include secondary keywords
• Provide practical, useful information rather than generic explanations

Use:
• bullet lists
• short paragraphs
• clear explanations

Avoid filler text.

---

## Key Takeaways
Provide 5–7 important insights the reader should remember.

---

## Conclusion

Summarize the article in 100–150 words and guide the reader
toward the next logical step.

---

## FAQ Section

Write **5–7 frequently asked questions** related to the primary keyword.

Each answer should be:
40–80 words
clear and direct.

---

STEP 3 — SEO OPTIMIZATION OUTPUT

After the article, generate:

META TITLE
(max 60 characters, include primary keyword)

META DESCRIPTION
(max 155 characters)

URL SLUG
(short, lowercase, hyphenated)

IMAGE ALT TEXT (5)

PEOPLE ALSO ASK QUESTIONS (5 additional)

FAQ SCHEMA (JSON-LD)

Use valid structured data format.

--------------------------------------------------

WRITING STYLE

• Natural human tone
• Informative and authoritative
• Avoid keyword stuffing
• Use short paragraphs for readability
• Focus on value, clarity, and depth

--------------------------------------------------

OUTPUT FORMAT

Return the entire article in Markdown with this order:

1. Article Content
2. Key Takeaways
3. FAQ
4. SEO Metadata
5. Schema Markup

Do not include any explanations outside the article.

STYLING RULES

Do NOT include HTML styling.
Do NOT include inline styles.

The article will be rendered using a CSS class called:

markdown-content

Only return clean Markdown structure using:

# headings
## subheadings
paragraphs
lists
tables
images
code blocks

Do not add custom HTML wrappers.
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

      const kw = secondaryKeywords
        .split(",")
        .map(k => k.trim())
        .filter(Boolean);
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

  const clearBrandCache = (brand) => {
    try {
      localStorage.removeItem(`seo-brand-context:${brand}`);
      alert("Brand intelligence refreshed. It will regenerate next time.");
    } catch { }
  };

  return (
    <>
      <div className="app">
        <div className="container">
          <div className="header">
            <div className="badge">✦ AI-Powered</div>
            <h1>Content Studio</h1>
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
              <div className="dropdown-group brand-select">
                <select
                  className="dropdown"
                  value={selectedOption}
                  onChange={e => setSelectedOption(e.target.value)}
                >
                  <option value="">Select Brand</option>
                  <option value="darglobal">Darglobal</option>
                  <option value="wasalt">Wasalt</option>
                </select>

                <button
                  className="refresh-brand-btn"
                  onClick={() => {
                    if (!selectedOption) {
                      alert("Select a brand first");
                      return;
                    }
                    clearBrandCache(selectedOption);
                  }}
                  title="Refresh brand intelligence"
                >
                  ⟳
                </button>
              </div>

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