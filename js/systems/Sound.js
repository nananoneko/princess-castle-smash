/**
 * 音效管理系统
 * 使用 Web Audio API 合成音效（无需外部文件）
 * Safari 兼容：AudioContext 必须在用户手势的同步调用栈内创建
 */

class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.isEnabled = true;
        this.volume = 0.8;
    }

    init() {}

    /**
     * 尝试创建/恢复 AudioContext（必须在用户手势事件中同步调用）
     */
    _tryUnlock() {
        if (!this.isEnabled) return;

        try {
            if (!this.audioCtx) {
                // Safari 需要 webkitAudioContext
                const AC = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AC();

                // Safari 解锁技巧：播放一个静音 buffer
                const buf = this.audioCtx.createBuffer(1, 1, 22050);
                const src = this.audioCtx.createBufferSource();
                src.buffer = buf;
                src.connect(this.audioCtx.destination);
                src.start(0);
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        } catch (e) {
            console.warn('Audio init failed:', e);
            this.isEnabled = false;
        }
    }

    resume() {
        this._tryUnlock();
    }

    /**
     * 播放发射音效
     */
    playShootSound() {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
            osc.type = 'sine';

            gain.gain.setValueAtTime(this.volume, t);
            gain.gain.linearRampToValueAtTime(this.volume * 0.8, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.start(t);
            osc.stop(t + 0.4);
        } catch (e) {
            console.warn('playShootSound error:', e);
        }
    }

    /**
     * 播放击中音效
     */
    playHitSound(type = 'wood') {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const configs = {
                'wood':  { freq: 300, wave: 'square',   dur: 0.2 },
                'stone': { freq: 200, wave: 'square',   dur: 0.25 },
                'glass': { freq: 800, wave: 'sine',     dur: 0.3 },
                'gold':  { freq: 500, wave: 'triangle', dur: 0.4 }
            };
            const c = configs[type] || configs['wood'];

            osc.frequency.setValueAtTime(c.freq, t);
            osc.frequency.exponentialRampToValueAtTime(c.freq / 2, t + c.dur);
            osc.type = c.wave;

            gain.gain.setValueAtTime(this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + c.dur);

            osc.start(t);
            osc.stop(t + c.dur);
        } catch (e) {
            console.warn('playHitSound error:', e);
        }
    }

    /**
     * 播放破碎音效
     */
    playBreakSound(type = 'wood') {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            const dur = 0.4;
            const bufSize = Math.floor(this.audioCtx.sampleRate * dur);
            const buffer = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = type === 'glass' ? 2000 : 800;
            filter.Q.value = 1;

            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            noise.start(t);
            noise.stop(t + dur);

            // Tonal layer
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();
            osc.connect(oscGain);
            oscGain.connect(this.audioCtx.destination);

            osc.frequency.setValueAtTime(type === 'glass' ? 1200 : 250, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
            osc.type = 'sawtooth';

            oscGain.gain.setValueAtTime(this.volume * 0.5, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.start(t);
            osc.stop(t + 0.3);
        } catch (e) {
            console.warn('playBreakSound error:', e);
        }
    }

    /**
     * 播放倒塌音效
     */
    playCrashSound() {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            for (let i = 0; i < 5; i++) {
                const off = i * 0.06;
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.frequency.setValueAtTime(100 + Math.random() * 200, t + off);
                osc.frequency.exponentialRampToValueAtTime(50, t + off + 0.5);
                osc.type = 'sawtooth';

                gain.gain.setValueAtTime(this.volume * 0.6, t + off);
                gain.gain.exponentialRampToValueAtTime(0.01, t + off + 0.5);

                osc.start(t + off);
                osc.stop(t + off + 0.5);
            }
        } catch (e) {
            console.warn('playCrashSound error:', e);
        }
    }

    /**
     * 播放胜利音效
     */
    playVictorySound() {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];

            notes.forEach((freq, i) => {
                const off = i * 0.15;
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.frequency.setValueAtTime(freq, t + off);
                osc.type = 'triangle';

                gain.gain.setValueAtTime(this.volume * 0.7, t + off);
                gain.gain.exponentialRampToValueAtTime(0.01, t + off + 1.2);

                osc.start(t + off);
                osc.stop(t + off + 1.2);
            });
        } catch (e) {
            console.warn('playVictorySound error:', e);
        }
    }

    /**
     * 播放星星收集音效
     */
    playStarSound() {
        this._tryUnlock();
        if (!this.audioCtx) return;

        try {
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.frequency.setValueAtTime(1046.50, t);
            osc.frequency.exponentialRampToValueAtTime(1567.98, t + 0.3);
            osc.type = 'sine';

            gain.gain.setValueAtTime(this.volume * 0.6, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.start(t);
            osc.stop(t + 0.5);
        } catch (e) {
            console.warn('playStarSound error:', e);
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
}
