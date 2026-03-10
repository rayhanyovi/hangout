import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorShell } from "@/components/routes/error-shell";

describe("ErrorShell", () => {
  it("renders retry and navigation actions", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorShell
        badge="Route error"
        title="Route failed"
        description="Unexpected provider failure."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Route failed")).toBeInTheDocument();
    expect(screen.getByText("Unexpected provider failure.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
