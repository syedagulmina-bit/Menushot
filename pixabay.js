export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    return res.status(200).end();
  }

  const { query, per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const PIXABAY_KEY = process.env.PIXABAY_KEY;

  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${per_page}&safesearch=true&editors_choice=false`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Pixabay ${r.status}`);
    const data = await r.json();

    const photos = (data.hits || []).map(p => ({
      id: p.id,
      thumb: p.webformatURL,
      full: p.largeImageURL,
      page: p.pageURL,
      title: p.tags || query,
      photographer: p.user,
      source: 'Pixabay'
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ photos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
