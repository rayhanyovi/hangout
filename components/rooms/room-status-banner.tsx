import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type RoomStatusBannerProps = {
  tone: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
};

export function RoomStatusBanner({
  tone,
  title,
  description,
}: RoomStatusBannerProps) {
  return (
    <Alert tone={tone}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
