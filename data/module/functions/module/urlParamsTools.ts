type UrlParamValue = string | number | boolean | undefined;

function updateParams(
  params: Record<string, UrlParamValue>,
  overwrite: boolean = false
): void {

  const decode = (s: string): string => decodeURIComponent(s.replace(/\+/g, ' '));

  const parseSearch = (search: string): Map<string, string | undefined> => {
    const map = new Map<string, string | undefined>();

    search
      .replace(/^\?/, '')
      .split('&')
      .filter(Boolean)
      .forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) {
          map.set(decode(pair), undefined);
        } else {
          map.set(decode(pair.slice(0, idx)), decode(pair.slice(idx + 1)));
        }
      });

    return map;
  };

  const url = new URL(window.location.href);

  const query = overwrite ? new Map<string, string | undefined>() : parseSearch(url.search);

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, value === undefined ? undefined : String(value));
  });

  const search = Array.from(query.entries())
    .map(([k, v]) =>
      v === undefined
        ? encodeURIComponent(k)
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join('&');

  window.history.replaceState({}, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
}

function removeParams(keys: string | string[]): void {
  const names = new Set(Array.isArray(keys) ? keys : [keys]);

  const decode = (s: string): string => decodeURIComponent(s.replace(/\+/g, ' '));

  const parseSearch = (search: string): Map<string, string | undefined> => {
    const map = new Map<string, string | undefined>();

    search
      .replace(/^\?/, '')
      .split('&')
      .filter(Boolean)
      .forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) {
          map.set(decode(pair), undefined);
        } else {
          map.set(decode(pair.slice(0, idx)), decode(pair.slice(idx + 1)));
        }
      });

    return map;
  };

  const url = new URL(window.location.href);
  const query = parseSearch(url.search);

  names.forEach((k) => query.delete(k));

  const search = Array.from(query.entries())
    .map(([k, v]) =>
      v === undefined
        ? encodeURIComponent(k)
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join('&');

  window.history.replaceState({}, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
}

export default {
  updateParams,
  removeParams,
}