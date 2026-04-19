"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
};

export default function BackButton({
  fallbackHref,
  label = "Indietro",
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    const hasReferrer = typeof document !== "undefined" && document.referrer.length > 0;

    if (hasReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300"
    >
      {label}
    </button>
  );
}
