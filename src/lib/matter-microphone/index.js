const Matter = require('matter-js')
const Bodies = Matter.Bodies

const Tone = require('tone')

const deepmerge = require('deepmerge')

const aux = require('../auxiliary')

function _isSoundBody(body) {
	return body.plugin && body.plugin.sound && body.plugin.sound.player
}

function _maxVertexDistance(body) {
	return body.vertices.reduce((res, vertex) => {
    let distance = aux.calcDistance(body.position, vertex)
    return distance > res ? distance : res
  }, 0)
}

function matterMicrophone(x, y, radius, options, microphoneOptions) {
	options = options || {}
	microphoneOptions = microphoneOptions || {}
	microphoneOptions.soundBodies = microphoneOptions.soundBodies || []

	const DEFAULT_MICROPHONE_OPTIONS = {
		isSensor: true,
		plugin: {
			microphone: {
				microphones: {},
			},
			collision: {
				start: (collision) => {
					let self = collision.self
					let other = collision.other
					let mic = self.plugin.microphone.microphones[other.id]

					if (!_isSoundBody(other) || !mic) {
						return
					}

					// console.log('START')

					other.plugin.sound.player.connect(
						mic.volumeNode
					)
					mic.volumeNode.volume.value = aux.calcVolume(
						self,
						other,
						{
							minVolume: microphoneOptions.minVolume || -20,
							maxVolume: microphoneOptions.maxVolume || 0,
							maxDistance: self.plugin.microphone.maxVertexDistance +
													 (other.plugin.sound.maxVertexDistance || 0)
						}
					)

				},

				active: (collision) => {
	        let self = collision.self
	        let other = collision.other
	        let mic = self.plugin.microphone.microphones[other.id]

					if (!_isSoundBody(other) || !mic) {
						return
					}

          mic.volumeNode.volume.value = aux.calcVolume(
            self,
            other,
            {
							minVolume: microphoneOptions.minVolume || -20,
							maxVolume: microphoneOptions.maxVolume || 0,
							maxDistance: self.plugin.microphone.maxVertexDistance +
													 (other.plugin.sound.maxVertexDistance || 0)
            }
          )

          // console.log(`${self.label} ${other.label}: ${mic.volumeNode.volume.value}`)

				},
	      end: (collision) => {
	        let self = collision.self
	        let other = collision.other
	        let mic = self.plugin.microphone.microphones[other.id]

					if (!_isSoundBody(other) || !mic) {
						return
					}

          collision.other.plugin.sound.player.disconnect(
            mic.volumeNode
          )

	      }
			}
		}
	}

	options = deepmerge(DEFAULT_MICROPHONE_OPTIONS, options)

	/**
	 * For each sound body, create a microphone for that body,
	 * so that multiple bodies can have multiple volumes.
	 */
	microphoneOptions.soundBodies.forEach(body => {

		if (!_isSoundBody(body)) {
			console.warn('invalid sound body', body)
			return
		}

		/**
		 * Calculate the most distant vertex of the given body
		 * and store it
		 */
    body.plugin.sound.maxVertexDistance = body.vertices.reduce((res, vertex) => {
      let distance = aux.calcDistance(body.position, vertex)
      return distance > res ? distance : res
    }, 0)

    /**
     * Microphonate it
     */
		options.plugin.microphone.microphones[body.id] = {
			volumeNode: new Tone.Volume().toMaster(),
		}
	})


	let microphoneBody = Bodies.circle(x, y, radius, options)

	microphoneBody.plugin.microphone.maxVertexDistance = _maxVertexDistance(microphoneBody)

	return microphoneBody
}

module.exports = matterMicrophone
