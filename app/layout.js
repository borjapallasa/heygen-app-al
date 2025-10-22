import "@/styles/globals.css";

export const metadata = {
  title: "HeyGen App",
  description: "Avatar groups, videos, and recorder UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
