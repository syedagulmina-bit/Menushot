export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const PIXABAY_KEY = process.env.PIXABAY_KEY || '52068982-20dc99ebcaa7063bf8c031b44';

  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${per_page}&safesearch=true&min_width=640`;
    const r = await fetch(url);
    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: `Pixabay ${r.status}: ${txt}` });
    }
    const data = await r.json();

    const photos = (data.hits || []).map(p => ({
      id: p.id,
      // Use previewURL for thumb (small, public, no auth needed)
      // and webformatURL for full (also public when fetched server-side)
      thumb: p.previewURL,
      full: p.webformatURL,
      page: p.pageURL,
      title: p.tags ? p.tags.split(',').slice(0, 4).join(', ') : query,
      photographer: p.user,
      source: 'Pixabay'
    }));

    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
