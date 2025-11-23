#!/usr/bin/env python3
import os
import json
from pathlib import Path
from datetime import datetime
from PIL import Image

albums_dir = Path('albums')
image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# Get all album folders
album_folders = [d for d in albums_dir.iterdir() if d.is_dir()]

# Generate list of album IDs for albums.json
album_ids = []

for album_folder in album_folders:
    # Get all image files in the folder
    image_files = sorted([
        f for f in album_folder.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ])

    if image_files:
        album_ids.append(album_folder.name)

        photos_json_path = album_folder / 'photos.json'

        # Check if photos.json already exists to preserve created date
        if photos_json_path.exists():
            with open(photos_json_path, 'r') as f:
                existing_data = json.load(f)
                created_date = existing_data.get('created')
        else:
            created_date = datetime.now().isoformat()

        # Build photo list with dimensions
        photos = []
        for img_file in image_files:
            try:
                with Image.open(img_file) as img:
                    width, height = img.size
                    photos.append({
                        'filename': img_file.name,
                        'width': width,
                        'height': height
                    })
            except Exception as e:
                print(f"Warning: Could not read dimensions for {img_file.name}: {e}")
                # Fallback to just filename if image can't be opened
                photos.append(img_file.name)

        # Create photos.json
        data = {
            'name': album_folder.name.replace('-', ' ').title(),
            'photos': photos,
            'created': created_date
        }

        with open(photos_json_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Generated {album_folder.name}/photos.json with {len(photos)} photos")

# Create/update albums.json
albums_json_path = albums_dir / 'albums.json'
albums_data = {
    'albums': sorted(album_ids)
}

with open(albums_json_path, 'w') as f:
    json.dump(albums_data, f, indent=2)

print(f"\nGenerated albums.json with {len(album_ids)} albums")
print("Done! Albums automatically detected from folders.")
