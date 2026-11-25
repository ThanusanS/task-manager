import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://task-manager-gamma-ruddy-29.vercel.app"),

  title: {
    default: "TaskFlow | Smart Task Management",
    template: "%s | TaskFlow",
  },

  description:
    "TaskFlow is a modern task management platform designed to organize tasks, track productivity, monitor progress, and manage your workflow efficiently.",

  applicationName: "TaskFlow",

  keywords: [
    "Task Management",
    "Task Organizer",
    "Productivity",
    "Task Tracking",
    "Next.js",
    "Full Stack Web Application",
  ],

  openGraph: {
    title: "TaskFlow | Smart Task Management",
    description:
      "Organize your work, track your progress, and achieve more with TaskFlow.",
    siteName: "TaskFlow",
    type: "website",
    url: "https://task-manager-gamma-ruddy-29.vercel.app",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
