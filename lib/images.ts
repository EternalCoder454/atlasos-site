/* The two system images and what each one is for. Shared by the page
   and the download route, so a name can't be valid in one and not the
   other. */

export const imageIds = ["atlasos", "atlasos-nvidia"] as const;
export type ImageId = (typeof imageIds)[number];

export const images: Record<ImageId, { name: string; ref: string; forWhat: string }> = {
  atlasos: {
    name: "AtlasOS",
    ref: "ghcr.io/eternalcoder454/atlasos:stable",
    forWhat: "Intel and AMD graphics, and older NVIDIA cards on the open nouveau driver.",
  },
  "atlasos-nvidia": {
    name: "AtlasOS for NVIDIA",
    ref: "ghcr.io/eternalcoder454/atlasos-nvidia:stable",
    forWhat:
      "GeForce GTX 16 and RTX 20 series or newer, with NVIDIA's own driver (open kernel modules).",
  },
};

export function isImageId(value: string): value is ImageId {
  return (imageIds as readonly string[]).includes(value);
}
