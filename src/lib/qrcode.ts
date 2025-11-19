// Helper to generate QR code URL for a table with token
export function generateTableQRCodeUrl(tableId: string, token: string): string {
  const billUrl = `${window.location.origin}/bill/${tableId}?token=${token}`;
  // Using QR code API service
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(billUrl)}`;
}