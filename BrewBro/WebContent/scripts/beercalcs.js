/*!
 * Beercalcs script
 * 
 */

function cToF(tempC) {
	return (((tempC * 9) / 5) + 32);
}

function fToC(tempF) {
	return ((5 * (tempF - 32)) / 9);
}

// this makes iterating functions cleaner:
function cfTocf(unit, temp) {
	if (unit == "C") {
		return fToC(temp);
	} else {
		return cToF(temp);
	}
}

function sgToPlato(SG) {
	var plato = -616.989 + 1111.488 * SG - 630.606 * SG * SG + 136.10305 * SG
			* SG * SG;
	return plato;
}

function platoToSG(plato) {
	var SG = 1.0000131 + 0.00386777 * plato + 1.27447E-5 * plato * plato
			+ 6.34964E-8 * plato * plato * plato;
	return SG;
}

function brixToSG(brix) {
	var sg = 1.000898 + 0.003859118 * brix + 0.00001370735 * brix * brix
			+ 0.00000003742517 * brix * brix * brix;
	return sg;
}

function calcColour(lov, method) {
	var colour = 0;
	if (method == "ebc") {
		// From Greg Noonan's article at
		// http://brewingtechniques.com/bmg/noonan.html
		colour = 1.4922 * Math.pow(lov, 0.6859); // SRM
		// EBC is apr. SRM * 2.65 - 1.2
		colour = (colour * 2.65) - 1.2;
	} else {
		// calculates SRM based on MCU (degrees LOV)
		if (lov > 0)
			colour = 1.4922 * Math.pow(lov, 0.6859);
		else
			colour = 0;
	}

	return colour;
}

function calcAlcohol(og, fg, method) {
	var alc = 0;
	if (!method) {
		method = 'abv';
	}
	if (method == 'abw') {
		var oPlato = sgToPlato(og);
		var fPlato = sgToPlato(fg);
		var q = 0.22 + 0.001 * oPlato;
		var re = (q * oPlato + fPlato) / (1.0 + q);
		alc = (oPlato - re) / (2.0665 - 0.010665 * oPlato);

	} else {
		alc = calcAlcohol(og, fg, 'abw') * fg / 0.794;
	}
	return alc;

};

/*
 * Hop IBU calculation methods:
 */
function calcTinseth(amount, size, sg, time, aa, HopsUtil) {
	var daautil; // decimal alpha acid utilization
	var bigness; // bigness factor
	var boil_fact; // boil time factor
	var mgl_aaa; // mg/l of added alpha units
	var ibu;

	bigness = 1.65 * (Math.pow(0.000125, (sg - 1))); // 0.000125
	// original
	boil_fact = (1 - (Math.exp(-0.04 * time))) / HopsUtil;
	daautil = bigness * boil_fact;
	mgl_aaa = (aa / 100) * amount * 7490 / size;
	ibu = daautil * mgl_aaa;
	return ibu;
};

// rager method of ibu calculation
// constant 7962 is corrected to 7490 as per hop faq
function calcRager(amount, size, sg, time, AA) {
	var ibu, utilization, ga;
	utilization = 18.11 + 13.86 * rational_tanh((time - 31.32) / 18.27);
	ga = sg < 1.050 ? 0.0 : ((sg - 1.050) / 0.2);
	ibu = amount * (utilization / 100) * (AA / 100.0) * 7490;
	ibu /= size * (1 + ga);
	return ibu;
};

// utilization table for average floc yeast
var util = [ 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 4, 5, 5, 6, 7, 9, 11, 13, 11, 13,
		16, 13, 16, 19, 15, 19, 23, 16, 20, 24, 17, 21, 25 ];

function calcGaretz(amount, size, sg, time, start_vol, yeast_flocc, AA) {
	// iterative value seed - adjust to loop through value
	var desired_ibu = calcRager(amount, size, sg, time, AA);
	var elevation = 500; // elevation in feet - change for
	// user setting
	var concentration_f = size / start_vol;
	var boil_gravity = (concentration_f * (sg - 1)) + 1;
	var gravity_f = ((boil_gravity - 1.050) / 0.2) + 1;
	var temp_f = (elevation / 550 * 0.02) + 1;

	// iterative loop, uses desired_ibu to define hopping_f,
	// then seeds
	// itself
	var hopping_f, utilization, combined_f;
	var ibu = desired_ibu;
	var util_index;
	for ( var i = 0; i < 5; i++) { // iterate loop 5 times
		hopping_f = ((concentration_f * desired_ibu) / 260) + 1;
		if (time > 50)
			util_index = 10;
		else
			util_index = Math.round(time / 5.0);
		utilization = util[(util_index * 3) + yeast_flocc];
		combined_f = gravity_f * temp_f * hopping_f;
		ibu = (utilization * AA * amount * 0.749) / (size * combined_f);
		desired_ibu = ibu;
	}

	return ibu;
};

function calcRGB(srm) {
	var R, G, B;

	if (srm < 11) {
		R = 259.13 + (-7.42 * srm);
		G = 278.87 + (-15.12 * srm);
		B = 82.73 + (-4.48 * srm);
	} else if (srm >= 11 && srm < 21) {
		R = 335.27 + (-11.73 * srm);
		G = 203.42 + (-7.58 * srm);
		B = 92.50 + (-2.90 * srm);
	} else {
		R = 220.20 + (-7.20 * srm);
		G = 109.42 + (-3.42 * srm);
		B = 50.75 + (-1.33 * srm);
	}

	var r = Math.round(R);
	var b = Math.round(B);
	var g = Math.round(G);
	if (r < 0)
		r = 0;
	if (r > 255)
		r = 255;
	if (g < 0)
		g = 0;
	if (g > 255)
		g = 255;
	if (b < 0)
		b = 0;
	if (b > 255)
		b = 255;

	return "rgb(" + r + "," + g + "," + b + ")";
}

/*
 * unit converters
 */

var weights = {
	'g' : 453.292,
	'oz' : 16,
	'kg' : 0.453592,
	'lb' : 1
};

function convertWgtTo(from, to, amount) {
	return amount * weights[to] / weights[from];
}

var volumes = {
	'gal' : 1,
	'l' : 3.785411,
	'qt' : 4
};

function convertTo(from, to, amount) {
	return amount * volumes[to] / volumes[from];
};

// hydrometer correction formula based on post by AJ DeLange in HBD 3701

function deltaSG(TempC, SG) {
	var coeffic = new Array();
	coeffic[0]= [ 56.084, -0.17885, -0.13063 ]; // 0 - 4.99
	coeffic[1]=[ 69.685, -1.367, -0.10621 ]; // 5 - 9.99
	coeffic[2]=[ 77.782, -1.7288, -0.10822 ]; // 10 - 14.99
	coeffic[3]=[ 87.895, -2.3601, -0.10285 ]; // 15 - 19.99
	coeffic[4]=[ 97.052, -2.7729, -0.10596 ] ; // 20 - 24.99
	plato = sgToPlato(SG);
	coefficIndex = 4;
	if (plato < 20)
		coefficIndex = 3;
	else {
		if (plato < 15)
			coefficIndex = 2;
		else if (plato < 10)
			coefficIndex = 1;
		else if (plato < 5)
			coefficIndex = 0;
	}

	var dSG = (coeffic[coefficIndex][0]) + (coeffic[coefficIndex][1] * TempC)
			+ (coeffic[coefficIndex][2] * TempC * TempC);

	// changed + to - from original
	CorrectedSG = platoToSG(plato - (dSG / 100));
	return CorrectedSG;
};

function hydrometerCorrection(tempC, SG, refTempC) {
	// tempC = float(tempC);
	// SG = float(SG);
	// refTempC = float(refTempC);
	correctedSG = 0;
	if (refTempC == 20.0)
		correctedSG = deltaSG(tempC, SG);
	else
		correctedSG = SG * deltaSG(tempC, SG) / deltaSG(refTempC, SG);

	return correctedSG;
}

/*
 * Utility Math functions not included in jscript math lib:
 */
function rational_tanh(x) {
	if (x < -3)
		return -1;
	else if (x > 3)
		return 1;
	else
		return x * (27 + x * x) / (27 + 9 * x * x);
}
