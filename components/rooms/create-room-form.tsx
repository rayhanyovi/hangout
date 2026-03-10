"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { getRoomRoute } from "@/lib/contracts";
import { createRoomSchema } from "@/lib/validation";
import { createDraftJoinCode, serializeDraftRoomSearchParams } from "@/lib/rooms";

const CATEGORY_OPTIONS = [
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
  { value: "park", label: "Park" },
  { value: "mall", label: "Mall" },
] as const;

const BUDGET_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "mid", label: "Mid" },
  { value: "high", label: "High" },
] as const;

const RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000] as const;

export function CreateRoomForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hostDisplayName, setHostDisplayName] = useState("");
  const [transportMode, setTransportMode] = useState<"walk" | "motor" | "car" | "transit">("motor");
  const [privacyMode, setPrivacyMode] = useState<"exact" | "approximate">("approximate");
  const [radiusMDefault, setRadiusMDefault] = useState<(typeof RADIUS_OPTIONS)[number]>(2000);
  const [categories, setCategories] = useState<Array<(typeof CATEGORY_OPTIONS)[number]["value"]>>([
    "cafe",
    "restaurant",
  ]);
  const [budget, setBudget] = useState<"low" | "mid" | "high" | undefined>("mid");
  const [tagsInput, setTagsInput] = useState("wifi, cozy");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const toggleCategory = (value: (typeof CATEGORY_OPTIONS)[number]["value"]) => {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createRoomSchema.safeParse({
      title: title.trim() ? title.trim() : null,
      hostDisplayName,
      transportMode,
      privacyMode,
      venuePreferences: {
        categories,
        tags: parsedTags,
        budget,
        radiusMDefault,
      },
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Form room belum valid.");
      return;
    }

    setError(null);

    const joinCode = createDraftJoinCode();
    const query = serializeDraftRoomSearchParams({
      title: parsed.data.title,
      hostDisplayName: parsed.data.hostDisplayName,
      transportMode: parsed.data.transportMode,
      privacyMode: parsed.data.privacyMode,
      categories: parsed.data.venuePreferences.categories,
      tags: parsed.data.venuePreferences.tags,
      budget: parsed.data.venuePreferences.budget,
      radiusMDefault: parsed.data.venuePreferences.radiusMDefault,
      previewMode: true,
    });

    startTransition(() => {
      router.push(`${getRoomRoute(joinCode)}?${query.toString()}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[2rem] border border-line bg-white/78 p-6 shadow-[0_22px_70px_rgba(31,27,23,0.12)]"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Room title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Friday catch-up"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Host name
          </span>
          <input
            value={hostDisplayName}
            onChange={(event) => setHostDisplayName(event.target.value)}
            placeholder="Yovi"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Transport mode
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: "walk", label: "Walk" },
              { value: "motor", label: "Motor" },
              { value: "car", label: "Car" },
              { value: "transit", label: "Transit" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTransportMode(option.value as typeof transportMode)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  transportMode === option.value
                    ? "border-coral bg-coral/12 text-coral"
                    : "border-line bg-surface text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Privacy mode
          </p>
          <div className="grid gap-2">
            {[
              {
                value: "approximate",
                label: "Approximate",
                copy: "Koordinat dibulatkan untuk share area-level presence.",
              },
              {
                value: "exact",
                label: "Exact",
                copy: "Presisi lebih tinggi selama room masih aktif.",
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPrivacyMode(option.value as typeof privacyMode)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  privacyMode === option.value
                    ? "border-teal bg-teal/12"
                    : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  {privacyMode === option.value ? (
                    <Check className="h-4 w-4 text-teal" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{option.copy}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Search radius
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {RADIUS_OPTIONS.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => setRadiusMDefault(radius)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  radiusMDefault === radius
                    ? "border-foreground bg-foreground text-background"
                    : "border-line bg-surface text-foreground"
                }`}
              >
                {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Venue categories
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const active = categories.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleCategory(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-coral bg-coral/12 text-coral"
                      : "border-line bg-surface text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Soft tags
            </span>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="wifi, cozy, outdoor"
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral"
            />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Budget signal
          </p>
          <div className="grid gap-2">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBudget(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  budget === option.value
                    ? "border-sun bg-sun/25"
                    : "border-line bg-surface"
                }`}
              >
                <span className="text-sm font-semibold text-foreground">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-line bg-surface p-4 text-sm leading-6 text-muted">
            Flow ini sudah memakai validasi kontrak root app. Saat submit,
            form akan membuka room shell preview dengan draft seed sampai API
            create-room server side dihubungkan.
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-coral">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Host setup ini sudah cukup untuk mengalir ke route room yang dibekukan.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Opening room..." : "Preview room shell"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
