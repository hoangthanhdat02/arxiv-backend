#!/usr/bin/env python3
"""
arXiv Paper Ingestion Pipeline (Data Engineer Task - Member 2)
Respects arXiv Terms of Service:
- Max 1 request per 3 seconds
- Single simultaneous connection
- Uses Atom 1.0 XML Query API
"""

import time
import json
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse
from typing import List, Dict, Any

ARXIV_BASE_URL = "http://export.arxiv.org/api/query"
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}

def fetch_arxiv_papers(category: str = "cs.AI", max_results: int = 20) -> List[Dict[str, Any]]:
    query_params = {
        "search_query": f"cat:{category}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    }
    url = f"{ARXIV_BASE_URL}?{urllib.parse.urlencode(query_params)}"
    print(f"[*] Calling arXiv API: {url}")

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ArXivDiscoveryClient/1.0 (academic-coursework)"}
    )

    with urllib.request.urlopen(req) as response:
        xml_content = response.read().decode("utf-8")

    root = ET.fromstring(xml_content)
    papers = []

    for entry in root.findall("atom:entry", ATOM_NS):
        id_url = entry.find("atom:id", ATOM_NS).text.strip()
        arxiv_id = id_url.split("/abs/")[-1]
        title = entry.find("atom:title", ATOM_NS).text.strip().replace("\n", " ")
        summary = entry.find("atom:summary", ATOM_NS).text.strip().replace("\n", " ")
        published = entry.find("atom:published", ATOM_NS).text.strip()
        updated = entry.find("atom:updated", ATOM_NS).text.strip()

        authors = [
            a.find("atom:name", ATOM_NS).text.strip()
            for a in entry.findall("atom:author", ATOM_NS)
        ]

        # Extract PDF link
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
        for link in entry.findall("atom:link", ATOM_NS):
            if link.attrib.get("title") == "pdf":
                pdf_url = link.attrib.get("href")

        papers.append({
            "id": arxiv_id,
            "title": title,
            "authors": authors,
            "abstract": summary,
            "published_date": published,
            "updated_date": updated,
            "primary_category": category,
            "categories": [category],
            "pdf_url": pdf_url
        })

    return papers

if __name__ == "__main__":
    print("[+] Starting test ingest of arXiv papers...")
    results = fetch_arxiv_papers(category="cs.AI", max_results=5)
    print(f"[+] Successfully fetched {len(results)} papers!")
    print(json.dumps(results[:2], indent=2))

    # Mandatory 3-second delay according to arXiv Terms of Service
    print("[*] Waiting 3 seconds before subsequent API requests...")
    time.sleep(3)
