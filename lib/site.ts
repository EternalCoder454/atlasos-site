/* The facts the page repeats. Everything here comes from the Telamon OS
   README; a claim that is not there does not go here either. */

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://telamon.eterneon.net";

export const site = {
  name: "Telamon OS",
  title: "Telamon OS: a Fedora KDE desktop for people who build things",
  description:
    "A Fedora and KDE Plasma desktop with your developer tools already installed, updates that wait for you, and automatic rollback.",
  repo: "https://github.com/EternalCoder454/AtlasOS",
  installerRepo: "https://github.com/EternalCoder454/atlasos-installer",
};

/* The social card, for every page. */
export const ogImage = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "The Telamon OS desktop in Light and Dark: a menu bar on top, and Telamon Notepad and Ghostty over the sakura wallpaper",
};

export const links = {
  dev: `${site.repo}/blob/main/DEV.md`,
  optimization: `${site.repo}/blob/main/docs/OPTIMIZATION.md`,
  privacy: `${site.repo}/blob/main/docs/PRIVACY.md`,
  software: `${site.repo}/blob/main/docs/INSTALLING-SOFTWARE.md`,
  nvidia: `${site.repo}/blob/main/DEV.md#nvidia`,
  mediaWriter: "https://fedoraproject.org/workstation/download",
};
