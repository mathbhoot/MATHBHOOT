(function () {
    'use strict';

    const configUrl = new URL('read-aloud.config.json', document.currentScript.src);

    const fallbackConfig = {
        targetSelector: '[data-read-aloud-content]',
        controlsSelector: '[data-read-aloud-controls]',
        statusSelector: '[data-read-aloud-status]',
        playSelector: '[data-read-aloud-play]',
        pauseSelector: '[data-read-aloud-pause]',
        stopSelector: '[data-read-aloud-stop]',
        voiceSelector: '[data-read-aloud-voice]',
        speedSelector: '[data-read-aloud-speed]',
        defaultVoiceProfile: 'ana-natural',
        voiceProfiles: {
            'ana-natural': {
                label: 'Ana Natural - US English',
                langs: ['en-US'],
                preferredNames: ['Microsoft Ana Online', 'Microsoft Ana', 'Ana'],
                fallbackPreferredNames: ['Microsoft Aria', 'Aria', 'Zira'],
                fallbackLangs: ['en-US']
            },
            'us-boy': {
                label: 'Boy Voice - US English',
                langs: ['en-US'],
                preferredNames: ['Microsoft Guy Online', 'Microsoft Guy', 'Guy', 'Microsoft Davis', 'Davis', 'Microsoft Tony', 'Tony', 'Christopher', 'Eric', 'Roger'],
                fallbackPreferredNames: ['Microsoft Ana Online', 'Microsoft Ana', 'Ana'],
                fallbackLangs: ['en-US']
            }
        },
        defaultRate: 0.92,
        pitch: 1.14,
        volume: 1,
        chunkMaxLength: 420,
        labels: {
            play: 'Read aloud',
            resume: 'Resume',
            restart: 'Restart',
            pause: 'Pause',
            stop: 'Stop',
            ready: 'Ready to read this story aloud.',
            loadingVoice: 'Loading voice...',
            playing: 'Reading aloud.',
            paused: 'Paused.',
            stopped: 'Stopped.',
            unsupported: 'Read aloud is not supported in this browser.',
            noText: 'No story text was found for read aloud.',
            noAllowedVoice: 'No allowed US English voice is available in this browser.',
            voicePrefix: 'Voice:'
        }
    };

    const state = {
        config: fallbackConfig,
        chunks: [],
        fullText: '',
        chunkIndex: 0,
        charOffset: 0,
        voice: null,
        voiceProfile: fallbackConfig.defaultVoiceProfile,
        rate: fallbackConfig.defaultRate,
        playbackId: 0,
        currentUtteranceStartedAt: 0,
        currentUtteranceStartOffset: 0,
        currentUtteranceText: '',
        boundaryReceived: false,
        isPlaying: false,
        isPaused: false
    };

    function mergeConfig(config) {
        return {
            ...fallbackConfig,
            ...config,
            labels: {
                ...fallbackConfig.labels,
                ...(config && config.labels ? config.labels : {})
            }
        };
    }

    function cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/â€”/g, '-')
            .replace(/â€“/g, '-')
            .replace(/â€™/g, "'")
            .replace(/â€œ|â€/g, '"')
            .replace(/â€¦/g, '...')
            .replace(/>/g, '')
            .trim();
    }

    function splitIntoChunks(text, maxLength) {
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks = [];
        let current = '';
        let searchOffset = 0;

        sentences.forEach((sentence) => {
            const next = `${current} ${sentence}`.trim();
            if (next.length > maxLength && current) {
                chunks.push({
                    text: current,
                    start: text.indexOf(current, searchOffset)
                });
                searchOffset = chunks[chunks.length - 1].start + current.length;
                current = sentence.trim();
                return;
            }

            current = next;
        });

        if (current) {
            chunks.push({
                text: current,
                start: text.indexOf(current, searchOffset)
            });
        }

        return chunks;
    }

    function getReadableText(target) {
        if (!target) {
            return '';
        }

        const clone = target.cloneNode(true);
        clone.querySelectorAll('script, style, img, button, a[href], [aria-hidden="true"], [data-read-aloud-skip]').forEach((node) => {
            node.remove();
        });

        return cleanText(clone.textContent || '');
    }

    function getVisibleTextNodeOffset(target, clickedNode, clickedOffset) {
        if (!target || !clickedNode) {
            return 0;
        }

        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.textContent || !node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                const parent = node.parentElement;

                if (!parent || parent.closest('script, style, button, a[href], [aria-hidden="true"], [data-read-aloud-skip]')) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let offset = 0;
        let node = walker.nextNode();

        while (node) {
            if (node === clickedNode) {
                return offset + cleanText(node.textContent.slice(0, clickedOffset)).length;
            }

            offset += cleanText(node.textContent).length + 1;
            node = walker.nextNode();
        }

        return 0;
    }

    function getCaretFromPoint(event) {
        if (document.caretPositionFromPoint) {
            const position = document.caretPositionFromPoint(event.clientX, event.clientY);
            return position ? { node: position.offsetNode, offset: position.offset } : null;
        }

        if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(event.clientX, event.clientY);
            return range ? { node: range.startContainer, offset: range.startOffset } : null;
        }

        return null;
    }

    function findChunkByFullTextOffset(offset) {
        const safeOffset = Math.max(0, offset);
        const chunkIndex = state.chunks.findIndex((chunk, index) => {
            const nextChunk = state.chunks[index + 1];
            const end = nextChunk ? nextChunk.start : chunk.start + chunk.text.length;
            return safeOffset >= chunk.start && safeOffset < end;
        });

        if (chunkIndex === -1) {
            return {
                chunkIndex: Math.max(0, state.chunks.length - 1),
                charOffset: 0
            };
        }

        return {
            chunkIndex,
            charOffset: Math.max(0, safeOffset - state.chunks[chunkIndex].start)
        };
    }

    function snapToWordStart(text, offset) {
        let nextOffset = Math.max(0, Math.min(offset, text.length));

        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('en-US', { granularity: 'word' });
            let closestWordOffset = nextOffset;

            for (const segment of segmenter.segment(text)) {
                if (!segment.isWordLike) {
                    continue;
                }

                if (segment.index > nextOffset) {
                    break;
                }

                closestWordOffset = segment.index;
            }

            return closestWordOffset;
        }

        while (nextOffset > 0 && /\S/.test(text.charAt(nextOffset - 1))) {
            nextOffset -= 1;
        }

        return nextOffset;
    }

    function setStatus(elements, message) {
        if (elements.status) {
            elements.status.textContent = message;
        }
    }

    function setButtons(elements) {
        if (elements.play) {
            elements.play.textContent = state.isPaused ? state.config.labels.resume : state.config.labels.play;
            if (!state.isPlaying && state.chunkIndex > 0 && state.chunkIndex >= state.chunks.length) {
                elements.play.textContent = state.config.labels.restart;
            }
        }

        if (elements.pause) {
            elements.pause.disabled = !state.isPlaying || state.isPaused;
        }

        if (elements.stop) {
            elements.stop.disabled = !state.isPlaying && !state.isPaused && state.chunkIndex === 0 && state.charOffset === 0;
        }
    }

    function nextPlaybackId() {
        state.playbackId += 1;
        return state.playbackId;
    }

    function getSelectedProfile(elements) {
        if (elements.voiceSelect && elements.voiceSelect.value) {
            return elements.voiceSelect.value;
        }

        return state.config.defaultVoiceProfile;
    }

    function getSelectedRate(elements) {
        if (!elements.speedSelect || !elements.speedSelect.value) {
            return state.config.defaultRate;
        }

        const selectedRate = Number.parseFloat(elements.speedSelect.value);
        return Number.isFinite(selectedRate) ? selectedRate : state.config.defaultRate;
    }

    function isAllowedEnglishVoice(voice) {
        return voice.lang === 'en-US';
    }

    function findVoiceByLangs(voices, langs) {
        return voices.find((voice) => langs.includes(voice.lang) && isAllowedEnglishVoice(voice)) || null;
    }

    function findVoiceById(voices, voiceId) {
        return voices.find((voice) => {
            const currentId = voice.voiceURI || voice.name;
            return currentId === voiceId && isAllowedEnglishVoice(voice);
        }) || null;
    }

    function findVoiceByName(voices, names, langs) {
        const preferredNames = (names || []).map((name) => name.toLowerCase());

        return voices.find((voice) => {
            const voiceName = voice.name.toLowerCase();
            return isAllowedEnglishVoice(voice)
                && (langs || []).includes(voice.lang)
                && preferredNames.some((name) => voiceName.includes(name));
        }) || null;
    }

    function resolveProfileVoice(profileKey) {
        return chooseVoice(profileKey);
    }

    function updateProfileOptions(elements) {
        if (!elements.voiceSelect) {
            return;
        }

        const options = [...elements.voiceSelect.options].filter((option) => state.config.voiceProfiles[option.value]);

        options.forEach((option) => {
            const hasVoice = Boolean(resolveProfileVoice(option.value));
            option.disabled = !hasVoice;
            option.hidden = !hasVoice;
        });

        if (!elements.voiceSelect.value || elements.voiceSelect.selectedOptions[0]?.disabled) {
            const firstAvailable = [...elements.voiceSelect.options].find((option) => !option.disabled && !option.hidden);

            if (firstAvailable) {
                elements.voiceSelect.value = firstAvailable.value;
            }
        }
    }

    function chooseVoice(profileKey) {
        if (!('speechSynthesis' in window)) {
            return null;
        }

        const voices = window.speechSynthesis.getVoices();

        if (profileKey.startsWith('voice:')) {
            return findVoiceById(voices, profileKey.replace('voice:', ''));
        }

        const profile = state.config.voiceProfiles[profileKey] || state.config.voiceProfiles[state.config.defaultVoiceProfile];

        return findVoiceByName(voices, profile.preferredNames, profile.langs)
            || findVoiceByName(voices, profile.fallbackPreferredNames, profile.fallbackLangs)
            || findVoiceByLangs(voices, profile.langs || [])
            || findVoiceByLangs(voices, profile.fallbackLangs || [])
            || null;
    }

    function estimatePausedOffset() {
        if (state.boundaryReceived || !state.currentUtteranceStartedAt || !state.currentUtteranceText) {
            return;
        }

        const elapsedSeconds = Math.max(0, (Date.now() - state.currentUtteranceStartedAt) / 1000);
        const estimatedCharactersPerSecond = 13 * state.rate;
        const estimatedOffset = state.currentUtteranceStartOffset + Math.floor(elapsedSeconds * estimatedCharactersPerSecond);
        state.charOffset = snapToWordStart(state.currentUtteranceText, estimatedOffset);
    }

    function speakCurrentChunk(elements, playbackId) {
        if (playbackId !== state.playbackId || state.isPaused) {
            return;
        }

        const currentChunk = state.chunks[state.chunkIndex];

        if (!currentChunk || !('speechSynthesis' in window)) {
            state.isPlaying = false;
            state.isPaused = false;
            state.chunkIndex = 0;
            state.charOffset = 0;
            setStatus(elements, state.config.labels.stopped);
            setButtons(elements);
            return;
        }

        state.charOffset = Math.max(0, Math.min(state.charOffset, currentChunk.text.length));

        while (state.charOffset < currentChunk.text.length && /\s/.test(currentChunk.text.charAt(state.charOffset))) {
            state.charOffset += 1;
        }

        if (state.charOffset >= currentChunk.text.length) {
            state.chunkIndex += 1;
            state.charOffset = 0;
            speakCurrentChunk(elements, playbackId);
            return;
        }

        const utteranceStartOffset = state.charOffset;
        state.currentUtteranceStartedAt = Date.now();
        state.currentUtteranceStartOffset = utteranceStartOffset;
        state.currentUtteranceText = currentChunk.text;
        state.boundaryReceived = false;

        const utterance = new SpeechSynthesisUtterance(currentChunk.text.slice(utteranceStartOffset));
        utterance.lang = state.voice ? state.voice.lang : 'en-US';
        utterance.rate = state.rate;
        utterance.pitch = state.config.pitch;
        utterance.volume = state.config.volume;

        if (state.voice) {
            utterance.voice = state.voice;
        }

        utterance.onboundary = function (event) {
            if (playbackId !== state.playbackId || state.isPaused || !state.isPlaying || typeof event.charIndex !== 'number') {
                return;
            }

            state.charOffset = utteranceStartOffset + event.charIndex;
            state.boundaryReceived = true;
        };

        utterance.onend = function () {
            if (playbackId !== state.playbackId || state.isPaused || !state.isPlaying) {
                return;
            }

            state.chunkIndex += 1;
            state.charOffset = 0;

            if (state.chunkIndex < state.chunks.length && state.isPlaying) {
                speakCurrentChunk(elements, playbackId);
                return;
            }

            state.isPlaying = false;
            state.isPaused = false;
            state.chunkIndex = 0;
            state.charOffset = 0;
            setStatus(elements, state.config.labels.stopped);
            setButtons(elements);
        };

        utterance.onerror = function () {
            if (playbackId !== state.playbackId) {
                return;
            }

            state.isPlaying = false;
            state.isPaused = false;
            setStatus(elements, state.config.labels.stopped);
            setButtons(elements);
        };

        window.speechSynthesis.speak(utterance);
    }

    function play(elements) {
        if (!('speechSynthesis' in window)) {
            setStatus(elements, state.config.labels.unsupported);
            return;
        }

        if (state.isPaused) {
            state.isPaused = false;
            state.isPlaying = true;
            const playbackId = nextPlaybackId();
            setStatus(elements, state.config.labels.playing);
            setButtons(elements);
            speakCurrentChunk(elements, playbackId);
            return;
        }

        window.speechSynthesis.cancel();
        const playbackId = nextPlaybackId();
        state.chunkIndex = 0;
        state.charOffset = 0;
        state.voiceProfile = getSelectedProfile(elements);
        state.voice = chooseVoice(state.voiceProfile);
        state.rate = getSelectedRate(elements);

        if (!state.voice) {
            state.isPlaying = false;
            state.isPaused = false;
            setStatus(elements, state.config.labels.noAllowedVoice);
            setButtons(elements);
            return;
        }

        state.isPlaying = true;
        state.isPaused = false;

        const voiceLabel = ` ${state.config.labels.voicePrefix} ${state.voice.name}`;
        setStatus(elements, `${state.config.labels.playing}${voiceLabel}`);
        setButtons(elements);
        speakCurrentChunk(elements, playbackId);
    }

    function pause(elements) {
        if (!('speechSynthesis' in window) || !state.isPlaying) {
            return;
        }

        nextPlaybackId();
        estimatePausedOffset();
        window.speechSynthesis.cancel();
        state.isPaused = true;
        state.isPlaying = false;
        setStatus(elements, state.config.labels.paused);
        setButtons(elements);
    }

    function stop(elements) {
        nextPlaybackId();

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        state.isPlaying = false;
        state.isPaused = false;
        state.chunkIndex = 0;
        state.charOffset = 0;
        setStatus(elements, state.config.labels.stopped);
        setButtons(elements);
    }

    function playFromStoryClick(elements, event) {
        if (!state.isPlaying && !state.isPaused) {
            return;
        }

        const caret = getCaretFromPoint(event);

        if (!caret || !caret.node || !elements.target.contains(caret.node)) {
            return;
        }

        const fullTextOffset = getVisibleTextNodeOffset(elements.target, caret.node, caret.offset);
        const targetPosition = findChunkByFullTextOffset(fullTextOffset);
        const targetChunk = state.chunks[targetPosition.chunkIndex];

        if (!targetChunk) {
            return;
        }

        nextPlaybackId();

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        state.chunkIndex = targetPosition.chunkIndex;
        state.charOffset = snapToWordStart(targetChunk.text, targetPosition.charOffset);
        state.isPaused = false;
        state.isPlaying = true;

        const playbackId = nextPlaybackId();
        setStatus(elements, state.config.labels.playing);
        setButtons(elements);
        speakCurrentChunk(elements, playbackId);
    }

    function init(config) {
        state.config = mergeConfig(config);

        const controls = document.querySelector(state.config.controlsSelector);
        const target = document.querySelector(state.config.targetSelector);
        const elements = {
            controls,
            target,
            status: document.querySelector(state.config.statusSelector),
            play: document.querySelector(state.config.playSelector),
            pause: document.querySelector(state.config.pauseSelector),
            stop: document.querySelector(state.config.stopSelector),
            voiceSelect: document.querySelector(state.config.voiceSelector),
            speedSelect: document.querySelector(state.config.speedSelector)
        };

        if (!controls || !target) {
            return;
        }

        if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
            controls.hidden = false;
            if (elements.play) {
                elements.play.disabled = true;
            }
            setStatus(elements, state.config.labels.unsupported);
            setButtons(elements);
            return;
        }

        state.fullText = getReadableText(target);
        state.chunks = splitIntoChunks(state.fullText, state.config.chunkMaxLength);
        controls.hidden = false;

        if (!state.chunks.length) {
            if (elements.play) {
                elements.play.disabled = true;
            }
            setStatus(elements, state.config.labels.noText);
            setButtons(elements);
            return;
        }

        setStatus(elements, state.config.labels.loadingVoice);

        if (elements.voiceSelect) {
            elements.voiceSelect.value = state.config.defaultVoiceProfile;
        }

        if (elements.speedSelect) {
            elements.speedSelect.value = String(state.config.defaultRate);
        }

        const loadVoice = function () {
            updateProfileOptions(elements);
            state.voiceProfile = getSelectedProfile(elements);
            state.voice = chooseVoice(state.voiceProfile);
            const voiceLabel = state.voice ? ` ${state.config.labels.voicePrefix} ${state.voice.name}` : ` ${state.config.labels.noAllowedVoice}`;
            setStatus(elements, `${state.config.labels.ready}${voiceLabel}`);
            setButtons(elements);
        };

        window.speechSynthesis.onvoiceschanged = loadVoice;
        loadVoice();

        if (elements.play) {
            elements.play.addEventListener('click', function () {
                play(elements);
            });
        }

        if (elements.pause) {
            elements.pause.addEventListener('click', function () {
                pause(elements);
            });
        }

        if (elements.stop) {
            elements.stop.addEventListener('click', function () {
                stop(elements);
            });
        }

        if (elements.voiceSelect) {
            elements.voiceSelect.addEventListener('change', function () {
                if (state.isPlaying || state.isPaused) {
                    stop(elements);
                }
                loadVoice();
            });
        }

        if (elements.speedSelect) {
            elements.speedSelect.addEventListener('change', function () {
                state.rate = getSelectedRate(elements);

                if (state.isPlaying || state.isPaused) {
                    stop(elements);
                }
            });
        }

        target.addEventListener('click', function (event) {
            playFromStoryClick(elements, event);
        });

        window.addEventListener('beforeunload', function () {
            stop(elements);
        });
    }

    function start() {
        fetch(configUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Read aloud config was not loaded.');
                }
                return response.json();
            })
            .then(init)
            .catch(() => init(fallbackConfig));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
