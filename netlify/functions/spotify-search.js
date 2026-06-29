exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { title, artist } = JSON.parse(event.body || '{}');
  if (!title) return { statusCode: 400, body: JSON.stringify({ error: 'title required' }) };

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Spotify not configured' }) };
  }

  try {
    // Get access token (Client Credentials)
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const { access_token } = await tokenRes.json();

    // Search for track
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    const searchData = await searchRes.json();
    const track = searchData.tracks?.items?.[0];

    if (!track) {
      return { statusCode: 200, body: JSON.stringify({ found: false }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        found: true,
        trackId: track.id,
        trackUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
        albumArt: track.album.images[1]?.url || track.album.images[0]?.url
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Spotify search failed' }) };
  }
};
