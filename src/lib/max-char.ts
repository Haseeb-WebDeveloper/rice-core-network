/**
 * Truncates a string to a specified maximum length, appending an ellipsis ("…") if needed.
 * If max is 0 or negative, returns empty string.
 * If input is not a string, returns empty string.
 * Handles undefined/null input gracefully.
 *
 * NOTE: Does NOT append ellipsis if max is very small (<= 1). Always returns at least one char if possible.
 *
 * @param text - The string to truncate.
 * @param max - The maximum length of the returned string (not including ellipsis).
 * @returns The truncated string with ellipsis if exceeded, or original if within max.
 */
export function maxChar(text: string | null | undefined, max: number): string {
  if (typeof text !== "string") return "";
  if (max <= 0) return "";
  // If text is shorter or equal to max, return as is
  if (text.length <= max) return text;
  // If max is very small, fallback: show truncated chars without ellipsis
  if (max <= 1) return text.slice(0, max);
  // For URLs, avoid truncating in a way that breaks the protocol/scheme (special-case for "http" and "https")
  const isLikelyUrl =
    text.startsWith("http://") || text.startsWith("https://");
  if (isLikelyUrl && max > 10) {
    // Try to show as much as possible of the start and end (around the query string)
    const keepStart = Math.floor(max * 0.6);
    const keepEnd = max - keepStart - 1;
    if (keepEnd > 3) {
      return (
        text.slice(0, keepStart).trimEnd() +
        "…" +
        text.slice(text.length - keepEnd)
      );
    }
  }
  // Standard truncation with ellipsis
  return text.slice(0, max).trimEnd() + "…";
}
