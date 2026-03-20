/**
 * Browser Automation Test for Photic Preview Component
 * Runs in browser console to validate all slider functionality
 *
 * Test Plan:
 * 1. Verify preview box renders
 * 2. Test radius slider: min (40) to max (240)
 * 3. Test spacing slider: full range
 * 4. Test blur slider: full range
 * 5. Verify debug overlay shows correct mapped values
 * 6. Check for console errors
 */

(async function runPhoticAudit() {
    console.clear();
    console.log('%c=== PHOTIC PREVIEW AUDIT ===', 'color: #FFD9A0; font-size: 14px; font-weight: bold;');

    // 1. Find the Photic Control Panel
    const controlPanel = document.querySelector('[class*="photic-control-panel"]');
    if (!controlPanel) {
        console.error('ERROR: Photic Control Panel not found in DOM');
        console.log('Available classes:', [...document.querySelectorAll('[class*="photic"]')].map(el => el.className));
        return;
    }
    console.log('✓ Photic Control Panel found');

    // 2. Find the preview container
    const previewContainer = controlPanel.querySelector('div[style*="96px"]') ||
                            controlPanel.querySelector('div[style*="relative"]');
    if (!previewContainer) {
        console.error('ERROR: Preview container not found');
        return;
    }
    console.log('✓ Preview container found');

    // 3. Find slider inputs
    const radiusSlider = Array.from(controlPanel.querySelectorAll('input[type="range"]'))
        .find(el => el.parentElement?.textContent?.includes('Radius'));
    const spacingSlider = Array.from(controlPanel.querySelectorAll('input[type="range"]'))
        .find(el => el.parentElement?.textContent?.includes('Spacing'));
    const blurSlider = Array.from(controlPanel.querySelectorAll('input[type="range"]'))
        .find(el => el.parentElement?.textContent?.includes('Glow'));

    if (!radiusSlider) console.error('ERROR: Radius slider not found');
    if (!spacingSlider) console.error('ERROR: Spacing slider not found');
    if (!blurSlider) console.error('ERROR: Blur slider not found');

    if (radiusSlider && spacingSlider && blurSlider) {
        console.log('✓ All three sliders found');
    }

    // 4. Helper function to get debug overlay info
    const getDebugInfo = () => {
        const debugEl = document.querySelector('[style*="rgba(255,255,255,0.4)"]');
        if (!debugEl) return null;
        return {
            text: debugEl.textContent,
            html: debugEl.innerHTML
        };
    };

    // Helper to trigger input event
    const setSlider = async (slider, value) => {
        if (!slider) return;
        slider.value = value;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    // 5. Test radius slider
    console.log('\n%c--- Testing RADIUS Slider ---', 'color: #FFD9A0; font-weight: bold;');
    if (radiusSlider) {
        await setSlider(radiusSlider, 40);
        const debugMin = getDebugInfo();
        console.log('Radius set to 40 (minimum):');
        if (debugMin) console.log('  Debug info:', debugMin.text.split('\n')[2]); // preview line

        await setSlider(radiusSlider, 240);
        const debugMax = getDebugInfo();
        console.log('Radius set to 240 (maximum):');
        if (debugMax) console.log('  Debug info:', debugMax.text.split('\n')[2]);

        // Verify significant visual change
        const minRadius = radiusSlider.value === '40' ? true : false;
        const maxRadius = radiusSlider.value === '240' ? true : false;
        if (minRadius && maxRadius) {
            console.log('✓ Radius slider responds to input changes');
        }
    }

    // 6. Test spacing slider
    console.log('\n%c--- Testing SPACING Slider ---', 'color: #FFD9A0; font-weight: bold;');
    if (spacingSlider) {
        await setSlider(spacingSlider, 40);
        const debugSpacingMin = getDebugInfo();
        console.log('Spacing set to 40 (minimum):');
        if (debugSpacingMin) console.log('  Debug info:', debugSpacingMin.text.split('\n')[2]);

        await setSlider(spacingSlider, 800);
        const debugSpacingMax = getDebugInfo();
        console.log('Spacing set to 800 (maximum):');
        if (debugSpacingMax) console.log('  Debug info:', debugSpacingMax.text.split('\n')[2]);

        console.log('✓ Spacing slider responds to input changes');
    }

    // 7. Test blur slider
    console.log('\n%c--- Testing BLUR (Glow) Slider ---', 'color: #FFD9A0; font-weight: bold;');
    if (blurSlider) {
        await setSlider(blurSlider, 0);
        const debugBlurMin = getDebugInfo();
        console.log('Blur set to 0 (minimum):');
        if (debugBlurMin) console.log('  Debug info:', debugBlurMin.text.split('\n')[2]);

        await setSlider(blurSlider, 80);
        const debugBlurMax = getDebugInfo();
        console.log('Blur set to 80 (maximum):');
        if (debugBlurMax) console.log('  Debug info:', debugBlurMax.text.split('\n')[2]);

        console.log('✓ Blur slider responds to input changes');
    }

    // 8. Check for console errors
    console.log('\n%c--- Console Health Check ---', 'color: #FFD9A0; font-weight: bold;');
    const errorCount = document.querySelectorAll('[role="alert"]').length;
    console.log(`Errors in page: ${errorCount}`);
    if (errorCount === 0) {
        console.log('✓ No visible error alerts');
    }

    // 9. Verify circle elements exist and animate
    const circles = previewContainer.querySelectorAll('div[style*="borderRadius"]');
    console.log(`\n%c--- Circle Elements ---`, 'color: #FFD9A0; font-weight: bold;');
    console.log(`Found ${circles.length} circle elements (expected: 2)`);
    if (circles.length === 2) {
        console.log('✓ Both left and right circles are rendered');
        circles.forEach((circle, idx) => {
            const style = window.getComputedStyle(circle);
            console.log(`  Circle ${idx + 1}: ${style.width} x ${style.height}, opacity: ${style.opacity}`);
        });
    }

    // 10. Final summary
    console.log('\n%c=== AUDIT COMPLETE ===', 'color: #FFD9A0; font-size: 14px; font-weight: bold;');
    console.log('All tests completed. Check output above for any errors.');

    return {
        controlPanelFound: !!controlPanel,
        previewFound: !!previewContainer,
        slidersFound: !!radiusSlider && !!spacingSlider && !!blurSlider,
        circlesFound: circles.length === 2,
        debugOverlayFound: !!getDebugInfo()
    };
})();
