interface ErrorBlockProps {
  message: string;
}

export default function ErrorBlock({ message }: ErrorBlockProps) {
  return (
    <div className="error-block">
      <strong>Error:</strong> {message}
    </div>
  );
}
