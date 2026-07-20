export function canonicalizeDaxTemplate(query: string) {
  return query
    .replaceAll("*areaName*", "{AREA}")
    .replaceAll("YEAR(TODAY()) - 1", "{COMPARE_YEAR}")
    .replaceAll("YEAR(TODAY())", "{CURRENT_YEAR}");
}

export function escapeDaxString(value: string) {
  return value.replaceAll('"', '""');
}

export function renderDaxTemplate(
  query: string,
  input: { area: string; currentYear: number; compareYear: number },
) {
  return canonicalizeDaxTemplate(query)
    .replaceAll("{AREA}", escapeDaxString(input.area))
    .replaceAll("{CURRENT_YEAR}", String(input.currentYear))
    .replaceAll("{COMPARE_YEAR}", String(input.compareYear));
}
