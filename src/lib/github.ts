export async function commitFileToGitHub(
    token: string,
    owner: string,
    repo: string,
    path: string,
    contentBase64: string,
    message: string
) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 1. Get existing file SHA (if it exists) to allow override
    let sha: string | undefined;
    try {
        const getRes = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Cloudflare-Worker-Bidxaagui',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (getRes.ok) {
            const data = await getRes.json() as any;
            sha = data.sha;
        }
    } catch (e) {
        console.warn('GitHub: Could not fetch existing file (might be new)', e);
    }

    // 2. Commit/Update file
    console.log(`GitHub: Committing ${path} (${contentBase64.length} bytes base64)`);

    const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Cloudflare-Worker-Bidxaagui',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message,
            content: contentBase64,
            sha: sha
        })
    });

    if (!putRes.ok) {
        const status = putRes.status;
        const errorText = await putRes.text();
        throw new Error(`GitHub API Error (HTTP ${status}): ${errorText}`);
    }

    const result = await putRes.json() as any;
    return result.content.html_url;
}
