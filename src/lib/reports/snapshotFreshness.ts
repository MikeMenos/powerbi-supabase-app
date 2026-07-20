export function isSnapshotFresh(
  snapshotDate: string | null | undefined,
  today: string,
) {
  return snapshotDate === today;
}
