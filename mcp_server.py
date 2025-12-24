#!/usr/bin/env python3
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def list_files(path=""):
    target = PROJECT_ROOT / path if path else PROJECT_ROOT
    if not target.exists():
        return "Path not found"
    if target.is_file():
        with open(target, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()[:10000]
    items = []
    for item in sorted(target.iterdir())[:50]:
        prefix = "[DIR] " if item.is_dir() else "[FILE]"
        items.append(f"{prefix} {item.name}")
    return "\n".join(items)

def write_file(path, content):
    target = PROJECT_ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, 'w', encoding='utf-8') as f:
        f.write(content)
    return f"Written to {path}"

def handle(msg):
    method = msg.get("method")
    mid = msg.get("id")
    
    if method == "initialize":
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "immanence", "version": "1.0.0"}
        }}
    
    if method == "notifications/initialized":
        return None
    
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": [
            {"name": "list_files", "description": "List directory or read file contents", "inputSchema": {"type": "object", "properties": {"path": {"type": "string", "description": "Relative path"}}}},
            {"name": "write_file", "description": "Write content to a file", "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}}
        ]}}
    
    if method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        
        if name == "list_files":
            result = list_files(args.get("path", ""))
        elif name == "write_file":
            result = write_file(args["path"], args["content"])
        else:
            result = "Unknown tool"
        
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "content": [{"type": "text", "text": str(result)}]
        }}
    
    if mid is not None:
        return {"jsonrpc": "2.0", "id": mid, "result": {}}
    return None

while True:
    line = sys.stdin.readline()
    if not line:
        break
    try:
        response = handle(json.loads(line))
        if response:
            print(json.dumps(response), flush=True)
    except:
        pass