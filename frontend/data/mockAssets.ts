export type MockAsset = {
  id: string;
  name: string;
  location: string;
  valuation: number;
  estimatedYield: number;
  tokensMinted: number;
  description: string;
  tags: string[];
  image: string;
};

export const MOCK_ASSETS: MockAsset[] = [
  {
    id: "skyline",
    name: "Skyline Residences",
    location: "Austin, TX",
    valuation: 12500000,
    estimatedYield: 8.2,
    tokensMinted: 1250000,
    description:
      "Class A multifamily with 96 luxury units. Tokenized equity slice covers renovation CAPEX and quarterly distributions.",
    tags: ["multifamily", "tier-1 market", "cash-flow"],
    image: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "harbor",
    name: "Harbor Logistics Park",
    location: "Rotterdam, NL",
    valuation: 8400000,
    estimatedYield: 9.1,
    tokensMinted: 840000,
    description:
      "Triple-net industrial asset near Europe’s busiest port. Long-term lease to global shipping operator.",
    tags: ["industrial", "eu", "institutional"],
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  },
];

