import { featuredRecallsResponseSchema, type FeaturedRecall } from "@clarilot/core";
import { TagPill } from "@/components/ui/TagPill";
import { formatSourceDate, formatStamp } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { FeedCard } from "./FeedCard";
import { SectionFrame } from "./SectionFrame";

function RecallMeta({ recall }: { recall: FeaturedRecall }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[0.8rem] leading-[1.4] text-ink/70">
      <dt>Recall</dt>
      <dd className="tabular text-ink">{recall.recallNumber}</dd>
      <dt>Reported</dt>
      <dd className="tabular">{formatSourceDate(recall.reportDate)}</dd>
      <dt>Fetched</dt>
      <dd className="tabular">{formatStamp(recall.fetchedAt)}</dd>
    </dl>
  );
}

const cardImages = ["feed-recall", "feed-docs"] as const;

function recallCard(recall: FeaturedRecall, index: number) {
  return (
    <FeedCard
      key={recall.recallNumber}
      tag={`${recall.classification} • ${recall.status}`}
      title={recall.productDescription}
      meta={<RecallMeta recall={recall} />}
      action={{ label: "View on openFDA", to: recall.permalink }}
      image={cardImages[index % cardImages.length] ?? "feed-recall"}
    />
  );
}

function FeedNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-col justify-center gap-2 rounded-card bg-mist p-[1.5rem] text-ink">
      <p className="type-h6">Published recalls</p>
      <p className="text-ink/70">{message}</p>
    </div>
  );
}

export function FeedSection() {
  const { resource } = useResource("/api/recalls/featured", featuredRecallsResponseSchema);
  const recalls =
    resource.state === "ready"
      ? resource.data.recalls.map((recall, index) => recallCard(recall, index))
      : [
          <FeedNotice
            key="notice"
            message={
              resource.state === "loading"
                ? "Loading the recall records this pharmacy was seeded from…"
                : `The recall feed is unavailable right now: ${resource.message}`
            }
          />,
        ];
  return (
    <SectionFrame id="recalls" divider="light" className="pb-[5rem]">
      <div className="pt-[1.6rem]">
        <TagPill label="Published recalls" />
        <h2 className="mt-[3rem] max-w-[34rem] type-h5 text-ink-2">
          The real FDA recalls the synthetic pharmacy is checked against
        </h2>
      </div>
      <div className="mt-[4rem] grid gap-4 md:grid-cols-3">{recalls}</div>
    </SectionFrame>
  );
}
