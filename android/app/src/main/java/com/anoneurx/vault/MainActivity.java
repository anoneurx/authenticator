package com.anoneurx.vault;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Hardware back button handling is delegated to the web layer
    // (Capacitor "backButton" event -> @capacitor/app listener in __root.tsx),
    // which closes open overlays/dialogs, steps back through in-app router
    // history, and only exits the app at the root screen.
}
