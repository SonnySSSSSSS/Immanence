import urllib.request
import json
import uuid

def queue_test(n=5):
    for i in range(n):
        prompt = {
            "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "z-image-turbo-fp8-aio.safetensors"}},
            "6": {"class_type": "CLIPTextEncode", "inputs": {"text": f"test {i}", "clip": ["4", 1]}},
            "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "text", "clip": ["4", 1]}},
            "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512, "batch_size": 1}},
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": int(uuid.uuid4().int % (2**32)),
                    "steps": 4, "cfg": 1.0, "sampler_name": "euler_ancestral", "scheduler": "simple", "denoise": 1,
                    "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]
                }
            },
            "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
            "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "TestBatch", "images": ["8", 0]}}
        }
        data = json.dumps({"prompt": prompt}).encode('utf-8')
        req = urllib.request.Request("http://127.0.0.1:8188/prompt", data=data)
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            print(f"Queued {i}: {res.get('prompt_id')}")

if __name__ == "__main__":
    queue_test()
