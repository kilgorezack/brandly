export interface BrandColor {
  hex: string;
  name: string;
  source: string;
}

export interface BrandFont {
  family: string;
  role: "heading" | "body" | "ui";
  source: string;
  isSystem: boolean;
}

export interface BrandLogo {
  url: string;
  source: string;
}

export interface BrandData {
  brandName: string;
  url: string;
  scrapedAt: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  logo: BrandLogo | null;
}
