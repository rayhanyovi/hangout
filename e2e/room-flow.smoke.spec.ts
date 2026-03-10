import { expect, test, type Page } from "@playwright/test";

async function setManualCoordinates(
  page: Page,
  memberId: string,
  lat: string,
  lng: string,
) {
  const memberCard = page.getByTestId(`member-card-${memberId}`);

  await expect(memberCard).toBeVisible();
  await memberCard.getByTestId(`member-enter-coordinates-${memberId}`).click();
  await memberCard.getByTestId(`member-latitude-${memberId}`).fill(lat);
  await memberCard.getByTestId(`member-longitude-${memberId}`).fill(lng);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/api/rooms/") &&
        response.ok(),
    ),
    memberCard.getByTestId(`member-save-location-${memberId}`).click(),
  ]);
}

async function setLocationFromMapPin(page: Page, memberId: string) {
  const memberCard = page.getByTestId(`member-card-${memberId}`);

  await expect(memberCard).toBeVisible();
  await memberCard.getByTestId(`member-pin-on-map-${memberId}`).click();
  await memberCard
    .getByTestId(`location-picker-map-${memberId}`)
    .locator(".leaflet-container")
    .click({
      position: {
        x: 180,
        y: 120,
      },
    });
  await expect(memberCard.getByTestId(`member-latitude-${memberId}`)).not.toHaveValue(
    "",
  );
  await expect(memberCard.getByTestId(`member-longitude-${memberId}`)).not.toHaveValue(
    "",
  );
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/api/rooms/") &&
        response.ok(),
    ),
    memberCard.getByTestId(`member-save-location-${memberId}`).click(),
  ]);
}

test("core room flow works across create, join, vote, and finalize", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext();

  const hostPage = await context.newPage();
  await hostPage.goto(`${baseURL}/rooms/new`);

  const roomTitle = `Smoke Room ${Date.now()}`;
  await hostPage.getByLabel("Room title").fill(roomTitle);
  await hostPage.getByLabel("Host name").fill("Alya");
  await hostPage.getByRole("button", { name: "Create room" }).click();
  await hostPage.waitForURL(/\/r\/[A-Z0-9]+\?member=/);
  await expect(hostPage.getByRole("heading", { name: roomTitle })).toBeVisible();

  const hostUrl = new URL(hostPage.url());
  const joinCode = hostUrl.pathname.split("/").at(-1);
  const hostMemberId = hostUrl.searchParams.get("member");

  expect(joinCode).toBeTruthy();
  expect(hostMemberId).toBeTruthy();

  const memberPage = await context.newPage();
  await memberPage.goto(`${baseURL}/r/${joinCode}`);
  await expect(
    memberPage.getByText("Join this room before interacting."),
  ).toBeVisible();
  await memberPage.getByLabel("Nama").fill("Bima");
  await memberPage.getByTestId("join-room-submit").click();
  await memberPage.waitForURL(new RegExp(`/r/${joinCode}\\?member=`));
  await expect(memberPage.getByText("Bima")).toBeVisible();

  const memberUrl = new URL(memberPage.url());
  const memberId = memberUrl.searchParams.get("member");

  expect(memberId).toBeTruthy();

  await setLocationFromMapPin(hostPage, hostMemberId!);
  await setManualCoordinates(memberPage, memberId!, "-6.2297", "106.8300");

  await expect(hostPage.getByTestId("venue-card-kopi-tengah")).toBeVisible();
  await expect(memberPage.getByTestId("venue-card-kopi-tengah")).toBeVisible();
  await expect(hostPage.getByText("Mapbox Matrix driving proxy")).toBeVisible();

  await Promise.all([
    memberPage.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/votes") &&
        response.ok(),
    ),
    memberPage.getByRole("button", { name: "Vote for selected venue" }).click(),
  ]);
  await Promise.all([
    hostPage.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/votes") &&
        response.ok(),
    ),
    hostPage.getByRole("button", { name: "Vote for selected venue" }).click(),
  ]);
  await Promise.all([
    hostPage.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/finalize") &&
        response.ok(),
    ),
    hostPage.getByRole("button", { name: "Host finalize" }).click(),
  ]);

  await expect(
    hostPage.getByText("Room decision has been finalized."),
  ).toBeVisible();

  await hostPage.goto(`${baseURL}/r/${joinCode}/decision`);
  await expect(
    hostPage.getByRole("heading", { name: "Kopi Tengah" }),
  ).toBeVisible();
  await expect(
    hostPage
      .locator("article")
      .filter({ hasText: "Votes locked" })
      .getByText("2 vote(s)"),
  ).toBeVisible();
  await expect(
    hostPage.getByRole("link", { name: "Open in Maps" }),
  ).toHaveAttribute("href", "https://maps.example.com/kopi-tengah");

  await context.close();
});
