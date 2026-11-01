const found = import.meta.glob<string>("../assets/images/*.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

const byName = new Map(
  Object.entries(found).map(([path, url]) => {
    const file = path.split("/").pop() ?? path;
    return [file.replace(/\.(webp|jpe?g|png)$/, ""), url] as const;
  }),
);

export type ImageName =
  | "hero-texture"
  | "system-backdrop"
  | "source-recall"
  | "source-dispensing"
  | "source-receiving"
  | "source-shortage"
  | "source-ledger"
  | "about-pharmacist"
  | "cta-horizon"
  | "feed-recall"
  | "feed-docs";

export function imageUrl(name: ImageName): string | undefined {
  return byName.get(name);
}
