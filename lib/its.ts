export function getItsImageUrl(itsNumber: string | null | undefined): string {
  if (!itsNumber) return "";
  return `https://www.its52.com/GetImage.aspx?ID=${itsNumber}`;
}
