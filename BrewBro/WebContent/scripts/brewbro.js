// Get doc ready, add all onchange events
$(document).ready(
		function() {
			$("#in").change(
					function(event){
						calculate();
					});

			$("#convertmenu").change(
					function(event) {
						var type = $("#convertmenu").val();
						switch(type) {
					      case 'cToF':
					        $('#in-label').text('C:');
					        $('#outLabel').text('F:');
					        $("#in").attr({
					        	min: '0',
					        	max:'100',
					        	step:'1'					        	
					        });       
					        
					        $("#in").val('100');
					        
					        break;

					      case 'fToC':
					        $('#in-label').text('F:');
					        $('#outLabel').text('C:');
					        $("#in").attr({
					        	min: '0',
					        	max:'212',
					        	step:'1'					        	
					        });	
					        $("#in").val('212');
					        break;

					      case 'sgToPlato':
					        $('#in-label').text('SG:');
					        $('#outLabel').text('Plato:');
					        $("#in").val('1.050');
					        $("#in").attr({
					        	min: '1.000',
					        	max:'1.130',
					        	step:'0.001'					        	
					        });
					        break;

					      case 'platoToSg':
					        $('#in-label').text('Plato:');
					        $('#outLabel').text('SG:');
					        $("#in").attr({
					        	min: '0',
					        	max:'25',
					        	step:'0.5'					        	
					        });
					        $("#in").val('12');
					        break;

					      case 'brixToSG':
					        $('#in-label').text('Brix:');
					        $('#outLabel').text('SG:');
					        $("#in").val('12');
					        $("#in").attr({
					        	min: '0',
					        	max:'25',
					        	step:'0.5'					        	
					        });
					        break;

					      default:
					        alert("no luck");
					        break;
					    }
					     calculate();

					});
		});


function calculate() {
    type = $('#convertmenu').val();
    inp = $("#in").val();
    var out = 0;
    switch(type) {
      case 'cToF':
        out = cToF(inp);
        out = Math.round(out*10)/10;
        break;

      case 'fToC':
        out = fToC(inp);
        out = Math.round(out*10)/10;
        break;

      case 'sgToPlato':
        out = sgToPlato(inp);
        out = Math.round(out*10)/10;
        break;

      case 'platoToSg':
        out = platoToSG(inp);
        out = Math.round(out*1000)/1000;
        break;

      case 'brixToSG':
        out = brixToSG(inp);
        out = Math.round(out*1000)/1000;
        break;

      default:
        alert("no luck");
        break;

    }
    //alert(out);

    $("#out").val( out );
  }