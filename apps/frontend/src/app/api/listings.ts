export async function getListings() {
  try {
    const res = await fetch("http://localhost:3952/listings", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error('Failed to fetch listings');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}