import os
from PIL import Image
import numpy as np

def get_alpha_mask(filepath, threshold=10):
    try:
        img = Image.open(filepath).convert('RGBA')
        # Resize to small dimension for speed and slight fuzziness tolerance
        img = img.resize((256, 256)) 
        alpha = np.array(img.split()[-1])
        # Binary mask
        return alpha > threshold
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def compare_silhouettes(stage, path):
    base_dir = "public/avatars"
    
    ekagrata_path = os.path.join(base_dir, f"{stage}_{path}_ekagrata.png")
    sahaja_path = os.path.join(base_dir, f"{stage}_{path}_sahaja.png")
    vigilance_path = os.path.join(base_dir, f"{stage}_{path}_vigilance.png")
    
    mask_e = get_alpha_mask(ekagrata_path)
    mask_s = get_alpha_mask(sahaja_path)
    mask_v = get_alpha_mask(vigilance_path)
    
    if mask_e is None or mask_s is None or mask_v is None:
        return f"{stage} {path}: MISSING FILES"
    
    # Compare Ekagrata vs Sahaja
    diff_s = np.sum(npm.abs(mask_e.astype(int) - mask_s.astype(int)))
    total_pixels_s = np.sum(mask_e) + np.sum(mask_s)
    # IoU-ish metric: 0 is perfect match (if using difference), 
    # but let's just use % differing pixels relative to object size
    
    # Simple overlap
    intersection_s = np.logical_and(mask_e, mask_s).sum()
    union_s = np.logical_or(mask_e, mask_s).sum()
    iou_s = intersection_s / union_s if union_s > 0 else 0
    
    intersection_v = np.logical_and(mask_e, mask_v).sum()
    union_v = np.logical_or(mask_e, mask_v).sum()
    iou_v = intersection_v / union_v if union_v > 0 else 0
    
    return {
        "stage": stage,
        "path": path,
        "sahaja_iou": iou_s,
        "vigilance_iou": iou_v,
        "verdict": "PASS" if iou_s > 0.85 and iou_v > 0.85 else "FAIL"
    }

import numpy as npm

results = []
stages = ['seedling', 'ember', 'flame', 'beacon', 'stellar']
paths = ['jnana', 'sakshi', 'soma', 'prana'] # The ones we fixed

print(f"{'STAGE':<10} {'PATH':<10} {'SAHAJA IoU':<12} {'VIGILANCE IoU':<12} {'VERDICT'}")
print("-" * 60)

for s in stages:
    for p in paths:
        res = compare_silhouettes(s, p)
        if isinstance(res, str):
            print(res)
        else:
            print(f"{res['stage']:<10} {res['path']:<10} {res['sahaja_iou']:.4f}       {res['vigilance_iou']:.4f}        {res['verdict']}")

