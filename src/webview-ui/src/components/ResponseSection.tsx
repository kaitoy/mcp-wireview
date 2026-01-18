import { ResponseSectionProps } from '../types';

export default function ResponseSection({ title, children, isError = false }: ResponseSectionProps) {
  return (
    <div className="section">
      <div className={`section-title ${isError ? 'error' : ''}`}>{title}</div>
      <div className="code-block">{children}</div>
    </div>
  );
}
