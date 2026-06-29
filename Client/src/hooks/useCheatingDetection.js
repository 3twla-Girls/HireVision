import { useEffect } from "react";

const API_URL = `${import.meta.env.VITE_BASEURL}/cheating/log`;

export default function useTabCheatingDetection(sessionId) {
    const logEvent = async (eventType) => {
        // Without a valid session id the backend returns 404 ("Session not found")
        // and the event is dropped. Surface this instead of failing silently.
        if (!sessionId) {
            console.warn(`⚠️ Tab proctoring: no sessionId — "${eventType}" not logged`);
            return;
        }
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    event_type: eventType,
                    timestamp: new Date().toISOString()
                }),
            });
            // fetch only rejects on network errors, NOT on 4xx/5xx — check explicitly.
            if (!res.ok) {
                const detail = await res.text().catch(() => "");
                console.error(`❌ Cheating log "${eventType}" failed: ${res.status} ${detail}`);
            }
        } catch (err) {
            console.error("Cheating log failed:", err);
        }
    };

    useEffect(() => {

        // TAB SWITCH
        const handleVisibility = () => {
            if (document.hidden) {
                logEvent("TAB_SWITCH");
            }
        };

        // WINDOW FOCUS
        const handleBlur = () => logEvent("WINDOW_BLUR");
        const handleFocus = () => logEvent("WINDOW_FOCUS");

        // FULLSCREEN EXIT
        const handleFullscreen = () => {
            if (!document.fullscreenElement) {
                logEvent("EXIT_FULLSCREEN");
                alert("Exiting fullscreen is not allowed!");
            }
        };

        // COPY / PASTE
        const handleCopy = (e) => {
            e.preventDefault();
            logEvent("COPY_ATTEMPT");
        };

        const handlePaste = (e) => {
            e.preventDefault();
            logEvent("PASTE_ATTEMPT");
        };

        // SHORTCUTS
        const handleKeyDown = (e) => {
            if (e.ctrlKey && ["c", "v", "u"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                logEvent("SHORTCUT_BLOCKED");
            }
        };

        // RIGHT CLICK
        const handleRightClick = (e) => e.preventDefault();

        // ADD LISTENERS
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("fullscreenchange", handleFullscreen);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleRightClick);

        // CLEANUP (VERY IMPORTANT)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("fullscreenchange", handleFullscreen);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleRightClick);
        };

    }, [sessionId]);
}