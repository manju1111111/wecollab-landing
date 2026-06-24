import os
import sys
import json
import time
import instaloader
from datetime import datetime

# Configure output encoding to utf-8
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_session_path(session_user):
    session_dir = os.path.join(os.getcwd(), 'data', 'instagram_sessions')
    if not os.path.exists(session_dir):
        os.makedirs(session_dir)
    return os.path.join(session_dir, f"{session_user}.session")

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing action or username arguments. Usage: python instaloader_sync.py [profile|posts|both] [username]", "code": "INVALID_ARGUMENTS"}))
        sys.exit(1)

    action = sys.argv[1].lower()
    target_username = sys.argv[2].replace("@", "").strip()

    # Load credentials from environment
    insta_user = os.environ.get("INSTAGRAM_USERNAME")
    insta_pass = os.environ.get("INSTAGRAM_PASSWORD")

    # Initialize Instaloader
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        max_connection_attempts=3
    )

    # Enable Session Persistence
    session_loaded = False
    if insta_user:
        session_file = get_session_path(insta_user)
        try:
            L.load_session_from_file(insta_user, session_file)
            session_loaded = True
            sys.stderr.write(f"Loaded Instagram session for {insta_user} from cache.\n")
        except FileNotFoundError:
            sys.stderr.write("Session file not found, attempting fresh login...\n")
        except Exception as e:
            sys.stderr.write(f"Session load failed: {str(e)}, attempting fresh login...\n")

        if not session_loaded:
            if insta_pass:
                try:
                    L.login(insta_user, insta_pass)
                    L.save_session_to_file(session_file)
                    session_loaded = True
                    sys.stderr.write(f"Successfully logged in as {insta_user} and saved session.\n")
                except instaloader.exceptions.BadCredentialsException:
                    print(json.dumps({"error": "Invalid Instagram credentials provided.", "code": "BAD_CREDENTIALS"}))
                    sys.exit(0)
                except instaloader.exceptions.ConnectionException as ce:
                    # Let it fall through to anonymous or report connection issue
                    sys.stderr.write(f"Login failed due to connection error: {str(ce)}.\n")
                except Exception as e:
                    sys.stderr.write(f"Login failed: {str(e)}.\n")
            else:
                sys.stderr.write("No Instagram password found in env, attempting anonymous sync.\n")
    else:
        sys.stderr.write("No Instagram credentials in env, executing anonymously.\n")

    # Retry helper for rate limit handling
    max_retries = 3
    retry_delay = 5

    profile = None
    for attempt in range(max_retries):
        try:
            profile = instaloader.Profile.from_username(L.context, target_username)
            break
        except instaloader.exceptions.ProfileNotExistsException:
            print(json.dumps({"error": f"Instagram profile @{target_username} does not exist.", "code": "PROFILE_NOT_FOUND"}))
            sys.exit(0)
        except instaloader.exceptions.ConnectionException as ce:
            if "429" in str(ce) or "too many requests" in str(ce).lower():
                sys.stderr.write(f"Rate limit hit during profile fetch. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})\n")
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                print(json.dumps({"error": f"Connection error fetching profile: {str(ce)}", "code": "CONNECTION_ERROR"}))
                sys.exit(0)
        except Exception as e:
            if "404" in str(e):
                print(json.dumps({"error": f"Profile @{target_username} not found (404).", "code": "PROFILE_NOT_FOUND"}))
            else:
                print(json.dumps({"error": f"Failed to fetch profile: {str(e)}", "code": "GENERIC_ERROR"}))
            sys.exit(0)

    if not profile:
        print(json.dumps({"error": "Failed to fetch profile due to rate limiting or connection drops.", "code": "RATE_LIMIT"}))
        sys.exit(0)

    if profile.is_private:
        # WeCollab only handles public profiles
        print(json.dumps({"error": f"The account @{target_username} is private. WeCollab only indexes public profiles.", "code": "PRIVATE_ACCOUNT"}))
        sys.exit(0)

    result = {}

    # Extract Profile Data
    if action in ['profile', 'both']:
        result['profile'] = {
            "username": profile.username,
            "full_name": profile.full_name or "",
            "biography": profile.biography or "",
            "followers": profile.followers,
            "following": profile.following,
            "posts_count": profile.mediacount,
            "profile_pic_url": profile.profile_pic_url or "",
            "is_verified": profile.is_verified,
            "external_url": profile.external_url or ""
        }

    # Extract Posts Data (up to 50)
    if action in ['posts', 'both']:
        posts_data = []
        count = 0
        
        try:
            posts_generator = profile.get_posts()
            for post in posts_generator:
                if count >= 50:
                    break
                
                # Fetch post details safely
                posts_data.append({
                    "post_id": post.mediaid,
                    "shortcode": post.shortcode,
                    "caption": post.caption or "",
                    "likes": post.likes,
                    "comments": post.comments,
                    "views": post.video_view_count if post.is_video else 0,
                    "timestamp": post.date_utc.isoformat() + "Z" if post.date_utc else None,
                    "is_video": post.is_video,
                    "url": f"https://www.instagram.com/p/{post.shortcode}/"
                })
                count += 1
                
        except instaloader.exceptions.ConnectionException as ce:
            sys.stderr.write(f"Rate limit or connection drop during posts iteration: {str(ce)}\n")
            # If we already got some posts, we can return what we have
            if len(posts_data) == 0:
                print(json.dumps({"error": "Rate limit hit while iterating posts.", "code": "RATE_LIMIT"}))
                sys.exit(0)
        except Exception as e:
            sys.stderr.write(f"Error fetching posts: {str(e)}\n")
            if len(posts_data) == 0:
                print(json.dumps({"error": f"Failed to fetch posts: {str(e)}", "code": "GENERIC_ERROR"}))
                sys.exit(0)

        result['posts'] = posts_data

    print(json.dumps(result))

if __name__ == "__main__":
    main()
