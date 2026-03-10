import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteShell } from "@/components/routes/route-shell";

describe("RouteShell", () => {
  it("renders the route title and next step guidance", () => {
    render(
      <RouteShell
        badge="Route shell"
        title="Room shell placeholder"
        description="A placeholder route for future implementation."
        nextStep="Hydrate room state."
      />,
    );

    expect(screen.getByText("Room shell placeholder")).toBeInTheDocument();
    expect(screen.getByText("Hydrate room state.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
