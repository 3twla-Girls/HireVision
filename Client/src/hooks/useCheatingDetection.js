import { useEffect } from "react";

const API_URL = `${import.meta.env.VITE_BASEURL}/cheating/log`;

export default function useTabCheatingDetection(sessionId) {
    // console.log("api url",API_URL);
    const logEvent = async (eventType) => {
        try {
            await fetch(API_URL, {
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