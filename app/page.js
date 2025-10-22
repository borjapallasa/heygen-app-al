import dynamic from "next/dynamic";

// IMPORTANT: path must match your repo exactly (case-sensitive on Vercel)
const AvatarGroupBubbles = dynamic(
  () => import("../src/components/AvatarGroupBubbles.jsx"),
  { ssr: false }
);

export default function Page() {
  return <AvatarGroupBubbles />;
}
