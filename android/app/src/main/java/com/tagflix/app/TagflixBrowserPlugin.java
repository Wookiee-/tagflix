package com.tagflix.app;

import android.graphics.Color;
import android.net.Uri;

import androidx.browser.customtabs.CustomTabsIntent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Opens a Chrome Custom Tab in immersive fullscreen mode.
 * Runs inside Chrome itself, so hardware-accelerated video is automatic.
 * Immersive mode hides the status + navigation bars for true fullscreen playback.
 */
@CapacitorPlugin(name = "TagflixBrowser")
public class TagflixBrowserPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }

        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setShowTitle(true);
        builder.setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK);

        String toolbarColor = call.getString("toolbarColor");
        if (toolbarColor != null) {
            try {
                builder.setToolbarColor(Color.parseColor(toolbarColor));
            } catch (IllegalArgumentException ignored) {
                // invalid color string — keep default
            }
        }

        CustomTabsIntent tabsIntent = builder.build();

        // Immersive fullscreen: hide status + navigation bars so the video
        // fills the entire screen. Pressing Back restores the bars and returns
        // to Tagflix (appStateChange fires in JS).
        // (The constant was dropped from androidx.browser, so we use the raw
        //  key that Chrome reads — harmless if a Chrome version ignores it.)
        tabsIntent.intent.putExtra("androidx.browser.customtabs.extra.ENABLE_IMMERSIVE_MODE", true);
        // Fallback: auto-hide the URL bar on scroll
        tabsIntent.intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, true);

        tabsIntent.launchUrl(getContext(), Uri.parse(url));

        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }
}
