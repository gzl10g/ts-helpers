export interface CatalogParam {
  name: string
  type: string
  description: string
  optional: boolean
}

export interface CatalogEntry {
  name: string
  module: string
  signature: string
  description: string
  params: CatalogParam[]
  returns: { type: string; description: string }
  examples: string[]
  nodeOnly: boolean
}

export interface Catalog {
  generatedAt: string
  version: string
  entries: CatalogEntry[]
}
