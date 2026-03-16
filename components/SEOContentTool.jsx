"use client";
import { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";
import "../components/styles/SEOContentTool.css";
import { TONES, CONTENT_TYPES, SEARCH_INTENTS, LANGUAGES, AUDIENCES, BRAND_CACHE_PREFIX, LS_PREFIX } from "@/constants/categories";

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
  const [selectedOption, setSelectedOption] = useState("Darglobal");

  const outputRef = useRef(null);
  const wordCount = (content || streamText).split(/\s+/).filter(Boolean).length;

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

  const getCachedBrandContext = () => {
    try {
      const key = `${BRAND_CACHE_PREFIX}${selectedOption}`;
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

  const setCachedBrandContext = (context) => {
    try {
      const key = `${BRAND_CACHE_PREFIX}${selectedOption}`;

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

  const generateBrandContext = async () => {
    const cached = getCachedBrandContext();

    if (cached) {
      console.log("Using cached brand context");
      return cached;
    }

    console.log("Fetching new brand context from AI");

    const brandPrompt = `
You are a real estate market intelligence analyst and real estate content strategist.

Create a structured intelligence profile and blog topic dataset focused on the company's NEW PROPERTY PROJECTS, DEVELOPMENTS, and INVESTMENT OPPORTUNITIES.

Brand Name: ${selectedOption}

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

      setCachedBrandContext(context);

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

    const brandContext = await generateBrandContext();

    const topicSuggestPrompt = `
You are a senior luxury real estate content strategist and global property market analyst.

Your goal is to generate **high-value SEO blog topics** for a luxury real estate investment blog.

Developer Brand: ${selectedOption}

Brand Intelligence:
${brandContext}

The blog focuses on:

• branded residences  
• luxury property developments  
• global real estate investment opportunities  
• major collaborations with luxury brands  
• new property launches  

The tone should sound like **premium real estate media such as Knight Frank, Bloomberg, or Architectural Digest.**

--------------------------------------------------

STEP 1 — Discover Active Projects

Identify **5–6 REAL luxury real estate developments** associated with:

${selectedOption}

These may include:

• branded residences  
• luxury villa communities  
• high-end apartment developments  
• golf communities  
• coastal luxury developments  

For each project capture:

Project: project name  
Location: city, country  
Brand: collaboration partner (if applicable)

Example:

Project: Tierra Viva  
Location: Marbella, Spain  
Brand: Lamborghini

Project: The Astera  
Location: Ras Al Khaimah, UAE  
Brand: Aston Martin

--------------------------------------------------

STEP 2 — Create Projects Context

Return a section called:

## Projects Context

Project: Name  
Location: City, Country  
Brand: Brand partner or "None"

Repeat for 5–6 projects.

--------------------------------------------------

STEP 3 — Generate SEO Blog Topics

Using ONLY the projects listed above, generate **5–6 premium SEO blog titles.**

--------------------------------------------------

TITLE RULES (VERY IMPORTANT)

DO NOT use placeholders like:

[Brand]  
[City]  
[Project Name]

Always replace them with REAL values.

Brand name must always be:

${selectedOption}

The city must be derived from the project location.

Examples:

Location: Marbella, Spain → City: Marbella  
Location: Muscat, Oman → City: Muscat  
Location: Ras Al Khaimah, UAE → City: Ras Al Khaimah  

--------------------------------------------------

TITLE REQUIREMENTS

Every title MUST include:

• project name  
• collaboration brand if available  
• developer name (${selectedOption})  
• project city  

Titles must sound like **financial media or luxury real estate publications.**

--------------------------------------------------

TITLE STYLE EXAMPLES

Tierra Viva by Lamborghini: How ${selectedOption} Is Redefining Luxury Living in Marbella

The Astera by Aston Martin: Inside ${selectedOption}'s Iconic Beachfront Residences in Ras Al Khaimah

AIDA Oman: Why Investors Are Watching ${selectedOption}'s Coastal Development in Muscat

W Residences Dubai Harbour: How ${selectedOption} Is Expanding Luxury Living in Dubai

--------------------------------------------------

SEARCH TERM RULES

Each topic must include an SEO search term.

Search terms should contain:

• project name  
• collaboration brand  
• location  
• ${selectedOption}

Example:

Search term: Tierra Viva Lamborghini villas Marbella ${selectedOption}

--------------------------------------------------

RETURN FORMAT

## Projects Context

Project: Example  
Location: Example  
Brand: Example

Project: Example  
Location: Example  
Brand: Example

--------------------------------------------------

## Blog Topics

Title: Example premium headline  
Search term: Example SEO keyword

Title: Example premium headline  
Search term: Example SEO keyword

Generate **5–6 topics only**.

Do NOT include numbering or explanations.
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

      console.log(text);

      const blocks = text.split("Title:").slice(1);

      const topics = blocks.map(block => {
        const [titleLine, searchLine] = block.split("\n");

        return {
          title: titleLine.trim(),
          searchTerm: searchLine.replace("Search term:", "").trim()
        };
      });

      setSuggestedTopics(topics);

    } catch {
      setSuggestedTopics("Error generating topics.");
    }

    setTopicLoading(false);
  };

  const getProjectLinksFromTopic = async (topic) => {

    const prompt = `
You are a real estate SEO assistant.

Your job is to detect property projects mentioned in the topic
and return internal links for them.

Brand: ${selectedOption}

Topic:
${topic}

Instructions:

1. Identify if the topic references any property project.
2. Only return projects developed by the brand.
3. Convert project names into SEO slugs.

Example format:

Project: Tierra Viva
Link: /projects/tierra-viva

Project: AIDA Oman
Link: /projects/aida-oman

Rules:
- Maximum 5 links
- Only return valid projects
- If no projects found return "None"

Output format:

Project Links:

Project: Name
Link: /projects/slug

Project: Name
Link: /projects/slug
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
            temperature: 0.2,
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";

      return text;

    } catch {
      return "";
    }
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

    const projectLinks = await getProjectLinksFromTopic(topic);

    const prompt = `

You are an elite SEO strategist, real estate content expert, and long-form blog writer.

Your task is to generate a **high-ranking SEO article optimized for Google search** using semantic SEO, search intent matching, and authoritative information.

The content must follow **modern SEO best practices used by professional tools like SurferSEO, Clearscope, and MarketMuse.**

Target article length: **3500–4000 words**

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
Target Word Count: ${lengthGuide || "3800"}
Brand Name: ${selectedOption}
Project Links: ${projectLinks}

--------------------------------------------------

STEP 1 — SEARCH INTENT ANALYSIS (internal reasoning)

Before writing the article:

Determine:

• the main search intent behind the keyword
• informational / commercial / transactional intent
• semantic topics used by top ranking pages
• user pain points
• buyer concerns

Use this internally to design the structure.

Do NOT show this analysis in the output.

--------------------------------------------------

STEP 2 — ARTICLE STRUCTURE

Write a full SEO article with the following format.

# H1 Title

Create a compelling title including the **Primary Keyword**

Add:

Published Date: today's date  
Last Updated: today's date  
Estimated Reading Time

---

## Introduction

150–200 words

Include:

• strong hook
• search intent explanation
• why the topic matters
• primary keyword within first 100 words

---

## Table of Contents

Generate anchor links using this format:

- [Section Title](#section-id)

Each section must have an **id attribute**.

Example:

## Why Dubai Real Estate Is Growing
{id="dubai-real-estate-growth"}

---

## Main Article Sections

Write **7–8 H2 sections**

For each section:

1️⃣ Insert an image immediately after the heading.

Format:

![ALT TEXT](IMAGE_GENERATION_PROMPT)

Rules:

• cinematic ultra realistic
• architectural photography
• 16:9 composition
• max 6 images in article

Example:

![luxury golf villas overlooking ocean cliffs](ultra luxury golf community aerial sunset ocean cliffs cinematic architecture photography 16:9)

---

Each section must include:

• clear explanation
• bullet lists
• H3 subsections
• examples
• data insights
• secondary keywords naturally

Avoid filler content.

---

INTERNAL LINKING RULES

Use contextual internal links to brand pages or project pages.

Example:

[Luxury villas in Aida Oman](/projects/aida-oman)

Use **4–6 internal links**.

If project links are provided in input variables, prioritize those.

---

EXTERNAL LINKING RULES

Use **3–5 external links** from authoritative sources such as:

• government real estate reports
• global property market reports
• economic publications
• developer official websites

Example:

[Knight Frank Global Wealth Report](https://www.knightfrank.com/research)

Do not overlink.

---

KEYWORD HIGHLIGHTING

Highlight important keywords using **bold formatting**

Example:

**Dubai luxury real estate market**

Do NOT overuse bold formatting.

---

## Investment Potential Section

Include a section discussing:

• ROI potential
• property demand
• rental yield
• long term value

Use bullet points.

---

## Developer or Brand Section

Add credibility about the developer or brand.

Include:

• developer background
• reputation
• previous projects
• market credibility

This improves **E-E-A-T signals**.

---

## Key Takeaways

Provide **6–8 key insights**

Format:

• insight
• insight
• insight

Include both:

✔ advantages  
✔ considerations

---

## Conclusion

150–200 words summarizing the article.

Encourage readers to explore related guides or property listings.

---

## Call To Action

Add a CTA block encouraging users to:

• explore properties
• book consultation
• download brochure
• view project details

---

## FAQ Section

Generate **6–8 property related questions**

Each answer:

50–80 words.

Focus on:

• investment
• property details
• developer
• location
• buying process

---

STEP 3 — SEO METADATA

After the article output:

META TITLE  
(max 60 characters)

META DESCRIPTION  
(max 155 characters)

FOCUS KEYWORD

SECONDARY KEYWORDS

URL SLUG

CANONICAL URL

IMAGE ALT TEXT LIST (5)

PEOPLE ALSO ASK QUESTIONS (5)

---

STEP 4 — SCHEMA MARKUP

Generate valid **JSON-LD structured data** for:

1️⃣ BlogPosting Schema

2️⃣ FAQPage Schema

3️⃣ BreadcrumbList Schema

4️⃣ Organization Schema

Ensure markup passes **Google Rich Results Test**.

---

STEP 5 — IMAGE DATA

Provide structured data for generated images:

Image Title  
Image Alt Text  
Image Prompt  
Suggested File Name

---

WRITING STYLE

Use a **human, authoritative tone**

Follow these rules:

• short paragraphs
• high readability
• clear explanations
• no keyword stuffing
• useful insights
• actionable information

---

OUTPUT FORMAT

Return the response in this exact order:

1️⃣ Article Content  
2️⃣ Table of Contents  
3️⃣ Key Takeaways  
4️⃣ FAQ Section  
5️⃣ SEO Metadata  
6️⃣ Image Metadata  
7️⃣ Schema Markup

---

FORMATTING RULES

Return **clean Markdown only**

Allowed elements:

# headings  
## headings  
### headings  
paragraphs  
bullet lists  
tables  
images  
code blocks

Do NOT include inline styles.  
Do NOT include HTML wrappers.

The article will be rendered using CSS class:

markdown-content

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
                    onClick={() => setTopic(item.title)}
                  >
                    <div className="topicTitle">{item.title}</div>
                    <div className="topicKeyword">{item.searchTerm}</div>
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
                  Blog Post
                  {/* {CONTENT_TYPES.map(t => (
                    <div key={t} className={`chip ${contentType === t ? "active" : ""}`} onClick={() => setContentType(t)}>{t}</div>
                  ))} */}
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