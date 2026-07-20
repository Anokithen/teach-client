import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  compact?: boolean;
  href?: string;
}

export function Logo({ compact = false, href = '/' }: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/Teachalike_logo.png" alt="TeachAlike" width={36} height={36} className="rounded-lg" priority />
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-brand-900">
          Teach<span className="text-brand-400">Alike</span>
        </span>
      )}
    </Link>
  );
}
