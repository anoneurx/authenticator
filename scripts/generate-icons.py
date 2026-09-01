"""
Generate all app icons from src/assets/logo.png.
Replaces PWA icons in public/ and Android mipmap launcher icons.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "src", "assets", "logo.png")

img = Image.open(LOGO).convert("RGBA")
print(f"Source logo: {img.size[0]}x{img.size[1]} {img.mode}")

# ── PWA icons (public/) ──────────────────────────────────────────────────────
pwa_icons = {
    "icon-512x512.png": 512,
    "icon-192x192.png": 192,
    "apple-touch-icon.png": 180,
}

for name, size in pwa_icons.items():
    out = os.path.join(ROOT, "public", name)
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(out, "PNG")
    print(f"  ✓ public/{name}  ({size}x{size})")

# favicon.ico – multi-size ICO
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
ico_path = os.path.join(ROOT, "public", "favicon.ico")
ico_images = [img.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_images[0].save(ico_path, format="ICO", sizes=ico_sizes)
print(f"  ✓ public/favicon.ico  (multi-size)")

# ── Android mipmap launcher icons ────────────────────────────────────────────
# Standard Android density → pixel size mapping
android_densities = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Foreground icons are 108dp (with safe zone padding built in by Android)
android_fg_densities = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}

res_dir = os.path.join(ROOT, "android", "app", "src", "main", "res")

for density, size in android_densities.items():
    folder = os.path.join(res_dir, density)
    if not os.path.isdir(folder):
        continue

    # ic_launcher.png – standard square icon
    launcher = img.resize((size, size), Image.LANCZOS)
    launcher.save(os.path.join(folder, "ic_launcher.png"), "PNG")

    # ic_launcher_round.png – same image, Android clips to circle
    launcher.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")

    print(f"  ✓ {density}/ic_launcher.png + ic_launcher_round.png  ({size}x{size})")

for density, size in android_fg_densities.items():
    folder = os.path.join(res_dir, density)
    if not os.path.isdir(folder):
        continue

    # ic_launcher_foreground.png – logo centered on transparent canvas with padding
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Place logo in inner 66% (safe zone)
    inner = int(size * 0.66)
    logo_resized = img.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(logo_resized, (offset, offset), logo_resized)
    canvas.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")

    print(f"  ✓ {density}/ic_launcher_foreground.png  ({size}x{size})")

print("\n✅ All icons generated from src/assets/logo.png")
