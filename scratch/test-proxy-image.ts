async function run() {
  const url = "https://scontent-cdg4-1.cdninstagram.com/v/t51.2885-19/11850309_1674349799447611_206178162_a.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xNTAuYzIifQ&_nc_ht=scontent-cdg4-1.cdninstagram.com&_nc_cat=1&_nc_oc=Q6cZ2gFDKZHZU2hYq0FHNeFTO2r51Glys354uH2d_9UPFRNTMopRSito2OqtPldZq4_B63k&_nc_ohc=w4yXTTN-pGsQ7kNvwFRVhQj&_nc_gid=j9T9z-ZEzcYAv6ry7Djoag&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Af9scZpeuR_9i84XY61opJTu5993Ubkgb4XVpaotqmfkKQ&oe=6A4589C4&_nc_sid=8b3546";
  const proxyUrl = `https://www.wecollab.in/api/proxy-image?url=${encodeURIComponent(url)}`;
  console.log("Fetching live proxy image:", proxyUrl);

  try {
    const res = await fetch(proxyUrl);
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    if (!res.ok) {
      const text = await res.text();
      console.log("Error body:", text);
    }
  } catch (e: any) {
    console.error("Fetch failed:", e.message);
  }
}

run();
