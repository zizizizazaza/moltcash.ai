package com.lokacash.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.CookieManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_CODE = 1001;
    private Uri pendingOAuthUri = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setStatusBarColor(0xFFFFFFFF);
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
        controller.setAppearanceLightStatusBars(true);

        // Pre-request microphone permission on app start
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION_CODE);
        }

        // Save deep link for later — WebView isn't ready yet in onCreate
        Intent intent = getIntent();
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            Uri data = intent.getData();
            String query = data.getQuery();
            if (query != null && query.contains("privy_oauth")) {
                pendingOAuthUri = data;
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String url = data.toString();
            if (url.startsWith("https://www.loka.cash")) {
                String query = data.getQuery();
                if (query != null && query.contains("privy_oauth")) {
                    loadOAuthIntoWebView(query);
                }
            }
        }
    }

    private void loadOAuthIntoWebView(String query) {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.loadUrl("https://localhost/?" + query);
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
            settings.setMediaPlaybackRequiresUserGesture(false);

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

            // Process pending OAuth deep link (from cold start)
            if (pendingOAuthUri != null) {
                final String query = pendingOAuthUri.getQuery();
                pendingOAuthUri = null;
                // Delay to ensure Capacitor's web app has fully loaded
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    WebView wv = getBridge().getWebView();
                    if (wv != null && query != null) {
                        wv.loadUrl("https://localhost/?" + query);
                    }
                }, 1500);
            }

            // NOTE: Do NOT set a custom WebChromeClient here.
            // Capacitor's BridgeWebChromeClient already handles WebView permission
            // requests (microphone, camera) via onPermissionRequest.
            // Overriding it breaks Capacitor's bridge and getUserMedia.
        }
    }
}

