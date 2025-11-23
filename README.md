## Generate album and photo lists
`python3 generate_album_lists.py`

## Run server locally
`python3 -m http.server 8000 --bind 0.0.0.0`
to visit on mobile device user http://YOUR_LOCAL_IP:8000
run `ipconfig getifaddr en0` to find local IP

## Steps for adding images
- Create new folder under /albums
- Run `python3 generate_album_lists.py`
- Upload album to R2 Cloudfare
- Push to github
