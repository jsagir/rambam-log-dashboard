#!/usr/bin/env python3
"""Process all unprocessed raw logs, then build accumulated.json."""

import subprocess
import sys
from pathlib import Path


def main():
    project_root = Path(__file__).parent.parent
    raw_dir = project_root / 'logs' / 'raw'
    processed_dir = project_root / 'logs' / 'processed'

    if not raw_dir.exists():
        print("No logs/raw/ directory found.")
        sys.exit(1)

    processed_dir.mkdir(parents=True, exist_ok=True)

    # Find unprocessed logs
    raw_files = sorted(raw_dir.glob('*.txt'))
    processed_stems = {f.stem for f in processed_dir.glob('*.json')}

    new_files = [f for f in raw_files if f.stem not in processed_stems]

    if not new_files:
        print("All logs already processed.")
    else:
        print(f"Found {len(new_files)} new log file(s) to process:")
        for f in new_files:
            print(f"  - {f.name}")
            subprocess.run([sys.executable, str(project_root / 'scripts' / 'process_log.py'), str(f)], check=True)

    # Always rebuild accumulated
    print("\nRebuilding accumulated.json...")
    subprocess.run([sys.executable, str(project_root / 'scripts' / 'build_accumulated.py')], check=True)
    print("\nDone!")


if __name__ == '__main__':
    main()
