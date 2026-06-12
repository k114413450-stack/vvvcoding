import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-slate-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-purple-400 underline decoration-purple-500/40 underline-offset-2 hover:text-purple-300"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block font-mono text-xs text-emerald-300">{children}</code>
      );
    }
    return (
      <code className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-xs text-emerald-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="mb-3 text-lg font-bold text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-bold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold text-slate-100">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-purple-500/50 pl-4 text-slate-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-800" />,
};

interface PostContentProps {
  content: string;
  className?: string;
}

/**
 * Renders forum post/comment text as safe markdown.
 * Supports **bold**, lists, links, inline/block code — enough for AI-generated posts.
 * Plain text without markdown still renders normally.
 */
export default function PostContent({ content, className = "" }: PostContentProps) {
  return (
    <div className={`text-base leading-7 text-slate-300 font-sans ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
