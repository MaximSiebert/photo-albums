#!/usr/bin/env python3
import os
import json
from pathlib import Path
from datetime import datetime

albums_dir = Path('albums')
image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# Get all album folders
album_folders = [d for d in albums_dir.iterdir() if d.is_dir()]

# Generate list of album IDs for albums.json
album_ids = []

for album_folder in album_folders:
    # Get all image files in the folder
    photos = sorted([
        f.name for f in album_folder.iterdir() 
        if f.is_file() and f.suffix.lower() in image_extensions
    ])
    
    if photos:
        album_ids.append(album_folder.name)
        
        photos_json_path = album_folder / 'photos.json'
        
        # Check if photos.json already exists to preserve created date
        if photos_json_path.exists():
            with open(photos_json_path, 'r') as f:
                existing_data = json.load(f)
                created_date = existing_data.get('created')
        else:
            created_date = datetime.now().isoformat()
        
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
