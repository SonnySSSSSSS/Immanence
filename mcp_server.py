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

def read_file(path):
    try:
        target = PROJECT_ROOT / path
        if not target.exists():
            return f"Error: File not found at {path}"
        with open(target, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if len(content) > 50000:
                return content[:50000] + f"\n\n[... truncated ...]"
            return content
    except Exception as e:
        return f"Error: {str(e)}"

def handle(msg):
    method = msg.get("method")
    mid = msg.get("id")
    
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "immanence", "version": "1.0.0"}
            }
        }
    
    if method == "notifications/initialized":
        return None
    
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "tools": [
                    {
                        "name": "list_files",
                        "description": "List directory contents",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "path": {"type": "string"}
                            }
                        }
                    },
                    {
                        "name": "write_file",
                        "description": "Write content to file",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "path": {"type": "string"},
                                "content": {"type": "string"}
                            },
                            "required": ["path", "content"]
                        }
                    },
                    {
                        "name": "read_file",
                        "description": "Read file contents",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "path": {"type": "string"}
                            },
                            "required": ["path"]
                        }
                    }
                ]
            }
        }
    
    if method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        
        if name == "list_files":
            result = list_files(args.get("path", ""))
        elif name == "write_file":
            result = write_file(args.get("path"), args.get("content"))
        elif name == "read_file":
            result = read_file(args.get("path"))
        else:
            result = "Unknown tool"
        
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "content": [{"type": "text", "text": str(result)}]
            }
        }
    
    return None

if __name__ == "__main__":
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            response = handle(json.loads(line))
            if response:
                print(json.dumps(response), flush=True)
        except Exception as e:
            pass