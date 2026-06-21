import type { CreatorReport } from "./actions";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export function downloadCreatorPDF(report: CreatorReport): void {
  const profileImgSrc = report.profile_pic_url
    ? `/api/proxy-image?url=${encodeURIComponent(report.profile_pic_url)}`
    : "/assets/jannat_profile.png";

  const scoreColor =
    report.creator_score >= 85 ? "#7c3aed" :
    report.creator_score >= 70 ? "#4f46e5" : "#2563eb";

  const scoreLabel =
    report.creator_score >= 85 ? "Excellent" :
    report.creator_score >= 70 ? "Great" :
    report.creator_score >= 55 ? "Good" : "Average";

  const percentile =
    report.creator_score >= 85 ? "Top 15%" :
    report.creator_score >= 70 ? "Top 30%" : "Top 50%";

  const sourceLabel =
    report.data_source === "live" ? "🟢 Live Data" :
    report.data_source === "cached" ? "🔵 Cached" : "✨ AI Estimated";

  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${report.name} — Creator Analytics | WeCollab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 28px 32px; font-size: 12px; line-height: 1.4; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid #e2e8f0; }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-style: italic; font-size: 15px; }
    .logo-name { font-weight: 800; font-size: 15px; }
    .header-right { text-align: right; }
    .badge { display: inline-block; background: #f3f0ff; color: #7c3aed; padding: 3px 10px; border-radius: 100px; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .meta { font-size: 9px; color: #94a3b8; margin-top: 4px; }

    .profile-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid #7c3aed; flex-shrink: 0; }
    .profile-info { flex: 1; }
    .creator-name { font-size: 18px; font-weight: 800; }
    .creator-handle { color: #6366f1; font-weight: 600; font-size: 12px; margin-top: 2px; }
    .tags { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .tag { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 100px; font-size: 9px; font-weight: 700; }
    .counts { display: flex; gap: 24px; text-align: center; flex-shrink: 0; }
    .count-val { font-size: 18px; font-weight: 800; }
    .count-lbl { font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .vdiv { width: 1px; background: #e2e8f0; align-self: stretch; }

    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .grid3b { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .card-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; }
    .m-item { margin-bottom: 10px; }
    .m-label { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .m-val { font-size: 20px; font-weight: 800; margin-top: 1px; }
    .m-sub { font-size: 9px; font-weight: 700; margin-top: 1px; }
    .green { color: #10b981; }
    .purple { color: ${scoreColor}; }

    .score-wrap { text-align: center; padding: 8px 0; }
    .score-big { font-size: 52px; font-weight: 900; color: ${scoreColor}; line-height: 1; }
    .score-denom { font-size: 11px; color: #94a3b8; }
    .score-label { font-size: 10px; font-weight: 800; color: ${scoreColor}; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .score-pct { font-size: 9px; color: #94a3b8; margin-top: 3px; }

    .insight-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
    .iicon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
    .ilbl { font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .ival { font-size: 11px; font-weight: 700; }
    .isub { font-size: 9px; color: #94a3b8; margin-top: 1px; }

    .price-row { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .price-type { font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .price-val { font-size: 13px; font-weight: 800; margin-top: 2px; }
    .price-per { font-size: 9px; color: #94a3b8; }

    .content-stat { margin-bottom: 8px; }
    .cs-lbl { font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .cs-val { font-size: 14px; font-weight: 800; margin-top: 1px; }

    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; font-weight: 600; }

    @media print {
      body { padding: 0; background: white; }
      @page { margin: 10mm 12mm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-mark">w</div>
      <span class="logo-name">wecollab</span>
    </div>
    <div class="header-right">
      <span class="badge">Creator Analytics Report</span>
      <div class="meta">${sourceLabel} &nbsp;•&nbsp; ${date}</div>
    </div>
  </div>

  <!-- Profile Card -->
  <div class="profile-card">
    <img class="avatar"
      src="${origin}${profileImgSrc}"
      onerror="this.src='${origin}/assets/jannat_profile.png'"
      alt="${report.name}"
    />
    <div class="profile-info">
      <div class="creator-name">${report.name}</div>
      <div class="creator-handle">@${report.username}</div>
      <div class="tags">
        <span class="tag">${report.category}</span>
        <span class="tag">${report.platform}</span>
        <span class="tag">${report.location}</span>
      </div>
    </div>
    <div class="counts">
      <div><div class="count-val">${formatNum(report.followers)}</div><div class="count-lbl">Followers</div></div>
      <div class="vdiv"></div>
      <div><div class="count-val">${report.following.toLocaleString()}</div><div class="count-lbl">Following</div></div>
      <div class="vdiv"></div>
      <div><div class="count-val">${report.posts.toLocaleString()}</div><div class="count-lbl">Posts</div></div>
    </div>
  </div>

  <!-- Row 1: Metrics + Score -->
  <div class="grid3" style="grid-template-columns: 1fr 1fr 0.7fr;">
    <div class="card">
      <div class="card-title">Performance</div>
      <div class="m-item"><div class="m-label">Avg Likes</div><div class="m-val">${formatNum(report.avg_likes)}</div></div>
      <div class="m-item"><div class="m-label">Avg Comments</div><div class="m-val">${report.avg_comments.toLocaleString()}</div></div>
      <div class="m-item"><div class="m-label">Avg Views</div><div class="m-val">${formatNum(report.avg_views)}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Engagement & Quality</div>
      <div class="m-item"><div class="m-label">Engagement Rate</div><div class="m-val green">${report.engagement_rate}%</div><div class="m-sub green">Excellent</div></div>
      <div class="m-item"><div class="m-label">Posting Frequency</div><div class="m-val" style="font-size:16px">${report.posting_frequency}</div></div>
      <div class="m-item"><div class="m-label">Audience Quality</div><div class="m-val">${report.quality_score}%</div></div>
    </div>
    <div class="card">
      <div class="card-title purple">AI Creator Score</div>
      <div class="score-wrap">
        <div class="score-big">${report.creator_score}</div>
        <div class="score-denom">/100</div>
        <div class="score-label">${scoreLabel}</div>
        <div class="score-pct">${percentile} of Creators</div>
      </div>
    </div>
  </div>

  <!-- Row 2: Insights + Pricing + Content -->
  <div class="grid3b">
    <div class="card">
      <div class="card-title">AI Insights</div>
      <div class="insight-row">
        <div class="iicon" style="background:#f3f0ff">✨</div>
        <div><div class="ilbl">Niche</div><div class="ival">${report.niche}</div></div>
      </div>
      <div class="insight-row">
        <div class="iicon" style="background:#ecfdf5">👥</div>
        <div><div class="ilbl">Audience</div><div class="ival">${report.audience}</div><div class="isub">Female ${report.audience_demographics.female} | Male ${report.audience_demographics.male}</div></div>
      </div>
      <div class="insight-row">
        <div class="iicon" style="background:#eff6ff">🛡</div>
        <div><div class="ilbl">Brand Safety</div><div class="ival">${report.brand_safety_score}% — Very Safe</div></div>
      </div>
      <div class="insight-row">
        <div class="iicon" style="background:#fdf4ff">⚡</div>
        <div><div class="ilbl">Collab Potential</div><div class="ival" style="color:#7c3aed">Highly Recommended</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Estimated Pricing</div>
      <div class="price-row">
        <div><div class="price-type">${report.platform} Story</div><div class="price-val">${report.estimated_rates.story}</div></div>
        <div class="price-per">per story</div>
      </div>
      <div class="price-row">
        <div><div class="price-type">${report.platform} Reel / Post</div><div class="price-val">${report.estimated_rates.reel}</div></div>
        <div class="price-per">per post</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Content Performance</div>
      <div class="content-stat"><div class="cs-lbl">Top Post Views</div><div class="cs-val">${report.recent_content.top_views}</div></div>
      <div class="content-stat"><div class="cs-lbl">Avg Reach</div><div class="cs-val">${report.recent_content.avg_reach}</div></div>
      <div class="content-stat"><div class="cs-lbl">Avg Saves</div><div class="cs-val">${report.recent_content.avg_saves}</div></div>
      <div class="content-stat"><div class="cs-lbl">Best Posting Time</div><div class="cs-val">${report.recent_content.best_time}</div></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>wecollab.in/analytics — Free AI-Powered Creator Analytics</span>
    <span>Generated on ${new Date().toLocaleString("en-IN")} • Source: ${report.data_source}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 1000);
      }, 600);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=960,height=720,scrollbars=yes");
  if (!printWindow) {
    alert("Please allow pop-ups for this site to download the PDF.\nGo to browser address bar → click the pop-up icon → Allow.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
