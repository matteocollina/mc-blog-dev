import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="pt-4 text-3xl font-semibold tracking-tight text-zinc-50">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="pt-6 text-2xl font-semibold tracking-tight text-zinc-50">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="pt-4 text-xl font-semibold tracking-tight text-zinc-100">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="pt-3 text-lg font-semibold tracking-tight text-zinc-200">
            {children}
          </h4>
        ),
        p: ({ children }) => <p className="text-lg leading-8 text-zinc-200">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc space-y-3 pl-6 text-lg leading-8 text-zinc-200">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal space-y-3 pl-6 text-lg leading-8 text-zinc-200">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-700 pl-5 italic text-zinc-300">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-zinc-800" />,
        a: ({ href, children }) => {
          if (!href) {
            return <span>{children}</span>;
          }

          const className =
            "underline decoration-zinc-500 underline-offset-4 transition-colors hover:decoration-zinc-200";

          if (href.startsWith("/")) {
            return (
              <Link href={href} className={className}>
                {children}
              </Link>
            );
          }

          return (
            <a
              href={href}
              className={className}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          );
        },
        code: ({ children, className }) => {
          if (className) {
            return <code className={className}>{children}</code>;
          }

          return (
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.95em] text-zinc-100">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-7 text-zinc-100">
            {children}
          </pre>
        ),
        strong: ({ children }) => <strong className="font-semibold text-zinc-50">{children}</strong>,
        em: ({ children }) => <em className="italic text-zinc-100">{children}</em>,
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-base text-zinc-200">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="border-b border-zinc-700">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-zinc-800">{children}</tbody>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="px-3 py-3 align-top text-zinc-200">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
