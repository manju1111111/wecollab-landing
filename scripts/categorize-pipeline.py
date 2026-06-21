import os
import sys
import json
import instaloader
from datetime import datetime

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No username provided"}))
        sys.exit(1)
        
    target_username = sys.argv[1].replace("@", "").strip()
    
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False
    )
    
    # Try logging in if credentials are provided in the environment variables
    insta_user = os.environ.get("INSTAGRAM_USERNAME")
    insta_pass = os.environ.get("INSTAGRAM_PASSWORD")
    
    if insta_user and insta_pass:
        try:
            L.login(insta_user, insta_pass)
            sys.stderr.write(f"Logged in as {insta_user}\n")
        except Exception as e:
            sys.stderr.write(f"Login attempt failed: {str(e)}. Attempting anonymous access...\n")
            
    try:
        profile = instaloader.Profile.from_username(L.context, target_username)
        
        if profile.is_private:
            print(json.dumps({
                "error": f"The account @{target_username} is private. Cannot extract data.",
                "is_private": True
            }))
            sys.exit(0)
            
        captions = []
        hashtags_set = set()
        posts_data = []
        
        # Get posts generator
        posts = profile.get_posts()
        
        count = 0
        for post in posts:
            if count >= 10:
                break
            caption = post.caption or ""
            captions.append(caption)
            
            if post.caption_hashtags:
                for tag in post.caption_hashtags:
                    hashtags_set.add(tag)
                    
            posts_data.append({
                "date": post.date_utc.isoformat() if post.date_utc else None,
                "likes": post.likes,
                "comments": post.comments,
                "is_video": post.is_video,
                "views": post.video_view_count if post.is_video else 0
            })
            count += 1
            
        # Posting patterns
        posting_patterns = {
            "frequency": "Unknown",
            "avg_days_between_posts": 0.0,
            "posts_analyzed": len(posts_data)
        }
        
        if len(posts_data) >= 2:
            dates = []
            for p in posts_data:
                if p["date"]:
                    try:
                        dates.append(datetime.fromisoformat(p["date"]))
                    except ValueError:
                        pass
            if len(dates) >= 2:
                # Sort dates descending (newest to oldest)
                dates.sort(reverse=True)
                diffs = []
                for i in range(len(dates) - 1):
                    diff = (dates[i] - dates[i+1]).total_seconds() / 86400.0
                    diffs.append(abs(diff))
                if diffs:
                    avg_diff = sum(diffs) / len(diffs)
                    posting_patterns["avg_days_between_posts"] = round(avg_diff, 2)
                    if avg_diff <= 1.5:
                        posting_patterns["frequency"] = "Daily or near-daily"
                    elif avg_diff <= 4.0:
                        posting_patterns["frequency"] = "Multiple times a week"
                    elif avg_diff <= 8.0:
                        posting_patterns["frequency"] = "Weekly"
                    else:
                        posting_patterns["frequency"] = "Irregular"
                        
        response = {
            "username": profile.username,
            "name": profile.full_name or "",
            "bio": profile.biography or "",
            "followers": profile.followers,
            "following": profile.following,
            "website": profile.external_url or "",
            "captions": captions,
            "hashtags": list(hashtags_set),
            "profilePicture": profile.profile_pic_url or "",
            "posting_patterns": posting_patterns,
            "posts_data": posts_data
        }
        
        print(json.dumps(response))
        
    except instaloader.exceptions.ProfileNotExistsException:
        print(json.dumps({
            "error": f"Profile @{target_username} does not exist.",
            "error_type": "ProfileNotExistsException"
        }))
        sys.exit(0)
    except instaloader.exceptions.ConnectionException as ce:
        print(json.dumps({
            "error": f"Connection error / rate limit hit: {str(ce)}",
            "error_type": "ConnectionException",
            "rate_limited": True
        }))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected scraper failure: {str(e)}",
            "error_type": "GenericException"
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
