type RoomStatusBannerProps = {
  tone: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
};

const TONE_STYLES: Record<RoomStatusBannerProps["tone"], string> = {
  info: "border-line bg-card text-foreground",
  warning: "border-warning bg-warning-soft text-warning-foreground",
  error: "border-destructive bg-destructive/10 text-destructive",
  success: "border-success bg-success-soft text-success-foreground",
};

export function RoomStatusBanner({
  tone,
  title,
  description,
}: RoomStatusBannerProps) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 shadow-md ${TONE_STYLES[tone]}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7">{description}</p>
    </div>
  );
}
