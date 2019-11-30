main();

const histogram_R = [];

function main() {
	
	const img = new Image();
	// img.src = './assets/my_img.jpg';
	// img.src = './assets/ktm.jpg';
	img.src = './assets/medi_pic.jpg';
	
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');
	
	img.onload = () => {
		canvas.width = img.width;
		canvas.height = img.height;
		const tx = performance.now();
		context.drawImage(img, 0, 0);
		console.log("Load time image took " + (performance.now() - tx) + " ms");
		const imageData = context.getImageData(0, 0, img.width, img.height);
		const data = imageData.data;
		
		const grayscale = () => {
			const t0 = performance.now();
			
			for (let i = 0; i < data.length; i += 4) {
				const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
				data[i] = avg; // R
				data[i + 1] = avg; // G
				data[i + 2] = avg; // B
			}
			
			context.putImageData(imageData, 0, 0);
			console.log("function grayscale execute took " + (performance.now() - t0) + " ms");
		};
		
		const experiment = () => {
			const t0 = performance.now();
			// const histogram_R = [];
			let minIndex = 0;
			let maxIndex = 0;
			
			// Count
			for (let y = 0; y < img.height; y++) {
				for (let x = 0; x < img.width; x++) {
					let index = (x + y * img.width) * 4; // Position
					if (isNaN(histogram_R[data[index]])) {
						histogram_R[data[index]] = 1;
					}
					else {
						histogram_R[data[index]] += 1;
					}
				}
			}
			
			let maxValue = histogram_R[0];
			let minValue = histogram_R[0];
			for (let i = 0; i < histogram_R.length; i ++) {
				const value = histogram_R[i];
				if (value > maxValue) {
					maxValue = value;
					maxIndex = i;
				}
				if (value < minValue) {
					minValue = value;
					minIndex = i;
				}
			}
			
			context.putImageData(imageData, 0, 0);
			
			console.log("function experiment execute took " + (performance.now() - t0) + " ms");
			console.log(`[${minIndex}] ${minValue}, [${maxIndex}] ${maxValue}`);
			console.log(histogram_R);
			
			// const bb1 = 0;
			// const ba1 = 30;
			// const bb2 = 0;
			// const ba2 = 200;
			// window.event.on
		};
		
		const grayscalebtn = document.getElementById('grayscalebtn');
		grayscalebtn.addEventListener('click', experiment);
	};
	
}

window.addEventListener('chart', () => {
	google.charts.load('44', {
		callback: drawBackgroundColor,
		packages: ['corechart']
	});
});

function drawBackgroundColor() {
	
	console.log(histogram_R.length);
	
	let c = [
		[0, 3],
		[1, 10],
		[2, 23],
		[3, 59],
		[4, 34],
		[5, 29],
	];

	let data = new google.visualization.DataTable();
	data.addColumn('number', 'Color');
	data.addColumn('number', 'Value');

	data.addRows(c);

	let options = {
		hAxis: {
			title: 'RGB'
		},
		vAxis: {
			title: 'Density'
		},
		backgroundColor: '#f1f8e9'
	};

	let chart = new google.visualization.LineChart(document.getElementById('yo'));
	chart.draw(data, options);
}

function getFile() {
	const file = document.getElementById("myFile");
	const FILENAME = file.value.substring(12);
	if (FILENAME) {
		const CURR_DIR = "./assets/";
		const FULLPATH = CURR_DIR + FILENAME;
		console.log(FULLPATH);
	}
	else {
		console.warn('Browse image file first!');
	}
}

function resizeImageViewer(event) {
	const param = event.currentTarget;
	const canvas = document.getElementById('canvas');
	canvas.width = param.imgWidth;
	canvas.height = param.imgHeight;
	
	const ctx = canvas.getContext('2d');
	let image = new Image();
	
	image.addEventListener('load', function () {
		ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
	});
	image.src = param.url;
}
