"use client";
import VideosPane from "./VideosPane";

// Wrapper to make props optional for backward compatibility
export default function VideosSection(_props?: any) {
  return <VideosPane />;
}
