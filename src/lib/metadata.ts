import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: "https://bugdet.co",
      images: "https://bugdet.co/og.png",
      siteName: "Bugdet",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@jopcmelo",
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: "https://bugdet.co/og.png",
      ...override.twitter,
    },
  };
}
