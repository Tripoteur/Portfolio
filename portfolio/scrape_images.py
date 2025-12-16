
import os
import urllib.request
import re
from urllib.parse import urljoin

# Config
BASE_URL = "https://jeanfontaine.myportfolio.com/"
TARGET_DIR = "assets/scraped"
PAGES = [
    "",
    "cv",
    "creation-visuelle",
    "logobranding",
    "edition-video",
    "animation-css"
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_images():
    ensure_dir(TARGET_DIR)
    
    # Simple regex for img tags src
    img_re = re.compile(r'<img [^>]*src="([^"]+)"')
    
    downloaded = set()
    count = 0

    print(f"--- STARTING SCRAPE of {BASE_URL} ---")

    for page in PAGES:
        url = urljoin(BASE_URL, page)
        print(f"Scanning: {url}")
        
        try:
            with urllib.request.urlopen(url) as response:
                html = response.read().decode('utf-8')
                
                # Find all images
                srcs = img_re.findall(html)
                
                for src in srcs:
                    # Fix relative urls
                    full_url = urljoin(url, src)
                    
                    if full_url in downloaded:
                        continue
                        
                    # Generate filename
                    filename = os.path.basename(full_url.split("?")[0])
                    if not filename or len(filename) > 50:
                        filename = f"image_{count}.jpg"
                    
                    save_path = os.path.join(TARGET_DIR, filename)
                    
                    try:
                        print(f"   Downloading: {filename}...")
                        urllib.request.urlretrieve(full_url, save_path)
                        downloaded.add(full_url)
                        count += 1
                    except Exception as e:
                        print(f"   Failed to download {full_url}: {e}")

        except Exception as e:
            print(f"Failed to load page {url}: {e}")

    print(f"--- DONE. {count} images saved to {TARGET_DIR} ---")

if __name__ == "__main__":
    download_images()
