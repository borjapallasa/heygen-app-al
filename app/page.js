import dynamic from "next/dynamic";

// Dynamically import the client component (optional but safe if any `window` access happens)
const AvatarApp = dynamic(() => import("@/components/AvatarApp"), { ssr: false });

export default function Page() {
  return <AvatarApp />;
}
