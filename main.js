let clearData;

function main(imgDataBlob) {
	
	const isExecuted = [false, false, false];
	
	const img = new Image();
	img.src = URL.createObjectURL(imgDataBlob);
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');

	clearData = () => {
		updateLog("New file detected!");
		for (let i = 0; i < isExecuted.length; i++) {
			isExecuted[i] = true;
		}
	};
	
	img.onload = () => { // After success load image
		canvas.width = img.width;
		canvas.height = img.height;

		const tx = performance.now();
		context.drawImage(img, 0, 0);
		updateLog("Load time image took " + (performance.now() - tx) + " ms"); // Render load time
		updateLog("Image Dimension: " +  img.width + ", " + img.height); // Dimension information

		const imageData = context.getImageData(0, 0, img.width, img.height); // Get image context
		const data = imageData.data; // Get pixel data from image
		
		const grayscale = () => {
			const t0 = performance.now(); // Track the time
			
			for (let i = 0; i < data.length; i += 4) {
				const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // do AVG
				data[i] = avg; // Red
				data[i + 1] = avg; // Green
				data[i + 2] = avg; // Blue
				// data[i+3] is alpha properties
			}
			
			context.putImageData(imageData, 0, 0); // Implement to canvas
			updateLog("function grayscale execute took " + (performance.now() - t0) + " ms"); // Execute time passed
		};
		
		const histogram = () => {
			const t0 = performance.now(); // Track the time

			// Count container for RGB
			let histogram_R = [];
			let histogram_G = [];
			let histogram_B = [];
			
			for (let i = 0; i < data.length; i += 4) {
				// If pixel data is never be counted then set value to 1, else do increment
				histogram_R[data[i]] = isNaN(histogram_R[data[i]]) ? 1 : (histogram_R[data[i]] + 1);
				histogram_G[data[i+1]] = isNaN(histogram_G[data[i+1]]) ? 1 : (histogram_G[data[i+1]] + 1);
				histogram_B[data[i+2]] = isNaN(histogram_B[data[i+2]]) ? 1 : (histogram_B[data[i+2]] + 1);
			}
			
			context.putImageData(imageData, 0, 0); // Implement to canvas
			updateLog("function histogram execute took " + (performance.now() - t0) + " ms"); // Execute time passed

			// Display BarChart with library Chart.js
			let labelColorIdx = [];
			for (let i = 0; i < 256; i++) {
				labelColorIdx.push(i);
			}
			const ctxChart = document.getElementById('myChart').getContext('2d');
			const myBarChart = new Chart(ctxChart, { // Showing RGB Chart
				type: 'bar',
				data: {
					labels: labelColorIdx,
					datasets: [
						{
							label: 'Red',
							backgroundColor: 'rgb(231, 76, 60)',
							borderColor: 'rgb(192, 57, 43)',
							data: histogram_R
						},
						{
							label: 'Green',
							backgroundColor: 'rgb(46, 204, 113)',
							borderColor: 'rgb(39, 174, 96)',
							data: histogram_G
						},
						{
							label: 'Blue',
							backgroundColor: 'rgb(52, 152, 219)',
							borderColor: 'rgb(41, 128, 185)',
							data: histogram_B
						}
					]
				},
				options: {
					title: {
						display: true,
						text: 'Histogram'
					}
				}
			});
		};

		const convolution = () => {
			const gaussianFilter = [ // Filter or Kernel that used in convolution
				1/16, 2/16, 1/16,
				2/16, 4/16, 2/16,
				1/16, 2/16, 1/16
			];
			
			const t0 = performance.now(); // Track the time
			
			for (let i = 0; i < data.length; i += 4) { // Do iterate to all pixels
				// Init variable
				let sumR, sumG, sumB = 0; // Data that will implement for every pixel in center
				const r = i;
				const g = i + 1;
				const b = i + 2;
				// Init the map for kernel operation
				// Map dimension is 3x3, for every r, g, and b
				let r0, r1, r2, r3, r4, r5, r6, r7, r8 = 0;
				let g0, g1, g2, g3, g4, g5, g6, g7, g8 = 0;
				let b0, b1, b2, b3, b4, b5, b6, b7, b8 = 0;
				// Width of image times RGBA, for calibrate the map position in array
				const w = img.width * 4;
				
				// Red operation
				r0 = isNaN(data[r - w - 4]) ? 0 : (data[r - w - 4] * gaussianFilter[0]); // Left top
				r1 = isNaN(data[r - w]) ? 0 : (data[r - w] * gaussianFilter[1]); // Top center
				r2 = isNaN(data[r - w + 4]) ? 0 : (data[r - w + 4] * gaussianFilter[2]); // Right top

				r3 = isNaN(data[r - 4])? 0 : (data[r - 4] * gaussianFilter[3]); // Left center
				r4 = isNaN(data[r]) ? 0 : (data[r] * gaussianFilter[4]); // Center
				r5 = isNaN(data[r + 4]) ? 0 : (data[r + 4] * gaussianFilter[5]); // Right center

				r6 = isNaN(data[r + w - 4]) ? 0 : (data[r + w - 4] * gaussianFilter[6]); // Left bottom
				r7 = isNaN(data[r + w]) ? 0 : (data[r + w] * gaussianFilter[7]); // Bottom center
				r8 = isNaN(data[r + w + 4]) ? 0 : (data[r + w + 4] * gaussianFilter[8]); // Right bottom
				sumR = r0 + r1 + r2 + r3 + r4 + r5 + r6 + r7 + r8; // Sum of all operation
				data[r] = Math.ceil(sumR); // Implement to pixel data in Red

				// Green operation
				g0 = isNaN(data[g - w - 4]) ? 0 : (data[g - w - 4] * gaussianFilter[0]);
				g1 = isNaN(data[g - w]) ? 0 : (data[g - w] * gaussianFilter[1]);
				g2 = isNaN(data[g - w + 4]) ? 0 : (data[g - w + 4] * gaussianFilter[2]);

				g3 = isNaN(data[g - 4])? 0 : (data[g - 4] * gaussianFilter[3]);
				g4 = isNaN(data[g]) ? 0 : (data[g] * gaussianFilter[4]);
				g5 = isNaN(data[g + 4]) ? 0 : (data[g + 4] * gaussianFilter[5]);

				g6 = isNaN(data[g + w - 4]) ? 0 : (data[g + w - 4] * gaussianFilter[6]);
				g7 = isNaN(data[g + w]) ? 0 : (data[g + w] * gaussianFilter[7]);
				g8 = isNaN(data[g + w + 4]) ? 0 : (data[g + w + 4] * gaussianFilter[8]);
				sumG = g0 + g1 + g2 + g3 + g4 + g5 + g6 + g7 + g8;
				data[g] = Math.ceil(sumG);

				// Blue operation
				b0 = isNaN(data[b - w - 4]) ? 0 : (data[b - w - 4] * gaussianFilter[0]);
				b1 = isNaN(data[b - w]) ? 0 : (data[b - w] * gaussianFilter[1]);
				b2 = isNaN(data[b - w + 4]) ? 0 : (data[b - w + 4] * gaussianFilter[2]);

				b3 = isNaN(data[b - 4])? 0 : (data[b - 4] * gaussianFilter[3]);
				b4 = isNaN(data[b]) ? 0 : (data[b] * gaussianFilter[4]);
				b5 = isNaN(data[b + 4]) ? 0 : (data[b + 4] * gaussianFilter[5]);

				b6 = isNaN(data[b + w - 4]) ? 0 : (data[b + w - 4] * gaussianFilter[6]);
				b7 = isNaN(data[b + w]) ? 0 : (data[b + w] * gaussianFilter[7]);
				b8 = isNaN(data[b + w + 4]) ? 0 : (data[b + w + 4] * gaussianFilter[8]);
				sumB = b0 + b1 + b2 + b3 + b4 + b5 + b6 + b7 + b8;
				data[b] = Math.ceil(sumB);
			}

			context.putImageData(imageData, 0, 0); // Implement to canvas
			updateLog("function gaussian blur execute took " + (performance.now() - t0) + " ms"); // Execute time passed
		};

		// Button
		const executeBtn = document.getElementById('executeBtn');
		executeBtn.addEventListener('click', () => {
			const pickedMethod = document.getElementById('methods');
			let methodValue = "grayscale";
			for (method of pickedMethod) {
				if (method.checked) {
					methodValue = method.value;
					break;
				}
			}
			switch (methodValue) {
				case "grayscale":
					if (!isExecuted[0]) {
						updateLog("processing grayscale...");
						grayscale();
						isExecuted[0] = true;
					}
					break;
				case "histogram":
					if (!isExecuted[1]) {
						updateLog("processing histogram...");
						histogram();
						isExecuted[1] = true;
					}
					break;
				case "gaussianblur":
					if (!isExecuted[2]) {
						updateLog("processing gaussian blur...");
						convolution();
						isExecuted[2] = true;
					}
					break;
				default:
					console.warn("Nothing method of " + methodValue);
					break;
			}
		});
	};
	
}

function clearAll() {
	if (clearData) {
		clearData();
	}
}

function getFile() {
	const file = document.getElementById("myFile");
	if (file.files[0]) {
		clearAll();
		console.log(file.files[0]);
		updateLog("Loading image...");
		main(file.files[0]); // Execute picked file
	}
	else {
		updateLog("Nothing file to executed!");
	}
}

function updateLog(message) {
	const logElement = document.getElementById('log');
	logElement.innerHTML += " >> " + message + "<br>";
}
