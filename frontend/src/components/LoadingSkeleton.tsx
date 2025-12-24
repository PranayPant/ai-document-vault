export default function LoadingSkeleton() {
  return (
    <div className="m-auto flex h-full items-center justify-center">
      <div className="flex space-x-2">
        <div className="h-3 w-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-3 w-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-3 w-3 rounded-full bg-blue-500 animate-bounce"></div>
      </div>
    </div>
  );
}