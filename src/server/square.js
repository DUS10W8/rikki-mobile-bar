export async function squareRequest(path, body) {
  const host = process.env.SQUARE_ENVIRONMENT === "sandbox"
    ? "connect.squareupsandbox.com" : "connect.squareup.com";
  const response = await fetch(`https://${host}/v2/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": "2026-09-16",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Square returned ${response.status}`);
  return response.json();
}
