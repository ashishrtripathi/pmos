import { NextResponse } from "next/server";

// GET: Search GitHub repos or get repo details
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const owner = url.searchParams.get("owner") || "";
  const repo = url.searchParams.get("repo") || "";

  // Get repo details
  if (owner && repo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "PMOS/0.1.0",
        },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Repository not found" }, { status: 404 });
      }
      const data = await res.json();

      // Also get the README
      let readme = "";
      try {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/readme`,
          { headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "PMOS/0.1.0" } }
        );
        if (readmeRes.ok) {
          readme = await readmeRes.text();
        }
      } catch {
        // No README
      }

      // Get root file listing
      let rootFiles: string[] = [];
      try {
        const treeRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=0`,
          { headers: { Accept: "application/vnd.github+json", "User-Agent": "PMOS/0.1.0" } }
        );
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          rootFiles = (treeData.tree || []).map((t: any) => t.path);
        }
      } catch {
        // Try master branch
        try {
          const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=0`,
            { headers: { Accept: "application/vnd.github+json", "User-Agent": "PMOS/0.1.0" } }
          );
          if (treeRes.ok) {
            const treeData = await treeRes.json();
            rootFiles = (treeData.tree || []).map((t: any) => t.path);
          }
        } catch {
          // No tree
        }
      }

      return NextResponse.json({
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        htmlUrl: data.html_url,
        cloneUrl: data.clone_url,
        defaultBranch: data.default_branch,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        updatedAt: data.updated_at,
        topics: data.topics || [],
        hasPackageJson: rootFiles.includes("package.json"),
        hasReadme: rootFiles.includes("README.md") || rootFiles.includes("readme.md"),
        rootFiles,
        readme: readme.substring(0, 3000), // First 3000 chars
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Search repos
  if (query) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=20`,
        { headers: { Accept: "application/vnd.github+json", "User-Agent": "PMOS/0.1.0" } }
      );
      if (!res.ok) {
        return NextResponse.json({ items: [], total: 0 });
      }
      const data = await res.json();
      return NextResponse.json({
        total: data.total_count,
        items: (data.items || []).map((item: any) => ({
          name: item.name,
          fullName: item.full_name,
          description: item.description,
          htmlUrl: item.html_url,
          language: item.language,
          stars: item.stargazers_count,
          updatedAt: item.updated_at,
          topics: item.topics || [],
        })),
      });
    } catch (error: any) {
      return NextResponse.json({ items: [], total: 0, error: error.message });
    }
  }

  return NextResponse.json({ items: [], total: 0 });
}
