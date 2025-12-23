/**
 * Markdown Component
 * Renders markdown content safely within the application.
 */
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

