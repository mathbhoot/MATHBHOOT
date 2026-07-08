(function () {
    const AUDIO_VOLUME = 0.75;
    const USER_UNLOCK_EVENTS = ['click', 'touchstart', 'keydown', 'pointerdown'];
    const START_RETRY_DELAYS = [120, 350, 700, 1000];

    function initBookToggleSound() {
        const bookToggle = document.getElementById('mobile-book-toggle');
        const bookAudio = document.getElementById('fur-elise-audio');

        if (!bookAudio) {
            return;
        }

        let hasStoppedForBook = false;

        bookAudio.volume = AUDIO_VOLUME;
        bookAudio.loop = true;
        bookAudio.preload = 'auto';
        bookAudio.load();

        const tryStartAudio = () => {
            if (hasStoppedForBook || !bookAudio.paused) {
                return;
            }

            const playback = bookAudio.play();

            if (playback && typeof playback.catch === 'function') {
                playback.catch(() => {
                    listenForUserAudioUnlock();
                });
            }
        };

        const removeUserAudioUnlock = () => {
            USER_UNLOCK_EVENTS.forEach((eventName) => {
                document.removeEventListener(eventName, tryStartAudio);
            });
        };

        const listenForUserAudioUnlock = () => {
            USER_UNLOCK_EVENTS.forEach((eventName) => {
                document.addEventListener(eventName, tryStartAudio, { once: true });
            });
        };

        const queueLandingStartAttempts = () => {
            tryStartAudio();
            START_RETRY_DELAYS.forEach((delay) => {
                window.setTimeout(tryStartAudio, delay);
            });
        };

        bookAudio.addEventListener('loadeddata', tryStartAudio, { once: true });
        bookAudio.addEventListener('canplay', tryStartAudio, { once: true });

        if (bookToggle) {
            bookToggle.addEventListener('click', () => {
                hasStoppedForBook = true;
                removeUserAudioUnlock();
                bookAudio.pause();
                bookAudio.currentTime = 0;
            });
        }

        window.addEventListener('pagehide', () => {
            hasStoppedForBook = true;
            bookAudio.pause();
        });

        queueLandingStartAttempts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBookToggleSound);
        return;
    }

    initBookToggleSound();
}());
