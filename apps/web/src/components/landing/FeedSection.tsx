import { featuredRecallsResponseSchema, type FeaturedRecall } from "@clarilot/core";
import { TagPill } from "@/components/ui/TagPill";
import { formatSourceDate, formatStamp } from "@/lib/format";
import { links } from "@/lib/links";
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

function recallCard(recall: FeaturedRecall) {
  return (
    <FeedCard
      key={recall.recallNumber}
      tag={`${recall.classification} • ${recall.status}`}
      title={recall.productDescription}
      meta={<RecallMeta recall={recall} />}
      action={{ label: "View on openFDA", to: recall.permalink }}
      image="feed-recall"
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

const methodCard = (
  <FeedCard
    key="method"
    wide
    tag="Method"
    title="One Zetaris statement across four sources, logged in a query ledger"
    action={{ label: "See the query", to: "/console?view=ledger" }}
    image="feed-docs"
  />
);

const documentCards = [
  {
    tag: "Source documentation",
    title: "openFDA drug enforcement reports",
    to: links.openfdaEnforcement,
  },
  { tag: "Source documentation", title: "openFDA drug shortages", to: links.openfdaShortages },
  { tag: "Query engine", title: "Zetaris getting started", to: links.zetarisStart },
].map((doc) => (
  <FeedCard
    key={doc.title}
    tag={doc.tag}
    title={doc.title}
    action={{ label: "Read more", to: doc.to }}
    image="feed-docs"
  />
));

export function FeedSection() {
  const { resource } = useResource("/api/recalls/featured", featuredRecallsResponseSchema);
  const recalls =
    resource.state === "ready"
      ? resource.data.recalls.map(recallCard)
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
  const [first, ...rest] = recalls;
  return (
    <SectionFrame divider="light" className="pb-[5rem]">
      <div className="pt-[1.6rem]">
        <TagPill label="In the feed" />
        <h2 className="mt-[3rem] max-w-[34rem] type-h5 text-ink-2">
          Published FDA recalls this pharmacy is checked against, and the documents behind the
          method
        </h2>
      </div>
      <div className="mt-[4rem] grid gap-4 md:grid-cols-3">
        {first}
        {methodCard}
        {rest}
        {documentCards}
      </div>
    </SectionFrame>
  );
}
