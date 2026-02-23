import { Jimp } from 'jimp';

async function cropImages() {
    try {
        console.log("Reading barber_portrait.png...");
        const portrait = await Jimp.read('public/barber_portrait.png');
        const pW = portrait.bitmap.width;
        const pH = portrait.bitmap.height;
        console.log(`Portrait Original: ${pW}x${pH}`);

        const pCropX = Math.floor(pW * 0.35);
        const pCropY = Math.floor(pH * 0.05);
        const pCropW = Math.floor(pW * 0.65); // make sure it matches the width remainder
        const pCropH = Math.floor(pH * 0.65);

        portrait.crop({ x: pCropX, y: pCropY, w: pCropW, h: pCropH });
        await portrait.write('public/barber_portrait.png');
        console.log("Saved cropped barber_portrait.png");

        console.log("Reading barber_action.png...");
        const action = await Jimp.read('public/barber_action.png');
        const aW = action.bitmap.width;
        const aH = action.bitmap.height;
        console.log(`Action Original: ${aW}x${aH}`);

        const aCropX = Math.floor(aW * 0.35);
        const aCropY = Math.floor(aH * 0.20);
        const aCropW = Math.floor(aW * 0.65);
        const aCropH = Math.floor(aH * 0.80);

        action.crop({ x: aCropX, y: aCropY, w: aCropW, h: aCropH });
        await action.write('public/barber_action.png');
        console.log("Saved cropped barber_action.png");

        console.log("Done.");
    } catch (e) {
        console.error(e);
    }
}
cropImages();
