export declare type PageParams = {
  [key: string]: string;
};

export declare type Structure = string;
export declare type Nullable<T> = T | null | undefined;
export declare type NullableStructure = Nullable<Structure>;
export declare type NullableParams = Nullable<PageParams>;

export declare type PageLike = {
  route: string;

  index?: number;

  url?: string;

  view?: NullableStructure;
  panel?: NullableStructure;

  modal?: NullableStructure;
  popout?: NullableStructure;

  params?: NullableParams;
};

export declare type InitPage = {
  view?: NullableStructure;
  panel?: NullableStructure;
};

export declare type InitRouteList = {
  [route: string]: InitPage;
};

export declare type Token = {
  name: string;
  raw: string;
};

export declare type RouteMeta = {
  regex: RegExp;
  tokens: Token[];
  exclude: string[];
};

export declare type RouteMetaList = {
  [route: string]: RouteMeta;
};
