const FIREBASE_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || 'AIzaSyByW5MWjXilGzYiZ3AQ_K8V1NCzQgQyoZE';

export async function verifyFirebaseIdToken(idToken: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  const data = await response.json();
  if (!response.ok || !data.users?.[0]) {
    throw new Error(data.error?.message || 'Invalid Firebase ID token');
  }

  return {
    uid: String(data.users[0].localId || ''),
    email: String(data.users[0].email || '').toLowerCase(),
    emailVerified: Boolean(data.users[0].emailVerified),
  };
}
