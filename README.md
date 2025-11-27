## Generate album and photo lists
- `python3 generate_album_lists.py`

## Run server locally
- `python3 -m http.server 8000 --bind 0.0.0.0`
- to visit on mobile device use http://YOUR_LOCAL_IP:80001
run `ipconfig getifaddr en0` to find local IP

## Steps for adding images
- Create new folder under /albums and add photos
- Run `python3 generate_album_lists.py`
- Upload album to R2 Cloudfare using `rclone copy ./albums/[Album-name] r2:my-photo-albums/albums/[Album-name]`
- Push to github

## Syncing 
- `rclone sync ./albums r2:my-photo-albums/albums --progress --exclude "*.DS_Store" --exclude ".git/*"`
