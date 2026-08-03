/**
 * The knobs the design exposed in its props panel. Change them here and the
 * whole booklet — cover, chapter openers, quote kickers, back cover — retunes.
 */
export interface BookConfig {
  /** Cover, chapter and accent colour. The design shipped four. */
  coverColor: string;
  /** Print the "Placeholder" tag on unsourced quotations. */
  showPlaceholderTags: boolean;
  campaignLabel: string;
  campaignUrl: string;
  disclaimer: string;
}

export const COVER_COLORS = ["#ff5a00", "#d4ff00", "#ff00a0", "#00e5ff"] as const;

export const bookConfig: BookConfig = {
  coverColor: "#ff5a00",
  showPlaceholderTags: true,
  campaignLabel: "Victorian Trades Hall Council",
  campaignUrl: "megaphone.org.au/petitions/pauline-hanson",
  disclaimer:
    "Authorised as political comment. Quotations reproduced from the public record for criticism and review. No permission was sought or given by Pauline Hanson or One Nation, and none is implied.",
};
