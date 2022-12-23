const sampleURLs = {
  'shoot': 'assets/kretopi__synthguns-004.wav',
  'hit': 'assets/204696__craxic__glass22.flac',
  'battle-theme': 'assets/338817__sirkoto51__rpg-battle-loop-1.opus'
}

const samples = {}

systems.push({
  name: 'audio',
  init (g) {
    const audioCtx = new AudioContext()
    audioCtx.suspend()

    const gainNode = audioCtx.createGain()
    gainNode.connect(audioCtx.destination)

    const oscillator = audioCtx.createOscillator()
    oscillator.type = 'triangle';
    oscillator.start()

    const oscillatorControl = audioCtx.createGain()
    oscillatorControl.connect(gainNode)
    oscillatorControl.gain.value = 0

    oscillator.connect(oscillatorControl)

    async function resume () {
      if (audioCtx.state !== 'running') {
        await audioCtx.resume()

        const resultPromises = Object.entries(sampleURLs).map(([name, url]) => {
          return Promise.all([
            name,
            fetch(url)
            .then(res => res.arrayBuffer())
            .then(buf => audioCtx.decodeAudioData(buf))
          ])
        })

        const results = await Promise.all(resultPromises)

        for (const [name, res] of results) {
          samples[name] = res
        }
      }
    }

    function setVolume (v) {
      gainNode.gain.value = v
    }

    function getFrequency(semitone) {
      return 440 * Math.pow(2, (semitone - 69)/12)
    }

    let timer = null

    const TRANSITION_TIME = 0.2

    function play (tone, length = 1000) {
      oscillator.frequency.setValueAtTime(~~getFrequency(tone), audioCtx.currentTime)

      if (timer) {
        clearTimeout(timer)
      } else {
        oscillatorControl.gain.cancelAndHoldAtTime(audioCtx.currentTime)
        oscillatorControl.gain.linearRampToValueAtTime(1, audioCtx.currentTime + TRANSITION_TIME)
      }

      timer = setTimeout(() => {
        oscillatorControl.gain.cancelAndHoldAtTime(audioCtx.currentTime)
        oscillatorControl.gain.linearRampToValueAtTime(0, audioCtx.currentTime + TRANSITION_TIME)
        timer = null
      }, length)
    }

    function playSound (name) {
      const node = audioCtx.createBufferSource()
      node.connect(gainNode)
      node.buffer = samples[name]
      node.start()

      node.onended = () => node.disconnect(gainNode)
    }

    /**
     * @type {{ audio: AudioBufferSourceNode, gain: GainNode } | null}
     */
    let currentLooping = null

    /**
     * @param {string | null} name
     */
    function playSoundLoop (name) {
      if (currentLooping) {
        const stopping = currentLooping
        currentLooping = null

        stopping.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + TRANSITION_TIME)

        setTimeout(() => {
          stopping.audio.stop()
          stopping.gain.disconnect(gainNode)
        }, TRANSITION_TIME)
      }

      if (name !== null) {
        const node = audioCtx.createBufferSource()
        const mediaGainNode = audioCtx.createGain()

        node.connect(mediaGainNode)
        mediaGainNode.connect(gainNode)

        mediaGainNode.gain.setValueAtTime(0, audioCtx.currentTime)
        mediaGainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + TRANSITION_TIME)

        node.loop = true
        node.buffer = samples[name]
        node.start()

        currentLooping = {
          audio: node,
          gain: mediaGainNode
        }
      }
    }

    setVolume(0.3)

    g.audioService = {
      audioSamples: samples,
      audioCtx,
      gainNode,
      oscillator,
      resume,
      setVolume,
      play,
      playSound,
      playSoundLoop
    }
  }
})
