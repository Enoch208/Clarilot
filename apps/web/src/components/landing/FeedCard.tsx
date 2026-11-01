import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import type { ImageName } from "@/lib/images";

type FeedCardProps = {
  tag: string;
  title: string;
  meta?: ReactNode;
  action: { label: string; to: string };
  image: ImageName;
  wide?: boolean;
};

export function FeedCard({ tag, title, meta, action, image, wide = false }: FeedCardProps) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-card bg-mist ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="relative isolate h-[15rem] lg:h-[25rem]">
        <ImageSlot
          name={image}
          alt=""
          fallback="surface-light"
          className="absolute inset-0 -z-10 size-full"
        />
        <span className="glass-soft absolute top-[1.5rem] left-[1.5rem] rounded-pill px-3 py-[0.275rem] text-[1rem] leading-[1.5] text-ink">
          {tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-6 p-[1.5rem]">
        <h3 className={`${wide ? "type-h5" : "type-h6"} line-clamp-3 text-ink`}>{title}</h3>
        {meta}
        <div className="mt-auto">
          <ButtonLink to={action.to} variant="outline-dark">
            {action.label}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
