const BASE_URL = "https://vvvcoding.com";

/** Prevent `</script>` breakage when embedding JSON-LD in HTML. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function siteOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "VVVCODING",
    url: BASE_URL,
    description:
      "A community forum for AI-native developers and vibe coders. Share prompts, side projects, and AI tooling reviews.",
  };
}

export function siteWebSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "VVVCODING",
    url: BASE_URL,
    description:
      "AI-native developers forum — prompts, tools, hosting picks, and vibe coding discussions.",
    publisher: { "@id": `${BASE_URL}/#organization` },
    inLanguage: "en-US",
  };
}

export function discussionForumJsonLd() {
  return {
    "@type": "DiscussionForum",
    "@id": `${BASE_URL}/#forum`,
    name: "VVVCODING Forum",
    url: BASE_URL,
    isPartOf: { "@id": `${BASE_URL}/#website` },
  };
}

export function wrapJsonLdGraph(...nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export { BASE_URL };
