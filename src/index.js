const Matter = require('matter-js')
const Tone = require('tone')
const mousetrap = require('mousetrap')
const Metaesquema = require('metaesquema-util')

const aux = require('./lib/auxiliary')
const loadPlayers = require('./load-players')
const matterMicrophone = require('./lib/matter-microphone')

/**
 * Configure tone master
 */
Tone.Master.chain(new Tone.Limiter())


let _composites = require('./lib/composites')


// //some overall compression to keep the levels in check
// var masterCompressor = new Tone.Compressor({
//   "threshold" : -40,
//   "ratio" : 3,
//   "attack" : 0.5,
//   "release" : 0.1
// });
// //give a little boost to the lows
// var lowBump = new Tone.Filter(200, "lowshelf");
// //route everything through the filter
// //and compressor before going to the speakers
// Tone.Master.chain(lowBump, masterCompressor);

/**
 * Matter submodules
 */
const Engine = Matter.Engine
const Render = Matter.Render
const Runner = Matter.Runner
const Body = Matter.Body
const Bodies = Matter.Bodies
const World = Matter.World
const Mouse = Matter.Mouse
const MouseConstraint = Matter.MouseConstraint
const Events = Matter.Events
const Common = Matter.Common

const MatterCollision = require('matter-collision')

function setup(options) {
  const CANVAS_WIDTH = options.canvasWidth
  const CANVAS_HEIGHT = options.canvasHeight
  let canvas = options.canvas

  if (!canvas) {
    throw new Error('canvas is required')
  }
  
  if (!CANVAS_WIDTH) {
    throw new Error('CANVAS_WIDTH is required')
  }
  
  if (!CANVAS_HEIGHT) {
    throw new Error('CANVAS_HEIGHT is required')
  }

  if (options.plugins) {
  	options.plugins.forEach(plugin => {
  		Matter.use(plugin)
  	})
  }

  // create engine
  let engine = Engine.create({
  	// enable sleeping as we are collision heavy users
  	// enableSleeping: true
  })

  engine.world.gravity.x = 0
  engine.world.gravity.y = 0

  // engine.timing.timeScale = 0.05

  // create renderer
  let render = Render.create({
  	canvas: canvas,
  	engine: engine,
  	options: {
  		wireframes: false,
      // showPositions: true,
      // showAngleIndicator: true,
  		// background: '#003123',
  		pixelRatio: 1,

  		width: CANVAS_WIDTH,
  		height: CANVAS_HEIGHT,
  	}
  })
  Render.run(render)

  // create engine runner
  let runner = Metaesquema.Matter.Runner.createMixedRunner(engine)
  runner.run()

  let wallGenerator = Metaesquema.Matter.Bodies.walls({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  })

  let walls = [
    wallGenerator.top({
      label: 'CEILING',
      restitution: 1,
    }),

    wallGenerator.bottom({
      label: 'GROUND',
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
    }),

    wallGenerator.left({
      label: 'LEFT',
      isStatic: true,
      restitution: 1,
    }),

    wallGenerator.right({
      label: 'RIGHT',
      isStatic: true,
      restitution: 1,
    }),
	]

  World.add(engine.world, walls)



  /**
   * Sound bodies
   */
  // options.tone.players.canadian_01.start()
  options.tone.players.cloud_01.start()
  // options.tone.players.coptor_01.start()
  options.tone.players.glass_01.start()
  options.tone.players.night.start()


  let soundBodies = [
    Bodies.circle(CANVAS_WIDTH * 1/2, CANVAS_HEIGHT / 2, 20, {
      label: 'cloud_01',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      render: {
        fillStyle: 'red',
      },
      plugin: {
        sound: {
          player: options.tone.players.cloud_01
        },
      }
    }),
    Bodies.circle(CANVAS_WIDTH * 1/2, CANVAS_HEIGHT / 2, 20, {
      label: 'glass_01',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      render: {
        fillStyle: 'skyblue',
      },
      plugin: {
        sound: {
          player: options.tone.players.glass_01
        },
      }
    }),
    Bodies.circle(CANVAS_WIDTH * 1/2, CANVAS_HEIGHT / 2, 20, {
      label: 'night',
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      render: {
        fillStyle: '#FFFF00',
      },
      plugin: {
        sound: {
          player: options.tone.players.night
        },
      }
    }),
  ]

  let microphones = [
    matterMicrophone(CANVAS_WIDTH * 1 / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2 * 4/5,
      {
        label: 'mic-1',
        isStatic: true,
        render: {
          fillStyle: '#AF1959',

        }
      },
      {
        soundBodies: soundBodies,
        minVolume: -10,
        maxVolume: 4,
      }
    ),
    // matterMicrophone(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2 * 3/5,
    //   {
    //     label: 'mic-2',
    //     isStatic: true,
    //     render: {
    //       fillStyle: '#753255',
    //     }
    //   },
    //   {
    //     soundBodies: soundBodies,
    //     minVolume: -30,
    //     maxVolume: 10,
    //   }
    // ),
  ]

  World.add(engine.world, microphones)
  // let sound bodies come over microphones
  World.add(engine.world, soundBodies)

  World.add(engine.world, _composites.arc(
    CANVAS_WIDTH * 1 / 2, // x
    CANVAS_HEIGHT / 2, // y
    (CANVAS_HEIGHT / 2 * 4/5) + 40, // radius
    0, // startAngle
    2 * Math.PI, // endAngle
    100, //sides
    {
      // bodyWidth:
      bodyHeight: 10,
    }, {
      // isStatic: true,
      angle: 0,
      density: 1,
      restitution: 1,
      render: {
        // fillStyle: 'red',
      }
    }
  ))





  // add mouse control
  let mouse = Mouse.create(render.canvas)
  let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      // allow bodies on mouse to rotate
      angularStiffness: 0,
      render: {
        visible: false
      }
    }
  })

  World.add(engine.world, mouseConstraint);

  // keep the mouse in sync with rendering
  render.mouse = mouse;




  return {
  	engine: engine,
    isPlaying: false,

  	stop: function () {
      this.isPlaying = false

      runner.stop()
  	}
  }
}

loadPlayers([
  // {
  //   name: 'canadian_01',
  //   url: 'resources/canadian_01.wav',
  //   loop: true,
  // },
  {
    name: 'cloud_01',
    url: 'resources/cloud_01.wav',
    loop: true,
  },
  // {
  //   name: 'coptor_01',
  //   url: 'resources/coptor_01.wav',
  //   loop: true,
  // },
  {
    name: 'glass_01',
    url: 'resources/glass_01.wav',
    loop: true,
  },
  {
    name: 'night',
    url: 'resources/night.mp3',
    loop: true,
  },
])
.then((players) => {
  let config = {
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    canvas: document.querySelector('canvas'),
    plugins: [
      // Metaesquema.Matter.Plugins.maxVelocity({
      //   maxVelocity: 10,
      // }),
      new MatterCollision({
        collisionMomentumUpperThreshold: 1000,
      })
    ],

    tone: {
      players: players,
    }
  }

  let app = setup(config)
})
