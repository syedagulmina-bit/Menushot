export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query = '', per_page = 8 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' });

  // Your Drive folder IDs
  const FOLDERS = {
    'Burgers':       '1eQlhsTarU-f5u5fH_0NRk7X5NkLl1KdG',
    'Pizzas':        '1iWVI7wCKu5JjLPzEas-W3f1s583a35EQ',
    'Pasta':         '1yOaQV4z5zJzl7pRaGJ5667BUnKcFYtZg',
    'Rice':          '1-r9N_wVLZYaHvMTMRGYibb_qA43tHAd4',
    'Sushi':         '1tU5rKMvzrRnNNC6suHzAzn5gU4vG6fvn',
    'Noodles':       '1jKrznagGgwQQkELnNuzvXraIsiRH0yj2',
    'Fries':         '1F4dsFmt0pw3Hrif6H-Oflzm9SfiMYB5Z',
    'Fried Chicken': '1bTaafcSUZ-Um_OaAUuPkLfTItJtJNCjX',
    'Ice Cream':     '1AbUtNyNiazE9VTunqmMYTq_P16ZcqXRA',
    'Drinks':        '1g_oU6vmcomeCyrT5BBhY1cSBygL88i-L',
  };

  try {
    // Search all folders in parallel
    const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    const folderResults = await Promise.all(
      Object.entries(FOLDERS).map(async ([folderName, folderId]) => {
        // Build Drive API query — search by filename keywords within folder
        const nameConditions = words.map(w => `name contains '${w}'`).join(' or ');
        const driveQuery = `(${nameConditions}) and '${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name)&pageSize=20&key=${API_KEY}`;
        
        const r = await fetch(url);
        if (!r.ok) return [];
        const data = await r.json();
        
        return (data.files || []).map(f => ({
          id:           f.id,
          name:         f.name.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/-/g, ' '),
          folder:       folderName,
          thumb:        `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`,
          full:         `https://drive.google.com/thumbnail?id=${f.id}&sz=w1200`,
          page:         `https://drive.google.com/file/d/${f.id}/view`,
        }));
      })
    );

    // Flatten, score and sort by relevance
    const all = folderResults.flat();
    const scored = all.map(item => {
      const haystack = (item.name + ' ' + item.folder).toLowerCase();
      const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(per_page));

    const photos = scored.map(({ item }) => ({
      id:           item.id,
      thumb:        item.thumb,
      full:         item.full,
      page:         item.page,
      title:        item.name,
      photographer: 'Your Team',
      source:       `My Images · ${item.folder}`,
      folder:       item.folder,
      isDrive:      true,
    }));

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json({ photos });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
