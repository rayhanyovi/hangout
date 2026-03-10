import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomVotingPanel } from "@/components/rooms/room-voting-panel";

describe("RoomVotingPanel", () => {
  it("renders an empty state before venues are available", () => {
    render(
      <RoomVotingPanel
        venues={[]}
        votes={[]}
        selectedVenueId={null}
        currentMemberId="member-1"
        hostMemberId="member-1"
        finalizedVenueId={null}
        isSubmitting={false}
        errorMessage={null}
        onVote={vi.fn()}
        onFinalize={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/voting opens after the shortlist is ready/i),
    ).toBeInTheDocument();
  });
});
