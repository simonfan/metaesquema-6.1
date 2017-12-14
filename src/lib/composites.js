const Matter = require('matter-js')

exports.arc = function (x, y, radius, startAngle, endAngle, sides, arcOptions, options) {
	options = options || {}
	arcOptions = arcOptions || {}

	if (sides < 3) {
		throw new Error('sides must be higher than 2')
	}

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

	let bodyWidth = arcOptions.bodyWidth || arcPartLength
	let bodyHeight = arcOptions.bodyHeight || 10

	// we must push the center half the bodyHeight outwards
	// let bodyHeightGrowAdjust = bodyHeight / 2
	//  Math.sqrt(2) / 2 * bodyHeight
	

	let bodies = arcInnerPoints.map((point, index) => {
		let nextPoint = arcInnerPoints[index + 1] || arcLastInnerPoint

		let center = Matter.Vector.div(Matter.Vector.add(point, nextPoint), 2)

		// center = Matter.Vector.mult(center, (bodyHeightGrowAdjust + radius) / radius)

		// add the distance required

		let diff = Matter.Vector.sub(nextPoint, point)

		return {
			center: center,
			angle: Math.atan(diff.y / diff.x),
		}
	})

	bodies = bodies.map(body => {

		let bodyOptions = Object.assign({}, {
			angle: body.angle
		}, options)

		return Matter.Bodies.rectangle(x + body.center.x, y + body.center.y, bodyWidth, bodyHeight, bodyOptions)
	})

	return bodies
}


// exports.arc(0, 0, 100, 0, 2 * Math.PI, 4)
