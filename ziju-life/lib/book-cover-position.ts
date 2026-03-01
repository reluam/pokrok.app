/**
 * Returns CSS object-position value for a book cover from item settings.
 * Custom position (positionX/Y) takes precedence over keyword (bookCoverPosition).
 */
export function getBookCoverObjectPosition(item: {
  bookCoverPosition?: string;
  bookCoverPositionX?: number;
  bookCoverPositionY?: number;
}): string {
  if (
    item.bookCoverPositionX != null &&
    item.bookCoverPositionY != null
  ) {
    return `${item.bookCoverPositionX}% ${item.bookCoverPositionY}%`;
  }
  const map: Record<string, string> = {
    center: "50% 50%",
    top: "50% 0%",
    bottom: "50% 100%",
    left: "0% 50%",
    right: "100% 50%",
    "top left": "0% 0%",
    "top right": "100% 0%",
    "bottom left": "0% 100%",
    "bottom right": "100% 100%",
  };
  return map[item.bookCoverPosition ?? "center"] ?? "50% 50%";
}
