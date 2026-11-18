# Muthoot Branch Finder

A static branch directory that displays all records by default and filters them live as a PIN code is typed. Use the tabs to view all branches or filter by MFL, MML, and South.

## Branch data

Branch records are maintained separately in `branch-data/mfl.json`, `branch-data/mml.json`, and `branch-data/south.json`. Add each record to the file for its branch list.

Each file contains a JSON array using this format:

```json
[
  {
    "pincode": "110001",
    "territoryCode": "0042",
    "branchName": "Branch name",
    "branchAddress": "Branch address"
  }
]
```

Keep PIN codes and territory codes as strings to preserve leading zeroes. Territory codes must contain exactly four digits. The site uses `branch-data/muthoot_logo.png` for the header logo.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## GitHub Pages

Push the project files to the repository's `main` branch, then open **Settings → Pages**. Select **Deploy from a branch**, choose `main` and `/(root)`, and save. This static site does not require a paid backend or domain. Public repositories make their branch data public; do not upload private or unauthorised information.
