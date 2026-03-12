import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../components/styles/markdown-content.css";

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Extract JSON schema block
  const schemaMatch = content.match(/```json([\s\S]*?)```/);

  const schemaJSON = schemaMatch ? schemaMatch[1].trim() : null;

  // Remove schema from article content
  const articleContent = schemaMatch
    ? content.replace(schemaMatch[0], "")
    : content;

  const copySchema = () => {
    if (schemaJSON) {
      navigator.clipboard.writeText(schemaJSON);
    }
  };

  return (
    <div className="markdown-content">
      
      {/* ARTICLE CONTENT */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {articleContent}
      </ReactMarkdown>

      {/* SCHEMA VIEWER */}
      {schemaJSON && (
        <div className="schema-box">
          <div className="schema-header">
            <h3>⚙ Schema Markup</h3>
            <button onClick={copySchema}>Copy JSON</button>
          </div>

          <pre className="schema-code">
            <code>{schemaJSON}</code>
          </pre>
        </div>
      )}

    </div>
  );
};

export default MarkdownRenderer;