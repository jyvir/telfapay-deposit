export class PageListModel<T> {
  content: Array<T>;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
  sort: Sort;
  pageable: Pageable;
}

export class Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export class Pageable {
  sort: Sort;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

