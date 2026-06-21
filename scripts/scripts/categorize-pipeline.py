import instaloader
import json
import sys

username = sys.argv[1]

L = instaloader.Instaloader()

profile = instaloader.Profile.from_username(
    L.context,
    username
)

captions = []

for i, post in enumerate(profile.get_posts()):
    if post.caption:
        captions.append(post.caption[:500])

    if i >= 4:
        break

result = {
    "username": profile.username,
    "followers": profile.followers,
    "bio": profile.biography,
    "captions": captions
}

print(json.dumps(result))