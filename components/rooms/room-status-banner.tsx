type RoomStatusBannerProps = {
  tone: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
};

const TONE_STYLES: Record<RoomStatusBannerProps["tone"], string> = {
  info: "border-line bg-white/80 text-foreground",
  warning: "border-sun/40 bg-sun/20 text-foreground",
  error: "border-coral/30 bg-coral/8 text-coral",
  success: "border-teal/30 bg-teal/10 text-teal",
};

export function RoomStatusBanner({
  tone,
  title,
  description,
}: RoomStatusBannerProps) {
  return (
    <div
      className={`rounded-[1.4rem] border px-5 py-4 shadow-[0_12px_32px_rgba(31,27,23,0.06)] ${TONE_STYLES[tone]}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7">{description}</p>
    </div>
  );
}
