/**
 * Anoneurx Notification Bridge.
 *
 * Two distinct channels:
 *  - `toast`      : in-app sonner toasts only (never reach the device notification center).
 *  - `notifySystem`: pushes a real device notification via Capacitor Local Notifications
 *                    (Android/iOS) or the Web Notifications API, when the user has opted in.
 *                    Used only for lock / unlock / TOTP-copy events.
 */
import { Capacitor } from "@capacitor/core";
import { toast as sonner } from "sonner";

const PREF_KEY = "anoneurx.systemNotifications";

type ToastData = { description?: string };

export function systemNotificationsSupported(): boolean {
  return typeof window !== "undefined" && ("Notification" in window || Capacitor.isNativePlatform());
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (Capacitor.isNativePlatform()) return "default";
  return systemNotificationsSupported() ? Notification.permission : "unsupported";
}

function prefEnabled(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) === "on";
  } catch {
    return false;
  }
}

export function systemNotificationsActive(): boolean {
  if (Capacitor.isNativePlatform()) return prefEnabled();
  return systemNotificationsSupported() && prefEnabled() && Notification.permission === "granted";
}

/** Requests permission via Capacitor (native) or Web Notifications API. */
export async function enableSystemNotifications(): Promise<boolean> {
  if (!systemNotificationsSupported()) return false;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== "granted") return false;
      window.localStorage.setItem(PREF_KEY, "on");
      return true;
    } catch {
      return false;
    }
  }

  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return false;
    }
  }
  if (permission !== "granted") return false;
  try {
    window.localStorage.setItem(PREF_KEY, "on");
  } catch {
    // Preference not persisted
  }
  return true;
}

export function disableSystemNotifications(): void {
  try {
    window.localStorage.setItem(PREF_KEY, "off");
  } catch {
    // Ignore
  }
}

async function showNativeNotification(title: string, description?: string, kind = "default"): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body: description ?? "",
          id: Math.floor(Date.now() / 1000) % 2147483647,
          smallIcon: "ic_stat_notification",
          largeIcon: "ic_notification_large",
        },
      ],
    });
    return result.notifications.length > 0;
  } catch {
    return false;
  }
}

async function showWebNotification(title: string, description?: string, kind = "default"): Promise<boolean> {
  if (Capacitor.isNativePlatform()) return false;
  const options: NotificationOptions = {
    ...(description !== undefined ? { body: description } : {}),
    icon: "/favicon.ico",
    tag: `anoneurx-${kind}`,
  };
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Send a real device notification (lock / unlock / TOTP copy only).
 * Silently no-ops if system notifications are not active.
 */
export function notifySystem(title: string, description?: string, kind = "default"): void {
  if (!systemNotificationsActive()) return;
  if (Capacitor.isNativePlatform()) {
    void showNativeNotification(title, description, kind);
  } else {
    void showWebNotification(title, description, kind);
  }
}

/** In-app sonner toast — never triggers a device notification. */
export const toast = {
  success: (title: string, data?: ToastData) => void sonner.success(title, data),
  error: (title: string, data?: ToastData) => void sonner.error(title, data),
  info: (title: string, data?: ToastData) => void sonner.info(title, data),
  warning: (title: string, data?: ToastData) => void sonner.warning(title, data),
  message: sonner.message.bind(sonner),
  loading: sonner.loading.bind(sonner),
  promise: sonner.promise.bind(sonner),
  dismiss: sonner.dismiss.bind(sonner),
};

export default toast;
