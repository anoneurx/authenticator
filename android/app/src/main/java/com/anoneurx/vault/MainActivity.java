package com.anoneurx.vault;

import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }
    // Hardware back button handling is delegated to the web layer
    // (Capacitor "backButton" event -> @capacitor/app listener in __root.tsx),
    // which closes open overlays/dialogs, steps back through in-app router
    // history, and only exits the app at the root screen.
}
