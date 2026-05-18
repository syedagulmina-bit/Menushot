export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const PEXELS_KEY = process.env.PEXELS_KEY || 'cfEM6mSEgxqpGbjIa9FQPuLw87vH8xQB0oHc720cw0RsA7m4Vce4typ6';

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: `Pexels ${r.status}: ${txt}` });
    }
    const data = await r.json();
    const photos = (data.photos || []).map(p => ({
      id: p.id,
      thumb: p.src.medium,
      full: p.src.large2x || p.src.large,
      page: p.url,
      title: p.alt || query,
      photographer: p.photographer,
      source: 'Pexels'
    }));
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
