const defaultTypes = `
export interface Media {
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
}

export interface APIResponseCollectionMetadata {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface APIResponse<T> {
  data: T;
}

export interface APIResponseCollection<T> {
  data: T[];
  meta: APIResponseCollectionMetadata;
}
`;

module.exports = {
  defaultTypes,
};
