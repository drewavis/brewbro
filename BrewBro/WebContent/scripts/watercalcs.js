/* water calculations */
"use strict";
function water (name){
	this.ions={'ca':0, 'mg':0, 'na':0, 'so4':0, 'hco3':0, 'cl':0, };
	if(name in profiles){ this.ions= profiles[name];}
	this.treated = this.ions;
	this.salts =  {'MgSO4':0, 'CaSO4':0, 'NaCl':0, 'NaHCO3':0, 'CaCO3':0, 'CaCl2':0}  ;
}

function updateWater(w, ions){
	for (var i in ions){
		w.ions[i]=ions[i];
	}
	w.treated=w.ions;
}

function calcTreated(w){
	for (var ion in w.ions){
		var total=0;
		for (var salt in salts){
			if (ion in salts[salt]['effect']){
				total += salts[salt]['effect'][ion] * w.salts[salt];
			}			
		}
		w.treated[ion]=total + w.ions[ion];
	}
}

function rms(w1, w2){
    var r = 0;
    for (var key in w1.treated){
    	r += Math.pow(w1.treated[key] - w2.treated[key], 2);
    }
    r = Math.sqrt(r);
    return r;
}

function randWater(w, s, amount){
	var add=Math.random()*amount;
	// produces -1,0, or 1:
	var updown =  Math.floor(Math.random()*3)-1;
	add *= updown;
	w.salts[s] += add;
	if (w.salts[s]<0) w.salts[s]=0;	
}

function permute(w,amount){
	// requires jquery:
	var w2 = jQuery.extend(true, {}, w);
	for (var salt in w2.salts){
		randWater(w2,salt,amount);
	}
	calcTreated(w2);
	return w2;
}

var profiles = {
		'Distilled':{ 'ca':0, 'hco3':0, 'cl':0, 'mg':0, 'na':0, 'so4':0, }, 
		'Burton':{ 'ca':270, 'hco3':197, 'cl':40, 'mg':60, 'na':30, 'so4':640, },
		'Dortmund':{ 'ca':225, 'hco3':221, 'cl':60, 'mg':40, 'na':60, 'so4':120, },
		'Dublin':{ 'ca':119, 'hco3':156, 'cl':19, 'mg':4, 'na':12, 'so4':53, },
		'Edinburgh':{ 'ca':140, 'hco3':140, 'cl':34, 'mg':60, 'na':80, 'so4':96, },
		'Koln':{ 'ca':104, 'hco3':152, 'cl':109, 'mg':15, 'na':52, 'so4':86, },
		'London':{ 'ca':52, 'hco3':104, 'cl':34, 'mg':32, 'na':86, 'so4':32, },
		'Munich':{ 'ca':75, 'hco3':148, 'cl':2, 'mg':18, 'na':2, 'so4':10, },
		'Pilsen':{ 'ca':7, 'hco3':14, 'cl':5, 'mg':2, 'na':2, 'so4':5, },
		'Vienna':{ 'ca':200, 'hco3':118, 'cl':12, 'mg':60, 'na':8, 'so4':125, },
		'Ottawa':{ 'ca':17.5, 'hco3':45, 'cl':5, 'mg':2.4, 'na':15, 'so4':26, },
		};

var salts = {      
		'MgSO4': {'cname':'epsom salt', 'effect':{'so4':103.0, 'mg':26.1, }, 'gPerTsp':4.50}, 
		'CaSO4':  {'cname':'gypsum', 'effect':{'so4':147.4, 'ca':61.5, }, 'gPerTsp':1.8}, 
		'NaCl':  {'cname':'salt', 'effect':{'na':103.9, 'cl':160.3}, 'gPerTsp':6.5},
		'NaHCO3':   {'cname':'baking soda', 'effect':{'na':72.3, 'hco3':188.7, }, 'gPerTsp':4.4}, 
		'CaCO3':  {'cname':'chalk', 'effect':{'ca':105.8, 'hco3':158.4, }, 'gPerTsp':4.0}, 
		'CaCl2':  {'cname':'calcium chloride', 'effect':{'ca':72.0, 'cl':127.4, }, 'gPerTsp':3.4} 
		};

/* Simulated Annealing functions */

function P(prev_score, next_score, temperature){
    if (next_score < prev_score)  return 1.0;
    else  return Math.exp(-Math.abs(prev_score - next_score) / temperature);
}


function kirkpatrick_cooling(start_temp, alpha){
	var T = start_temp;	
	var a = alpha;
	this.next=function(){
    T = a * T;    
    return T;
	};
};


function anneal(target_water, start_water, max_evaluations, start_temp, alpha){

    var current = jQuery.extend(true, {}, start_water);
    var best = jQuery.extend(true, {}, start_water);
    var current_score = rms(current,target_water);
    var best_score = current_score;
    var num_evaluations = 1;
    var cooling_schedule = new kirkpatrick_cooling(start_temp, alpha);

    var done = false;
    while (!done){
    	var temperature = cooling_schedule.next();
        
        for (var i=0;i<1000;i++){            
        	num_evaluations += 1;
            if (num_evaluations >= max_evaluations){
                done = true;
                break;}            
            
            // examine moves around our current position
            var next = permute(current, temperature);
            var next_score = rms(target_water,next);
            if (next_score < best_score){
            	best=next;
            	best_score = next_score;
            }
                
            // probablistically accept this solution
            // always accepting better solutions
           var  p = P(current_score, next_score, temperature);
            if (Math.random() < p){
                current = next;
                current_score = next_score;
                break;
                };
        }
        // see if completely finished
        if (done) break;
    }


    return best;
};

function calcWater(target_water, source_water, vol){
    // first compare the waters to determine required dilution
    var dilution = 0;   // in %
    for (var ion in target_water.ions){
        if (source_water.ions[ion] > target_water.ions[ion] && (1 - (target_water.ions[ion] / source_water.ions[ion]) > dilution)){
            dilution = 1 - (target_water.ions[ion] / source_water.ions[ion]);
        };
    };
    
    // if there is dilution required, dilute the start water ions accordingly:
    if (dilution > 0){
        for (ion in source_water.ions){
            source_water.ions[ion] *= (1 - dilution);
        }
    }
    // dilute with volume:
    var dilvol = vol * dilution;
   
    // now lets do the annealing:
    var res = anneal(target_water, source_water, 10000, 10, .95);
    
    // we have the gr of salt per gal, lets multiply by vol to get real amount,
    // plus calc the tsp of each:
    var salttsp = jQuery.extend(true, {}, res.salts);
    for (var salt in res.salts){
        res.salts[salt] *= vol;
        salttsp[salt] = res.salts[salt] / salts[salt]['gPerTsp'];
    }
   var ret = [res,salttsp,dilvol];
    return ret;
};

function test(){
    var w = new water();
    var w2 = new water('Burton');
    var s = "Old water RMS: " + rms(w,w2);

    var result = calcWater(w2, w, 5);
    s += "\n new water RMS: "+ rms(w2,result[0]);
    alert(s);
    return result;

}