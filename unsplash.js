export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    return res.status(200).end();
  }

  const { query, per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const UNSPLASH_KEY = process.env.UNSPLASH_KEY;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=landscape&client_id=${UNSPLASH_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Unsplash ${r.status}`);
    const data = await r.json();

    const photos = (data.results || []).map(p => ({
      id: p.id,
      thumb: p.urls.small,
      full: p.urls.regular,
      page: `${p.links.html}?utm_source=menushot&utm_medium=referral`,
      title: p.alt_description || query,
      photographer: p.user.name,
      source: 'Unsplash'
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
