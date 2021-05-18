module.exports = function() {

	alert('hi');
	
	// Setup gauges
	document.querySelectorAll('[data-gauge-container]').forEach((gauge) => {

		var gaugeProgress = gauge.querySelector('[data-gauge-container-progress]');
		var gaugeRail = gauge.querySelector('[data-gauge-container-rail]');

		var gaugeTarget = parseInt(gaugeProgress.getAttribute('data-target'));

		// Variables
		var gaugeR = parseInt(gauge.querySelectorAll('circle')[0].getAttribute('r'));
		var gaugeC = gaugeR * Math.PI * 2;
		var animationDuration = 1.5;

		// Init svg circles
		var circles = gauge.querySelectorAll('circle');
		TweenMax.set(circles, {
			strokeDashoffset: gaugeC
		});

		TweenMax.set(gaugeProgress, {
			attr: {
				'stroke-dasharray': gaugeC + ' ' + gaugeC
			}
		});

		// Calculate the offset
		function calculateOffset(t, c) {
			var target = c - (c * t) / 100;
			return target;
		}

		// Timeline
		var tl = new TimelineMax();

		// Performance Gauge animation
		tl.to(gaugeProgress, animationDuration, {
			strokeDashoffset: calculateOffset(gaugeTarget, gaugeC),
			ease: Power3.easeInOut
		});
	});

	document.querySelectorAll('[data-opportunity-toggle]').forEach((item,i) => {

		if(i == 0) {
			item.classList.add('active');
		}

		item.addEventListener('click', (e) => {
			e.preventDefault();

			let opportunity = e.target.getAttribute('data-opportunity-toggle');

			// Highlight the list item
			document.querySelectorAll('[data-opportunity-toggle]').forEach((v) => {
				v.classList.remove('active');
			});
			item.classList.add('active');

			// Bring the content to view
			document.querySelectorAll('[data-opportunity]').forEach((v) => {
				v.classList.remove('active');
			});
			document.querySelectorAll('[data-opportunity="' + opportunity + '"]').forEach((v) => {
				v.classList.add('active');
				v.scrollIntoView();
			});
		});
	});
}