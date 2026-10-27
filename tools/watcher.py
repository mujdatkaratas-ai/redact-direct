#!/usr/bin/env python3
"""
Redact Direct — Local File Watcher

Runs on your machine. Polls the Supabase redact-files bucket for new files,
downloads them locally, and when you've finished redacting, uploads the
finished pack back and updates the job status.

AIR-GAPPED: No cloud AI. No external processing. Everything runs locally.

SETUP:
  1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local (same folder)
  2. Run: python watcher.py

FLOW:
  1. Client uploads files → appears in Supabase Storage
  2. Watcher downloads them to ./downloads/<job_id>/
  3. You redact them (in any tool you like)
  4. Put the redacted pack(s) in ./uploads/<job_id>/  (same folder names)
  5. Watcher detects finished packs → uploads to Supabase → sets status "ready"
  6. Client gets an email → downloads from the portal

CONFIG:
  Create a .env.local file in the same directory as this script with:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime, timezone

# ─── Config ───
SCRIPT_DIR = Path(__file__).parent
DOWNLOADS_DIR = SCRIPT_DIR / "downloads"
UPLOADS_DIR = SCRIPT_DIR / "uploads"
ENV_FILE = SCRIPT_DIR / ".env.local"
POLL_INTERVAL = 30  # seconds between checks
BUCKET = "redact-files"

# ─── Load env ───
def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip().strip('"').strip("'")
    # Also check system env
    for k in ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]:
        if k not in env and os.environ.get(k):
            env[k] = os.environ[k]
    return env

env = load_env()
SUPABASE_URL = env.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = env.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local")
    print(f"  File: {ENV_FILE}")
    sys.exit(1)

# ─── Supabase API helpers ───
def supabase_get(path: str):
    r = requests.get(
        f"{SUPABASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
        },
    )
    return r

def supabase_post(path: str, body: dict):
    r = requests.post(
        f"{SUPABASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "application/json",
        },
        json=body,
    )
    return r

def supabase_patch(path: str, body: dict):
    r = requests.patch(
        f"{SUPABASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        json=body,
    )
    return r

# ─── Storage helpers ───
def list_storage(prefix: str = ""):
    """List files in the redact-files bucket."""
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "application/json",
        },
        json={"prefix": prefix, "limit": 100},
    )
    if r.status_code == 200:
        return r.json()
    return []

def download_file(storage_path: str, local_path: Path):
    """Download a file from the bucket to a local path."""
    r = requests.get(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
        },
        stream=True,
    )
    if r.status_code == 200:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    return False

def upload_file(local_path: Path, storage_path: str, content_type: str = "application/octet-stream"):
    """Upload a file to the bucket."""
    with open(local_path, "rb") as f:
        r = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}",
            headers={
                "Authorization": f"Bearer {SERVICE_KEY}",
                "apikey": SERVICE_KEY,
                "x-upsert": "false",
                "Content-Type": content_type,
            },
            data=f,
        )
    return r.status_code in (200, 201)

def create_signed_url(storage_path: str, expires: int = 60):
    """Create a signed download URL for a file."""
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET}/{storage_path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "application/json",
        },
        json={"expiresIn": str(expires)},
    )
    if r.status_code == 200:
        return r.json().get("signedURL")
    return None

# ─── Database helpers ───
def get_jobs():
    """Get all jobs from redact_jobs."""
    r = supabase_get("/rest/v1/redact_jobs?select=*")
    if r.status_code == 200:
        return r.json()
    return []

def get_job(job_id: str):
    """Get a single job."""
    r = supabase_get(f"/rest/v1/redact_jobs?id=eq.{job_id}&select=*")
    if r.status_code == 200:
        data = r.json()
        return data[0] if data else None
    return None

def get_files_for_job(job_id: str):
    """Get all files for a job."""
    r = supabase_get(f"/rest/v1/redact_files?job_id=eq.{job_id}&select=*")
    if r.status_code == 200:
        return r.json()
    return []

def update_job_status(job_id: str, status: str):
    """Update the job status."""
    r = supabase_patch(f"/rest/v1/redact_jobs?id=eq.{job_id}", {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return r.status_code in (200, 204)

def insert_pack(job_id: str, file_name: str, storage_path: str):
    """Insert a redacted pack record."""
    r = supabase_post("/rest/v1/redact_packs", {
        "job_id": job_id,
        "file_name": file_name,
        "storage_path": storage_path,
    })
    return r.status_code in (200, 201)

# ─── Main loop ───
def check_for_new_files():
    """Download any new files that haven't been downloaded yet."""
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    for job in get_jobs():
        job_id = job["id"]
        files = get_files_for_job(job_id)
        
        for f in files:
            storage_path = f["storage_path"]  # e.g. "job_id/timestamp-filename.txt"
            file_name = f["file_name"]         # e.g. "filename.txt"
            
            # Local path: downloads/<job_id>/<file_name>
            local_file = DOWNLOADS_DIR / job_id / file_name
            done_marker = DOWNLOADS_DIR / job_id / f".{file_name}.downloaded"
            
            if done_marker.exists():
                continue  # Already downloaded
            
            # Download using the full storage_path
            if download_file(storage_path, local_file):
                done_marker.touch()
                print(f"  ✅ Downloaded: {job_id}/{file_name}")
                
                # Update job status to in_review
                if job["status"] == "pending":
                    update_job_status(job_id, "in_review")
                    print(f"  📋 Status → in_review: {job['reference']}")
            else:
                print(f"  ❌ Download failed: {job_id}/{file_name} (path: {storage_path})")

def check_for_uploads():
    """Upload any redacted packs from the uploads folder."""
    if not UPLOADS_DIR.exists():
        return
    
    for job_dir in UPLOADS_DIR.iterdir():
        if not job_dir.is_dir():
            continue
        job_id = job_dir.name
        
        for pack_file in job_dir.iterdir():
            if pack_file.name.startswith(".") or pack_file.name.startswith("_"):
                continue
            if pack_file.suffix == ".uploaded":
                continue
            
            # Upload the pack to storage
            storage_path = f"{job_id}/{pack_file.name}"
            if upload_file(pack_file, storage_path):
                # Insert the pack record
                insert_pack(job_id, pack_file.name, storage_path)
                # Update job status to ready
                update_job_status(job_id, "ready")
                # Mark as uploaded
                pack_file.rename(job_dir / f"{pack_file.name}.uploaded")
                print(f"  ✅ Pack uploaded: {job_id}/{pack_file.name}")
                print(f"  📋 Status → ready: {job_id}")
            else:
                print(f"  ❌ Upload failed: {job_id}/{pack_file.name}")

def main():
    print("=" * 60)
    print("  Redact Direct — Local File Watcher")
    print("  Air-gapped. No cloud AI. Running locally.")
    print("=" * 60)
    print(f"  Supabase: {SUPABASE_URL}")
    print(f"  Downloads: {DOWNLOADS_DIR}")
    print(f"  Uploads:   {UPLOADS_DIR}")
    print(f"  Poll interval: {POLL_INTERVAL}s")
    print("=" * 60)
    print()
    print("  HOW IT WORKS:")
    print("  1. New files from clients are downloaded to ./downloads/<job_id>/")
    print("  2. Redact the files using any tool")
    print("  3. Put the finished pack in ./uploads/<job_id>/")
    print("  4. The watcher uploads it and sets the job to 'ready'")
    print("  5. The client gets an email and downloads from the portal")
    print()
    print("  Press Ctrl+C to stop.")
    print()
    
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    while True:
        try:
            now = datetime.now().strftime("%H:%M:%S")
            print(f"[{now}] Checking for new files and uploads...")
            check_for_new_files()
            check_for_uploads()
        except Exception as e:
            print(f"  ⚠️  Error: {e}")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
