const Matter = require('matter-js')

exports.arc = function (x, y, radius, startAngle, endAngle, sides, callback) {
	if (sides < 3) {
		throw new Error('sides must be higher than 2')
	}

	let arcComposite = Matter.Composite.create({ label: 'Arc' })

	let theta = (endAngle - startAngle) / sides

	let arcInnerPoints = []
	let arcLastInnerPoint = {
		x: Math.cos(endAngle) * radius,
		y: Math.sin(endAngle) * radius
	}

	for (let i = 0; i < sides; i += 1) {
		let angle = startAngle + (i * theta)
		let innerX = Math.cos(angle) * radius
		let innerY = Math.sin(angle) * radius

		arcInnerPoints.push({
			x: innerX,
			y: innerY
		})
	}

	// there certainly is a mathematically more intelligent manner of doing this...
	let arcPartLength = Matter.Vector.magnitude(Matter.Vector.sub(arcInnerPoints[1], arcInnerPoints[0]))

	arcInnerPoints.forEach((point, index) => {
		let nextPoint = arcInnerPoints[index + 1] || arcLastInnerPoint

		let center = Matter.Vector.div(Matter.Vector.add(point, nextPoint), 2)

		let diff = Matter.Vector.sub(nextPoint, point)

		let body = callback(
			x + center.x,
			y + center.y,
			arcPartLength,
			Math.atan(diff.y / diff.x)
		)

		Matter.Composite.addBody(arcComposite, body)
	})

	return arcComposite
}

/**
 * Creates a wall composite
 * @param  {Object}   options
 * @param  {Number}   - x          Walls center X
 * @param  {Number}   - y          Walls center Y
 * @param  {Number}   - areaWidth  Walled area width
 * @param  {Number}   - areaHeight Walled area height
 * @param  {Number}   - wallWidth  Each wall's width
 * @param  {Function} callback     Function that creates a body
 * @return {Matter.Composite}
 */
function createWallsComposite(options, callback) {
	let wallsComposite = Matter.Composite.create({ label: 'Walls' })

	let wallsSpecs = [
		{
			position: 'top',
			x: options.x,
			y: options.y - (options.areaHeight / 2) - (options.wallWidth / 2),
			width: options.areaWidth,
			height: options.wallWidth,
		},
		{
			position: 'bottom',
			x: options.x,
			y: options.y + (options.areaHeight / 2) + (options.wallWidth / 2),
			width: options.areaWidth,
			height: options.wallWidth,
		},
		{
			position: 'left',
			x: options.x - (options.areaWidth / 2) - (options.wallWidth / 2),
			y: options.y,
			width: options.wallWidth,
			height: options.areaHeight
		},
		{
			position: 'right',
			x: options.x + (options.areaWidth / 2) + (options.wallWidth / 2),
			y: options.y,
			width: options.wallWidth,
			height: options.areaHeight
		}
	]

	wallsSpecs.forEach(spec => {
		let body = callback(spec)

		if (body) {
			Matter.Composite.addBody(wallsComposite, body)
		}
	})

	return wallsComposite
}

exports.walls = createWallsComposite

