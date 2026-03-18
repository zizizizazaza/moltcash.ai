package com.lokacash.app;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Ensure content does NOT go behind the status bar
        WindowCompat.setDecorFitsSystemWindows(window, true);

        // White status bar background with dark icons
        window.setStatusBarColor(0xFFFFFFFF);
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
        controller.setAppearanceLightStatusBars(true);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Disable WebView scrollbars so they don't reserve layout space
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }
}
