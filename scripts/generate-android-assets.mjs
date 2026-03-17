/**
 * Generate Android app icons and splash screens from source images.
 * Usage: node scripts/generate-android-assets.mjs
 */
import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const ANDROID_RES = './android/app/src/main/res';
const ICON_SRC = 'C:/Users/A/.gemini/antigravity/brain/1ce45a59-2a97-4153-ad57-3b4fb730981d/loka_app_icon_1773732636956.png';
const SPLASH_SRC = 'C:/Users/A/.gemini/antigravity/brain/1ce45a59-2a97-4153-ad57-3b4fb730981d/loka_splash_screen_1773732652822.png';

// Android icon sizes (density → pixel size)
const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground icon (slightly larger for adaptive icon, 108dp base with safe zone)
const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Splash screen sizes (portrait: width × height)
const SPLASH_PORT_SIZES = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
};

// Splash screen sizes (landscape: width × height)
const SPLASH_LAND_SIZES = {
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
};

async function generateIcons() {
  console.log('Generating app icons...');
  for (const [dir, size] of Object.entries(ICON_SIZES)) {
    const outDir = join(ANDROID_RES, dir);
    mkdirSync(outDir, { recursive: true });

    // ic_launcher.png
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(outDir, 'ic_launcher.png'));

    // ic_launcher_round.png (same image, OS applies circle mask)
    await sharp(ICON_SRC)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (for adaptive icons)
    const fgSize = FOREGROUND_SIZES[dir];
    await sharp(ICON_SRC)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(outDir, 'ic_launcher_foreground.png'));

    console.log(`  ✓ ${dir} (${size}px icon, ${fgSize}px foreground)`);
  }
}

async function generateSplashScreens() {
  console.log('Generating splash screens...');

  // Default drawable splash
  await sharp(SPLASH_SRC)
    .resize(480, 480, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(ANDROID_RES, 'drawable', 'splash.png'));
  console.log('  ✓ drawable/splash.png');

  // Portrait splash screens
  for (const [dir, [w, h]] of Object.entries(SPLASH_PORT_SIZES)) {
    const outDir = join(ANDROID_RES, dir);
    mkdirSync(outDir, { recursive: true });
    await sharp(SPLASH_SRC)
      .resize(w, h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'splash.png'));
    console.log(`  ✓ ${dir} (${w}×${h})`);
  }

  // Landscape splash screens
  for (const [dir, [w, h]] of Object.entries(SPLASH_LAND_SIZES)) {
    const outDir = join(ANDROID_RES, dir);
    mkdirSync(outDir, { recursive: true });
    await sharp(SPLASH_SRC)
      .resize(w, h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'splash.png'));
    console.log(`  ✓ ${dir} (${w}×${h})`);
  }
}

async function main() {
  await generateIcons();
  await generateSplashScreens();
  console.log('\n✅ All Android assets generated successfully!');
}

main().catch(console.error);
