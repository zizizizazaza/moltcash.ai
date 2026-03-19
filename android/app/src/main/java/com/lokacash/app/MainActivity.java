package com.lokacash.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.CookieManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERMISSION_CODE = 1001;

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
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String url = data.toString();
            if (url.startsWith("https://www.loka.cash")) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    // Pass OAuth params to app's WebView
                    String query = data.getQuery();
                    if (query != null && query.contains("privy_oauth")) {
                        webView.loadUrl("https://localhost/?" + query);
                    }
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

            // Handle WebView permission requests (microphone, camera, etc.)
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            // Check if we have the Android-level audio permission
                            if (ContextCompat.checkSelfPermission(MainActivity.this,
                                    Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                request.grant(request.getResources());
                            } else {
                                ActivityCompat.requestPermissions(MainActivity.this,
                                        new String[]{Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION_CODE);
                                // Grant after request (the dialog will show)
                                request.grant(request.getResources());
                            }
                            return;
                        }
                    }
                    request.deny();
                }
            });
        }
    }
}
