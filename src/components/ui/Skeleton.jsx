export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-2xl',
    button: 'h-9 w-24 rounded-xl',
  };

  return <div className={`animate-shimmer ${variants[variant]} ${className}`} />;
}
