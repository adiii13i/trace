// Fetches the unified diff for a single commit from the GitHub API.
// We request the .diff media type which gives us a plain-text patch
// rather than the default JSON response.
//
// Diffs can be huge on large commits so we cap at MAX_DIFF_BYTES before
// sending to the LLM — 12KB is usually more than enough for the model
// to make a decision and keeps token costs predictable.

const MAX_DIFF_BYTES = 12_000;

export async function fetchCommitDiff(
  owner: string,
  repo: string,
  sha: string
): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set in environment');

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        'application/vnd.github.v3.diff',
        'User-Agent':  'trace-verification/1.0',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for commit ${sha}`);
  }

  const text = await res.text();
  return text.slice(0, MAX_DIFF_BYTES);
}
