// Get doc ready, add all onchange events
$(document).ready(

function() {
	
	/* Yeast page change events */
	$('#rdo_yeasttype, #yeast_wortvol, #yeast_units, #yeast_og, #yeast_temp').change(function() {
		var type = $('input:radio[name=rdo_yeasttype]:checked').val();		
		var wortvol = $('#yeast_wortvol').val();
		var units = $('#yeast_units').val();
		var og = $('#yeast_og').val();
	
		var volml = convertTo(units,'ml', wortvol);
		
		var ret = yeastPitch(type,volml,og);
		 $('#yeast_count').val(ret['cells']);		
		 $('#yeast_gr').val(Math.round(ret['drygr']*10)/10);	
	});

	/* Refractometer page change events */
	
	$('#ref_abv_cbrix, #ref_abv_csg').change(function() {
		var c_brix = $('#ref_abv_cbrix').val();
		var c_csg = $('#ref_abv_csg').val();
		var abv = SGBrixToABV(c_csg,c_brix);
		 $('#ref_abv_abv').val(Math.round(abv*10)/10);		
	});
	
	$('#ref_og_brix, #ref_curr_brix').change(function() {
		var og_brix = $('#ref_og_brix').val();
		var curr_brix = $('#ref_curr_brix').val();
		var sg = brixToFG(og_brix,curr_brix);
		 $('#ref_curr_sg').val(Math.round(sg*1000)/1000);		
	});
	
	$('#ref_brix').change(function() {
		var brix = $('#ref_brix').val();
		var sg = brixToSG(brix);
		 $('#ref_sg').val(Math.round(sg*1000)/1000);		
	});
	
	/* Hyrdometer page change events */
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
		$('#correct_sg').val(Math.round(corrected_sg *1000) / 1000);

	});

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