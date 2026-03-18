package com.lokacash.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.CookieManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setStatusBarColor(0xFFFFFFFF);
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
        controller.setAppearanceLightStatusBars(true);

        // Handle deep link on initial launch
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Handle deep link when app is already running (singleTask)
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String url = data.toString();
            // OAuth redirect from system browser: https://localhost/?privy_oauth_state=...
            if (url.startsWith("https://localhost")) {
                // Load the OAuth callback URL in the WebView
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.loadUrl(url);
                }
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            // Remove WebView identifier so Google OAuth doesn't block us
            String ua = settings.getUserAgentString();
            if (ua != null && ua.contains("; wv")) {
                ua = ua.replace("; wv", "");
                settings.setUserAgentString(ua);
            }

            // Enable third-party cookies for OAuth
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
    }
}
