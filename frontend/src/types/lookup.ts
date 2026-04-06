export interface LookupEntry {
  id: number;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
  // Extra fields per type
  description?: string; // CargoType, DocumentType
  country?: string; // Port
  symbol?: string; // Currency
  exchange_rate?: number; // Currency
  is_default?: boolean; // Currency
}

export type LookupType =
  | "ports"
  | "cargo-types"
  | "currencies"
  | "document-types";

export interface LookupConfig {
  type: LookupType;
  label: string;
  apiPath: string;
  extraFields?: {
    name: string;
    label: string;
    type: "text" | "number" | "checkbox";
  }[];
}

export const LOOKUP_CONFIGS: LookupConfig[] = [
  {
    type: "ports",
    label: "Ports / Locations",
    apiPath: "/api/setup/ports/",
    extraFields: [{ name: "country", label: "Country", type: "text" }],
  },
  {
    type: "cargo-types",
    label: "Cargo Types",
    apiPath: "/api/setup/cargo-types/",
    extraFields: [
      { name: "description", label: "Description", type: "text" },
    ],
  },
  {
    type: "currencies",
    label: "Currencies",
    apiPath: "/api/setup/currencies/",
    extraFields: [
      { name: "symbol", label: "Symbol", type: "text" },
      { name: "exchange_rate", label: "Exchange Rate", type: "number" },
      { name: "is_default", label: "Default Currency", type: "checkbox" },
    ],
  },
  {
    type: "document-types",
    label: "Document Types",
    apiPath: "/api/setup/document-types/",
    extraFields: [
      { name: "description", label: "Description", type: "text" },
    ],
  },
];
