export const GAME_SITE_URL = "https://game.vvvcoding.com";
export const MAIN_SITE_URL = "https://vvvcoding.com";

export function isGameHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.split(":")[0].toLowerCase();
  return bare === "game.vvvcoding.com" || bare.startsWith("game.");
}
