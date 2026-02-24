import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => <h1 className="content-title" {...props} />,
        h2: (props) => <h2 className="section-heading" {...props} />,
        h3: (props) => <h3 className="sub-heading" {...props} />,
        p: (props) => <p className="paragraph" {...props} />,
        ul: (props) => <ul className="list-disc ml-6 my-3" {...props} />,
        ol: (props) => <ol className="list-decimal ml-6 my-3" {...props} />,
        li: (props) => <li className="mb-1" {...props} />,
        hr: () => <hr className="my-6 border-gray-300" />,
        code({ inline, children, ...props }) {
          if (inline) {
            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          }

          return (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              <code {...props}>{children}</code>
            </pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;