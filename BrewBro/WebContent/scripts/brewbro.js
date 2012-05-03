/* brewbro.js:
 * Functions using jquery to handle change events on the brewbro UI.
 * Supporting calculations are in beercalcs.js.
 */
"use strict";


// Set up onchange events.  jquery mobile uses doc.init() rather than document.ready()
$('#water').live('pageinit', function(event) {
	// profiles is defined in watercalcs.js:
	for (var p in profiles) {
		$('#water_source').append($("<option />").val(p).text(p));
		$('#water_target').append($("<option />").val(p).text(p));
	};

	// set each ion value
	$('#water_source').change(function() {
		var w = $('#water_source').val();
		setIons(w, 'src');
	});

	$('#water_target').change(function() {
		var w = $('#water_target').val();
		setIons(w, 'trg');
	});

	// set both to distilled
	$("#water_source, #water_target :option first").attr('selected', 'selected');
	$('#water_source, #water_target').selectmenu("refresh", true);
	$('#water_source, #water_target').change();


	// calculate
	$('#calculate').click(function() {
		var water_data = $('#water_form').serializeArray();

		var src_ions = {};
		var targ_ions = {};
		jQuery.each(water_data, function() {
			if (this.name.indexOf("_src") != -1) {
				var k = this.name.substring(0, this.name.indexOf("_src"));
				src_ions[k] = this.value;
			} else if (this.name.indexOf("_trg") != -1) {
				var k = this.name.substring(0, this.name.indexOf("_trg"));
				targ_ions[k] = this.value;
			}

		});
		// get vol and convert to gal
		var vol = $('#water_vol').val();
		var vol_u = $('#water_vol_u').val();
		vol = convertTo(vol_u,'gal',vol);

		var src_water = new water();
		var targ_water = new water();
		updateWater(src_water, src_ions);
		updateWater(targ_water, targ_ions);
		var res = calcWater(targ_water, src_water, vol);

		// result is array of : treated water, tsp, dilution vol
		var treat_water = res[0];
		var salt_tsp = res[1];
		var dil_vol = res[2];

		for (var ion in treat_water.treated) {
			var t_id = '#' + ion + "_treat";
			$(t_id).val(Math.round(treat_water.treated[ion]*10)/10);
		}

		for (var salt in treat_water.salts){
			var t_id='#'+salt;
			$(t_id).val(Math.round(treat_water.salts[salt]*10)/10);
		}
		for (var salt in salt_tsp) {
			var salt_id = '#' + salt + "tsp";
			$(salt_id).val(Math.round(salt_tsp[salt]*10)/10);
		}

		// convert dil vol from gal to target units:
		dil_vol = convertTo('gal',vol_u,dil_vol);
		$('#dilute_vol').val(Math.round(dil_vol*10)/10);

		console.log(res);

	});

});

// Call when the target or source drop-down changes:
function setIons(profile, targ) {

	for ( var key in profiles[profile]) {
		var inp_id = '#' + key + "_" + targ;
		$(inp_id).val(profiles[profile][key]);
	}
};

$('#carb')
		.live(
				'pageinit',
				function(event) {
					/* Carbonation page change events */

					/* change temp if units changes */

					$('input:radio[name=carb_temp_u]')
							.change(
									function() {
										var bottle_temp = $('#carb_bottletemp')
												.val();
										var serv_temp = $('#carb_serv_temp')
												.val();
										var tempU = $(
												'input:radio[name=carb_temp_u]:checked')
												.val();

										if (tempU == 'c') {
											bottle_temp = fToC(bottle_temp);
											serv_temp = fToC(serv_temp);

										} else {
											bottle_temp = cToF(bottle_temp);
											serv_temp = cToF(serv_temp);
										}
										$('#carb_bottletemp')
												.val(
														Math
																.round(bottle_temp * 10) / 10);
										$('#carb_serv_temp')
												.val(
														Math
																.round(serv_temp * 10) / 10);

									});

					$(
							'input:radio[name=carb_temp_u],#carb_targ_vols, #carb_serv_temp,#carb_sugar, #carb_beervol,#carb_beervol_u ')
							.change(
									function() {

										var bottle_temp = $('#carb_bottletemp')
												.val();
										var serv_temp = $('#carb_serv_temp')
												.val();
										var tempU = $(
												'input:radio[name=carb_temp_u]:checked')
												.val();
										if (tempU == 'c') {
											bottle_temp = cToF(bottle_temp);
											serv_temp = cToF(serv_temp);
										}
										var disolved_co2 = dissolvedCO2(bottle_temp);
										$('#carb_co2')
												.val(
														Math
																.round(disolved_co2 * 10) / 10);

										var targ_vols = $('#carb_targ_vols')
												.val();

										var keg_psi = kegPSI(serv_temp,
												targ_vols);
										$('#carb_kegpsi').val(
												Math.round(keg_psi * 10) / 10);

										var sugar_type = $('#carb_sugar').val();
										var beer_vol = $('#carb_beervol').val();
										var beer_vol_u = $('#carb_beervol_u')
												.val();

										beer_vol = convertTo(beer_vol_u, 'l',
												beer_vol);

										var sugar_g_l = PrimingSugarGL(
												disolved_co2, targ_vols,
												sugar_type);
										var sugar_add = sugar_g_l * beer_vol;
										$('#carb_sugarg').val(
												Math.round(sugar_add));

									});

				});

$('#hydro').live('pageinit', function(event) {
	/* Hyrdometer page change events */
	/* change temp if units changes */
	$('input:radio[name=hydr_tmp_u]').change(function() {
		var temp = $('#hydr_tmp').val();
		var ctemp = $('#callib_tmp').val();
		var tempU = $('input:radio[name=hydr_tmp_u]:checked').val();

		if (tempU == 'c') {
			temp = fToC(temp);
			ctemp = fToC(ctemp);

		} else {
			temp = cToF(temp);
			ctemp = cToF(ctemp);
		}
		$('#hydr_tmp').val(Math.round(temp * 10) / 10);
		$('#callib_tmp').val(Math.round(ctemp * 10) / 10);

	});

	$('#hydr_sg, #hydr_tmp, #callib_tmp').change(function() {
		var sg = $('#hydr_sg').val();
		var tempU = $('input:radio[name=hydr_tmp_u]:checked').val();
		var temp = $('#hydr_tmp').val();
		var ctemp = $('#callib_tmp').val();
		if (tempU == 'f') {
			temp = fToC(temp);
			ctemp = fToC(ctemp);
		}
		var corrected_sg = hydrometerCorrection(temp, sg, ctemp);
		$('#correct_sg').val(Math.round(corrected_sg * 1000) / 1000);

	});
});

$('#yeast')
		.live(
				'pageinit',
				function(event) {
					/* Yeast page change events */
					$(
							'input:radio[name=rdo_yeasttype], #yeast_wortvol, #yeast_units, #yeast_og, #yeast_temp')
							.change(
									function() {
										var type = $(
												'input:radio[name=rdo_yeasttype]:checked')
												.val();
										var wortvol = $('#yeast_wortvol').val();
										var units = $('#yeast_units').val();
										var og = $('#yeast_og').val();

										var volml = convertTo(units, 'ml',
												wortvol);

										var ret = yeastPitch(type, volml, og);
										$('#yeast_count').val(ret['cells']);
										$('#yeast_gr')
												.val(
														Math
																.round(ret['drygr'] * 10) / 10);
										$("#yeast_tubes")
												.val(
														Math
																.round(ret['cells'] / 100 + 0.5));
										$("#yeast_l")
												.val(
														Math
																.round(ret['cells'] / 1.2) / 100);
									});
				});

$('#refract').live('pageinit', function(event) {
	/* Refractometer page change events */

	$('#ref_abv_cbrix, #ref_abv_csg').change(function() {
		var c_brix = $('#ref_abv_cbrix').val();
		var c_csg = $('#ref_abv_csg').val();
		var abv = SGBrixToABV(c_csg, c_brix);
		$('#ref_abv_abv').val(Math.round(abv * 10) / 10);
	});

	$('#ref_og_brix, #ref_curr_brix').change(function() {
		var og_brix = $('#ref_og_brix').val();
		var curr_brix = $('#ref_curr_brix').val();
		var sg = brixToFG(og_brix, curr_brix);
		$('#ref_curr_sg').val(Math.round(sg * 1000) / 1000);
	});

	$('#ref_brix').change(function() {
		var brix = $('#ref_brix').val();
		var sg = brixToSG(brix);
		$('#ref_sg').val(Math.round(sg * 1000) / 1000);
	});
});

$('#convert').live('pageinit', function(event) {
	/* Conversion page change events */
	$("#in").change(function(event) {
		calculate();
	});

	$("#convertmenu").change(function(event) {
		var type = $("#convertmenu").val();
		switch (type) {
		case 'cToF':
			$('#in-label').text('C:');
			$('#outLabel').text('F:');
			$("#in").attr({
				min : '0',
				max : '100',
				step : '1'
			});

			$("#in").val('100');

			break;

		case 'fToC':
			$('#in-label').text('F:');
			$('#outLabel').text('C:');
			$("#in").attr({
				min : '0',
				max : '212',
				step : '1'
			});
			$("#in").val('212');
			break;

		case 'sgToPlato':
			$('#in-label').text('SG:');
			$('#outLabel').text('Plato:');
			$("#in").val('1.050');
			$("#in").attr({
				min : '1.000',
				max : '1.130',
				step : '0.001'
			});
			break;

		case 'platoToSg':
			$('#in-label').text('Plato:');
			$('#outLabel').text('SG:');
			$("#in").attr({
				min : '0',
				max : '25',
				step : '0.5'
			});
			$("#in").val('12');
			break;

		case 'brixToSG':
			$('#in-label').text('Brix:');
			$('#outLabel').text('SG:');
			$("#in").val('12');
			$("#in").attr({
				min : '0',
				max : '25',
				step : '0.5'
			});
			break;

		default:
			alert("no luck");
			break;
		}
		calculate();
	});
});

/* Conversion page support functions */
function calculate() {
	type = $('#convertmenu').val();
	inp = $("#in").val();
	var out = 0;
	switch (type) {
	case 'cToF':
		out = cToF(inp);
		out = Math.round(out * 10) / 10;
		break;

	case 'fToC':
		out = fToC(inp);
		out = Math.round(out * 10) / 10;
		break;

	case 'sgToPlato':
		out = sgToPlato(inp);
		out = Math.round(out * 10) / 10;
		break;

	case 'platoToSg':
		out = platoToSG(inp);
		out = Math.round(out * 1000) / 1000;
		break;

	case 'brixToSG':
		out = brixToSG(inp);
		out = Math.round(out * 1000) / 1000;
		break;

	default:
		alert("no luck");
		break;

	}
	// alert(out);

	$("#out").val(out);
}