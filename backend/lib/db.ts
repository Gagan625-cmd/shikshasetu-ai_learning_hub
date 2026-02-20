const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

export async function queryDB(sql: string) {
  if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
    throw new Error("Database configuration missing");
  }

  const response = await fetch(`${DB_ENDPOINT}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Accept": "application/json",
      "Authorization": `Bearer ${DB_TOKEN}`,
      "surreal-ns": DB_NAMESPACE,
      "surreal-db": "main",
    },
    body: sql,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("DB query failed:", text);
    throw new Error(`DB query failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

export async function getPremiumStatus(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const sql = `SELECT * FROM premium_users WHERE email = '${normalizedEmail}' LIMIT 1;`;
    const result = await queryDB(sql);
    console.log("getPremiumStatus result for", normalizedEmail, JSON.stringify(result));

    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (firstResult.result && Array.isArray(firstResult.result) && firstResult.result.length > 0) {
        return firstResult.result[0].is_premium === true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
}

export async function setPremiumStatus(email: string, isPremium: boolean, stripeSessionId?: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const sql = `
      DELETE FROM premium_users WHERE email = '${normalizedEmail}';
      CREATE premium_users SET
        email = '${normalizedEmail}',
        is_premium = ${isPremium},
        stripe_session_id = '${stripeSessionId || ""}',
        updated_at = '${now}',
        created_at = '${now}';
    `;
    const result = await queryDB(sql);
    console.log("setPremiumStatus result:", JSON.stringify(result));
    return true;
  } catch (error) {
    console.error("Error setting premium status:", error);
    return false;
  }
}
