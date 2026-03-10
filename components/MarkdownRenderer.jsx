import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* Clean AI response markdown */
const cleanMarkdown = (text) => {
  if (!text) return "";

  return text
    .replace(/^```markdown\s*/i, "")
    .replace(/^```md\s*/i, "")
    .replace(/```$/, "")
    .trim();
};

/* Create anchor IDs for headings (for Table of Contents links) */
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const cleanedContent = cleanMarkdown(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        /* H1 */
        h1: ({ children }) => (
          <h1
            id={slugify(children)}
            className="text-3xl md:text-4xl font-bold my-6 text-gray-900"
          >
            {children}
          </h1>
        ),

        /* H2 */
        h2: ({ children }) => (
          <h2
            id={slugify(children)}
            className="text-2xl md:text-3xl font-semibold mt-10 mb-4 text-gray-900"
          >
            {children}
          </h2>
        ),

        /* H3 */
        h3: ({ children }) => (
          <h3
            id={slugify(children)}
            className="text-xl md:text-2xl font-semibold mt-6 mb-3 text-gray-800"
          >
            {children}
          </h3>
        ),

        /* Paragraph */
        p: ({ children }) => (
          <p className="text-gray-700 leading-relaxed my-3">{children}</p>
        ),

        /* Images */
        img: ({ src, alt }) => (
          <figure className="my-6">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="w-full rounded-xl shadow-md"
            />
            {alt && (
              <figcaption className="text-sm text-gray-500 mt-2 text-center">
                {alt}
              </figcaption>
            )}
          </figure>
        ),

        /* Lists */
        ul: ({ children }) => (
          <ul className="list-disc ml-6 my-3 space-y-1 text-gray-700">
            {children}
          </ul>
        ),

        ol: ({ children }) => (
          <ol className="list-decimal ml-6 my-3 space-y-1 text-gray-700">
            {children}
          </ol>
        ),

        li: ({ children }) => <li>{children}</li>,

        /* Divider */
        hr: () => <hr className="my-10 border-gray-300" />,

        /* Tables */
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full border border-gray-300">
              {children}
            </table>
          </div>
        ),

        th: ({ children }) => (
          <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-semibold">
            {children}
          </th>
        ),

        td: ({ children }) => (
          <td className="border border-gray-300 px-4 py-2">{children}</td>
        ),

        /* Code blocks */
        code({ inline, children }) {
          if (inline) {
            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          }

          return (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
              <code>{children}</code>
            </pre>
          );
        },

        /* Links */
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 underline hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {cleanedContent}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;