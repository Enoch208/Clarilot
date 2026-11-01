import { imageUrl, type ImageName } from "@/lib/images";

type ImageSlotProps = {
  name: ImageName;
  alt: string;
  fallback: string;
  className?: string;
};

export function ImageSlot({ name, alt, fallback, className = "" }: ImageSlotProps) {
  const url = imageUrl(name);
  if (url === undefined) {
    return <div role="img" aria-label={alt} className={`${fallback} ${className}`} />;
  }
  return <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
